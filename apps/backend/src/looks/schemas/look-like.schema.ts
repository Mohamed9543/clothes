import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LookLikeDocument = HydratedDocument<LookLike>;

@Schema({ timestamps: true })
export class LookLike {
  @Prop({ required: true, index: true })
  lookId: string;

  @Prop({ required: true, index: true })
  userId: string;
}

export const LookLikeSchema = SchemaFactory.createForClass(LookLike);
LookLikeSchema.index({ lookId: 1, userId: 1 }, { unique: true });
