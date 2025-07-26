// src/roles/roles.service.ts
import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as Sentry from '@sentry/nestjs';
import { CreateRoleDto, UpdateRoleDto, RoleResponseDto } from './dto/role.dto';
import { CreateRolePermissionDto, UpdateRolePermissionDto, RolePermissionResponseDto } from './dto/role-permission.dto';
import { Role, RolePermission } from '@prisma/client';

type RoleWithPermissions = Role & {
  permissions: RolePermission[];
};

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    try {
      const normalizedName = createRoleDto.name.toLowerCase().trim();
      
      const existingRole = await this.prisma.role.findFirst({
        where: {
          name: {
            equals: normalizedName,
            mode: 'insensitive',
          },
        },
      });

      if (existingRole) {
        throw new ConflictException('Role name already exists');
      }

      const role = await this.prisma.role.create({
        data: {
          name: createRoleDto.name.trim(),
          description: createRoleDto.description?.trim() || null,
        },
        include: {
          permissions: true,
        },
      });

      return this.mapToRoleResponse(role as RoleWithPermissions);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'create_role' },
        extra: { roleName: createRoleDto.name },
      });
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException('Failed to create role');
    }
  }

  async findAll(): Promise<RoleResponseDto[]> {
    try {
      const roles = await this.prisma.role.findMany({
        include: {
          permissions: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return roles.map(role => this.mapToRoleResponse(role as RoleWithPermissions));
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'find_all_roles' },
      });
      throw new NotFoundException('Failed to fetch roles');
    }
  }

  async findOne(id: string): Promise<RoleResponseDto> {
    try {
      const role = await this.prisma.role.findUnique({
        where: { id },
        include: {
          permissions: true,
        },
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      return this.mapToRoleResponse(role as RoleWithPermissions);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'find_one_role' },
        extra: { roleId: id },
      });
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Role not found');
    }
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<RoleResponseDto> {
    try {
      if (updateRoleDto.name) {
        const normalizedName = updateRoleDto.name.toLowerCase().trim();
        
        const existingRole = await this.prisma.role.findFirst({
          where: {
            name: {
              equals: normalizedName,
              mode: 'insensitive',
            },
            NOT: { id },
          },
        });

        if (existingRole) {
          throw new ConflictException('Role name already exists');
        }
      }

      const updateData: Partial<Role> = {};
      if (updateRoleDto.name) updateData.name = updateRoleDto.name.trim();
      if (updateRoleDto.description !== undefined) {
        updateData.description = updateRoleDto.description?.trim() || null;
      }

      const role = await this.prisma.role.update({
        where: { id },
        data: updateData,
        include: {
          permissions: true,
        },
      });

      return this.mapToRoleResponse(role as RoleWithPermissions);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'update_role' },
        extra: { roleId: id },
      });
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new NotFoundException('Failed to update role');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const userCount = await this.prisma.user.count({
        where: { roleId: id },
      });

      if (userCount > 0) {
        throw new BadRequestException(`Cannot delete role. ${userCount} user(s) are assigned to this role`);
      }

      await this.prisma.role.delete({
        where: { id },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'delete_role' },
        extra: { roleId: id },
      });
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new NotFoundException('Role not found');
    }
  }

  async addPermission(roleId: string, createPermissionDto: CreateRolePermissionDto): Promise<RolePermissionResponseDto> {
    try {
      const role = await this.prisma.role.findUnique({ where: { id: roleId } });
      if (!role) {
        throw new NotFoundException('Role not found');
      }

      const existingPermission = await this.prisma.rolePermission.findUnique({
        where: {
          roleId_moduleName: {
            roleId,
            moduleName: createPermissionDto.moduleName,
          },
        },
      });

      if (existingPermission) {
        throw new ConflictException('Permission for this module already exists');
      }

      const permission = await this.prisma.rolePermission.create({
        data: {
          roleId,
          ...createPermissionDto,
        },
      });

      return this.mapToPermissionResponse(permission);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'add_role_permission' },
        extra: { roleId, moduleName: createPermissionDto.moduleName },
      });
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to add permission');
    }
  }

  async updatePermission(roleId: string, moduleName: string, updatePermissionDto: UpdateRolePermissionDto): Promise<RolePermissionResponseDto> {
    try {
      const permission = await this.prisma.rolePermission.update({
        where: {
          roleId_moduleName: {
            roleId,
            moduleName,
          },
        },
        data: updatePermissionDto,
      });

      return this.mapToPermissionResponse(permission);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'update_role_permission' },
        extra: { roleId, moduleName },
      });
      throw new NotFoundException('Permission not found');
    }
  }

  async removePermission(roleId: string, moduleName: string): Promise<void> {
    try {
      await this.prisma.rolePermission.delete({
        where: {
          roleId_moduleName: {
            roleId,
            moduleName,
          },
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'remove_role_permission' },
        extra: { roleId, moduleName },
      });
      throw new NotFoundException('Permission not found');
    }
  }

  async getDefaultRoles(): Promise<Array<{ name: string; description: string; permissions: CreateRolePermissionDto[] }>> {
    return Promise.resolve([
      {
        name: 'Admin',
        description: 'System Administrator with full access',
        permissions: [
          { moduleName: 'users', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { moduleName: 'roles', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { moduleName: 'reservations', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { moduleName: 'pos', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { moduleName: 'inventory', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { moduleName: 'finance', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { moduleName: 'staff', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { moduleName: 'dashboard', canView: true, canCreate: true, canEdit: true, canDelete: true },
        ],
      },
      {
        name: 'Receptionist',
        description: 'Front desk operations and guest management',
        permissions: [
          { moduleName: 'reservations', canView: true, canCreate: true, canEdit: true, canDelete: false },
          { moduleName: 'dashboard', canView: true, canCreate: false, canEdit: false, canDelete: false },
        ],
      },
      {
        name: 'Restaurant Staff',
        description: 'Restaurant and bar operations',
        permissions: [
          { moduleName: 'pos', canView: true, canCreate: true, canEdit: true, canDelete: false },
          { moduleName: 'inventory', canView: true, canCreate: false, canEdit: false, canDelete: false },
        ],
      },
      {
        name: 'Finance Officer',
        description: 'Financial operations and reporting',
        permissions: [
          { moduleName: 'finance', canView: true, canCreate: true, canEdit: true, canDelete: false },
          { moduleName: 'dashboard', canView: true, canCreate: false, canEdit: false, canDelete: false },
          { moduleName: 'reservations', canView: true, canCreate: false, canEdit: false, canDelete: false },
          { moduleName: 'pos', canView: true, canCreate: false, canEdit: false, canDelete: false },
        ],
      },
      {
        name: 'Store Manager',
        description: 'Inventory and supply management',
        permissions: [
          { moduleName: 'inventory', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { moduleName: 'dashboard', canView: true, canCreate: false, canEdit: false, canDelete: false },
        ],
      },
    ]);
  }

  private mapToRoleResponse(role: RoleWithPermissions): RoleResponseDto {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions.map((p: RolePermission) => this.mapToPermissionResponse(p)),
    };
  }

  private mapToPermissionResponse(permission: RolePermission): RolePermissionResponseDto {
    return {
      id: permission.id,
      moduleName: permission.moduleName,
      canView: permission.canView,
      canCreate: permission.canCreate,
      canEdit: permission.canEdit,
      canDelete: permission.canDelete,
    };
  }
}
       