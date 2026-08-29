import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WishlistDocument = HydratedDocument<Wishlist>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Wishlist {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: [String], default: [] })
  productIds: string[];

  // Auto-created on a user's first "add to wishlist" — cannot be deleted
  // while it's the user's only list.
  @Prop({ default: false })
  isDefault: boolean;

  createdAt: Date;
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);
WishlistSchema.index({ userId: 1, createdAt: 1 });
