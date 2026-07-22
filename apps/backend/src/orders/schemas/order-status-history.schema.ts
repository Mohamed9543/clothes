import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { OrderStatus } from './order.schema';

export type OrderStatusHistoryDocument = HydratedDocument<OrderStatusHistory>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class OrderStatusHistory {
  @Prop({ required: true, index: true })
  orderId: string;

  @Prop({ type: String, enum: OrderStatus, default: null })
  fromStatus: OrderStatus | null;

  @Prop({ type: String, enum: OrderStatus, required: true })
  toStatus: OrderStatus;

  @Prop({ type: String, default: null })
  changedBy: string | null;
}

export const OrderStatusHistorySchema = SchemaFactory.createForClass(OrderStatusHistory);
OrderStatusHistorySchema.index({ orderId: 1, createdAt: 1 });
