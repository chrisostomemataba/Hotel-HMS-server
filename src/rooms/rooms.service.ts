/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as Sentry from '@sentry/nestjs';
import { CreateRoomDto, UpdateRoomDto, UpdateRoomStatusDto, RoomResponseDto, RoomAvailabilityDto, AvailableRoomResponseDto } from './rooms.dto';
import { RoomType, RoomStatus } from './rooms.enum';
import { Room } from '@prisma/client';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async create(createRoomDto: CreateRoomDto): Promise<RoomResponseDto> {
    try {
      const existingRoom = await this.prisma.room.findFirst({
        where: {
          roomNumber: {
            equals: createRoomDto.roomNumber.trim(),
            mode: 'insensitive',
          },
        },
      });

      if (existingRoom) {
        throw new ConflictException('Room number already exists');
      }

      const room = await this.prisma.room.create({
        data: {
          roomNumber: createRoomDto.roomNumber.trim(),
          type: createRoomDto.type,
          status: createRoomDto.status,
          pricePerNight: createRoomDto.pricePerNight,
        },
      });

      return this.mapToRoomResponse(room);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'create_room' },
        extra: { roomNumber: createRoomDto.roomNumber },
      });
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException('Failed to create room');
    }
  }

  async findAll(): Promise<RoomResponseDto[]> {
    try {
      const rooms = await this.prisma.room.findMany({
        orderBy: [
          { roomNumber: 'asc' },
        ],
      });

      return rooms.map(room => this.mapToRoomResponse(room));
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'find_all_rooms' },
      });
      throw new NotFoundException('Failed to fetch rooms');
    }
  }

  async findOne(id: string): Promise<RoomResponseDto> {
    try {
      const room = await this.prisma.room.findUnique({
        where: { id },
      });

      if (!room) {
        throw new NotFoundException('Room not found');
      }

      return this.mapToRoomResponse(room);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'find_one_room' },
        extra: { roomId: id },
      });
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Room not found');
    }
  }

  async update(id: string, updateRoomDto: UpdateRoomDto): Promise<RoomResponseDto> {
    try {
      const existingRoom = await this.prisma.room.findUnique({
        where: { id },
      });

      if (!existingRoom) {
        throw new NotFoundException('Room not found');
      }

      if (updateRoomDto.roomNumber) {
        const roomNumberExists = await this.prisma.room.findFirst({
          where: {
            roomNumber: {
              equals: updateRoomDto.roomNumber.trim(),
              mode: 'insensitive',
            },
            NOT: { id },
          },
        });

        if (roomNumberExists) {
          throw new ConflictException('Room number already exists');
        }
      }

      const room = await this.prisma.room.update({
        where: { id },
        data: {
          ...(updateRoomDto.roomNumber && { roomNumber: updateRoomDto.roomNumber.trim() }),
          ...(updateRoomDto.type && { type: updateRoomDto.type }),
          ...(updateRoomDto.status && { status: updateRoomDto.status }),
          ...(updateRoomDto.pricePerNight !== undefined && { pricePerNight: updateRoomDto.pricePerNight }),
        },
      });

      return this.mapToRoomResponse(room);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'update_room' },
        extra: { roomId: id },
      });
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new ConflictException('Failed to update room');
    }
  }

  async updateStatus(id: string, updateStatusDto: UpdateRoomStatusDto): Promise<RoomResponseDto> {
    try {
      const existingRoom = await this.prisma.room.findUnique({
        where: { id },
        include: {
          reservations: {
            where: {
              status: {
                in: ['Confirmed', 'Checked In'],
              },
              checkOutDate: {
                gte: new Date(),
              },
            },
          },
        },
      });

      if (!existingRoom) {
        throw new NotFoundException('Room not found');
      }

      if (updateStatusDto.status === RoomStatus.AVAILABLE && existingRoom.reservations.length > 0) {
        throw new BadRequestException('Cannot set room to Available while active reservations exist');
      }

      const room = await this.prisma.room.update({
        where: { id },
        data: {
          status: updateStatusDto.status,
        },
      });

      return this.mapToRoomResponse(room);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'update_room_status' },
        extra: { roomId: id, status: updateStatusDto.status },
      });
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new ConflictException('Failed to update room status');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const room = await this.prisma.room.findUnique({
        where: { id },
        include: {
          reservations: true,
        },
      });

      if (!room) {
        throw new NotFoundException('Room not found');
      }

      if (room.reservations.length > 0) {
        throw new BadRequestException('Cannot delete room with existing reservations');
      }

      await this.prisma.room.delete({
        where: { id },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'delete_room' },
        extra: { roomId: id },
      });
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new ConflictException('Failed to delete room');
    }
  }

  async findAvailable(availabilityDto: RoomAvailabilityDto): Promise<AvailableRoomResponseDto[]> {
    try {
      const checkInDate = new Date(availabilityDto.checkIn);
      const checkOutDate = new Date(availabilityDto.checkOut);

      if (checkInDate >= checkOutDate) {
        throw new BadRequestException('Check-in date must be before check-out date');
      }

      if (checkInDate < new Date()) {
        throw new BadRequestException('Check-in date cannot be in the past');
      }

      const rooms = await this.prisma.room.findMany({
        where: {
          status: RoomStatus.AVAILABLE,
          reservations: {
            none: {
              AND: [
                {
                  status: {
                    in: ['Confirmed', 'Checked In'],
                  },
                },
                {
                  checkInDate: {
                    lt: checkOutDate,
                  },
                  checkOutDate: {
                    gt: checkInDate,
                  },
                },
              ],
            },
          },
        },
        orderBy: [
          { type: 'asc' },
          { roomNumber: 'asc' },
        ],
      });

      return rooms.map(room => ({
        id: room.id,
        roomNumber: room.roomNumber,
        type: room.type as RoomType,
        pricePerNight: Number(room.pricePerNight),
        isAvailable: true,
      }));
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'find_available_rooms' },
        extra: { checkIn: availabilityDto.checkIn, checkOut: availabilityDto.checkOut },
      });
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new NotFoundException('Failed to check room availability');
    }
  }

  async findByType(type: RoomType): Promise<RoomResponseDto[]> {
    try {
      const rooms = await this.prisma.room.findMany({
        where: { type },
        orderBy: { roomNumber: 'asc' },
      });

      return rooms.map(room => this.mapToRoomResponse(room));
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'find_rooms_by_type' },
        extra: { type },
      });
      throw new NotFoundException('Failed to fetch rooms by type');
    }
  }

  async findByStatus(status: RoomStatus): Promise<RoomResponseDto[]> {
    try {
      const rooms = await this.prisma.room.findMany({
        where: { status },
        orderBy: { roomNumber: 'asc' },
      });

      return rooms.map(room => this.mapToRoomResponse(room));
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'find_rooms_by_status' },
        extra: { status },
      });
      throw new NotFoundException('Failed to fetch rooms by status');
    }
  }

  private mapToRoomResponse(room: Room): RoomResponseDto {
    return {
      id: room.id,
      roomNumber: room.roomNumber,
      type: room.type as RoomType,
      status: room.status as RoomStatus,
      pricePerNight: Number(room.pricePerNight),
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }
}