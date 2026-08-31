import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtAccessPayload } from '../auth/strategies/jwt-access.strategy';
import { UserRole } from '../users/schemas/user.schema';
import { AvatarAssetsService } from './avatar-assets.service';
import { CreateAvatarAssetDto } from './dto/create-avatar-asset.dto';
import { UpdateAvatarAssetDto } from './dto/update-avatar-asset.dto';

@Controller('avatar-assets')
@UseGuards(JwtAuthGuard)
export class AvatarAssetsController {
  constructor(private readonly avatarAssetsService: AvatarAssetsService) {}

  @Get()
  findAllActive() {
    return this.avatarAssetsService.findAllActive();
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllAdmin() {
    return this.avatarAssetsService.findAllAdmin();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@CurrentUser() user: JwtAccessPayload, @Body() dto: CreateAvatarAssetDto) {
    return this.avatarAssetsService.create(dto, user.sub);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: UpdateAvatarAssetDto,
  ) {
    return this.avatarAssetsService.update(id, dto, user.sub);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.avatarAssetsService.remove(id, user.sub);
  }
}
