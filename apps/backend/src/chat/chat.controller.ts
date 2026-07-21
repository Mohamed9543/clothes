import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtAccessPayload } from '../auth/strategies/jwt-access.strategy';
import { ClaudeService } from './claude.service';
import { ConversationsService } from './conversations.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatRole } from './schemas/conversation.schema';

@Controller('chat/conversations')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly claudeService: ClaudeService,
  ) {}

  @Post()
  create(@CurrentUser() user: JwtAccessPayload) {
    return this.conversationsService.create(user.sub);
  }

  @Get()
  findAll(@CurrentUser() user: JwtAccessPayload) {
    return this.conversationsService.findAllForUser(user.sub);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.conversationsService.findOneForUser(user.sub, id);
  }

  @Post(':id/messages')
  async sendMessage(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    const conversation = await this.conversationsService.findOneForUser(user.sub, id);

    await this.conversationsService.appendMessages(id, [
      { role: ChatRole.USER, content: dto.content },
    ]);

    const history = [
      ...conversation.messages.map((m) => ({ role: m.role, content: m.content })),
      { role: ChatRole.USER, content: dto.content },
    ];

    const reply = await this.claudeService.chat(history);

    await this.conversationsService.appendMessages(id, [
      { role: ChatRole.ASSISTANT, content: reply.content },
    ]);

    return { message: reply.content, products: reply.products };
  }
}
