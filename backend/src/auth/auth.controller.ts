import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, CookieOptions } from 'express';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from './current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  private cookieOpts(maxAgeMs?: number): CookieOptions {
    const isSecure = this.config.get('COOKIE_SECURE') === 'true';
    const domain = this.config.get<string>('COOKIE_DOMAIN');
    const opts: CookieOptions = {
      httpOnly: true,
      sameSite: isSecure ? 'none' : 'lax',
      secure: isSecure,
      path: '/',
    };
    if (domain && domain.length > 0) opts.domain = domain;
    if (typeof maxAgeMs === 'number') opts.maxAge = maxAgeMs;
    return opts;
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    res.cookie('access_token', accessToken, this.cookieOpts(15 * 60 * 1000));
    res.cookie(
      'refresh_token',
      refreshToken,
      this.cookieOpts(7 * 24 * 60 * 60 * 1000),
    );
  }

  @Post('signup')
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.auth.signup(dto);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { user };
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.auth.login(dto);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { user };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.['refresh_token'];
    if (!token) throw new UnauthorizedException('no refresh token');
    let payload;
    try {
      payload = await this.auth.verifyRefreshToken(token);
    } catch {
      throw new UnauthorizedException('invalid refresh token');
    }
    const tokens = await this.auth.refresh(payload.sub, payload.username);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { ok: true };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Res({ passthrough: true }) res: Response) {
    const clearOpts = this.cookieOpts();
    res.clearCookie('access_token', clearOpts);
    res.clearCookie('refresh_token', clearOpts);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: CurrentUserPayload) {
    return { user };
  }
}
