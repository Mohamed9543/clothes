'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { localize } from '@/lib/localized';
import type { ChatToolProduct } from '@/types';

export function ChatProductCard({ product }: { product: ChatToolProduct }) {
  const locale = useLocale();
  const t = useTranslations('common');

  return (
    <Link
      href={`/produit/${product.slug}`}
      className="flex w-36 shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-surface"
    >
      <div className="relative aspect-[3/4] bg-background">
        {product.image && (
          <Image src={product.image} alt={localize(product.name, locale)} fill className="object-cover" sizes="144px" />
        )}
      </div>
      <div className="p-2">
        <p className="truncate text-xs font-medium">{localize(product.name, locale)}</p>
        <p className="text-xs text-muted">
          {product.price} {t('currency')}
        </p>
      </div>
    </Link>
  );
}
