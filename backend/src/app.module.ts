import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';


import { User } from './entities/user.entity';
import { CustomerProfile } from './entities/customer-profile.entity';
import { TicketCategory } from './entities/ticket-category.entity';
import { SupportTicket } from './entities/support-ticket.entity';
import { TicketStatusHistory } from './entities/ticket-status-history.entity';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { TicketsModule } from './tickets/tickets.module';
import { UsersModule } from './users/users.module';
import { TicketCategoriesModule,} from './ticket-categories/ticket-categories.module';
import { TicketStatusHistoriesModule } from './ticket-status-histories/ticket-status-histories.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.getOrThrow<string>('DB_HOST'),
        port: Number(config.getOrThrow('DB_PORT')),
        username: config.getOrThrow<string>('DB_USERNAME'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: config.get('DB_SYNCHRONIZE') !== 'false',
      }),
    }),

    TypeOrmModule.forFeature([
      User,
      CustomerProfile,
      TicketCategory,
      SupportTicket,
      TicketStatusHistory,
    ]),

    AuthModule,

    CustomersModule,

    TicketsModule,

    UsersModule,

    TicketCategoriesModule,

    TicketStatusHistoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}