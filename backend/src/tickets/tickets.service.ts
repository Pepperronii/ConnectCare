
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SupportTicketsService } from './support-tickets.service';

import { SupportTicket } from '../entities/support-ticket.entity';
import { TicketCategory } from '../entities/ticket-category.entity';
import { CustomerProfile } from '../entities/customer-profile.entity';
import { TicketStatusHistory } from '../entities/ticket-status-history.entity';
import { User } from '../entities/user.entity';

import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';

@Injectable()
export class TicketsService {
  constructor(
    private readonly supportTicketsService: SupportTicketsService,

    @InjectRepository(SupportTicket)
    private readonly ticketRepository: Repository<SupportTicket>,

    @InjectRepository(TicketCategory)
    private readonly categoryRepository: Repository<TicketCategory>,

    @InjectRepository(CustomerProfile)
    private readonly customerRepository: Repository<CustomerProfile>,

    @InjectRepository(TicketStatusHistory)
    private readonly historyRepository: Repository<TicketStatusHistory>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private async getActor(userId: number) {
    const user = await this.userRepository.findOneBy({
      userId,
    });

    if (
      !user ||
      !['Customer', 'Staff', 'Admin'].includes(user.role)
    ) {
      throw new ForbiddenException('Access denied');
    }

    return user;
  }

  async getCategories(userId: number) {
    await this.getActor(userId);

    return this.categoryRepository.find({
      order: {
        categoryName: 'ASC',
      },
    });
  }

  async findAll(userId: number) {
    const user = await this.getActor(userId);

    if (user.role === 'Customer') {
      const customer =
        await this.customerRepository.findOneBy({
          userId,
        });

      if (!customer) {
        return [];
      }

      return this.ticketRepository.find({
        where: {
          customerId: customer.customerId,
        },
        order: {
          ticketId: 'DESC',
        },
      });
    }

    return this.ticketRepository.find({
      order: {
        ticketId: 'DESC',
      },
    });
  }

  async findOne(id: number, userId: number) {
    return this.supportTicketsService.findOne(
      id,
      userId,
    );
  }

  async create(dto: CreateTicketDto, userId: number) {
    const user = await this.getActor(userId);

    if (user.role !== 'Customer') {
      throw new ForbiddenException(
        'Only customers can submit support tickets',
      );
    }

    const customer =
      await this.customerRepository.findOneBy({
        userId,
      });

    if (!customer) {
      throw new NotFoundException(
        'Customer profile not found',
      );
    }

    return this.supportTicketsService.create(
      {
        customerId: customer.customerId,
        categoryId: dto.categoryId,
        subject: dto.subject,
        description: dto.description,
        priority: (dto.priority ?? 'Normal') as
          'Low' | 'Normal' | 'High',
      },
      userId,
    );
  }

  async getHistory(id: number, userId: number) {
    await this.supportTicketsService.findOne(
      id,
      userId,
    );

    return this.historyRepository.find({
      where: {
        ticketId: id,
      },
      order: {
        changedAt: 'ASC',
        historyId: 'ASC',
      },
    });
  }

  async updateStatus(
    id: number,
    dto: UpdateTicketStatusDto,
    userId: number,
  ) {
    const user = await this.getActor(userId);

    if (!['Staff', 'Admin'].includes(user.role)) {
      throw new ForbiddenException(
        'Only staff and admin can update ticket status',
      );
    }

    const ticket =
      await this.supportTicketsService.findOne(
        id,
        userId,
      );

    if (ticket.status === dto.status) {
      throw new BadRequestException(
        'Please select a different status',
      );
    }

    return this.supportTicketsService.update(
      id,
      {
        status: dto.status as
          'Pending' | 'In Progress' | 'Resolved',
        remarks: dto.remarks?.trim() || null,
      },
      userId,
    );
  }
}
