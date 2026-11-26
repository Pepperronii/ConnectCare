
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';

import { TicketsService } from './tickets.service';
import { AuthGuard } from '../auth/auth.guard';

import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';

@Controller('tickets')
@UseGuards(AuthGuard)
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
  ) {}

  @Get('categories')
  getCategories(@Req() request: any) {
    return this.ticketsService.getCategories(
      request.user.sub,
    );
  }

  @Get()
  findAll(@Req() request: any) {
    return this.ticketsService.findAll(
      request.user.sub,
    );
  }

  @Post()
  create(
    @Body() dto: CreateTicketDto,
    @Req() request: any,
  ) {
    return this.ticketsService.create(
      dto,
      request.user.sub,
    );
  }

  @Get(':id/history')
  getHistory(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: any,
  ) {
    return this.ticketsService.getHistory(
      id,
      request.user.sub,
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: any,
  ) {
    return this.ticketsService.findOne(
      id,
      request.user.sub,
    );
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTicketStatusDto,
    @Req() request: any,
  ) {
    return this.ticketsService.updateStatus(
      id,
      dto,
      request.user.sub,
    );
  }
}
