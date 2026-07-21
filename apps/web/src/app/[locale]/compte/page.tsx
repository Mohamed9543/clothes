'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/context/auth-context';
import { apiFetch } from '@/lib/api';
import { localize } from '@/lib/localized';
import type { Order } from '@/types';

export default function AccountPage() {
  const t = useTranslations('account');
  const tOrderStatus = useTranslations('orderStatus');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();

  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      apiFetch<Order[]>('/orders', { auth: true }).then(setOrders);
    }
  }, [user]);

  if (!authLoading && !user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">{t('title')}</h1>

      {user && (
        <div className="mb-8 rounded-xl border border-border bg-surface p-4">
          <p className="font-medium">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-sm text-muted">{user.email}</p>
          <button
            onClick={() => logout()}
            className="mt-3 text-sm text-brand-terracotta underline"
          >
            {tNav('logout')}
          </button>
        </div>
      )}

      <h2 className="mb-4 text-lg font-semibold">{t('myOrders')}</h2>

      {orders?.length === 0 && <p className="text-muted">{t('noOrders')}</p>}

      <div className="space-y-4">
        {orders?.map((order) => (
          <div key={order._id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">
                {t('orderNumber')} #{order._id.slice(-6)}
              </p>
              <span className="rounded-full border border-border px-3 py-1 text-xs">
                {tOrderStatus(order.status)}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">
              {new Date(order.createdAt).toLocaleDateString(locale)}
            </p>
            <ul className="mt-3 space-y-1 text-sm">
              {order.items.map((item) => (
                <li key={`${order._id}-${item.productId}`}>
                  {item.quantity} × {localize(item.name, locale)} ({item.size})
                </li>
              ))}
            </ul>
            <p className="mt-3 text-end font-medium">
              {order.totalAmount} {tCommon('currency')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
