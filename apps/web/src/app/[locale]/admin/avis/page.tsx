'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api';
import { localize } from '@/lib/localized';
import type { PaginatedResult, ReviewWithProduct } from '@/types';

export default function AdminReviewsPage() {
  const t = useTranslations('admin');
  const locale = useLocale();

  const [reviews, setReviews] = useState<ReviewWithProduct[] | null>(null);

  const loadReviews = useCallback(async () => {
    const result = await apiFetch<PaginatedResult<ReviewWithProduct>>('/reviews/admin/all?limit=100', {
      auth: true,
    });
    setReviews([...result.items].sort((a, b) => b.reportCount - a.reportCount));
  }, []);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  async function toggleHidden(review: ReviewWithProduct) {
    await apiFetch(`/reviews/admin/${review._id}/status`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ isHidden: !review.isHidden }),
    });
    void loadReviews();
  }

  async function handleDelete(review: ReviewWithProduct) {
    if (!window.confirm(t('confirmDeleteReview'))) return;
    await apiFetch(`/reviews/admin/${review._id}`, { method: 'DELETE', auth: true });
    void loadReviews();
  }

  if (reviews?.length === 0) {
    return <p className="text-muted">{t('noReviewsAdmin')}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-start text-sm">
        <thead>
          <tr className="border-b border-border text-start text-xs text-muted">
            <th className="p-3 text-start">{t('colProduct')}</th>
            <th className="p-3 text-start">{t('colReviewer')}</th>
            <th className="p-3 text-start">{t('colRating')}</th>
            <th className="p-3 text-start">{t('colComment')}</th>
            <th className="p-3 text-start">{t('colDate')}</th>
            <th className="p-3 text-start">{t('colReports')}</th>
            <th className="p-3 text-start">{t('colStatus')}</th>
            <th className="p-3 text-start">{t('colActions')}</th>
          </tr>
        </thead>
        <tbody>
          {reviews?.map((review) => (
            <tr key={review._id} className="border-b border-border last:border-0">
              <td className="p-3">{localize(review.productName, locale)}</td>
              <td className="p-3">{review.authorName}</td>
              <td className="p-3">{review.rating} / 5</td>
              <td className="max-w-xs p-3">{review.comment}</td>
              <td className="p-3">{new Date(review.createdAt).toLocaleDateString(locale)}</td>
              <td className="p-3">
                {review.reportCount > 0 ? (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
                    {review.reportCount}
                  </span>
                ) : (
                  '—'
                )}
              </td>
              <td className="p-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    review.isHidden ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-800'
                  }`}
                >
                  {review.isHidden ? t('statusInactive') : t('statusActive')}
                </span>
              </td>
              <td className="space-x-2 rtl:space-x-reverse p-3 whitespace-nowrap">
                <button onClick={() => toggleHidden(review)} className="underline">
                  {review.isHidden ? t('show') : t('hide')}
                </button>
                <button onClick={() => handleDelete(review)} className="text-red-600 underline">
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
