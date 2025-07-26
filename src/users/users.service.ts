// src/users/users.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as Sentry from '@sentry/nestjs';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

      const user = await this.prisma.user.create({
        data: {
          fullName: createUserDto.fullName,
          email: createUserDto.email,
          passwordHash: hashedPassword,
          roleId: createUserDto.roleId,
          isActive: createUserDto.isActive ?? true,
        },
        include: {
          role: true,
        },
      });

      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        isActive: user.isActive,
        role: {
          id: user.role.id,
          name: user.role.name,
          description: user.role.description ?? '',
        },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      Sentry.captureException(error);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException('Failed to create user');
    }
  }

  async findAll(): Promise<UserResponseDto[]> {
    try {
      const users = await this.prisma.user.findMany({
        include: {
          role: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return users.map(user => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        isActive: user.isActive,
        role: {
          id: user.role.id,
          name: user.role.name,
          description: user.role.description ?? '',
        },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));
    } catch (error) {
      Sentry.captureException(error);
      throw new NotFoundException('Failed to fetch users');
    }
  }

  async findOne(id: string): Promise<UserResponseDto> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          role: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        isActive: user.isActive,
        role: {
          id: user.role.id,
          name: user.role.name,
          description: user.role.description ?? '',
        },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      Sentry.captureException(error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('User not found');
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    try {
      if (updateUserDto.email) {
        const existingUser = await this.prisma.user.findFirst({
          where: {
            email: updateUserDto.email,
            NOT: { id },
          },
        });

        if (existingUser) {
          throw new ConflictException('Email already exists');
        }
      }

      const user = await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
        include: {
          role: true,
        },
      });

      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        isActive: user.isActive,
        role: {
          id: user.role.id,
          name: user.role.name,
          description: user.role.description ?? '',
        },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      Sentry.captureException(error);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new NotFoundException('Failed to update user');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      Sentry.captureException(error);
      throw new NotFoundException('User not found');
    }
  }
}