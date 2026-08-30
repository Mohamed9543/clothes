import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { AddOutfitToCartButton } from '@/components/add-outfit-to-cart-button';
import { ProductCard } from '@/components/product-card';
import { serverApiFetch } from '@/lib/server-api';
import { localize } from '@/lib/localized';
import type { OutfitWithProducts } from '@/types';

export default async function OutfitPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const outfit = await serverApiFetch<OutfitWithProducts>(`/outfits/${slug}`);

  if (!outfit) {
    notFound();
  }

  const t = await getTranslations('outfit');
  const tCommon = await getTranslations('common');

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border bg-surface">
        <Image
          src={outfit.coverImage}
          alt={localize(outfit.title, locale)}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      </div>

      <h1 className="mt-6 text-2xl font-semibold">{localize(outfit.title, locale)}</h1>
      <p className="mt-2 text-muted">{localize(outfit.description, locale)}</p>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <p className="text-xl font-semibold text-brand-terracotta">
          {t('totalPrice')}: {outfit.totalPrice} {tCommon('currency')}
        </p>
        <AddOutfitToCartButton productIds={outfit.productIds} />
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">{t('includedProducts')}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {outfit.products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
