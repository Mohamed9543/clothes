import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LookDocument = HydratedDocument<Look>;

@Schema({ timestamps: true })
export class Look {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ type: [String], default: [] })
  productIds: string[];

  @Prop({ type: [String], required: true })
  images: string[];

  @Prop({ type: String, default: null, trim: true, maxlength: 500 })
  caption: string | null;

  @Prop({ default: 0, min: 0 })
  likeCount: number;

  @Prop({ default: 0, min: 0 })
  reportCount: number;

  @Prop({ default: false })
  isHidden: boolean;

  createdAt: Date;
}

export const LookSchema = SchemaFactory.createForClass(Look);
LookSchema.index({ isHidden: 1, createdAt: -1 });
