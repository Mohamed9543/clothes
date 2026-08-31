import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/schemas/user.schema';
import { StatsPeriod } from './stats.service';
import { StatsService } from './stats.service';

const VALID_PERIODS: StatsPeriod[] = ['day', 'week', 'month', 'year'];

@Controller('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('dashboard')
  getDashboard(@Query('period') period?: string) {
    const resolvedPeriod = VALID_PERIODS.includes(period as StatsPeriod)
      ? (period as StatsPeriod)
      : 'month';
    return this.statsService.getDashboard(resolvedPeriod);
  }
}
