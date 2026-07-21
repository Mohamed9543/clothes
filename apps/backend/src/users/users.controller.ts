import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtAccessPayload } from '../auth/strategies/jwt-access.strategy';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  async updateProfile(@CurrentUser() user: JwtAccessPayload, @Body() dto: UpdateProfileDto) {
    const updated = await this.usersService.updateProfile(user.sub, dto);
    return {
      id: updated._id.toString(),
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      role: updated.role,
      preferredLanguage: updated.preferredLanguage,
      avatarUrl: updated.avatarUrl,
      heightCm: updated.heightCm,
      weightKg: updated.weightKg,
      gender: updated.gender,
    };
  }
}
