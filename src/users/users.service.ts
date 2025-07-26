// src/users/users.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as Sentry from '@sentry/nestjs';
import { CreateUserDto, UpdateUserDto, UserResponseDto, AssignRoleDto } from './user.dto';
import { User, Role } from '@prisma/client';

type UserWithRole = User & {
  role: Role;
};

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

      const roleExists = await this.prisma.role.findUnique({
        where: { id: createUserDto.roleId },
      });

      if (!roleExists) {
        throw new NotFoundException('Role not found');
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

      return this.mapToUserResponse(user as UserWithRole);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'create_user' },
        extra: { email: createUserDto.email, roleId: createUserDto.roleId },
      });
      if (error instanceof ConflictException || error instanceof NotFoundException) {
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

      return users.map(user => this.mapToUserResponse(user as UserWithRole));
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'find_all_users' },
      });
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

      return this.mapToUserResponse(user as UserWithRole);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'find_one_user' },
        extra: { userId: id },
      });
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

      if (updateUserDto.roleId) {
        const roleExists = await this.prisma.role.findUnique({
          where: { id: updateUserDto.roleId },
        });

        if (!roleExists) {
          throw new NotFoundException('Role not found');
        }
      }

      const user = await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
        include: {
          role: true,
        },
      });

      return this.mapToUserResponse(user as UserWithRole);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'update_user' },
        extra: { userId: id, roleId: updateUserDto.roleId },
      });
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Failed to update user');
    }
  }

  async assignRole(userId: string, assignRoleDto: AssignRoleDto): Promise<UserResponseDto> {
    try {
      const userExists = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!userExists) {
        throw new NotFoundException('User not found');
      }

      const roleExists = await this.prisma.role.findUnique({
        where: { id: assignRoleDto.roleId },
      });

      if (!roleExists) {
        throw new NotFoundException('Role not found');
      }

      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { roleId: assignRoleDto.roleId },
        include: {
          role: true,
        },
      });

      return this.mapToUserResponse(user as UserWithRole);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'assign_role' },
        extra: { userId, roleId: assignRoleDto.roleId },
      });
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Failed to assign role');
    }
  }

  async getUsersByRole(roleId: string): Promise<UserResponseDto[]> {
    try {
      const roleExists = await this.prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!roleExists) {
        throw new NotFoundException('Role not found');
      }

      const users = await this.prisma.user.findMany({
        where: { roleId },
        include: {
          role: true,
        },
        orderBy: {
          fullName: 'asc',
        },
      });

      return users.map(user => this.mapToUserResponse(user as UserWithRole));
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'get_users_by_role' },
        extra: { roleId },
      });
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Failed to fetch users by role');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'delete_user' },
        extra: { userId: id },
      });
      throw new NotFoundException('User not found');
    }
  }

  private mapToUserResponse(user: UserWithRole): UserResponseDto {
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
  }
}