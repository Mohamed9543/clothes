'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { localize } from '@/lib/localized';

export default function CartPage() {
  const t = useTranslations('cart');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { cart, isLoading, updateItem, removeItem } = useCart();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  if (!authLoading && !user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">{t('title')}</h1>

      {!isLoading && cart?.items.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="mb-4 text-muted">{t('empty')}</p>
          <Link href="/catalogue" className="text-brand-terracotta underline">
            {t('browseCatalog')}
          </Link>
        </div>
      )}

      {cart && cart.items.length > 0 && (
        <div className="space-y-4">
          {cart.items.map((item) => (
            <div
              key={`${item.productId}-${item.size}`}
              className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4"
            >
              {item.image && (
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-background">
                  <Image src={item.image} alt={localize(item.name, locale)} fill className="object-cover" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium">{localize(item.name, locale)}</p>
                <p className="text-sm text-muted">
                  {t('size')}: {item.size}
                </p>
                <p className="text-sm text-muted">
                  {item.unitPrice} {tCommon('currency')}
                </p>
              </div>
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(event) => updateItem(item.productId, Number(event.target.value))}
                className="w-16 rounded-md border border-border bg-background px-2 py-1 text-sm"
              />
              <p className="w-20 text-end font-medium">
                {item.subtotal} {tCommon('currency')}
              </p>
              <button
                onClick={() => removeItem(item.productId)}
                className="text-sm text-brand-terracotta underline"
              >
                {t('remove')}
              </button>
            </div>
          ))}

          <div className="flex items-center justify-between border-t border-border pt-4">
            <p className="text-lg font-semibold">{t('total')}</p>
            <p className="text-lg font-semibold">
              {cart.total} {tCommon('currency')}
            </p>
          </div>

          <Link
            href="/checkout"
            className="block w-full rounded-full bg-brand-terracotta px-6 py-3 text-center text-sm font-medium text-white hover:opacity-90"
          >
            {t('checkout')}
          </Link>
        </div>
      )}
    </div>
  );
}
