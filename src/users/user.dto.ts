import { IsBoolean, IsNotEmpty,IsOptional,IsUUID,MinLength, IsEmail } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto{
    @ApiProperty({ example: 'John Doe' })
    @IsNotEmpty()
    fullName: string;

    @ApiProperty({ example: 'johndoe@example.com'})
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'password123' })
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @ApiProperty({example: 'uuid-role-id'})
    @IsUUID()
    roleId: string;

    @ApiProperty({example: true, required: false})
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