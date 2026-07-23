'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Ban, CircleCheck, Eye, Pencil, Receipt, Trash2, X } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import type { AdminUser, Order } from '@/types';

export default function AdminUsersPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tOrderStatus = useTranslations('orderStatus');
  const locale = useLocale();

  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [openOrdersId, setOpenOrdersId] = useState<string | null>(null);
  const [ordersByUser, setOrdersByUser] = useState<Record<string, Order[]>>({});
  const [viewingUser, setViewingUser] = useState<AdminUser | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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

  function openEdit(user: AdminUser) {
    setEditingUser(user);
    setEditFirstName(user.firstName);
    setEditLastName(user.lastName);
    setEditError(null);
  }

  async function handleSaveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editingUser) return;
    setIsSavingEdit(true);
    setEditError(null);
    try {
      await apiFetch(`/users/admin/${editingUser._id}`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({ firstName: editFirstName, lastName: editLastName }),
      });
      setEditingUser(null);
      void loadUsers();
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : t('saveError'));
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleDeleteUser(user: AdminUser) {
    if (!window.confirm(t('confirmDeleteUser'))) return;
    await apiFetch(`/users/admin/${user._id}`, { method: 'DELETE', auth: true });
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
                      onClick={() => setViewingUser(user)}
                      aria-label={t('viewUser')}
                      title={t('viewUser')}
                      className="hover:opacity-70"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEdit(user)}
                      aria-label={t('edit')}
                      title={t('edit')}
                      className="text-brand-terracotta hover:opacity-70"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
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
                    <button
                      onClick={() => handleDeleteUser(user)}
                      disabled={user.role === 'admin'}
                      aria-label={t('delete')}
                      title={t('delete')}
                      className="text-red-600 hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
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

      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-xl bg-surface p-6">
            <button
              onClick={() => setViewingUser(null)}
              aria-label={t('close')}
              className="absolute end-4 top-4"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="mb-4 font-medium">{t('viewUser')}</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">{t('colName')}</dt>
                <dd>{viewingUser.firstName} {viewingUser.lastName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{t('colEmail')}</dt>
                <dd>{viewingUser.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{t('colRole')}</dt>
                <dd>{viewingUser.role === 'admin' ? t('roleAdmin') : t('roleCustomer')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{t('colLanguage')}</dt>
                <dd>{viewingUser.preferredLanguage}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{t('colRegistered')}</dt>
                <dd>{new Date(viewingUser.createdAt).toLocaleDateString(locale)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{t('colStatus')}</dt>
                <dd>{viewingUser.isBlocked ? t('statusInactive') : t('statusActive')}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSaveEdit}
            className="relative w-full max-w-md space-y-4 rounded-xl bg-surface p-6"
          >
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              aria-label={t('close')}
              className="absolute end-4 top-4"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="font-medium">{t('editUser')}</h2>
            <input
              required
              value={editFirstName}
              onChange={(e) => setEditFirstName(e.target.value)}
              placeholder={t('colName')}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              required
              value={editLastName}
              onChange={(e) => setEditLastName(e.target.value)}
              placeholder={t('colName')}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            {editError && <p className="text-sm text-red-600">{editError}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSavingEdit}
                className="rounded-full bg-brand-terracotta px-6 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {t('save')}
              </button>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-full border border-border px-6 py-2 text-sm hover:border-brand-gold"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
