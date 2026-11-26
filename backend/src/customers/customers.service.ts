
import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CustomerProfile } from '../entities/customer-profile.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(CustomerProfile)
    private readonly customerRepository: Repository<CustomerProfile>,
  ) {}

  async createProfile(
    userId: number,
    role: string,
    dto: CreateCustomerDto,
  ) {
    if (role !== 'Customer') {
      throw new ForbiddenException('Customers only');
    }

    const existing = await this.customerRepository.findOne({
      where: { userId },
    });

    if (existing) {
      throw new ConflictException(
        'Customer profile already exists',
      );
    }

    const phoneNumber = dto.phoneNumber.trim();
    const serviceAddress = dto.serviceAddress.trim();

    if (!phoneNumber || !serviceAddress) {
      throw new BadRequestException(
        'All fields are required',
      );
    }

    const profile = this.customerRepository.create({
      userId,
      phoneNumber,
      serviceAddress,
    });

    try {
      await this.customerRepository.save(profile);
    } catch (error) {
      if (
        (error as { code?: string }).code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(
          'Customer profile already exists',
        );
      }

      throw error;
    }

    return {
      message: 'Customer profile created successfully',
      profile,
    };
  }

  async getProfile(userId: number) {
    const profile = await this.customerRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(
        'Customer profile not found',
      );
    }

    return profile;
  }

  async updateProfile(
    userId: number,
    dto: UpdateCustomerDto,
  ) {
    const profile = await this.customerRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(
        'Customer profile not found',
      );
    }

    if (dto.phoneNumber !== undefined) {
      if (
        typeof dto.phoneNumber !== 'string' ||
        !dto.phoneNumber.trim()
      ) {
        throw new BadRequestException(
          'Invalid phone number',
        );
      }

      profile.phoneNumber = dto.phoneNumber.trim();
    }

    if (dto.serviceAddress !== undefined) {
      if (
        typeof dto.serviceAddress !== 'string' ||
        !dto.serviceAddress.trim()
      ) {
        throw new BadRequestException(
          'Invalid service address',
        );
      }

      profile.serviceAddress = dto.serviceAddress.trim();
    }

    await this.customerRepository.save(profile);

    return {
      message: 'Customer profile updated successfully',
      profile,
    };
  }

  async findAll(role: string) {
    if (!['Staff', 'Admin'].includes(role)) {
      throw new ForbiddenException('Access denied');
    }

    return this.customerRepository.find({
      relations: {
        user: true,
      },
      select: {
        customerId: true,
        userId: true,
        phoneNumber: true,
        serviceAddress: true,
        createdAt: true,
        user: {
          userId: true,
          fullName: true,
          email: true,
        },
      },
      order: {
        customerId: 'DESC',
      },
    });
  }
}
