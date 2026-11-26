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

import { TicketCategoriesService } from './ticket-categories.service';
import { CreateTicketCategoryDto } from './dto/create-ticket-category.dto';
import { UpdateTicketCategoryDto } from './dto/update-ticket-category.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('api/v1/ticket-categories')
@UseGuards(AuthGuard)
export class TicketCategoriesController {
  constructor(
    private readonly ticketCategoriesService:
      TicketCategoriesService,
  ) {}

  @Get()
  findAll(
    @Req() request: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number,
  ) {
    return this.ticketCategoriesService.findAll(
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
    return this.ticketCategoriesService.findOne(
      id,
      request.user.sub,
    );
  }

  @Post()
  create(
    @Body() dto: CreateTicketCategoryDto,
    @Req() request: any,
  ) {
    return this.ticketCategoriesService.create(
      dto,
      request.user.sub,
    );
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTicketCategoryDto,
    @Req() request: any,
  ) {
    return this.ticketCategoriesService.update(
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
    return this.ticketCategoriesService.remove(
      id,
      request.user.sub,
    );
  }
}