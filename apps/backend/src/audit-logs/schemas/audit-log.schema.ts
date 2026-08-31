import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  adminUserId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  action: string;

  @Prop({ required: true, trim: true })
  targetType: string;

  @Prop({ required: true, trim: true })
  targetId: string;

  @Prop({ type: String, default: null })
  details: string | null;

  createdAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ createdAt: -1 });
