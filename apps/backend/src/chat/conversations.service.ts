import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatMessage, ChatRole, Conversation, ConversationDocument } from './schemas/conversation.schema';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
  ) {}

  create(userId: string): Promise<ConversationDocument> {
    return this.conversationModel.create({ userId, title: '', messages: [] });
  }

  findAllForUser(userId: string) {
    return this.conversationModel
      .find({ userId })
      .select('title createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .exec();
  }

  async findOneForUser(userId: string, conversationId: string): Promise<ConversationDocument> {
    const conversation = await this.conversationModel.findById(conversationId).exec();
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    if (conversation.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return conversation;
  }

  async appendMessages(
    conversationId: string,
    messages: Array<{ role: ChatRole; content: string; recommendedProductIds?: string[] }>,
  ): Promise<void> {
    const entries: ChatMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
      createdAt: new Date(),
      recommendedProductIds: m.recommendedProductIds ?? [],
    }));

    const conversation = await this.conversationModel.findById(conversationId).exec();
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    conversation.messages.push(...entries);
    if (!conversation.title && messages[0]?.role === ChatRole.USER) {
      conversation.title = messages[0].content.slice(0, 60);
    }
    await conversation.save();
  }
}
