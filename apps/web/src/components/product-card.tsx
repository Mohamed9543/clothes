'use client';

import Image from 'next/image';
import { Heart, ImageOff } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { localize } from '@/lib/localized';
import { colorNameToHex } from '@/lib/colors';
import { productColors } from '@/lib/product-variants';
import { useAuth } from '@/context/auth-context';
import { useWishlist } from '@/context/wishlist-context';
import type { Product } from '@/types';

const MAX_SWATCHES = 4;

export function ProductCard({
  product,
}: {
  product: Product & { isLowStock?: boolean; isOutOfStock?: boolean };
}) {
  const locale = useLocale();
  const t = useTranslations('common');
  const tProduct = useTranslations('product');
  const { user } = useAuth();
  const { isInWishlist, toggle } = useWishlist();

  const colors = productColors(product);
  const shownColors = colors.slice(0, MAX_SWATCHES);
  const extraColors = colors.length - shownColors.length;
  const inWishlist = isInWishlist(product._id);

  return (
    <Link
      href={`/produit/${product.slug}`}
      className="group block overflow-hidden rounded-xl border border-border bg-surface"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-background">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={localize(product.name, locale)}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <ImageOff className="h-8 w-8" />
          </div>
        )}

        {user && (
          <button
            onClick={(event) => {
              event.preventDefault();
              void toggle(product._id);
            }}
            aria-label={tProduct('wishlistToggle')}
            className="absolute end-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-brand-terracotta shadow-sm"
          >
            <Heart className="h-4 w-4" fill={inWishlist ? 'currentColor' : 'none'} />
          </button>
        )}
        {product.isOutOfStock && (
          <span className="absolute start-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white">
            {tProduct('outOfStock')}
          </span>
        )}
        {!product.isOutOfStock && product.isLowStock && (
          <span className="absolute start-2 top-2 rounded-full bg-brand-terracotta px-2 py-0.5 text-xs text-white">
            {tProduct('lowStock')}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium">{localize(product.name, locale)}</p>
        <p className="mt-1 text-sm text-muted">
          {product.price} {t('currency')}
        </p>
        {shownColors.length > 0 && (
          <div className="mt-2 flex items-center gap-1">
            {shownColors.map((color) => (
              <span
                key={color}
                title={color}
                className="h-3 w-3 rounded-full border border-border"
                style={{ backgroundColor: colorNameToHex(color) }}
              />
            ))}
            {extraColors > 0 && <span className="text-xs text-muted">+{extraColors}</span>}
          </div>
        )}
      </div>
    </Link>
  );
}
