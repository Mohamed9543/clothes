import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Governorate, PaymentStatus } from '@libas/shared';

export type OrderDocument = HydratedDocument<Order>;
export { PaymentStatus };

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  COD = 'cod',
  CARD = 'card',
}

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Object, required: true })
  name: Record<string, string>;

  @Prop({ required: true })
  unitPrice: number;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  size: string;

  @Prop({ required: true })
  color: string;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
export class ShippingAddress {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ required: true, trim: true })
  address: string;

  // Legacy free-text field from before governorate/delegation existed — kept
  // optional so pre-migration orders remain readable. New orders populate
  // governorate/delegation instead (enforced at the DTO level, not here).
  @Prop({ trim: true })
  city?: string;

  @Prop({ type: String, enum: Governorate })
  governorate?: Governorate;

  @Prop({ trim: true })
  delegation?: string;

  @Prop({ required: true, trim: true, default: 'Tunisie' })
  country: string;
}

export const ShippingAddressSchema = SchemaFactory.createForClass(ShippingAddress);

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ required: true, min: 0, default: 0 })
  shippingFee: number;

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ type: String, enum: PaymentMethod, default: PaymentMethod.COD })
  paymentMethod: PaymentMethod;

  // Denormalized mirror of the authoritative `Payment` record's status (kept
  // in sync by PaymentsService) — lets the UI/admin query order payment state
  // without joining to the payments collection for every list view.
  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop({ type: ShippingAddressSchema, required: true })
  shippingAddress: ShippingAddress;

  createdAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
