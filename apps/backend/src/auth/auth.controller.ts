import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import type { JwtAccessPayload } from './strategies/jwt-access.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  google(@Body() dto: GoogleLoginDto) {
    return this.authService.googleLogin(dto.credential);
  }

  @Get('google/mobile/start')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  googleMobileStart(@Query('returnUrl') returnUrl: string, @Res() res: Response) {
    res.redirect(this.authService.googleMobileStartUrl(returnUrl ?? ''));
  }

  @Post('google/mobile/callback')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async googleMobileCallback(
    @Body() body: { id_token?: string; state?: string },
    @Res() res: Response,
  ) {
    const target = await this.authService.googleMobileCallback(
      body.id_token ?? '',
      body.state ?? '',
    );
    const escaped = target.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const script = JSON.stringify(target).replace(/</g, '\\u003c');
    // A page rather than a 302: mobile browsers don't always follow a redirect to a
    // custom app scheme; the auth session closes as soon as the app link opens.
    res
      .type('html')
      .send(
        `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>StyleForm</title><p style="font-family:sans-serif;text-align:center;margin-top:30vh">Returning to StyleForm…</p><script>location.replace(${script});</script><noscript><a href="${escaped}">Continue</a></noscript>`,
      );
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('verify-reset-code')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  verifyResetCode(@Body() dto: VerifyResetCodeDto) {
    return this.authService.verifyResetCode(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtRefreshGuard)
  refresh(@Body() _dto: RefreshDto, @CurrentUser() user: JwtAccessPayload & { refreshToken: string }) {
    return this.authService.refresh(user.sub, user.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  logout(@CurrentUser() user: JwtAccessPayload) {
    return this.authService.logout(user.sub).then(() => ({ success: true }));
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtAccessPayload) {
    return this.authService.getSafeUser(user.sub);
  }
}
