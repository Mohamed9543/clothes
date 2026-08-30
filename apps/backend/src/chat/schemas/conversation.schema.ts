import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

export enum ChatRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export class RecommendedOutfit {
  @Prop({ type: [String], required: true })
  productIds: string[];

  @Prop({ required: true, min: 0 })
  totalPrice: number;
}

@Schema({ _id: false })
export class ChatMessage {
  @Prop({ type: String, enum: ChatRole, required: true })
  role: ChatRole;

  @Prop({ required: true })
  content: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ type: [String], default: [] })
  recommendedProductIds: string[];

  @Prop({ type: RecommendedOutfit, default: null })
  recommendedOutfit: RecommendedOutfit | null;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ trim: true, default: '' })
  title: string;

  @Prop({ type: [ChatMessageSchema], default: [] })
  messages: ChatMessage[];
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
