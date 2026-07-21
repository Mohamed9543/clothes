'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { localize } from '@/lib/localized';
import type { Product } from '@/types';

export function ProductCard({ product }: { product: Product }) {
  const locale = useLocale();
  const t = useTranslations('common');

  return (
    <Link
      href={`/produit/${product.slug}`}
      className="group block overflow-hidden rounded-xl border border-border bg-surface"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-background">
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt={localize(product.name, locale)}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium">{localize(product.name, locale)}</p>
        <p className="mt-1 text-sm text-muted">
          {product.price} {t('currency')}
        </p>
      </div>
    </Link>
  );
}
