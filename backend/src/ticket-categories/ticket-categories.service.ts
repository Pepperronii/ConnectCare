import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';

import { TicketCategory } from '../entities/ticket-category.entity';
import { SupportTicket } from '../entities/support-ticket.entity';
import { User } from '../entities/user.entity';

import { CreateTicketCategoryDto } from './dto/create-ticket-category.dto';
import { UpdateTicketCategoryDto } from './dto/update-ticket-category.dto';

@Injectable()
export class TicketCategoriesService {
  constructor(
    @InjectRepository(TicketCategory)
    private readonly categoryRepository: Repository<TicketCategory>,

    @InjectRepository(SupportTicket)
    private readonly ticketRepository: Repository<SupportTicket>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private async requireAdmin(actorId: number) {
    const user = await this.userRepository.findOneBy({
      userId: actorId,
    });

    if (!user || user.role !== 'Admin') {
      throw new ForbiddenException(
        'Admin access required',
      );
    }
  }

  private async requireReader(actorId: number) {
    const user = await this.userRepository.findOneBy({
      userId: actorId,
    });

    if (
      !user ||
      !['Customer', 'Staff', 'Admin'].includes(user.role)
    ) {
      throw new ForbiddenException('Access denied');
    }
  }

  private handleDatabaseError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const code = (
        error.driverError as { code?: string }
      ).code;

      if (code === 'ER_DUP_ENTRY') {
        throw new ConflictException(
          'Category name already exists',
        );
      }

      if (code === 'ER_ROW_IS_REFERENCED_2') {
        throw new ConflictException(
          'Category is being used by support tickets',
        );
      }
    }

    throw error;
  }

  async findAll(
    actorId: number,
    page: number,
    limit: number,
  ) {
    await this.requireReader(actorId);

    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException(
        'Invalid pagination values',
      );
    }

    const [categories, total] =
      await this.categoryRepository.findAndCount({
        order: { categoryId: 'ASC' },
        skip: (page - 1) * limit,
        take: limit,
      });

    return {
      data: categories,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number, actorId: number) {
    await this.requireReader(actorId);

    const category =
      await this.categoryRepository.findOneBy({
        categoryId: id,
      });

    if (!category) {
      throw new NotFoundException(
        'Category not found',
      );
    }

    return category;
  }

  async create(
    dto: CreateTicketCategoryDto,
    actorId: number,
  ) {
    await this.requireAdmin(actorId);

    const categoryName = dto.categoryName.trim();

    if (!categoryName) {
      throw new BadRequestException(
        'Category name is required',
      );
    }

    const existingCategory =
      await this.categoryRepository.findOneBy({
        categoryName,
      });

    if (existingCategory) {
      throw new ConflictException(
        'Category name already exists',
      );
    }

    const category = this.categoryRepository.create({
      categoryName,
      description: dto.description?.trim() || null,
    });

    try {
      const savedCategory =
        await this.categoryRepository.save(category);

      return {
        message: 'Category created successfully',
        category: savedCategory,
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async update(
    id: number,
    dto: UpdateTicketCategoryDto,
    actorId: number,
  ) {
    await this.requireAdmin(actorId);

    const category =
      await this.categoryRepository.findOneBy({
        categoryId: id,
      });

    if (!category) {
      throw new NotFoundException(
        'Category not found',
      );
    }

    if (dto.categoryName !== undefined) {
      const categoryName = dto.categoryName.trim();

      if (!categoryName) {
        throw new BadRequestException(
          'Category name is required',
        );
      }

      const existingCategory =
        await this.categoryRepository.findOneBy({
          categoryName,
        });

      if (
        existingCategory &&
        existingCategory.categoryId !== id
      ) {
        throw new ConflictException(
          'Category name already exists',
        );
      }

      category.categoryName = categoryName;
    }

    if (dto.description !== undefined) {
      category.description =
        dto.description?.trim() || null;
    }

    try {
      const updatedCategory =
        await this.categoryRepository.save(category);

      return {
        message: 'Category updated successfully',
        category: updatedCategory,
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(id: number, actorId: number) {
    await this.requireAdmin(actorId);

    const category =
      await this.categoryRepository.findOneBy({
        categoryId: id,
      });

    if (!category) {
      throw new NotFoundException(
        'Category not found',
      );
    }

    const relatedTickets =
      await this.ticketRepository.countBy({
        categoryId: id,
      });

    if (relatedTickets > 0) {
      throw new ConflictException(
        'Category is being used by support tickets',
      );
    }

    try {
      await this.categoryRepository.remove(category);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }
}