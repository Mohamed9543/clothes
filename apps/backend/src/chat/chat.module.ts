import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatalogModule } from '../catalog/catalog.module';
import { ChatController } from './chat.controller';
import { ClaudeService } from './claude.service';
import { ConversationsService } from './conversations.service';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Conversation.name, schema: ConversationSchema }]),
    CatalogModule,
  ],
  controllers: [ChatController],
  providers: [ConversationsService, ClaudeService],
})
export class ChatModule {}
