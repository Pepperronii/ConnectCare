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

import { SupportTicketsService } from './support-tickets.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('api/v1/support-tickets')
@UseGuards(AuthGuard)
export class SupportTicketsController {
  constructor(
    private readonly supportTicketsService:
      SupportTicketsService,
  ) {}

  @Get()
  findAll(
    @Req() request: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number,
  ) {
    return this.supportTicketsService.findAll(
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
    return this.supportTicketsService.findOne(
      id,
      request.user.sub,
    );
  }

  @Post()
  create(
    @Body() dto: CreateSupportTicketDto,
    @Req() request: any,
  ) {
    return this.supportTicketsService.create(
      dto,
      request.user.sub,
    );
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSupportTicketDto,
    @Req() request: any,
  ) {
    return this.supportTicketsService.update(
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
    return this.supportTicketsService.remove(
      id,
      request.user.sub,
    );
  }
}