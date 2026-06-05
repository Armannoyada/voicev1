import {
  Body,
  Controller,
  HttpCode,
  Param,
  Post,
  Get,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/current-user.decorator';
import { CallsService } from './calls.service';
import { CallsGateway } from './calls.gateway';
import { InitiateCallDto } from './dto/initiate-call.dto';

@UseGuards(JwtAuthGuard)
@Controller('calls')
export class CallsController {
  constructor(
    private readonly calls: CallsService,
    private readonly gateway: CallsGateway,
  ) {}

  @Post('initiate')
  async initiate(
    @CurrentUser() me: CurrentUserPayload,
    @Body() dto: InitiateCallDto,
  ) {
    const call = await this.calls.initiate(me.id, dto.calleeIdentifier);
    this.gateway.emitIncomingCall(call.calleeId, {
      callId: call.id,
      from: call.caller,
      createdAt: call.createdAt,
    });
    return call;
  }

  @Post(':id/accept')
  @HttpCode(200)
  async accept(
    @Param('id') id: string,
    @CurrentUser() me: CurrentUserPayload,
  ) {
    const call = await this.calls.accept(id, me.id);
    const tokenInfo = await this.calls.getToken(id, me.id);
    this.gateway.emitCallAccepted(call.callerId, {
      callId: call.id,
      roomName: call.roomName,
    });
    return { call, ...tokenInfo };
  }

  @Post(':id/decline')
  @HttpCode(200)
  async decline(
    @Param('id') id: string,
    @CurrentUser() me: CurrentUserPayload,
  ) {
    const call = await this.calls.decline(id, me.id);
    this.gateway.emitCallDeclined(call.callerId, { callId: call.id });
    return { call };
  }

  @Post(':id/cancel')
  @HttpCode(200)
  async cancel(
    @Param('id') id: string,
    @CurrentUser() me: CurrentUserPayload,
  ) {
    const call = await this.calls.cancel(id, me.id);
    this.gateway.emitCallCanceled(call.calleeId, { callId: call.id });
    return { call };
  }

  @Post(':id/end')
  @HttpCode(200)
  async end(
    @Param('id') id: string,
    @CurrentUser() me: CurrentUserPayload,
  ) {
    const call = await this.calls.end(id, me.id);
    this.gateway.emitCallEnded([call.callerId, call.calleeId], {
      callId: call.id,
    });
    return { call };
  }

  @Get(':id/token')
  async token(
    @Param('id') id: string,
    @CurrentUser() me: CurrentUserPayload,
  ) {
    return this.calls.getToken(id, me.id);
  }
}
