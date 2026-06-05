import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/current-user.decorator';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';

@UseGuards(JwtAuthGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  @Post()
  async create(
    @CurrentUser() me: CurrentUserPayload,
    @Body() dto: CreateRoomDto,
  ) {
    return this.rooms.create(me.id, dto.title);
  }

  @Get(':code')
  async get(@Param('code') code: string) {
    return this.rooms.getByCode(code);
  }

  @Post(':code/join')
  async join(
    @Param('code') code: string,
    @CurrentUser() me: CurrentUserPayload,
  ) {
    return this.rooms.join(code, me.id);
  }

  @Post(':code/end')
  async end(
    @Param('code') code: string,
    @CurrentUser() me: CurrentUserPayload,
  ) {
    return this.rooms.end(code, me.id);
  }
}
