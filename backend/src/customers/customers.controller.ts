import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';

import { CustomersService } from './customers.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
@UseGuards(AuthGuard)
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
  ) {}

  @Post('profile')
  createProfile(
    @Req() request: any,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customersService.createProfile(
      request.user.sub,
      request.user.role,
      dto,
    );
  }

  @Get('profile')
  getProfile(@Req() request: any) {
    return this.customersService.getProfile(
      request.user.sub,
    );
  }

  @Patch('profile')
  updateProfile(
    @Req() request: any,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.updateProfile(
      request.user.sub,
      dto,
    );
  }

  @Get()
  findAll(@Req() request: any) {
    return this.customersService.findAll(
      request.user.role,
    );
  }
}