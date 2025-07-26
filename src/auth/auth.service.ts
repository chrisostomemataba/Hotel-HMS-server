// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as Sentry from '@sentry/nestjs';
import { LoginDto, AuthResponseDto } from './auth.dto';
import { JwtPayload } from './jwt.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: loginDto.email },
        include: {
          role: {
            include: {
              permissions: true,
            },
          },
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid credentials or account inactive');
      }

      const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload: JwtPayload = { 
        sub: user.id, 
        email: user.email, 
        roleId: user.roleId 
      };
      const accessToken = this.jwtService.sign(payload);

      return {
        accessToken,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: {
            id: user.role.id,
            name: user.role.name,
            description: user.role.description || '',
          },
          permissions: user.role.permissions.map(p => ({
            moduleName: p.moduleName,
            canView: p.canView,
            canCreate: p.canCreate,
            canEdit: p.canEdit,
            canDelete: p.canDelete,
          })),
        },
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'login' },
        extra: { email: loginDto.email },
      });
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Login failed');
    }
  }

  async validateUser(userId: string): Promise<any> {
    if (!userId || typeof userId !== 'string') {
      return null;
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            include: {
              permissions: true,
            },
          },
        },
      });

      if (!user || !user.isActive) {
        return null;
      }

      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        permissions: user.role.permissions,
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'validate_user' },
        extra: { userId },
      });
      return null;
    }
  }

  async getProfile(userId: string): Promise<any> {
    if (!userId || typeof userId !== 'string') {
      throw new UnauthorizedException('Invalid user ID');
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            include: {
              permissions: true,
            },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: {
          id: user.role.id,
          name: user.role.name,
          description: user.role.description || '',
        },
        permissions: user.role.permissions.map(p => ({
          moduleName: p.moduleName,
          canView: p.canView,
          canCreate: p.canCreate,
          canEdit: p.canEdit,
          canDelete: p.canDelete,
        })),
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'get_profile' },
        extra: { userId },
      });
      throw new UnauthorizedException('Failed to get profile');
    }
  }
}