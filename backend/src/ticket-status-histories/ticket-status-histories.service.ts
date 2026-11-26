import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { TicketStatusHistory } from '../entities/ticket-status-history.entity';
import { SupportTicket } from '../entities/support-ticket.entity';
import { CustomerProfile } from '../entities/customer-profile.entity';
import { User } from '../entities/user.entity';

import { CreateTicketStatusHistoryDto } from './dto/create-ticket-status-history.dto';
import { UpdateTicketStatusHistoryDto } from './dto/update-ticket-status-history.dto';

@Injectable()
export class TicketStatusHistoriesService {
  constructor(
    @InjectRepository(TicketStatusHistory)
    private readonly historyRepository:
      Repository<TicketStatusHistory>,

    @InjectRepository(SupportTicket)
    private readonly ticketRepository:
      Repository<SupportTicket>,

    @InjectRepository(CustomerProfile)
    private readonly customerRepository:
      Repository<CustomerProfile>,

    @InjectRepository(User)
    private readonly userRepository:
      Repository<User>,

    private readonly dataSource: DataSource,
  ) {}

  private async getActor(actorId: number) {
    const actor = await this.userRepository.findOneBy({
      userId: actorId,
    });

    if (
      !actor ||
      !['Customer', 'Staff', 'Admin'].includes(actor.role)
    ) {
      throw new ForbiddenException('Access denied');
    }

    return actor;
  }

  private async checkOwnership(
    ticket: SupportTicket,
    actor: User,
  ) {
    if (actor.role !== 'Customer') {
      return;
    }

    const customer =
      await this.customerRepository.findOneBy({
        userId: actor.userId,
      });

    if (
      !customer ||
      customer.customerId !== ticket.customerId
    ) {
      throw new ForbiddenException('Access denied');
    }
  }

  async findAll(
    actorId: number,
    page: number,
    limit: number,
  ) {
    const actor = await this.getActor(actorId);

    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException(
        'Invalid pagination values',
      );
    }

    const query = this.historyRepository
      .createQueryBuilder('history')
      .innerJoin('history.ticket', 'ticket')
      .orderBy('history.historyId', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (actor.role === 'Customer') {
      const customer =
        await this.customerRepository.findOneBy({
          userId: actorId,
        });

      if (!customer) {
        return {
          data: [],
          total: 0,
          page,
          limit,
        };
      }

      query.where(
        'ticket.customerId = :customerId',
        {
          customerId: customer.customerId,
        },
      );
    }

    const [histories, total] =
      await query.getManyAndCount();

    return {
      data: histories,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number, actorId: number) {
    const actor = await this.getActor(actorId);

    const history =
      await this.historyRepository.findOneBy({
        historyId: id,
      });

    if (!history) {
      throw new NotFoundException(
        'Ticket status history not found',
      );
    }

    const ticket =
      await this.ticketRepository.findOneBy({
        ticketId: history.ticketId,
      });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    await this.checkOwnership(ticket, actor);

    return history;
  }

  async create(
    dto: CreateTicketStatusHistoryDto,
    actorId: number,
  ) {
    const actor = await this.getActor(actorId);

    if (!['Staff', 'Admin'].includes(actor.role)) {
      throw new ForbiddenException(
        'Staff or admin access required',
      );
    }

    return this.dataSource.transaction(
      async (manager) => {
        const ticket = await manager.findOne(
          SupportTicket,
          {
            where: { ticketId: dto.ticketId },
            lock: { mode: 'pessimistic_write' },
          },
        );

        if (!ticket) {
          throw new NotFoundException(
            'Ticket not found',
          );
        }

        if (ticket.status === dto.newStatus) {
          throw new BadRequestException(
            'Ticket already has this status',
          );
        }

        const previousStatus = ticket.status;

        ticket.status = dto.newStatus;

        ticket.resolvedAt =
          dto.newStatus === 'Resolved'
            ? new Date()
            : null;

        await manager.save(ticket);

        const history = manager.create(
          TicketStatusHistory,
          {
            ticketId: ticket.ticketId,
            updatedByUserId: actorId,
            previousStatus,
            newStatus: dto.newStatus,
            remarks: dto.remarks ?? null,
          },
        );

        const savedHistory =
          await manager.save(history);

        return {
          message:
            'Ticket status history created successfully',
          history: savedHistory,
        };
      },
    );
  }

  async update(
    id: number,
    dto: UpdateTicketStatusHistoryDto,
    actorId: number,
  ) {
    const actor = await this.getActor(actorId);

    if (!['Staff', 'Admin'].includes(actor.role)) {
      throw new ForbiddenException(
        'Staff or admin access required',
      );
    }

    const history =
      await this.historyRepository.findOneBy({
        historyId: id,
      });

    if (!history) {
      throw new NotFoundException(
        'Ticket status history not found',
      );
    }

    if (
      actor.role === 'Staff' &&
      history.updatedByUserId !== actorId
    ) {
      throw new ForbiddenException(
        'You can only edit your own remarks',
      );
    }

    if (dto.remarks === undefined) {
      throw new BadRequestException(
        'Remarks field is required',
      );
    }

    history.remarks = dto.remarks;

    const updatedHistory =
      await this.historyRepository.save(history);

    return {
      message:
        'Ticket status history updated successfully',
      history: updatedHistory,
    };
  }

  async remove(id: number, actorId: number) {
    const actor = await this.getActor(actorId);

    if (actor.role !== 'Admin') {
      throw new ForbiddenException(
        'Admin access required',
      );
    }

    const existing =
      await this.historyRepository.findOneBy({
        historyId: id,
      });

    if (!existing) {
      throw new NotFoundException(
        'Ticket status history not found',
      );
    }

    await this.dataSource.transaction(
      async (manager) => {
        const ticket = await manager.findOne(
          SupportTicket,
          {
            where: {
              ticketId: existing.ticketId,
            },
            lock: { mode: 'pessimistic_write' },
          },
        );

        if (!ticket) {
          throw new NotFoundException(
            'Ticket not found',
          );
        }

        const history = await manager.findOneBy(
          TicketStatusHistory,
          { historyId: id },
        );

        if (!history) {
          throw new NotFoundException(
            'Ticket status history not found',
          );
        }

        const latest = await manager.findOne(
          TicketStatusHistory,
          {
            where: {
              ticketId: ticket.ticketId,
            },
            order: {
              historyId: 'DESC',
            },
          },
        );

        if (
          !latest ||
          latest.historyId !== id ||
          history.previousStatus === null ||
          ticket.status !== history.newStatus
        ) {
          throw new ConflictException(
            'Only the latest status change can be deleted',
          );
        }

        const previous = await manager.findOne(
          TicketStatusHistory,
          {
            where: {
              ticketId: ticket.ticketId,
              historyId: require('typeorm').LessThan(id),
            },
            order: {
              historyId: 'DESC',
            },
          },
        );

        if (
          !previous ||
          previous.newStatus !== history.previousStatus
        ) {
          throw new ConflictException(
            'Inconsistent ticket status history',
          );
        }

        ticket.status = history.previousStatus;

        ticket.resolvedAt =
          ticket.status === 'Resolved'
            ? previous.changedAt
            : null;

        await manager.save(ticket);

        await manager.delete(
          TicketStatusHistory,
          { historyId: id },
        );
      },
    );
  }
}