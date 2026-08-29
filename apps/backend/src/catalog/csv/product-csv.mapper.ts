import { CreateProductDto } from '../dto/create-product.dto';
import { ProductAudience, ProductType } from '../schemas/product.schema';
import type { ProductDocument } from '../schemas/product.schema';

export const CSV_COLUMNS = [
  'slug',
  'name_fr',
  'name_en',
  'name_ar',
  'name_tn',
  'description_fr',
  'description_en',
  'description_ar',
  'description_tn',
  'price',
  'audience',
  'type',
  'images',
  'variants',
  'isActive',
] as const;

function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(';')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

interface CsvVariant {
  sku: string;
  size: string;
  color: string;
  stock: number;
  priceOverride: number | null;
}

// Encoded as "sku:size:color:stock:priceOverride" per variant, separated by "|".
// priceOverride may be left empty (e.g. "SKU1:M:Rouge:5:") to mean "no override".
function parseVariants(value: string | undefined): CsvVariant[] {
  if (!value) return [];
  return value
    .split('|')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => {
      const [sku, size, color, stockRaw, priceOverrideRaw] = entry.split(':').map((part) => part.trim());
      if (!sku || !size || !color || stockRaw === undefined || stockRaw === '') {
        throw new Error(
          `Invalid variant "${entry}" (expected format "sku:size:color:stock:priceOverride")`,
        );
      }
      const stock = Number(stockRaw);
      if (!Number.isFinite(stock) || Number.isNaN(stock)) {
        throw new Error(`Invalid stock value in variant "${entry}"`);
      }
      const priceOverride =
        priceOverrideRaw === undefined || priceOverrideRaw === '' ? null : Number(priceOverrideRaw);
      if (priceOverride !== null && (!Number.isFinite(priceOverride) || Number.isNaN(priceOverride))) {
        throw new Error(`Invalid priceOverride value in variant "${entry}"`);
      }
      return { sku, size, color, stock, priceOverride };
    });
}

export function rowToProductDto(row: Record<string, string>): CreateProductDto {
  return {
    slug: (row.slug ?? '').trim().toLowerCase(),
    name: {
      fr: row.name_fr ?? '',
      en: row.name_en ?? '',
      ar: row.name_ar ?? '',
      tn: row.name_tn ?? '',
    },
    description: {
      fr: row.description_fr ?? '',
      en: row.description_en ?? '',
      ar: row.description_ar ?? '',
      tn: row.description_tn ?? '',
    },
    price: Number(row.price),
    audience: row.audience as ProductAudience,
    type: row.type as ProductType,
    variants: parseVariants(row.variants),
    images: parseList(row.images),
    isActive:
      row.isActive === undefined || row.isActive === ''
        ? true
        : row.isActive.trim().toLowerCase() === 'true',
  };
}

export function productToRow(product: ProductDocument): Record<string, string> {
  return {
    slug: product.slug,
    name_fr: product.name.fr,
    name_en: product.name.en,
    name_ar: product.name.ar,
    name_tn: product.name.tn,
    description_fr: product.description.fr,
    description_en: product.description.en,
    description_ar: product.description.ar,
    description_tn: product.description.tn,
    price: String(product.price),
    audience: product.audience,
    type: product.type,
    images: product.images.join(';'),
    variants: product.variants
      .map(
        (variant) =>
          `${variant.sku}:${variant.size}:${variant.color}:${variant.stock}:${variant.priceOverride ?? ''}`,
      )
      .join('|'),
    isActive: String(product.isActive),
  };
}
