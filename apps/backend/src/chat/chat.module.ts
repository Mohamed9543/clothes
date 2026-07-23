import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatalogModule } from '../catalog/catalog.module';
import { ChatController } from './chat.controller';
import { ConversationsService } from './conversations.service';
import { GeminiService } from './gemini.service';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Conversation.name, schema: ConversationSchema }]),
    CatalogModule,
  ],
  controllers: [ChatController],
  providers: [ConversationsService, GeminiService],
})
export class ChatModule {}
