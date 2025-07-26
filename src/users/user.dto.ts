// src/users/dto/user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsUUID, IsBoolean, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'john@hotel.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'uuid-role-id' })
  @IsUUID()
  roleId: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateUserDto {
  @ApiProperty({ example: 'John Doe Updated', required: false })
  @IsOptional()
  fullName?: string;

  @ApiProperty({ example: 'john.updated@hotel.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'uuid-role-id', required: false })
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AssignRoleDto {
  @ApiProperty({ example: 'uuid-role-id' })
  @IsUUID()
  roleId: string;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  role: {
    id: string;
    name: string;
    description?: string;
  };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}