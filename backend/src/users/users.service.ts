import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private safeUser(user: User) {
    return {
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  private async requireAdmin(actorId: number) {
    const actor = await this.userRepository.findOneBy({
      userId: actorId,
    });

    if (!actor || actor.role !== 'Admin') {
      throw new ForbiddenException(
        'Admin access required',
      );
    }
  }

  private async hashPassword(password: string) {
    if (Buffer.byteLength(password, 'utf8') > 72) {
      throw new BadRequestException(
        'Password must not exceed 72 bytes',
      );
    }

    return bcrypt.hash(password, 12);
  }

  private handleDatabaseError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const code = (
        error.driverError as { code?: string }
      ).code;

      if (code === 'ER_DUP_ENTRY') {
        throw new ConflictException(
          'Email already exists',
        );
      }

      if (code === 'ER_ROW_IS_REFERENCED_2') {
        throw new ConflictException(
          'User has related records and cannot be deleted',
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
    await this.requireAdmin(actorId);

    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException(
        'Invalid pagination values',
      );
    }

    const [users, total] =
      await this.userRepository.findAndCount({
        order: { userId: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

    return {
      data: users.map((user) => this.safeUser(user)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: number, actorId: number) {
    if (id !== actorId) {
      await this.requireAdmin(actorId);
    }

    const user = await this.userRepository.findOneBy({
      userId: id,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.safeUser(user);
  }

  async create(
    dto: CreateUserDto,
    actorId: number,
  ) {
    await this.requireAdmin(actorId);

    const email = dto.email.trim().toLowerCase();
    const fullName = dto.fullName.trim();

    if (!fullName) {
      throw new BadRequestException(
        'Full name is required',
      );
    }

    const existingUser =
      await this.userRepository.findOneBy({ email });

    if (existingUser) {
      throw new ConflictException(
        'Email already exists',
      );
    }

    const passwordHash =
      await this.hashPassword(dto.password);

    const user = this.userRepository.create({
      fullName,
      email,
      passwordHash,
      role: dto.role,
    });

    try {
      const savedUser =
        await this.userRepository.save(user);

      return {
        message: 'User created successfully',
        user: this.safeUser(savedUser),
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async update(
    id: number,
    dto: UpdateUserDto,
    actorId: number,
  ) {
    await this.requireAdmin(actorId);

    const user = await this.userRepository.findOneBy({
      userId: id,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.fullName !== undefined) {
      const fullName = dto.fullName.trim();

      if (!fullName) {
        throw new BadRequestException(
          'Full name is required',
        );
      }

      user.fullName = fullName;
    }

    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();

      const existingUser =
        await this.userRepository.findOneBy({ email });

      if (
        existingUser &&
        existingUser.userId !== id
      ) {
        throw new ConflictException(
          'Email already exists',
        );
      }

      user.email = email;
    }

    if (dto.password !== undefined) {
      user.passwordHash =
        await this.hashPassword(dto.password);
    }

    try {
      const updatedUser =
        await this.userRepository.save(user);

      return {
        message: 'User updated successfully',
        user: this.safeUser(updatedUser),
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(id: number, actorId: number) {
    await this.requireAdmin(actorId);

    if (id === actorId) {
      throw new ForbiddenException(
        'You cannot delete your own account',
      );
    }

    const user = await this.userRepository.findOneBy({
      userId: id,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'Admin') {
      throw new ForbiddenException(
        'Admin accounts cannot be deleted here',
      );
    }

    try {
      await this.userRepository.remove(user);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }
}