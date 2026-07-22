'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { apiFetch, ApiError } from '@/lib/api';
import type { ProductReviewsResult } from '@/types';

function Stars({ value }: { value: number }) {
  return (
    <span className="text-brand-terracotta" aria-hidden>
      {'★'.repeat(Math.round(value))}
      <span className="text-border">{'★'.repeat(5 - Math.round(value))}</span>
    </span>
  );
}

export function ProductReviews({ slug }: { slug: string }) {
  const t = useTranslations('review');
  const locale = useLocale();
  const { user } = useAuth();

  const [data, setData] = useState<ProductReviewsResult | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    const result = await apiFetch<ProductReviewsResult>(`/reviews/product/${slug}`);
    setData(result);
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await apiFetch(`/reviews/product/${slug}`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ rating, comment }),
      });
      setComment('');
      setRating(5);
      void load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('genericError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-10 border-t border-border pt-8">
      <h2 className="text-lg font-semibold">{t('title')}</h2>

      {data && (
        <div className="mt-2 flex items-center gap-2 text-sm">
          <Stars value={data.avgRating} />
          <span className="text-muted">{t('ratingCount', { count: data.count })}</span>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {data?.reviews.length === 0 && <p className="text-sm text-muted">{t('noReviews')}</p>}
        {data?.reviews.map((review) => (
          <div key={review._id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{review.authorName}</p>
              <Stars value={review.rating} />
            </div>
            <p className="mt-1 text-xs text-muted">
              {new Date(review.createdAt).toLocaleDateString(locale)}
            </p>
            <p className="mt-2 text-sm">{review.comment}</p>
          </div>
        ))}
      </div>

      {user && (
        <form onSubmit={handleSubmit} className="mt-6 rounded-xl border border-border bg-surface p-4">
          <p className="mb-2 text-sm font-medium">{t('writeReview')}</p>
          <label className="mb-2 block text-sm">
            {t('rating')}
            <select
              value={rating}
              onChange={(event) => setRating(Number(event.target.value))}
              className="ms-2 rounded-md border border-border bg-background px-2 py-1 text-sm"
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            required
            minLength={1}
            maxLength={1000}
            rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder={t('comment')}
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-3 rounded-full bg-brand-terracotta px-6 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {t('submit')}
          </button>
        </form>
      )}
    </div>
  );
}
