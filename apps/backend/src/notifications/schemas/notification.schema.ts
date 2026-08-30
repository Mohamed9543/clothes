import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

export type NotificationType = 'order_status' | 'return_status' | 'return_requested';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Notification {
  // null = broadcast to every admin, rather than enumerating admin user ids.
  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  userId: Types.ObjectId | null;

  @Prop({ required: true, trim: true })
  type: NotificationType;

  @Prop({ required: true, trim: true })
  message: string;

  @Prop({ type: String, default: null })
  link: string | null;

  @Prop({ default: false })
  isRead: boolean;

  createdAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1, createdAt: -1 });
