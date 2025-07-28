/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { CreateRoomDto, UpdateRoomDto, UpdateRoomStatusDto, RoomResponseDto, RoomAvailabilityDto, AvailableRoomResponseDto } from './rooms.dto';
import { RoomType, RoomStatus } from './rooms.enum';

@ApiTags('rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new room' })
  @ApiResponse({ status: 201, description: 'Room created successfully', type: RoomResponseDto })
  @ApiResponse({ status: 409, description: 'Room number already exists' })
  async create(@Body() createRoomDto: CreateRoomDto): Promise<RoomResponseDto> {
    return this.roomsService.create(createRoomDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all rooms' })
  @ApiResponse({ status: 200, description: 'Rooms retrieved successfully', type: [RoomResponseDto] })
  @ApiQuery({ name: 'type', enum: RoomType, required: false, description: 'Filter by room type' })
  @ApiQuery({ name: 'status', enum: RoomStatus, required: false, description: 'Filter by room status' })
  async findAll(
    @Query('type') type?: RoomType,
    @Query('status') status?: RoomStatus,
  ): Promise<RoomResponseDto[]> {
    if (type) {
      return this.roomsService.findByType(type);
    }
    if (status) {
      return this.roomsService.findByStatus(status);
    }
    return this.roomsService.findAll();
  }

  @Get('available')
  @ApiOperation({ summary: 'Check room availability for dates' })
  @ApiResponse({ status: 200, description: 'Available rooms retrieved successfully', type: [AvailableRoomResponseDto] })
  @ApiResponse({ status: 400, description: 'Invalid date range' })
  @ApiQuery({ name: 'checkIn', description: 'Check-in date (YYYY-MM-DD)', example: '2025-07-26' })
  @ApiQuery({ name: 'checkOut', description: 'Check-out date (YYYY-MM-DD)', example: '2025-07-28' })
  async findAvailable(@Query() availabilityDto: RoomAvailabilityDto): Promise<AvailableRoomResponseDto[]> {
    return this.roomsService.findAvailable(availabilityDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get room by ID' })
  @ApiParam({ name: 'id', description: 'Room UUID' })
  @ApiResponse({ status: 200, description: 'Room retrieved successfully', type: RoomResponseDto })
  @ApiResponse({ status: 404, description: 'Room not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<RoomResponseDto> {
    return this.roomsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update room information' })
  @ApiParam({ name: 'id', description: 'Room UUID' })
  @ApiResponse({ status: 200, description: 'Room updated successfully', type: RoomResponseDto })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 409, description: 'Room number already exists' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoomDto: UpdateRoomDto,
  ): Promise<RoomResponseDto> {
    return this.roomsService.update(id, updateRoomDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update room status' })
  @ApiParam({ name: 'id', description: 'Room UUID' })
  @ApiResponse({ status: 200, description: 'Room status updated successfully', type: RoomResponseDto })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 400, description: 'Cannot update status due to active reservations' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateRoomStatusDto,
  ): Promise<RoomResponseDto> {
    return this.roomsService.updateStatus(id, updateStatusDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete room' })
  @ApiParam({ name: 'id', description: 'Room UUID' })
  @ApiResponse({ status: 204, description: 'Room deleted successfully' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete room with existing reservations' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.roomsService.remove(id);
  }
}