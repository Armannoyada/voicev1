import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { RoomStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LivekitService } from '../livekit/livekit.service';

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LENGTH = 8;

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly livekit: LivekitService,
  ) {}

  private normalizeCode(code: string) {
    return code.trim().toUpperCase();
  }

  private generateCode() {
    const bytes = randomBytes(ROOM_CODE_LENGTH);
    let code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += ROOM_CODE_ALPHABET[bytes[i] % ROOM_CODE_ALPHABET.length];
    }
    return code;
  }

  private async generateUniqueCode() {
    for (let i = 0; i < 8; i++) {
      const code = this.generateCode();
      const exists = await this.prisma.room.findUnique({ where: { code } });
      if (!exists) return code;
    }
    throw new InternalServerErrorException('failed to create unique room code');
  }

  async create(hostId: string, title?: string) {
    const host = await this.users.findById(hostId);
    if (!host) throw new NotFoundException('host not found');

    const code = await this.generateUniqueCode();
    const room = await this.prisma.room.create({
      data: {
        code,
        roomName: `room-${code.toLowerCase()}`,
        title: title?.trim() || `${host.username}'s room`,
        hostId,
      },
      include: {
        host: { select: { id: true, username: true, email: true } },
      },
    });
    return room;
  }

  async getByCode(code: string) {
    const room = await this.prisma.room.findUnique({
      where: { code: this.normalizeCode(code) },
      include: {
        host: { select: { id: true, username: true, email: true } },
      },
    });
    if (!room) throw new NotFoundException('room not found');
    return room;
  }

  async join(code: string, userId: string) {
    const room = await this.getByCode(code);
    if (room.status !== RoomStatus.ACTIVE) {
      throw new BadRequestException('room is no longer active');
    }
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('user not found');

    const tokenInfo = await this.livekit.createToken({
      roomName: room.roomName,
      identity: user.id,
      name: user.username,
    });

    return { room, ...tokenInfo };
  }

  async end(code: string, userId: string) {
    const room = await this.getByCode(code);
    if (room.hostId !== userId) {
      throw new ForbiddenException('only room host can end this room');
    }
    if (room.status === RoomStatus.ENDED) return room;
    return this.prisma.room.update({
      where: { id: room.id },
      data: { status: RoomStatus.ENDED, endedAt: new Date() },
      include: {
        host: { select: { id: true, username: true, email: true } },
      },
    });
  }
}
