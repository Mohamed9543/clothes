import { randomInt, randomBytes } from 'crypto';
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
import { OAuth2Client } from 'google-auth-library';
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

  async googleLogin(credential: string): Promise<{ user: SafeUser } & AuthTokens> {
    const clientId = this.configService.get('GOOGLE_CLIENT_ID', { infer: true });
    if (!clientId) {
      throw new ServiceUnavailableException('Google sign-in is not configured');
    }
    this.googleClient ??= new OAuth2Client(clientId);

    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({ idToken: credential, audience: clientId });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google credential');
    }
    if (!payload?.sub || !payload.email || !payload.email_verified) {
      throw new UnauthorizedException('Google account email is not verified');
    }

    let user = await this.usersService.findByEmail(payload.email);
    if (user) {
      if (!user.googleId) {
        await this.usersService.setGoogleId(user._id.toString(), payload.sub);
      }
    } else {
      user = await this.usersService.create({
        email: payload.email,
        // Random unusable password: this account signs in with Google (or resets via email).
        passwordHash: await bcrypt.hash(randomBytes(32).toString('hex'), SALT_ROUNDS),
        firstName: payload.given_name ?? payload.name ?? payload.email.split('@')[0],
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
