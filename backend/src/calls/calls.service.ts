import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CallStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LivekitService } from '../livekit/livekit.service';

@Injectable()
export class CallsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly livekit: LivekitService,
  ) {}

  async initiate(callerId: string, calleeIdentifier: string) {
    const callee = await this.users.findByIdentifier(calleeIdentifier);
    if (!callee) throw new NotFoundException('callee not found');
    if (callee.id === callerId) {
      throw new BadRequestException('cannot call yourself');
    }
    const caller = await this.users.findById(callerId);
    if (!caller) throw new NotFoundException('caller not found');

    const roomName = `call-${randomUUID()}`;
    const call = await this.prisma.call.create({
      data: {
        roomName,
        callerId,
        calleeId: callee.id,
        status: CallStatus.RINGING,
      },
      include: {
        caller: { select: { id: true, username: true, email: true } },
        callee: { select: { id: true, username: true, email: true } },
      },
    });
    return call;
  }

  async getById(callId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      include: {
        caller: { select: { id: true, username: true, email: true } },
        callee: { select: { id: true, username: true, email: true } },
      },
    });
    if (!call) throw new NotFoundException('call not found');
    return call;
  }

  async accept(callId: string, userId: string) {
    const call = await this.getById(callId);
    if (call.calleeId !== userId) {
      throw new ForbiddenException('only the callee can accept');
    }
    if (call.status !== CallStatus.RINGING) {
      throw new BadRequestException(`call is ${call.status}`);
    }
    const updated = await this.prisma.call.update({
      where: { id: callId },
      data: { status: CallStatus.ACCEPTED, startedAt: new Date() },
      include: {
        caller: { select: { id: true, username: true, email: true } },
        callee: { select: { id: true, username: true, email: true } },
      },
    });
    return updated;
  }

  async decline(callId: string, userId: string) {
    const call = await this.getById(callId);
    if (call.calleeId !== userId) {
      throw new ForbiddenException('only the callee can decline');
    }
    if (call.status !== CallStatus.RINGING) {
      throw new BadRequestException(`call is ${call.status}`);
    }
    return this.prisma.call.update({
      where: { id: callId },
      data: { status: CallStatus.DECLINED, endedAt: new Date() },
      include: {
        caller: { select: { id: true, username: true, email: true } },
        callee: { select: { id: true, username: true, email: true } },
      },
    });
  }

  async cancel(callId: string, userId: string) {
    const call = await this.getById(callId);
    if (call.callerId !== userId) {
      throw new ForbiddenException('only the caller can cancel');
    }
    if (call.status !== CallStatus.RINGING) {
      throw new BadRequestException(`call is ${call.status}`);
    }
    return this.prisma.call.update({
      where: { id: callId },
      data: { status: CallStatus.CANCELED, endedAt: new Date() },
      include: {
        caller: { select: { id: true, username: true, email: true } },
        callee: { select: { id: true, username: true, email: true } },
      },
    });
  }

  async end(callId: string, userId: string) {
    const call = await this.getById(callId);
    if (call.callerId !== userId && call.calleeId !== userId) {
      throw new ForbiddenException('not a participant');
    }
    if (call.status === CallStatus.ENDED) return call;
    return this.prisma.call.update({
      where: { id: callId },
      data: { status: CallStatus.ENDED, endedAt: new Date() },
      include: {
        caller: { select: { id: true, username: true, email: true } },
        callee: { select: { id: true, username: true, email: true } },
      },
    });
  }

  async getToken(callId: string, userId: string) {
    const call = await this.getById(callId);
    if (call.callerId !== userId && call.calleeId !== userId) {
      throw new ForbiddenException('not a participant');
    }
    if (call.status !== CallStatus.ACCEPTED) {
      throw new BadRequestException(`call must be accepted, is ${call.status}`);
    }
    const me =
      call.callerId === userId ? call.caller : call.callee;
    const { token, url, mode } = await this.livekit.createToken({
      roomName: call.roomName,
      identity: me.id,
      name: me.username,
    });
    return { token, url, mode, roomName: call.roomName };
  }
}
