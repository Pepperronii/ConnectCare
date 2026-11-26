import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TicketStatusHistoriesService } from './ticket-status-histories.service';
import { TicketStatusHistoriesController } from './ticket-status-histories.controller';

import { TicketStatusHistory } from '../entities/ticket-status-history.entity';
import { SupportTicket } from '../entities/support-ticket.entity';
import { CustomerProfile } from '../entities/customer-profile.entity';
import { User } from '../entities/user.entity';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TicketStatusHistory,
      SupportTicket,
      CustomerProfile,
      User,
    ]),
    AuthModule,
  ],
  controllers: [
    TicketStatusHistoriesController,
  ],
  providers: [
    TicketStatusHistoriesService,
  ],
})
export class TicketStatusHistoriesModule {}