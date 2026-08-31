import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PushSubscriptionDocument = HydratedDocument<PushSubscription>;

@Schema({ _id: false })
export class PushSubscriptionKeys {
  @Prop({ required: true })
  p256dh: string;

  @Prop({ required: true })
  auth: string;
}

export const PushSubscriptionKeysSchema = SchemaFactory.createForClass(PushSubscriptionKeys);

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class PushSubscription {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  endpoint: string;

  @Prop({ type: PushSubscriptionKeysSchema, required: true })
  keys: PushSubscriptionKeys;

  createdAt: Date;
}

export const PushSubscriptionSchema = SchemaFactory.createForClass(PushSubscription);
