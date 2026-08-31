'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api';
import type { Look, PaginatedResult } from '@/types';

export default function AdminLookbookPage() {
  const t = useTranslations('admin');
  const locale = useLocale();

  const [looks, setLooks] = useState<Look[] | null>(null);

  const loadLooks = useCallback(async () => {
    const result = await apiFetch<PaginatedResult<Look>>('/looks/admin/all?limit=100', { auth: true });
    setLooks([...result.items].sort((a, b) => b.reportCount - a.reportCount));
  }, []);

  useEffect(() => {
    void loadLooks();
  }, [loadLooks]);

  async function toggleHidden(look: Look) {
    await apiFetch(`/looks/admin/${look._id}/status`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ isHidden: !look.isHidden }),
    });
    void loadLooks();
  }

  async function handleDelete(look: Look) {
    if (!window.confirm(t('confirmDeleteLook'))) return;
    await apiFetch(`/looks/admin/${look._id}`, { method: 'DELETE', auth: true });
    void loadLooks();
  }

  if (looks?.length === 0) {
    return <p className="text-muted">{t('noLooksAdmin')}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-start text-sm">
        <thead>
          <tr className="border-b border-border text-start text-xs text-muted">
            <th className="p-3 text-start" />
            <th className="p-3 text-start">{t('colAuthor')}</th>
            <th className="p-3 text-start">{t('colCaption')}</th>
            <th className="p-3 text-start">{t('colLikes')}</th>
            <th className="p-3 text-start">{t('colDate')}</th>
            <th className="p-3 text-start">{t('colReports')}</th>
            <th className="p-3 text-start">{t('colStatus')}</th>
            <th className="p-3 text-start">{t('colActions')}</th>
          </tr>
        </thead>
        <tbody>
          {looks?.map((look) => (
            <tr key={look._id} className="border-b border-border last:border-0">
              <td className="p-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-border">
                  <Image src={look.images[0]} alt="" fill className="object-cover" />
                </div>
              </td>
              <td className="p-3">{look.authorName}</td>
              <td className="max-w-xs p-3">{look.caption ?? '—'}</td>
              <td className="p-3">{look.likeCount}</td>
              <td className="p-3">{new Date(look.createdAt).toLocaleDateString(locale)}</td>
              <td className="p-3">
                {look.reportCount > 0 ? (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
                    {look.reportCount}
                  </span>
                ) : (
                  '—'
                )}
              </td>
              <td className="p-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    look.isHidden ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-800'
                  }`}
                >
                  {look.isHidden ? t('statusInactive') : t('statusActive')}
                </span>
              </td>
              <td className="space-x-2 rtl:space-x-reverse p-3 whitespace-nowrap">
                <button onClick={() => toggleHidden(look)} className="underline">
                  {look.isHidden ? t('show') : t('hide')}
                </button>
                <button onClick={() => handleDelete(look)} className="text-red-600 underline">
                  {t('delete')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
