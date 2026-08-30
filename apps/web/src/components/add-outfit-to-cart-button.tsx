'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { apiFetch, ApiError } from '@/lib/api';
import type { BulkAddResult } from '@/types';

export function AddOutfitToCartButton({ productIds }: { productIds: string[] }) {
  const t = useTranslations('outfit');
  const router = useRouter();
  const { user } = useAuth();
  const { refresh } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleClick() {
    if (!user) {
      router.push('/login');
      return;
    }
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const result = await apiFetch<BulkAddResult>('/cart/bulk-add', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ productIds }),
      });
      await refresh();
      setFeedback(
        result.skippedProductIds.length > 0 ? t('someItemsUnavailable') : t('itemsAdded'),
      );
    } catch (err) {
      setFeedback(err instanceof ApiError ? err.message : t('itemsAdded'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isSubmitting}
        className="rounded-full bg-brand-terracotta px-6 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {t('addToCart')}
      </button>
      {feedback && <p className="mt-2 text-sm text-muted">{feedback}</p>}
    </div>
  );
}
