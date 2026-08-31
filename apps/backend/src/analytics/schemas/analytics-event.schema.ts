import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AnalyticsEventDocument = HydratedDocument<AnalyticsEvent>;

// Only known event types are ever accepted (see analytics.controller.ts) —
// this collection never records an arbitrary client-supplied string.
export type AnalyticsEventType = 'tryon_opened';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class AnalyticsEvent {
  @Prop({ required: true, trim: true })
  type: AnalyticsEventType;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  userId: Types.ObjectId | null;

  createdAt: Date;
}

export const AnalyticsEventSchema = SchemaFactory.createForClass(AnalyticsEvent);
AnalyticsEventSchema.index({ type: 1, createdAt: -1 });
