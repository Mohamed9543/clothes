import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

export enum ProductAudience {
  MEN = 'men',
  WOMEN = 'women',
  KIDS = 'kids',
}

export enum ProductType {
  PULL = 'pull',
  PANTALON = 'pantalon',
  CHEMISE = 'chemise',
  ROBE = 'robe',
  VESTE = 'veste',
  CHAUSSURE = 'chaussure',
  ACCESSOIRE = 'accessoire',
}

@Schema({ _id: false })
export class LocalizedText {
  @Prop({ required: true, trim: true })
  ar: string;

  @Prop({ required: true, trim: true })
  tn: string;

  @Prop({ required: true, trim: true })
  fr: string;

  @Prop({ required: true, trim: true })
  en: string;
}

export const LocalizedTextSchema = SchemaFactory.createForClass(LocalizedText);

export const LOW_STOCK_THRESHOLD = 5;

@Schema({ _id: false })
export class ProductVariant {
  @Prop({ required: true, trim: true })
  size: string;

  @Prop({ required: true, min: 0, default: 0 })
  stock: number;
}

export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  slug: string;

  @Prop({ type: LocalizedTextSchema, required: true })
  name: LocalizedText;

  @Prop({ type: LocalizedTextSchema, required: true })
  description: LocalizedText;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ type: String, enum: ProductAudience, required: true, index: true })
  audience: ProductAudience;

  @Prop({ type: String, enum: ProductType, required: true, index: true })
  type: ProductType;

  @Prop({ type: [ProductVariantSchema], default: [] })
  variants: ProductVariant[];

  @Prop({ type: [String], default: [] })
  colors: string[];

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: true })
  tryOnEnabled: boolean;

  @Prop({ type: String, default: null })
  modelUrl: string | null;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ price: 1 });
ProductSchema.index({ 'name.fr': 'text', 'name.en': 'text', 'name.ar': 'text', 'name.tn': 'text' });
