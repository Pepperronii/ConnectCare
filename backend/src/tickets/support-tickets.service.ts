import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { SupportTicket } from '../entities/support-ticket.entity';
import { CustomerProfile } from '../entities/customer-profile.entity';
import { TicketCategory } from '../entities/ticket-category.entity';
import { TicketStatusHistory } from '../entities/ticket-status-history.entity';
import { User } from '../entities/user.entity';

import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';

@Injectable()
export class SupportTicketsService {
  constructor(
    @InjectRepository(SupportTicket)
    private readonly ticketRepository: Repository<SupportTicket>,

    @InjectRepository(CustomerProfile)
    private readonly customerRepository: Repository<CustomerProfile>,

    @InjectRepository(TicketCategory)
    private readonly categoryRepository: Repository<TicketCategory>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

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

    const customer = await this.customerRepository.findOneBy({
      userId: actor.userId,
    });

    if (
      !customer ||
      ticket.customerId !== customer.customerId
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

    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .orderBy('ticket.ticketId', 'DESC')
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

      query.where('ticket.customerId = :customerId', {
        customerId: customer.customerId,
      });
    }

    const [tickets, total] = await query.getManyAndCount();

    return {
      data: tickets,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number, actorId: number) {
    const actor = await this.getActor(actorId);

    const ticket = await this.ticketRepository.findOneBy({
      ticketId: id,
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    await this.checkOwnership(ticket, actor);

    return ticket;
  }

  async create(
    dto: CreateSupportTicketDto,
    actorId: number,
  ) {
    const actor = await this.getActor(actorId);

    let customer: CustomerProfile | null;

    if (actor.role === 'Customer') {
      customer = await this.customerRepository.findOneBy({
        userId: actorId,
      });

      if (
        customer &&
        dto.customerId != null &&
        dto.customerId !== customer.customerId
      ) {
        throw new ForbiddenException('Access denied');
      }
    } else {
      if (!dto.customerId) {
        throw new BadRequestException(
          'Customer ID is required',
        );
      }

      customer = await this.customerRepository.findOneBy({
        customerId: dto.customerId,
      });
    }

    if (!customer) {
      throw new NotFoundException(
        'Customer profile not found',
      );
    }

    const category = await this.categoryRepository.findOneBy({
      categoryId: dto.categoryId,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (!dto.subject.trim() || !dto.description.trim()) {
      throw new BadRequestException(
        'Subject and description are required',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const ticket = manager.create(SupportTicket, {
        customerId: customer!.customerId,
        categoryId: dto.categoryId,
        subject: dto.subject.trim(),
        description: dto.description.trim(),
        priority: dto.priority ?? 'Normal',
        status: 'Pending',
        assignedStaffId: null,
        resolvedAt: null,
      });

      const savedTicket = await manager.save(ticket);

      const history = manager.create(TicketStatusHistory, {
        ticketId: savedTicket.ticketId,
        updatedByUserId: actorId,
        previousStatus: null,
        newStatus: 'Pending',
        remarks: 'Ticket created',
      });

      await manager.save(history);

      return {
        message: 'Support ticket created successfully',
        ticket: savedTicket,
      };
    });
  }

  async update(
    id: number,
    dto: UpdateSupportTicketDto,
    actorId: number,
  ) {
    const actor = await this.getActor(actorId);

    return this.dataSource.transaction(async (manager) => {
      const ticket = await manager.findOne(SupportTicket, {
        where: { ticketId: id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!ticket) {
        throw new NotFoundException('Ticket not found');
      }

      await this.checkOwnership(ticket, actor);

      if (actor.role === 'Customer') {
        if (ticket.status !== 'Pending') {
          throw new ForbiddenException(
            'Only pending tickets can be edited',
          );
        }

        if (
          dto.status !== undefined ||
          dto.assignedStaffId !== undefined ||
          dto.priority !== undefined ||
          dto.remarks !== undefined
        ) {
          throw new ForbiddenException(
            'You cannot update restricted fields',
          );
        }
      }

      if (dto.categoryId !== undefined) {
        const category = await manager.findOneBy(
          TicketCategory,
          { categoryId: dto.categoryId },
        );

        if (!category) {
          throw new NotFoundException('Category not found');
        }

        ticket.categoryId = dto.categoryId;
      }

      if (dto.subject !== undefined) {
        if (!dto.subject.trim()) {
          throw new BadRequestException(
            'Subject is required',
          );
        }

        ticket.subject = dto.subject.trim();
      }

      if (dto.description !== undefined) {
        if (!dto.description.trim()) {
          throw new BadRequestException(
            'Description is required',
          );
        }

        ticket.description = dto.description.trim();
      }

      if (dto.priority !== undefined) {
        ticket.priority = dto.priority;
      }

      if (dto.assignedStaffId !== undefined) {
        if (actor.role !== 'Admin') {
          throw new ForbiddenException(
            'Only admin can assign staff',
          );
        }

        if (dto.assignedStaffId !== null) {
          const staff = await manager.findOneBy(User, {
            userId: dto.assignedStaffId,
          });

          if (!staff || staff.role !== 'Staff') {
            throw new BadRequestException(
              'Invalid staff account',
            );
          }
        }

        ticket.assignedStaffId = dto.assignedStaffId;
      }

      const previousStatus = ticket.status;

      const statusChanged =
        dto.status !== undefined &&
        dto.status !== previousStatus;

      if (dto.remarks != null && !statusChanged) {
        throw new BadRequestException(
          'Remarks require a status change',
        );
      }

      if (statusChanged) {
        ticket.status = dto.status!;

        ticket.resolvedAt =
          dto.status === 'Resolved'
            ? new Date()
            : null;
      }

      const updatedTicket = await manager.save(ticket);

      if (statusChanged) {
        const history = manager.create(
          TicketStatusHistory,
          {
            ticketId: id,
            updatedByUserId: actorId,
            previousStatus,
            newStatus: ticket.status,
            remarks: dto.remarks ?? null,
          },
        );

        await manager.save(history);
      }

      return {
        message: 'Support ticket updated successfully',
        ticket: updatedTicket,
      };
    });
  }

  async remove(id: number, actorId: number) {
    const actor = await this.getActor(actorId);

    if (actor.role !== 'Admin') {
      throw new ForbiddenException(
        'Admin access required',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      const ticket = await manager.findOne(SupportTicket, {
        where: { ticketId: id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!ticket) {
        throw new NotFoundException('Ticket not found');
      }

      const histories = await manager.find(
        TicketStatusHistory,
        {
          where: { ticketId: id },
        },
      );

      const isUntouchedTicket =
        ticket.status === 'Pending' &&
        ticket.assignedStaffId === null &&
        histories.length === 1 &&
        histories[0].previousStatus === null &&
        histories[0].newStatus === 'Pending';

      if (!isUntouchedTicket) {
        throw new ConflictException(
          'Ticket has processing history and cannot be deleted',
        );
      }

      await manager.delete(TicketStatusHistory, {
        ticketId: id,
      });

      await manager.delete(SupportTicket, {
        ticketId: id,
      });
    });
  }
}