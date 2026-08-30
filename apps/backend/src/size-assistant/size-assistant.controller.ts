import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtAccessPayload } from '../auth/strategies/jwt-access.strategy';
import { SizeAssistantService } from './size-assistant.service';

@Controller('size-assistant')
@UseGuards(JwtAuthGuard)
export class SizeAssistantController {
  constructor(private readonly sizeAssistantService: SizeAssistantService) {}

  @Get('recommend/:productId')
  recommend(@CurrentUser() user: JwtAccessPayload, @Param('productId') productId: string) {
    return this.sizeAssistantService.recommend(user.sub, productId);
  }
}
