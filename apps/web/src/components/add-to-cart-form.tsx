'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { ApiError } from '@/lib/api';
import type { Product } from '@/types';

export function AddToCartForm({ product }: { product: Product }) {
  const t = useTranslations('product');
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart();

  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedVariant = product.variants.find((variant) => variant.size === size);
  const allOutOfStock = product.variants.every((variant) => variant.stock <= 0);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (!size) {
      setError(t('selectSize'));
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      await addItem(product._id, quantity, size);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('selectSize'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium">{t('size')}</p>
        <div className="flex flex-wrap gap-2">
          {product.variants.map((variant) => {
            const isOut = variant.stock <= 0;
            return (
              <button
                type="button"
                key={variant.size}
                disabled={isOut}
                onClick={() => {
                  setSize(variant.size);
                  setQuantity(1);
                }}
                title={isOut ? t('outOfStock') : undefined}
                className={`rounded-md border px-3 py-1 text-sm ${
                  isOut
                    ? 'cursor-not-allowed border-border text-muted line-through'
                    : size === variant.size
                      ? 'border-brand-terracotta text-brand-terracotta'
                      : 'border-border'
                }`}
              >
                {variant.size}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="quantity">
          {t('quantity')}
        </label>
        <input
          id="quantity"
          type="number"
          min={1}
          max={selectedVariant?.stock ?? 1}
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
          disabled={!selectedVariant}
          className="w-20 rounded-md border border-border bg-surface px-2 py-1 text-sm disabled:opacity-50"
        />
      </div>

      {error && <p className="text-sm text-brand-terracotta">{error}</p>}
      {success && <p className="text-sm text-green-700">{t('addedToCart')}</p>}

      <button
        type="submit"
        disabled={allOutOfStock || isSubmitting}
        className="w-full rounded-full bg-brand-terracotta px-6 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {allOutOfStock ? t('outOfStock') : t('addToCart')}
      </button>
    </form>
  );
}
