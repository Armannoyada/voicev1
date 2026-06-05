import { Module } from '@nestjs/common';
import { CallsService } from './calls.service';
import { CallsController } from './calls.controller';
import { CallsGateway } from './calls.gateway';
import { UsersModule } from '../users/users.module';
import { LivekitModule } from '../livekit/livekit.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [UsersModule, LivekitModule, AuthModule],
  controllers: [CallsController],
  providers: [CallsService, CallsGateway],
})
export class CallsModule {}
