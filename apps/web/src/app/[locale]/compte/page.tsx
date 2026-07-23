'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { LogOut, Package, User as UserIcon } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/context/auth-context';
import { apiFetch } from '@/lib/api';
import { localize } from '@/lib/localized';
import { OrderTimeline } from '@/components/order-timeline';
import type { Order, OrderStatusHistoryEntry } from '@/types';

export default function AccountPage() {
  const t = useTranslations('account');
  const tOrderStatus = useTranslations('orderStatus');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const tAvatar = useTranslations('avatar');
  const tAdmin = useTranslations('admin');
  const locale = useLocale();
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [openHistoryId, setOpenHistoryId] = useState<string | null>(null);
  const [histories, setHistories] = useState<Record<string, OrderStatusHistoryEntry[]>>({});

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

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

  if (!authLoading && !user) {
    return null;
  }

  const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : '';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">{t('title')}</h1>

      {user && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-terracotta text-lg font-semibold text-white">
              {initials || <UserIcon className="h-6 w-6" />}
            </div>
            <div>
              <p className="font-medium">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-muted">{user.email}</p>
              {isAdmin && (
                <span className="mt-1 inline-block rounded-full bg-brand-terracotta/10 px-2 py-0.5 text-xs font-medium text-brand-terracotta">
                  {tAdmin('roleAdmin')}
                </span>
              )}
              {!isAdmin && (
                <Link
                  href="/avatar"
                  className="mt-1 inline-block text-sm text-brand-terracotta underline"
                >
                  {tAvatar('myAvatar')}
                </Link>
              )}
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-brand-gold"
          >
            <LogOut className="h-4 w-4" />
            {tNav('logout')}
          </button>
        </div>
      )}

      {isAdmin ? (
        <Link
          href="/admin"
          className="flex items-center gap-2 rounded-xl border border-border bg-surface p-4 text-sm font-medium hover:border-brand-gold"
        >
          <Package className="h-4 w-4" />
          {tAdmin('title')}
        </Link>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
