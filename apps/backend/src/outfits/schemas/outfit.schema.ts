import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { LocalizedText, LocalizedTextSchema } from '../../catalog/schemas/product.schema';

export type OutfitDocument = HydratedDocument<Outfit>;

@Schema({ timestamps: true })
export class Outfit {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  slug: string;

  @Prop({ type: LocalizedTextSchema, required: true })
  title: LocalizedText;

  @Prop({ type: LocalizedTextSchema, required: true })
  description: LocalizedText;

  @Prop({ required: true, trim: true })
  coverImage: string;

  @Prop({ type: [String], required: true })
  productIds: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isFeatured: boolean;

  // Percentage off the summed product prices when bought as a whole bundle.
  // Only applied at checkout while every product below is genuinely still
  // in the customer's cart — see OutfitsService.findApplicableBundle.
  @Prop({ type: Number, default: null, min: 0, max: 100 })
  bundleDiscountPercent: number | null;

  createdAt: Date;
}

export const OutfitSchema = SchemaFactory.createForClass(Outfit);
