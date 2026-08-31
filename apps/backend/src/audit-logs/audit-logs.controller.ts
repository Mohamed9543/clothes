import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/schemas/user.schema';
import { AuditLogsService } from './audit-logs.service';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get('admin/all')
  findAllAdmin(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.auditLogsService.findAllAdmin(Number(page) || 1, Number(limit) || 50);
  }
}
