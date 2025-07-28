import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsOptional, MaxLength, Min, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { RoomType, RoomStatus } from './rooms.enum';

export class CreateRoomDto {
  @ApiProperty({ example: '101' })
  @IsNotEmpty()
  @MaxLength(20)
  roomNumber: string;

  @ApiProperty({ example: RoomType.STANDARD, enum: RoomType })
  @IsEnum(RoomType)
  type: RoomType;

  @ApiProperty({ example: RoomStatus.AVAILABLE, enum: RoomStatus })
  @IsEnum(RoomStatus)
  status: RoomStatus;

  @ApiProperty({ example: 150.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }: { value: unknown }) => parseFloat(String(value)))
  pricePerNight: number;
}

export class UpdateRoomDto {
  @ApiProperty({ example: '102', required: false })
  @IsOptional()
  @MaxLength(20)
  roomNumber?: string;

  @ApiProperty({ example: RoomType.DELUXE, enum: RoomType, required: false })
  @IsOptional()
  @IsEnum(RoomType)
  type?: RoomType;

  @ApiProperty({ example: RoomStatus.CLEANING, enum: RoomStatus, required: false })
  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;

  @ApiProperty({ example: 200.00, required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }: { value: unknown }) => parseFloat(String(value)))
  pricePerNight?: number;
}

export class UpdateRoomStatusDto {
  @ApiProperty({ example: RoomStatus.OCCUPIED, enum: RoomStatus })
  @IsEnum(RoomStatus)
  status: RoomStatus;
}

export class RoomResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  roomNumber: string;

  @ApiProperty({ enum: RoomType })
  type: RoomType;

  @ApiProperty({ enum: RoomStatus })
  status: RoomStatus;

  @ApiProperty()
  pricePerNight: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class RoomAvailabilityDto {
  @ApiProperty({ example: '2025-07-26' })
  @IsNotEmpty()
  checkIn: string;

  @ApiProperty({ example: '2025-07-28' })
  @IsNotEmpty()
  checkOut: string;
}

export class AvailableRoomResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  roomNumber: string;

  @ApiProperty({ enum: RoomType })
  type: RoomType;

  @ApiProperty()
  pricePerNight: number;

  @ApiProperty()
  isAvailable: boolean;
}