import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';

import { CustomerProfilesService } from './customer-profiles.service';
import { CustomerProfilesController } from './customer-profiles.controller';

import { CustomerProfile } from '../entities/customer-profile.entity';
import { User } from '../entities/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerProfile,
      User,
    ]),
    AuthModule,
  ],
  controllers: [
    CustomersController,
    CustomerProfilesController,
  ],
  providers: [
    CustomersService,
    CustomerProfilesService,
  ],
  exports: [
    CustomersService,
    CustomerProfilesService,
  ],
})
export class CustomersModule {}