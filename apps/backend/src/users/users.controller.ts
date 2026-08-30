import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtAccessPayload } from '../auth/strategies/jwt-access.strategy';
import { OrdersService } from '../orders/orders.service';
import { BlockUserDto } from './dto/block-user.dto';
import { SetAvatarStatusDto } from './dto/set-avatar-status.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { UserDocument, UserRole } from './schemas/user.schema';
import { UsersService } from './users.service';

function toSelfUserView(user: UserDocument) {
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
    chestCm: user.chestCm,
    waistCm: user.waistCm,
    hipsCm: user.hipsCm,
    legLengthCm: user.legLengthCm,
    usualSize: user.usualSize,
    fitPreference: user.fitPreference,
  };
}

function toAdminUserView(user: UserDocument) {
  return {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    preferredLanguage: user.preferredLanguage,
    isBlocked: user.isBlocked,
    avatarUrl: user.avatarUrl,
    heightCm: user.heightCm,
    weightKg: user.weightKg,
    gender: user.gender,
    createdAt: user.createdAt,
  };
}

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
    return toSelfUserView(updated);
  }

  @Delete('me/body-profile')
  async clearBodyProfile(@CurrentUser() user: JwtAccessPayload) {
    const updated = await this.usersService.clearBodyProfile(user.sub);
    return toSelfUserView(updated);
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

  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findOneAdmin(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return toAdminUserView(user);
  }

  @Patch('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateUserAdmin(@Param('id') id: string, @Body() dto: UpdateUserAdminDto) {
    const user = await this.usersService.updateAdmin(id, dto);
    return toAdminUserView(user);
  }

  @Delete('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async removeUser(@CurrentUser() currentUser: JwtAccessPayload, @Param('id') id: string) {
    if (id === currentUser.sub) {
      throw new BadRequestException('You cannot delete your own account');
    }
    const target = await this.usersService.findById(id);
    if (target?.role === UserRole.ADMIN) {
      throw new BadRequestException('You cannot delete another admin account');
    }
    await this.usersService.remove(id);
  }
}
