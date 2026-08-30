import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtAccessPayload } from '../auth/strategies/jwt-access.strategy';
import { UserRole } from '../users/schemas/user.schema';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findMine(@CurrentUser() user: JwtAccessPayload) {
    return this.notificationsService.findForUser(user.sub, user.role === UserRole.ADMIN);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: JwtAccessPayload) {
    const count = await this.notificationsService.countUnread(user.sub, user.role === UserRole.ADMIN);
    return { count };
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.notificationsService.markRead(id, user.sub, user.role === UserRole.ADMIN);
  }

  @Patch('read-all')
  async markAllRead(@CurrentUser() user: JwtAccessPayload) {
    await this.notificationsService.markAllRead(user.sub, user.role === UserRole.ADMIN);
    return { success: true };
  }
}
