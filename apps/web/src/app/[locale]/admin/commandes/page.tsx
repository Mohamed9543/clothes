'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api';
import { localize } from '@/lib/localized';
import type { Order, OrderStatus } from '@/types';

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
  const t = useTranslations('admin');
  const tOrderStatus = useTranslations('orderStatus');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [orders, setOrders] = useState<Order[] | null>(null);

  const loadOrders = useCallback(async () => {
    const result = await apiFetch<Order[]>('/orders/admin/all', { auth: true });
    setOrders(result);
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  async function updateStatus(order: Order, status: OrderStatus) {
    await apiFetch(`/orders/admin/${order._id}/status`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ status }),
    });
    void loadOrders();
  }

  if (orders?.length === 0) {
    return <p className="text-muted">{t('noOrders')}</p>;
  }

  return (
    <div className="space-y-4">
      {orders?.map((order) => (
        <div key={order._id} className="rounded-xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium">#{order._id.slice(-6)}</p>
              <p className="text-sm text-muted">
                {order.shippingAddress.fullName} — {order.shippingAddress.phone}
              </p>
              <p className="text-sm text-muted">
                {new Date(order.createdAt).toLocaleDateString(locale)}
              </p>
            </div>
            <select
              value={order.status}
              onChange={(event) => updateStatus(order, event.target.value as OrderStatus)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {tOrderStatus(status)}
                </option>
              ))}
            </select>
          </div>

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
  );
}
