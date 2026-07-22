import { BadRequestException, Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtAccessPayload } from '../auth/strategies/jwt-access.strategy';
import { OrdersService } from '../orders/orders.service';
import { BlockUserDto } from './dto/block-user.dto';
import { SetAvatarStatusDto } from './dto/set-avatar-status.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserRole } from './schemas/user.schema';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
  ) {}

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
      avatarDisabled: updated.avatarDisabled,
      heightCm: updated.heightCm,
      weightKg: updated.weightKg,
      gender: updated.gender,
    };
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllAdmin() {
    return this.usersService.findAllAdmin();
  }

  @Patch('admin/:id/block')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async setBlocked(
    @CurrentUser() currentUser: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: BlockUserDto,
  ) {
    if (id === currentUser.sub) {
      throw new BadRequestException('You cannot block your own account');
    }
    if (dto.isBlocked) {
      const target = await this.usersService.findById(id);
      if (target?.role === UserRole.ADMIN) {
        throw new BadRequestException('You cannot block another admin account');
      }
    }
    return this.usersService.setBlocked(id, dto.isBlocked);
  }

  @Get('admin/:id/orders')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findOrdersForUser(@Param('id') id: string) {
    return this.ordersService.findAllForUser(id);
  }

  @Get('admin/avatars')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllWithAvatars() {
    return this.usersService.findAllWithAvatars();
  }

  @Patch('admin/:id/avatar-status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  setAvatarDisabled(@Param('id') id: string, @Body() dto: SetAvatarStatusDto) {
    return this.usersService.setAvatarDisabled(id, dto.disabled);
  }
}
