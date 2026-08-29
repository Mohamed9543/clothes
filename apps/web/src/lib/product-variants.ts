import type { Product, ProductVariant } from '@/types';

/** Distinct colors available across a product's variants (order of first appearance). */
export function productColors(product: Pick<Product, 'variants'>): string[] {
  return [...new Set(product.variants.map((variant) => variant.color))];
}

/** Sizes available for a given color (order of first appearance). */
export function sizesForColor(product: Pick<Product, 'variants'>, color: string): string[] {
  return [...new Set(product.variants.filter((v) => v.color === color).map((v) => v.size))];
}

export function findVariant(
  product: Pick<Product, 'variants'>,
  size: string,
  color: string,
): ProductVariant | undefined {
  return product.variants.find((v) => v.size === size && v.color === color);
}
