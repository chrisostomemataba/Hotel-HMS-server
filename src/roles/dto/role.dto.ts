// src/roles/dto/role.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'Receptionist' })
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 'Front desk operations and guest management', required: false })
  @IsOptional()
  @MaxLength(255)
  description?: string;
}

export class UpdateRoleDto {
  @ApiProperty({ example: 'Senior Receptionist', required: false })
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @ApiProperty({ example: 'Front desk operations with supervisory duties', required: false })
  @IsOptional()
  @MaxLength(255)
  description?: string;
}

export class RoleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string | null;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  permissions: Array<{
    id: string;
    moduleName: string;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  }>;
}