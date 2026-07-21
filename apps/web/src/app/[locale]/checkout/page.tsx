'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { apiFetch, ApiError } from '@/lib/api';
import type { Order } from '@/types';

export default function CheckoutPage() {
  const t = useTranslations('checkout');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { cart, refresh } = useCart();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Tunisie');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  if (!authLoading && !user) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const created = await apiFetch<Order>('/orders', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          shippingAddress: { fullName, phone, address, city, country },
        }),
      });
      setOrder(created);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : tCommon('error'));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">{t('orderSuccessTitle')}</h1>
        <p className="mt-2 text-muted">{t('orderSuccessText')}</p>
        <Link
          href="/compte"
          className="mt-6 inline-block rounded-full bg-brand-terracotta px-6 py-3 text-sm font-medium text-white hover:opacity-90"
        >
          {t('viewOrder')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">{t('title')}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="font-medium">{t('shippingAddress')}</h2>

        <input
          required
          placeholder={t('fullName')}
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
        <input
          required
          placeholder={t('phone')}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
        <input
          required
          placeholder={t('address')}
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
        <input
          required
          placeholder={t('city')}
          value={city}
          onChange={(event) => setCity(event.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
        <input
          required
          placeholder={t('country')}
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />

        <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm">
          <p className="font-medium">{t('paymentMethod')}</p>
          <p className="text-muted">{t('cod')}</p>
        </div>

        {cart && (
          <div className="flex items-center justify-between border-t border-border pt-4 text-sm font-medium">
            <span>{t('title')}</span>
            <span>
              {cart.total} {tCommon('currency')}
            </span>
          </div>
        )}

        {error && <p className="text-sm text-brand-terracotta">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting || !cart || cart.items.length === 0}
          className="w-full rounded-full bg-brand-terracotta px-6 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {t('placeOrder')}
        </button>
      </form>
    </div>
  );
}
