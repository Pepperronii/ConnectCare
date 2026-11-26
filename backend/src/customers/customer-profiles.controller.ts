import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
} from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import { CustomerProfilesService } from './customer-profiles.service';
import { CreateCustomerProfileDto } from './dto/create-customer-profile.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('api/v1/customer-profiles')
@UseGuards(AuthGuard)
export class CustomerProfilesController {
  constructor(
    private readonly profilesService: CustomerProfilesService,
  ) {}

  @Get()
  findAll(
    @Req() request: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number,
  ) {
    return this.profilesService.findAll(
      request.user.sub,
      page,
      limit,
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: any,
  ) {
    return this.profilesService.findOne(
      id,
      request.user.sub,
    );
  }

  @Post()
  create(
    @Body() dto: CreateCustomerProfileDto,
    @Req() request: any,
  ) {
    return this.profilesService.create(
      dto,
      request.user.sub,
    );
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerDto,
    @Req() request: any,
  ) {
    return this.profilesService.update(
      id,
      dto,
      request.user.sub,
    );
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: any,
  ) {
    return this.profilesService.remove(
      id,
      request.user.sub,
    );
  }
}