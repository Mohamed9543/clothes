import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PaymentStatus } from '@libas/shared';

export type PaymentDocument = HydratedDocument<Payment>;
export { PaymentStatus };

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  orderId: Types.ObjectId;

  // 'mock' in Phase 1 — the value that will later become 'konnect' | 'flouci'
  // once a real gateway is wired up (see providers/mock-payment.provider.ts).
  @Prop({ required: true, trim: true })
  provider: string;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, trim: true, unique: true })
  reference: string;

  @Prop({ type: Date, default: null })
  confirmedAt: Date | null;

  createdAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
