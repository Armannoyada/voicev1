import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import * as cookie from 'cookie';
import { AuthService } from '../auth/auth.service';

@Injectable()
@WebSocketGateway({
  namespace: '/calls',
  cors: {
    origin: (origin, cb) => cb(null, true),
    credentials: true,
  },
})
export class CallsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(CallsGateway.name);

  @WebSocketServer()
  server!: Server;

  private userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) throw new Error('no token');
      const payload = await this.auth.verifyAccessToken(token);
      (client.data as any).userId = payload.sub;
      (client.data as any).username = payload.username;

      const set = this.userSockets.get(payload.sub) ?? new Set<string>();
      set.add(client.id);
      this.userSockets.set(payload.sub, set);

      client.join(`user:${payload.sub}`);
      this.logger.log(`socket connected: ${payload.username} (${client.id})`);
    } catch (err) {
      this.logger.warn(`auth failed for socket ${client.id}: ${(err as Error).message}`);
      client.emit('error', { message: 'unauthorized' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client.data as any)?.userId as string | undefined;
    if (userId) {
      const set = this.userSockets.get(userId);
      if (set) {
        set.delete(client.id);
        if (set.size === 0) this.userSockets.delete(userId);
      }
    }
  }

  private extractToken(client: Socket): string | null {
    const authHeader = client.handshake.headers.cookie;
    if (authHeader) {
      const parsed = cookie.parse(authHeader);
      if (parsed['access_token']) return parsed['access_token'];
    }
    const fromAuth = client.handshake.auth?.token as string | undefined;
    if (fromAuth) return fromAuth;
    return null;
  }

  emitIncomingCall(calleeId: string, payload: unknown) {
    this.server.to(`user:${calleeId}`).emit('incoming_call', payload);
  }

  emitCallAccepted(callerId: string, payload: unknown) {
    this.server.to(`user:${callerId}`).emit('call_accepted', payload);
  }

  emitCallDeclined(callerId: string, payload: unknown) {
    this.server.to(`user:${callerId}`).emit('call_declined', payload);
  }

  emitCallCanceled(calleeId: string, payload: unknown) {
    this.server.to(`user:${calleeId}`).emit('call_canceled', payload);
  }

  emitCallEnded(userIds: string[], payload: unknown) {
    for (const uid of userIds) {
      this.server.to(`user:${uid}`).emit('call_ended', payload);
    }
  }
}
