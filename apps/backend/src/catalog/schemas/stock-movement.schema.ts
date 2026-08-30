import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StockMovementDocument = HydratedDocument<StockMovement>;

export enum StockMovementReason {
  ORDER = 'order',
  RESTOCK = 'restock',
  CORRECTION = 'correction',
  DAMAGE = 'damage',
  RETURN = 'return',
}

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class StockMovement {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, index: true })
  productId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  size: string;

  @Prop({ trim: true, default: '' })
  color: string;

  @Prop({ required: true })
  quantityChange: number;

  @Prop({ type: String, enum: StockMovementReason, required: true })
  reason: StockMovementReason;

  @Prop({ type: Types.ObjectId, ref: 'Order', default: null })
  orderId: Types.ObjectId | null;

  @Prop({ trim: true, default: '' })
  note: string;
}

export const StockMovementSchema = SchemaFactory.createForClass(StockMovement);
StockMovementSchema.index({ productId: 1, createdAt: -1 });
