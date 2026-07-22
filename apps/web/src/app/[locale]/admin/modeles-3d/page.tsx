'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api';
import { localize } from '@/lib/localized';
import type { AdminAvatarUser, AdminProduct, PaginatedResult } from '@/types';

export default function AdminModels3dPage() {
  const t = useTranslations('admin');
  const locale = useLocale();

  const [avatars, setAvatars] = useState<AdminAvatarUser[] | null>(null);
  const [products, setProducts] = useState<AdminProduct[] | null>(null);

  const loadAvatars = useCallback(async () => {
    const result = await apiFetch<AdminAvatarUser[]>('/users/admin/avatars', { auth: true });
    setAvatars(result);
  }, []);

  const loadProducts = useCallback(async () => {
    const result = await apiFetch<PaginatedResult<AdminProduct>>('/products/admin/all?limit=100', {
      auth: true,
    });
    setProducts(result.items);
  }, []);

  useEffect(() => {
    void loadAvatars();
    void loadProducts();
  }, [loadAvatars, loadProducts]);

  async function toggleAvatarDisabled(user: AdminAvatarUser) {
    if (!user.avatarDisabled && !window.confirm(t('confirmDisableAvatar'))) return;
    await apiFetch(`/users/admin/${user._id}/avatar-status`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ disabled: !user.avatarDisabled }),
    });
    void loadAvatars();
  }

  async function toggleTryOn(product: AdminProduct) {
    await apiFetch(`/products/${product._id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ tryOnEnabled: !product.tryOnEnabled }),
    });
    void loadProducts();
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-4 text-lg font-semibold">{t('tabModels3d')}</h2>
        {avatars?.length === 0 ? (
          <p className="text-muted">{t('noAvatars')}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="border-b border-border text-start text-xs text-muted">
                  <th className="p-3 text-start">{t('colAvatarUser')}</th>
                  <th className="p-3 text-start">{t('colEmail')}</th>
                  <th className="p-3 text-start">{t('colAvatarStatus')}</th>
                  <th className="p-3 text-start">{t('colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {avatars?.map((user) => (
                  <tr key={user._id} className="border-b border-border last:border-0">
                    <td className="p-3">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          user.avatarDisabled
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {user.avatarDisabled ? t('statusInactive') : t('statusActive')}
                      </span>
                    </td>
                    <td className="space-x-2 rtl:space-x-reverse p-3 whitespace-nowrap">
                      {user.avatarUrl && (
                        <a
                          href={user.avatarUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                        >
                          {t('viewAvatar')}
                        </a>
                      )}
                      <button onClick={() => toggleAvatarDisabled(user)} className="text-brand-terracotta underline">
                        {user.avatarDisabled ? t('enableAvatar') : t('disableAvatar')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">{t('tryOnSection')}</h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="border-b border-border text-start text-xs text-muted">
                <th className="p-3 text-start">{t('colName')}</th>
                <th className="p-3 text-start">{t('tryOnStatus')}</th>
                <th className="p-3 text-start">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {products?.map((product) => (
                <tr key={product._id} className="border-b border-border last:border-0">
                  <td className="p-3">{localize(product.name, locale)}</td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        product.tryOnEnabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {product.tryOnEnabled ? t('statusActive') : t('statusInactive')}
                    </span>
                  </td>
                  <td className="p-3">
                    <button onClick={() => toggleTryOn(product)} className="text-brand-terracotta underline">
                      {product.tryOnEnabled ? t('disableTryOn') : t('enableTryOn')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
