import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { AddToCartForm } from '@/components/add-to-cart-form';
import { TryOnButton } from '@/components/avatar/try-on-button';
import { ProductReviews } from '@/components/product-reviews';
import { serverApiFetch } from '@/lib/server-api';
import { localize } from '@/lib/localized';
import type { Product } from '@/types';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const product = await serverApiFetch<Product>(`/products/${slug}`);

  if (!product) {
    notFound();
  }

  const t = await getTranslations('product');
  const tCommon = await getTranslations('common');

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-surface">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={localize(product.name, locale)}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted">
              <ImageOff className="h-12 w-12" />
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-semibold">{localize(product.name, locale)}</h1>
          <p className="mt-2 text-xl text-brand-terracotta">
            {product.price} {tCommon('currency')}
          </p>

          <p className="mt-2 text-sm">
            {product.variants.some((variant) => variant.stock > 0) ? t('inStock') : t('outOfStock')}
          </p>

          <div className="mt-6">
            <p className="mb-2 text-sm font-medium">{t('description')}</p>
            <p className="text-sm text-muted">{localize(product.description, locale)}</p>
          </div>

          <div className="mt-8 space-y-3">
            <AddToCartForm product={product} />
            <TryOnButton product={product} />
          </div>
        </div>
      </div>

      <ProductReviews slug={product.slug} />
    </div>
  );
}
