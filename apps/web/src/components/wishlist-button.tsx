'use client';

import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { useWishlist } from '@/context/wishlist-context';

export function WishlistButton({ productId }: { productId: string }) {
  const t = useTranslations('product');
  const { user } = useAuth();
  const { isInWishlist, toggle } = useWishlist();

  if (!user) return null;

  const inWishlist = isInWishlist(productId);

  return (
    <button
      type="button"
      onClick={() => void toggle(productId)}
      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${
        inWishlist ? 'border-brand-terracotta text-brand-terracotta' : 'border-border'
      }`}
    >
      <Heart className="h-4 w-4" fill={inWishlist ? 'currentColor' : 'none'} />
      {inWishlist ? t('wishlistRemove') : t('wishlistAdd')}
    </button>
  );
}
