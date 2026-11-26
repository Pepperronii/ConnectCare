import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';

import { CustomerProfile } from '../entities/customer-profile.entity';
import { User } from '../entities/user.entity';
import { CustomersService } from './customers.service';
import { CreateCustomerProfileDto } from './dto/create-customer-profile.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerProfilesService {
  constructor(
    @InjectRepository(CustomerProfile)
    private readonly profileRepository: Repository<CustomerProfile>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly customersService: CustomersService,
  ) {}

  private async getActor(actorId: number) {
    const actor = await this.userRepository.findOneBy({
      userId: actorId,
    });

    if (!actor) {
      throw new ForbiddenException('Access denied');
    }

    return actor;
  }

  private async getRecord(id: number) {
    const profile = await this.profileRepository.findOne({
      where: { customerId: id },
      relations: { user: true },
    });

    if (!profile) {
      throw new NotFoundException(
        'Customer profile not found',
      );
    }

    return profile;
  }

  private checkAccess(actor: User, profile: CustomerProfile) {
    if (
      actor.role !== 'Admin' &&
      actor.role !== 'Staff' &&
      actor.userId !== profile.userId
    ) {
      throw new ForbiddenException('Access denied');
    }
  }

  async findAll(
    actorId: number,
    page: number,
    limit: number,
  ) {
    const actor = await this.getActor(actorId);

    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException(
        'Invalid pagination values',
      );
    }

    const [profiles, total] =
      await this.profileRepository.findAndCount({
        where:
          actor.role === 'Customer'
            ? { userId: actorId }
            : {},
        relations: { user: true },
        order: { customerId: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

    return {
      data: profiles,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number, actorId: number) {
    const actor = await this.getActor(actorId);
    const profile = await this.getRecord(id);

    this.checkAccess(actor, profile);

    return profile;
  }

  async create(
    dto: CreateCustomerProfileDto,
    actorId: number,
  ) {
    const actor = await this.getActor(actorId);

    if (
      actor.role === 'Customer' &&
      actor.userId !== dto.userId
    ) {
      throw new ForbiddenException('Access denied');
    }

    const targetUser =
      await this.userRepository.findOneBy({
        userId: dto.userId,
      });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (targetUser.role !== 'Customer') {
      throw new BadRequestException(
        'Selected user must be a Customer',
      );
    }

    return this.customersService.createProfile(
      targetUser.userId,
      targetUser.role,
      {
        phoneNumber: dto.phoneNumber,
        serviceAddress: dto.serviceAddress,
      },
    );
  }

  async update(
    id: number,
    dto: UpdateCustomerDto,
    actorId: number,
  ) {
    const actor = await this.getActor(actorId);
    const profile = await this.getRecord(id);

    this.checkAccess(actor, profile);

    return this.customersService.updateProfile(
      profile.userId,
      dto,
    );
  }

  async remove(id: number, actorId: number) {
    const actor = await this.getActor(actorId);

    if (actor.role !== 'Admin') {
      throw new ForbiddenException(
        'Admin access required',
      );
    }

    const profile = await this.getRecord(id);

    try {
      await this.profileRepository.remove(profile);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = (
          error.driverError as { code?: string }
        ).code;

        if (code === 'ER_ROW_IS_REFERENCED_2') {
          throw new ConflictException(
            'Customer profile has related records',
          );
        }
      }

      throw error;
    }
  }
}