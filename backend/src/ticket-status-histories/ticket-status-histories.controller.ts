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

import { TicketStatusHistoriesService } from './ticket-status-histories.service';
import { CreateTicketStatusHistoryDto } from './dto/create-ticket-status-history.dto';
import { UpdateTicketStatusHistoryDto } from './dto/update-ticket-status-history.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('api/v1/ticket-status-histories')
@UseGuards(AuthGuard)
export class TicketStatusHistoriesController {
  constructor(
    private readonly service:
      TicketStatusHistoriesService,
  ) {}

  @Get()
  findAll(
    @Req() request: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number,
  ) {
    return this.service.findAll(
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
    return this.service.findOne(
      id,
      request.user.sub,
    );
  }

  @Post()
  create(
    @Body() dto: CreateTicketStatusHistoryDto,
    @Req() request: any,
  ) {
    return this.service.create(
      dto,
      request.user.sub,
    );
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTicketStatusHistoryDto,
    @Req() request: any,
  ) {
    return this.service.update(
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
    return this.service.remove(
      id,
      request.user.sub,
    );
  }
}