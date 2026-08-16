import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AvatarAssetDocument = HydratedDocument<AvatarAsset>;

export enum AvatarAssetType {
  BODY = 'body',
  HAIR = 'hair',
}

@Schema({ timestamps: true })
export class AvatarAsset {
  @Prop({ type: String, enum: AvatarAssetType, required: true, index: true })
  type: AvatarAssetType;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true })
  modelUrl: string;

  @Prop({ type: String, default: null })
  thumbnailUrl: string | null;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
}

export const AvatarAssetSchema = SchemaFactory.createForClass(AvatarAsset);
