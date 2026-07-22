'use client';

import Image from 'next/image';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { localize } from '@/lib/localized';
import type { Outfit } from '@/types';

export function OutfitCard({ outfit }: { outfit: Outfit }) {
  const locale = useLocale();

  return (
    <Link
      href={`/tenue/${outfit.slug}`}
      className="group block overflow-hidden rounded-xl border border-border bg-surface"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-background">
        <Image
          src={outfit.coverImage}
          alt={localize(outfit.title, locale)}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium">{localize(outfit.title, locale)}</p>
      </div>
    </Link>
  );
}
