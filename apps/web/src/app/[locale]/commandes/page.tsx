'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/context/auth-context';
import { apiFetch } from '@/lib/api';
import { localize } from '@/lib/localized';
import { OrderTimeline } from '@/components/order-timeline';
import type { Order, OrderStatusHistoryEntry } from '@/types';

export default function OrdersPage() {
  const t = useTranslations('account');
  const tOrderStatus = useTranslations('orderStatus');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const isAdmin = user?.role === 'admin';

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [openHistoryId, setOpenHistoryId] = useState<string | null>(null);
  const [histories, setHistories] = useState<Record<string, OrderStatusHistoryEntry[]>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && isAdmin) {
      router.replace('/admin/commandes');
    }
  }, [authLoading, user, isAdmin, router]);

  useEffect(() => {
    if (user && !isAdmin) {
      apiFetch<Order[]>('/orders', { auth: true }).then(setOrders);
    }
  }, [user, isAdmin]);

  async function toggleHistory(orderId: string) {
    if (openHistoryId === orderId) {
      setOpenHistoryId(null);
      return;
    }
    if (!histories[orderId]) {
      const result = await apiFetch<OrderStatusHistoryEntry[]>(`/orders/${orderId}/history`, {
        auth: true,
      });
      setHistories((prev) => ({ ...prev, [orderId]: result }));
    }
    setOpenHistoryId(orderId);
  }

  if (!authLoading && (!user || isAdmin)) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">{t('myOrders')}</h1>

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
                  {item.quantity} × {localize(item.name, locale)} ({item.size} / {item.color})
                </li>
              ))}
            </ul>
            <p className="mt-3 text-end font-medium">
              {order.totalAmount} {tCommon('currency')}
            </p>

            <button
              onClick={() => toggleHistory(order._id)}
              className="mt-3 text-sm text-brand-terracotta underline"
            >
              {openHistoryId === order._id ? t('hideTracking') : t('trackOrder')}
            </button>

            {openHistoryId === order._id && histories[order._id] && (
              <div className="mt-3">
                <OrderTimeline entries={histories[order._id]} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
