import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { AddToCartForm } from '@/components/add-to-cart-form';
import { TryOnButton } from '@/components/avatar/try-on-button';
import { ProductGallery } from '@/components/product-gallery';
import { ProductReviews } from '@/components/product-reviews';
import { SizeGuide } from '@/components/size-guide';
import { WishlistButton } from '@/components/wishlist-button';
import { serverApiFetch } from '@/lib/server-api';
import { localize } from '@/lib/localized';
import type { PublicProduct } from '@/types';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const product = await serverApiFetch<PublicProduct>(`/products/${slug}`);

  if (!product) {
    notFound();
  }

  const t = await getTranslations('product');
  const tCommon = await getTranslations('common');

  const stockLabel = product.isOutOfStock
    ? t('outOfStock')
    : product.isLowStock
      ? t('lowStock')
      : t('inStock');
  const stockClass = product.isOutOfStock
    ? 'text-muted'
    : product.isLowStock
      ? 'text-brand-terracotta'
      : 'text-green-700';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-10 md:grid-cols-2">
        <ProductGallery images={product.images} alt={localize(product.name, locale)} />

        <div>
          <h1 className="text-2xl font-semibold">{localize(product.name, locale)}</h1>
          <p className="mt-2 text-xl">
            {product.isOnSale && (
              <span className="me-3 text-base text-muted line-through">
                {product.compareAtPrice} {tCommon('currency')}
              </span>
            )}
            <span className="text-brand-terracotta">
              {product.price} {tCommon('currency')}
            </span>
          </p>
          {product.isOnSale && product.saleEndsAt && (
            <p className="mt-1 text-xs text-brand-terracotta">
              {t('saleEndsAt', { date: new Date(product.saleEndsAt).toLocaleDateString(locale) })}
            </p>
          )}

          <p className={`mt-2 text-sm font-medium ${stockClass}`}>{stockLabel}</p>

          <div className="mt-6">
            <p className="mb-2 text-sm font-medium">{t('description')}</p>
            <p className="text-sm text-muted">{localize(product.description, locale)}</p>
          </div>

          <div className="mt-4">
            <SizeGuide />
          </div>

          <div className="mt-8 space-y-3">
            <AddToCartForm product={product} />
            <TryOnButton product={product} />
            <WishlistButton productId={product._id} />
          </div>
        </div>
      </div>

      <ProductReviews slug={product.slug} />
    </div>
  );
}
