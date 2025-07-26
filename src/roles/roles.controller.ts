// src/roles/roles.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, RoleResponseDto } from './dto/role.dto';
import { CreateRolePermissionDto, UpdateRolePermissionDto, RolePermissionResponseDto } from './dto/role-permission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-guard';

@ApiTags('Roles')
@Controller('roles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({ summary: 'Create new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully', type: RoleResponseDto })
  @ApiResponse({ status: 409, description: 'Role name already exists' })
  async create(@Body() createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully', type: [RoleResponseDto] })
  async findAll(): Promise<RoleResponseDto[]> {
    return this.rolesService.findAll();
  }

  @Get('defaults')
  @ApiOperation({ summary: 'Get default hotel role templates' })
  @ApiResponse({ status: 200, description: 'Default roles retrieved successfully' })
  async getDefaults(): Promise<Array<{ name: string; description: string; permissions: CreateRolePermissionDto[] }>> {
    return this.rolesService.getDefaultRoles();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiResponse({ status: 200, description: 'Role retrieved successfully', type: RoleResponseDto })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async findOne(@Param('id') id: string): Promise<RoleResponseDto> {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update role' })
  @ApiResponse({ status: 200, description: 'Role updated successfully', type: RoleResponseDto })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 409, description: 'Role name already exists' })
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto): Promise<RoleResponseDto> {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete role' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete role with assigned users' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.rolesService.remove(id);
  }

  @Post(':id/permissions')
  @ApiOperation({ summary: 'Add permission to role' })
  @ApiResponse({ status: 201, description: 'Permission added successfully', type: RolePermissionResponseDto })
  @ApiResponse({ status: 409, description: 'Permission already exists for this module' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async addPermission(
    @Param('id') roleId: string,
    @Body() createPermissionDto: CreateRolePermissionDto,
  ): Promise<RolePermissionResponseDto> {
    return this.rolesService.addPermission(roleId, createPermissionDto);
  }

  @Patch(':id/permissions/:moduleName')
  @ApiOperation({ summary: 'Update role permission for specific module' })
  @ApiResponse({ status: 200, description: 'Permission updated successfully', type: RolePermissionResponseDto })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async updatePermission(
    @Param('id') roleId: string,
    @Param('moduleName') moduleName: string,
    @Body() updatePermissionDto: UpdateRolePermissionDto,
  ): Promise<RolePermissionResponseDto> {
    return this.rolesService.updatePermission(roleId, moduleName, updatePermissionDto);
  }

  @Delete(':id/permissions/:moduleName')
  @ApiOperation({ summary: 'Remove permission from role' })
  @ApiResponse({ status: 200, description: 'Permission removed successfully' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async removePermission(
    @Param('id') roleId: string,
    @Param('moduleName') moduleName: string,
  ): Promise<void> {
    return this.rolesService.removePermission(roleId, moduleName);
  }
}