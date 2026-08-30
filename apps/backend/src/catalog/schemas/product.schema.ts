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
  sku: string;

  @Prop({ required: true, trim: true })
  size: string;

  @Prop({ required: true, trim: true })
  color: string;

  @Prop({ required: true, min: 0, default: 0 })
  stock: number;

  @Prop({ type: Number, default: null })
  priceOverride: number | null;
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
  images: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: true })
  tryOnEnabled: boolean;

  @Prop({ type: String, default: null })
  modelUrl: string | null;

  // A sale is active when compareAtPrice > price. Never stored as a boolean —
  // always derived, so it can never drift out of sync with price changes.
  @Prop({ type: Number, default: null })
  compareAtPrice: number | null;

  // Optional flash-sale end date; once passed, the sale is no longer
  // considered active even if compareAtPrice is still set.
  @Prop({ type: Date, default: null })
  saleEndsAt: Date | null;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ price: 1 });
ProductSchema.index({ 'name.fr': 'text', 'name.en': 'text', 'name.ar': 'text', 'name.tn': 'text' });
ProductSchema.index({ 'variants.sku': 1 });

/**
 * Derives the flat list of distinct colors from a product's variants, for
 * any API response that still wants a color-swatch list (the `colors`
 * top-level field was removed — size/color/stock now live together on each
 * variant so stock is never mis-attributed to a color it doesn't belong to).
 */
export function deriveProductColors(product: Pick<Product, 'variants'>): string[] {
  return [...new Set(product.variants.map((variant) => variant.color))];
}

export function isProductOnSale(
  product: Pick<Product, 'price' | 'compareAtPrice' | 'saleEndsAt'>,
): boolean {
  if (product.compareAtPrice == null || product.compareAtPrice <= product.price) {
    return false;
  }
  if (product.saleEndsAt && product.saleEndsAt.getTime() < Date.now()) {
    return false;
  }
  return true;
}
