import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken } from 'livekit-server-sdk';

@Injectable()
export class LivekitService {
  constructor(private readonly config: ConfigService) {}

  private credentials() {
    const mode = this.config.get<string>('LIVEKIT_MODE', 'selfhosted');
    if (mode === 'cloud') {
      const url = this.config.get<string>('LIVEKIT_CLOUD_URL');
      const apiKey = this.config.get<string>('LIVEKIT_CLOUD_API_KEY');
      const apiSecret = this.config.get<string>('LIVEKIT_CLOUD_API_SECRET');
      if (!url || !apiKey || !apiSecret) {
        throw new InternalServerErrorException(
          'LiveKit Cloud credentials are missing in env',
        );
      }
      return { mode, url, apiKey, apiSecret };
    }
    const url = this.config.get<string>('LIVEKIT_SELFHOSTED_URL');
    const apiKey = this.config.get<string>('LIVEKIT_SELFHOSTED_API_KEY');
    const apiSecret = this.config.get<string>('LIVEKIT_SELFHOSTED_API_SECRET');
    if (!url || !apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        'Self-hosted LiveKit credentials are missing in env',
      );
    }
    return { mode, url, apiKey, apiSecret };
  }

  async createToken(params: {
    roomName: string;
    identity: string;
    name: string;
  }): Promise<{ token: string; url: string; mode: string }> {
    const { url, apiKey, apiSecret, mode } = this.credentials();

    const at = new AccessToken(apiKey, apiSecret, {
      identity: params.identity,
      name: params.name,
      ttl: 60 * 60,
    });
    at.addGrant({
      room: params.roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();
    return { token, url, mode };
  }
}
