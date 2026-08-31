'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/context/auth-context';
import { useFittingRoom } from '@/context/fitting-room-context';
import { apiFetch } from '@/lib/api';
import { localize } from '@/lib/localized';
import type { Product } from '@/types';

export function TryOnButton({ product }: { product: Product }) {
  const t = useTranslations('avatar');
  const locale = useLocale();
  const { user } = useAuth();
  const { addProduct, open } = useFittingRoom();

  if (!product.tryOnEnabled) {
    return null;
  }

  if (user?.avatarUrl && user.avatarDisabled) {
    return (
      <Link href="/avatar" className="block text-center text-sm text-brand-terracotta underline">
        {t('avatarDisabledMessage')}
      </Link>
    );
  }

  if (!user?.avatarUrl) {
    return (
      <Link href="/avatar" className="block text-center text-sm text-brand-terracotta underline">
        {t('createAvatarFirst')}
      </Link>
    );
  }

  return (
    <button
      onClick={() => {
        addProduct(product, localize(product.name, locale));
        open();
        // Fire-and-forget usage tracking for the admin dashboard — never
        // blocks or fails the try-on interaction itself.
        apiFetch('/analytics/track', {
          method: 'POST',
          auth: true,
          body: JSON.stringify({ type: 'tryon_opened' }),
        }).catch(() => {});
      }}
      className="w-full rounded-full border border-border px-6 py-3 text-sm font-medium hover:border-brand-gold"
    >
      {t('tryOn')}
    </button>
  );
}
