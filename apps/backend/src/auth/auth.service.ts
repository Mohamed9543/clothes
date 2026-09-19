import { createHmac, randomBytes, randomInt } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { EnvConfig } from '../config/env.validation';
import { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { MailService } from './mail.service';
import { JwtAccessPayload } from './strategies/jwt-access.strategy';

const SALT_ROUNDS = 12;
const RESET_CODE_TTL_MS = 10 * 60 * 1000;
const RESET_CODE_MAX_ATTEMPTS = 5;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SafeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  preferredLanguage: string;
  avatarUrl: string | null;
  avatarDisabled: boolean;
  heightCm: number | null;
  weightKg: number | null;
  gender: string | null;
  loyaltyPoints: number;
}

function toSafeUser(user: UserDocument): SafeUser {
  return {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    preferredLanguage: user.preferredLanguage,
    avatarUrl: user.avatarUrl,
    avatarDisabled: user.avatarDisabled,
    heightCm: user.heightCm,
    weightKg: user.weightKg,
    gender: user.gender,
    loyaltyPoints: user.loyaltyPoints,
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly mailService: MailService,
  ) {}

  private googleClient: OAuth2Client | null = null;

  private async issueTokens(user: UserDocument): Promise<AuthTokens> {
    const payload: JwtAccessPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET', { infer: true }),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRY', { infer: true }),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET', { infer: true }),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRY', { infer: true }),
    });

    const refreshTokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await this.usersService.updateRefreshTokenHash(user._id.toString(), refreshTokenHash);

    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto): Promise<{ user: SafeUser } & AuthTokens> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    const tokens = await this.issueTokens(user);
    return { user: toSafeUser(user), ...tokens };
  }

  async login(dto: LoginDto): Promise<{ user: SafeUser } & AuthTokens> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isBlocked) {
      throw new ForbiddenException('Your account has been blocked');
    }

    const tokens = await this.issueTokens(user);
    return { user: toSafeUser(user), ...tokens };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ success: true }> {
    const user = await this.usersService.findByEmail(dto.email);
    // Same response whether or not the account exists, so emails can't be enumerated.
    if (user && !user.isBlocked) {
      const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
      await this.usersService.setResetCode(
        user._id.toString(),
        await bcrypt.hash(code, SALT_ROUNDS),
        new Date(Date.now() + RESET_CODE_TTL_MS),
      );
      await this.mailService.sendPasswordResetCode(user.email, code, user.firstName);
    }
    return { success: true };
  }

  // Checks the emailed code (counting wrong guesses) without consuming it.
  private async assertValidResetCode(email: string, code: string): Promise<UserDocument> {
    const invalid = new BadRequestException('Invalid or expired code');
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.resetCodeHash || !user.resetCodeExpiresAt) {
      throw invalid;
    }

    const userId = user._id.toString();
    if (
      user.resetCodeExpiresAt.getTime() < Date.now() ||
      user.resetCodeAttempts >= RESET_CODE_MAX_ATTEMPTS
    ) {
      await this.usersService.clearResetCode(userId);
      throw invalid;
    }

    if (!(await bcrypt.compare(code, user.resetCodeHash))) {
      await this.usersService.incrementResetAttempts(userId);
      throw invalid;
    }
    return user;
  }

  async verifyResetCode(dto: VerifyResetCodeDto): Promise<{ success: true }> {
    await this.assertValidResetCode(dto.email, dto.code);
    return { success: true };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ success: true }> {
    const user = await this.assertValidResetCode(dto.email, dto.code);
    await this.usersService.resetPassword(
      user._id.toString(),
      await bcrypt.hash(dto.newPassword, SALT_ROUNDS),
    );
    return { success: true };
  }

  private async verifyGoogleIdToken(credential: string): Promise<TokenPayload> {
    const clientId = this.configService.get('GOOGLE_CLIENT_ID', { infer: true });
    if (!clientId) {
      throw new ServiceUnavailableException('Google sign-in is not configured');
    }
    this.googleClient ??= new OAuth2Client(clientId);

    let payload: TokenPayload | undefined;
    try {
      const ticket = await this.googleClient.verifyIdToken({ idToken: credential, audience: clientId });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google credential');
    }
    if (!payload?.sub || !payload.email || !payload.email_verified) {
      throw new UnauthorizedException('Google account email is not verified');
    }
    return payload;
  }

  private async loginWithGooglePayload(
    payload: TokenPayload,
  ): Promise<{ user: SafeUser } & AuthTokens> {
    const email = payload.email as string;
    let user = await this.usersService.findByEmail(email);
    if (user) {
      if (!user.googleId) {
        await this.usersService.setGoogleId(user._id.toString(), payload.sub);
      }
    } else {
      user = await this.usersService.create({
        email,
        // Random unusable password: this account signs in with Google (or resets via email).
        passwordHash: await bcrypt.hash(randomBytes(32).toString('hex'), SALT_ROUNDS),
        firstName: payload.given_name ?? payload.name ?? email.split('@')[0],
        lastName: payload.family_name ?? '-',
        googleId: payload.sub,
      });
    }

    if (user.isBlocked) {
      throw new ForbiddenException('Your account has been blocked');
    }
    const tokens = await this.issueTokens(user);
    return { user: toSafeUser(user), ...tokens };
  }

  async googleLogin(credential: string): Promise<{ user: SafeUser } & AuthTokens> {
    return this.loginWithGooglePayload(await this.verifyGoogleIdToken(credential));
  }

  // --- Google sign-in for the mobile app --------------------------------------
  // Redirect flow (no client secret needed): the app opens /auth/google/mobile/start
  // in a browser, Google posts an ID token back to /auth/google/mobile/callback, and
  // we hand fresh tokens to the app through its deep link. The state is HMAC-signed
  // and its hash is sent as the OIDC nonce, so a forged callback is rejected.

  private signState(state: string): string {
    return createHmac('sha256', this.configService.get('JWT_ACCESS_SECRET', { infer: true }))
      .update(state)
      .digest('hex');
  }

  private googleMobileCallbackUrl(): string {
    const base =
      this.configService.get('API_PUBLIC_URL', { infer: true }) ||
      process.env.RENDER_EXTERNAL_URL ||
      `http://localhost:${this.configService.get('PORT', { infer: true })}`;
    return `${base.replace(/\/$/, '')}/auth/google/mobile/callback`;
  }

  private assertAppReturnUrl(returnUrl: string): void {
    const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(returnUrl)?.[1]?.toLowerCase();
    if (!scheme || !['exp', 'exps', 'libas'].includes(scheme)) {
      throw new BadRequestException('Invalid return URL');
    }
  }

  googleMobileStartUrl(returnUrl: string): string {
    this.assertAppReturnUrl(returnUrl);
    const clientId = this.configService.get('GOOGLE_CLIENT_ID', { infer: true });
    if (!clientId) {
      throw new ServiceUnavailableException('Google sign-in is not configured');
    }
    const state = Buffer.from(
      JSON.stringify({ r: returnUrl, n: randomBytes(8).toString('hex') }),
    ).toString('base64url');
    const signature = this.signState(state);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: this.googleMobileCallbackUrl(),
      response_type: 'id_token',
      response_mode: 'form_post',
      scope: 'openid email profile',
      state: `${state}.${signature}`,
      nonce: signature,
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // Returns the deep link that sends the user back to the app, carrying tokens or an error.
  async googleMobileCallback(idToken: string, signedState: string): Promise<string> {
    const [state, signature] = signedState.split('.');
    if (!state || !signature || signature !== this.signState(state)) {
      throw new BadRequestException('Invalid state');
    }
    const { r: returnUrl } = JSON.parse(Buffer.from(state, 'base64url').toString()) as {
      r: string;
    };
    this.assertAppReturnUrl(returnUrl);

    const separator = returnUrl.includes('?') ? '&' : '?';
    try {
      const payload = await this.verifyGoogleIdToken(idToken);
      if (payload.nonce !== signature) {
        throw new UnauthorizedException('Invalid nonce');
      }
      const { accessToken, refreshToken } = await this.loginWithGooglePayload(payload);
      return `${returnUrl}${separator}accessToken=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}`;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      return `${returnUrl}${separator}error=${encodeURIComponent(message)}`;
    }
  }

  async refresh(userId: string, refreshToken: string): Promise<AuthTokens> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.refreshTokenHash) {
      throw new ForbiddenException('Access denied');
    }

    if (user.isBlocked) {
      throw new ForbiddenException('Your account has been blocked');
    }

    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) {
      throw new ForbiddenException('Access denied');
    }

    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshTokenHash(userId, null);
  }

  async getSafeUser(userId: string): Promise<SafeUser> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return toSafeUser(user);
  }
}
