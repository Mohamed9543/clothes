import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtAccessPayload } from '../auth/strategies/jwt-access.strategy';
import { UserRole } from '../users/schemas/user.schema';
import { CreateLookDto } from './dto/create-look.dto';
import { QueryLooksDto } from './dto/query-looks.dto';
import { SetLookStatusDto } from './dto/set-look-status.dto';
import { LooksService } from './looks.service';

@Controller('looks')
export class LooksController {
  constructor(private readonly looksService: LooksService) {}

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllAdmin(@Query() query: QueryLooksDto) {
    return this.looksService.findAllAdmin(query);
  }

  @Patch('admin/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  setStatus(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: SetLookStatusDto,
  ) {
    return this.looksService.setHidden(id, dto.isHidden, user.sub);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.looksService.remove(id, user.sub);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: JwtAccessPayload) {
    return this.looksService.findForUser(user.sub);
  }

  @Get()
  findPublicFeed(@Query() query: QueryLooksDto) {
    return this.looksService.findPublicFeed(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: JwtAccessPayload, @Body() dto: CreateLookDto) {
    return this.looksService.create(user.sub, dto);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  toggleLike(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.looksService.toggleLike(id, user.sub);
  }

  @Get(':id/like-status')
  @UseGuards(JwtAuthGuard)
  async likeStatus(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    const [likedId] = await this.looksService.getUserLikedLookIds(user.sub, [id]);
    return { liked: Boolean(likedId) };
  }

  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  report(@Param('id') id: string) {
    return this.looksService.report(id).then(() => ({ success: true }));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.looksService.findOne(id);
  }
}
