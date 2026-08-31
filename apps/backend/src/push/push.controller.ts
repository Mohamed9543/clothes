import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtAccessPayload } from '../auth/strategies/jwt-access.strategy';
import { SubscribePushDto } from './dto/subscribe-push.dto';
import { UnsubscribePushDto } from './dto/unsubscribe-push.dto';
import { PushService } from './push.service';

@Controller('push')
@UseGuards(JwtAuthGuard)
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Post('subscribe')
  subscribe(@CurrentUser() user: JwtAccessPayload, @Body() dto: SubscribePushDto) {
    return this.pushService.subscribe(user.sub, dto);
  }

  @Post('unsubscribe')
  async unsubscribe(@Body() dto: UnsubscribePushDto) {
    await this.pushService.unsubscribe(dto.endpoint);
    return { success: true };
  }
}
