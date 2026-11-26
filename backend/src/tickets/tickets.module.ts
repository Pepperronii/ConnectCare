import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';

import { SupportTicketsService } from './support-tickets.service';
import { SupportTicketsController } from './support-tickets.controller';

import { AuthModule } from '../auth/auth.module';

import { SupportTicket } from '../entities/support-ticket.entity';
import { TicketCategory } from '../entities/ticket-category.entity';
import { CustomerProfile } from '../entities/customer-profile.entity';
import { TicketStatusHistory } from '../entities/ticket-status-history.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SupportTicket,
      TicketCategory,
      CustomerProfile,
      TicketStatusHistory,
      User,
    ]),
    AuthModule,
  ],
  controllers: [
    TicketsController,
    SupportTicketsController,
  ],
  providers: [
    TicketsService,
    SupportTicketsService,
  ],
})
export class TicketsModule {}