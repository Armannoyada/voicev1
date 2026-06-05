import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { UsersModule } from '../users/users.module';
import { LivekitModule } from '../livekit/livekit.module';

@Module({
  imports: [UsersModule, LivekitModule],
  controllers: [RoomsController],
  providers: [RoomsService],
})
export class RoomsModule {}
