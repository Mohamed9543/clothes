import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReviewDocument = HydratedDocument<Review>;

export enum ReviewFit {
  SMALL = 'small',
  TRUE_TO_SIZE = 'true_to_size',
  LARGE = 'large',
}

@Schema({ timestamps: true })
export class Review {
  @Prop({ required: true, index: true })
  productId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true, trim: true, maxlength: 1000 })
  comment: string;

  @Prop({ type: String, enum: ReviewFit, default: null })
  fit: ReviewFit | null;

  @Prop({ type: [String], default: [] })
  photos: string[];

  @Prop({ default: 0, min: 0 })
  reportCount: number;

  @Prop({ default: false })
  isHidden: boolean;

  createdAt: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
