import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReturnDocument = HydratedDocument<Return>;

export enum ReturnType {
  RETURN = 'return',
  EXCHANGE = 'exchange',
}

export enum ReturnStatus {
  REQUESTED = 'requested',
  ACCEPTED = 'accepted',
  RETURN_SHIPPED = 'return_shipped',
  RECEIVED = 'received',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

@Schema({ _id: false })
export class ReturnItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  size: string;

  @Prop({ required: true, trim: true })
  color: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  // Only meaningful when the parent Return's type is EXCHANGE.
  @Prop({ type: String, trim: true, default: null })
  exchangeSize: string | null;

  @Prop({ type: String, trim: true, default: null })
  exchangeColor: string | null;
}

export const ReturnItemSchema = SchemaFactory.createForClass(ReturnItem);

@Schema({ _id: false })
export class ReturnStatusEntry {
  @Prop({ type: String, enum: ReturnStatus, required: true })
  status: ReturnStatus;

  @Prop({ default: Date.now })
  changedAt: Date;

  @Prop({ type: String, default: null })
  changedBy: string | null;
}

export const ReturnStatusEntrySchema = SchemaFactory.createForClass(ReturnStatusEntry);

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Return {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: ReturnType, required: true })
  type: ReturnType;

  @Prop({ type: [ReturnItemSchema], required: true })
  items: ReturnItem[];

  @Prop({ required: true, trim: true, maxlength: 500 })
  reason: string;

  @Prop({ type: String, enum: ReturnStatus, default: ReturnStatus.REQUESTED })
  status: ReturnStatus;

  // Only set once a RETURN (not an EXCHANGE) is actually received —
  // computed from the order's frozen line-item prices, never the current
  // catalogue price.
  @Prop({ type: Number, default: null })
  refundAmount: number | null;

  @Prop({ type: [ReturnStatusEntrySchema], default: [] })
  statusHistory: ReturnStatusEntry[];

  createdAt: Date;
}

export const ReturnSchema = SchemaFactory.createForClass(Return);
ReturnSchema.index({ orderId: 1 });
