/**
 * One-off migration: reshapes `Product.variants` from the old `{ size, stock }`
 * shape (with a separate, unstructured `colors: string[]` field) into the new
 * size×color matrix `{ sku, size, color, stock, priceOverride }`.
 *
 * WHY A SPLIT, NOT A DUPLICATE OR FIRST-COLOR-ONLY ASSIGNMENT:
 * The original data never recorded which color held how much stock — `colors`
 * was a flat, unstructured list with no relation to `variants[].stock`. There is
 * therefore no "correct" answer to synthesize from. This script evenly splits
 * each size's stock across its colors (floor division, remainder to the first
 * color), which avoids the two worse failure modes: assigning everything to the
 * first color (other colors would wrongly look permanently out of stock) or
 * duplicating the full stock across every color (inventory overstated by
 * colors.length×). Even-split preserves the invariant
 * `sum(new variants.stock for a size) === old variant.stock for that size`,
 * which is what the anti-oversell guard in ProductsService.decrementStock cares
 * about. This is a best-effort synthesis, not real per-color data — admins
 * should re-audit true per-color stock after running this script.
 *
 * DEPLOYMENT ORDER (do not reverse):
 *   1. Run this script BEFORE deploying the new schema/service code (i.e. while
 *      `ProductVariant.sku`/`.color` are not yet `required: true` at the
 *      Mongoose level) — it writes via the raw MongoDB driver so it can freely
 *      write the transitional/new shape regardless of which schema version is
 *      currently loaded.
 *   2. Verify migration completeness (see the count check this script prints).
 *   3. Only then deploy the new schema + service code that expects
 *      `sku`/`color` to always be present.
 *
 * Idempotent: skips any product whose first variant already has a `color`
 * field, so it is safe to re-run.
 *
 * Usage: pnpm --filter backend exec ts-node -r tsconfig-paths/register src/catalog/migrations/2026-01-variant-color-matrix.ts
 */
import '../../config/dns-fallback';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppModule } from '../../app.module';
import { Product } from '../schemas/product.schema';

interface LegacyVariant {
  size: string;
  stock: number;
}

interface LegacyProduct {
  _id: Types.ObjectId;
  slug: string;
  variants: (LegacyVariant & { color?: string; sku?: string })[];
  colors?: string[];
}

interface NewVariant {
  sku: string;
  size: string;
  color: string;
  stock: number;
  priceOverride: number | null;
}

function slugifyColor(color: string): string {
  return color
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildNewVariants(product: LegacyProduct): NewVariant[] {
  const colors = product.colors && product.colors.length > 0 ? product.colors : ['default'];
  const result: NewVariant[] = [];

  for (const legacyVariant of product.variants) {
    const n = colors.length;
    const base = Math.floor(legacyVariant.stock / n);
    const remainder = legacyVariant.stock - base * n;

    colors.forEach((color, index) => {
      const stock = base + (index === 0 ? remainder : 0);
      result.push({
        sku: `${product.slug}-${legacyVariant.size}-${slugifyColor(color)}`.toUpperCase(),
        size: legacyVariant.size,
        color,
        stock,
        priceOverride: null,
      });
    });
  }

  return result;
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const productModel = app.get<Model<Product>>(getModelToken(Product.name));
  const collection = productModel.collection;

  const allProducts = (await collection.find({}).toArray()) as unknown as LegacyProduct[];

  let migrated = 0;
  let skipped = 0;

  for (const product of allProducts) {
    const alreadyMigrated = product.variants.length > 0 && product.variants[0]?.color !== undefined;
    if (alreadyMigrated) {
      skipped += 1;
      continue;
    }

    const newVariants = buildNewVariants(product);

    await collection.updateOne(
      { _id: product._id },
      {
        $set: {
          variants: newVariants,
          _legacyVariantsBackup: { variants: product.variants, colors: product.colors ?? [] },
        },
        $unset: { colors: '' },
      },
    );
    migrated += 1;
  }

  const remaining = await collection.countDocuments({
    $or: [{ 'variants.0.color': { $exists: false } }, { variants: { $size: 0 } }],
  });

  console.log(
    `Migration done. ${migrated} product(s) migrated, ${skipped} already migrated (skipped).`,
  );
  console.log(
    remaining === 0
      ? 'Verification OK: every product now has size×color variants.'
      : `WARNING: ${remaining} product(s) still lack variant colors — investigate before deploying the strict schema.`,
  );

  await app.close();
}

bootstrap().catch((error) => {
  console.error('Migration failed', error);
  process.exit(1);
});
