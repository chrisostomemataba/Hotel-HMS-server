// src/roles/dto/role-permission.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsBoolean, IsIn } from 'class-validator';

const HOTEL_MODULES = ['users', 'roles', 'reservations', 'pos', 'inventory', 'finance', 'staff', 'dashboard'] as const;

export class CreateRolePermissionDto {
  @ApiProperty({ example: 'reservations', enum: HOTEL_MODULES })
  @IsNotEmpty()
  @IsIn(HOTEL_MODULES)
  moduleName: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  canView: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  canCreate: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  canEdit: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  canDelete: boolean;
}

export class UpdateRolePermissionDto {
  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  canView?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  canCreate?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  canEdit?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  canDelete?: boolean;
}

export class RolePermissionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  moduleName: string;

  @ApiProperty()
  canView: boolean;

  @ApiProperty()
  canCreate: boolean;

  @ApiProperty()
  canEdit: boolean;

  @ApiProperty()
  canDelete: boolean;
}