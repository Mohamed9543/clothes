'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Ban, CircleCheck, Receipt } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { AdminUser, Order } from '@/types';

export default function AdminUsersPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tOrderStatus = useTranslations('orderStatus');
  const locale = useLocale();

  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [openOrdersId, setOpenOrdersId] = useState<string | null>(null);
  const [ordersByUser, setOrdersByUser] = useState<Record<string, Order[]>>({});

  const loadUsers = useCallback(async () => {
    const result = await apiFetch<AdminUser[]>('/users/admin/all', { auth: true });
    setUsers(result);
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function toggleBlocked(user: AdminUser) {
    if (!user.isBlocked && !window.confirm(t('confirmBlock'))) return;
    await apiFetch(`/users/admin/${user._id}/block`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ isBlocked: !user.isBlocked }),
    });
    void loadUsers();
  }

  async function toggleOrders(userId: string) {
    if (openOrdersId === userId) {
      setOpenOrdersId(null);
      return;
    }
    if (!ordersByUser[userId]) {
      const result = await apiFetch<Order[]>(`/users/admin/${userId}/orders`, { auth: true });
      setOrdersByUser((prev) => ({ ...prev, [userId]: result }));
    }
    setOpenOrdersId(userId);
  }

  if (users?.length === 0) {
    return <p className="text-muted">{t('noUsers')}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-start text-sm">
        <thead>
          <tr className="border-b border-border text-start text-xs text-muted">
            <th className="p-3 text-start">{t('colName')}</th>
            <th className="p-3 text-start">{t('colEmail')}</th>
            <th className="p-3 text-start">{t('colRole')}</th>
            <th className="p-3 text-start">{t('colLanguage')}</th>
            <th className="p-3 text-start">{t('colRegistered')}</th>
            <th className="p-3 text-start">{t('colStatus')}</th>
            <th className="p-3 text-start">{t('colActions')}</th>
          </tr>
        </thead>
        <tbody>
          {users?.map((user) => (
            <Fragment key={user._id}>
              <tr className="border-b border-border last:border-0">
                <td className="p-3">
                  {user.firstName} {user.lastName}
                </td>
                <td className="p-3">{user.email}</td>
                <td className="p-3">{user.role === 'admin' ? t('roleAdmin') : t('roleCustomer')}</td>
                <td className="p-3">{user.preferredLanguage}</td>
                <td className="p-3">{new Date(user.createdAt).toLocaleDateString(locale)}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      user.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {user.isBlocked ? t('statusInactive') : t('statusActive')}
                  </span>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleBlocked(user)}
                      disabled={user.role === 'admin'}
                      aria-label={user.isBlocked ? t('unblock') : t('block')}
                      title={user.isBlocked ? t('unblock') : t('block')}
                      className="text-brand-terracotta hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {user.isBlocked ? (
                        <CircleCheck className="h-4 w-4" />
                      ) : (
                        <Ban className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => toggleOrders(user._id)}
                      aria-label={openOrdersId === user._id ? t('hideOrders') : t('viewOrders')}
                      title={openOrdersId === user._id ? t('hideOrders') : t('viewOrders')}
                      className="hover:opacity-70"
                    >
                      <Receipt className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
              {openOrdersId === user._id && (
                <tr className="border-b border-border last:border-0">
                  <td colSpan={7} className="bg-background p-3">
                    {ordersByUser[user._id]?.length === 0 && (
                      <p className="text-sm text-muted">{t('noOrders')}</p>
                    )}
                    <ul className="space-y-1 text-sm">
                      {ordersByUser[user._id]?.map((order) => (
                        <li key={order._id} className="flex justify-between">
                          <span>
                            #{order._id.slice(-6)} — {new Date(order.createdAt).toLocaleDateString(locale)} —{' '}
                            {tOrderStatus(order.status)}
                          </span>
                          <span>
                            {order.totalAmount} {tCommon('currency')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
