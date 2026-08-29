'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BadgeCheck, Flag } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { API_URL, apiFetch, apiUpload, ApiError } from '@/lib/api';
import type { ReviewFit, ProductReviewsResult } from '@/types';

const FITS: ReviewFit[] = ['small', 'true_to_size', 'large'];

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
  const [fit, setFit] = useState<ReviewFit | ''>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportedIds, setReportedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const result = await apiFetch<ProductReviewsResult>(`/reviews/product/${slug}`);
    setData(result);
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    event.target.value = '';
    setIsUploading(true);
    try {
      for (const file of Array.from(files).slice(0, 5 - photos.length)) {
        const formData = new FormData();
        formData.append('file', file);
        const result = await apiUpload<{ url: string }>('/uploads/image', formData, { auth: true });
        setPhotos((current) => [...current, `${API_URL}${result.url}`]);
      }
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await apiFetch(`/reviews/product/${slug}`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ rating, comment, fit: fit || undefined, photos }),
      });
      setComment('');
      setRating(5);
      setFit('');
      setPhotos([]);
      void load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('genericError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReport(reviewId: string) {
    await apiFetch(`/reviews/${reviewId}/report`, { method: 'POST', auth: true });
    setReportedIds((current) => [...current, reviewId]);
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
              <div className="flex items-center gap-2">
                <p className="font-medium">{review.authorName}</p>
                <span
                  title={t('verifiedPurchase')}
                  className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800"
                >
                  <BadgeCheck className="h-3 w-3" />
                  {t('verifiedPurchase')}
                </span>
              </div>
              <Stars value={review.rating} />
            </div>
            <p className="mt-1 text-xs text-muted">
              {new Date(review.createdAt).toLocaleDateString(locale)}
            </p>
            {review.fit && <p className="mt-1 text-xs text-muted">{t(`fit.${review.fit}`)}</p>}
            <p className="mt-2 text-sm">{review.comment}</p>
            {review.photos.length > 0 && (
              <div className="mt-2 flex gap-2">
                {review.photos.map((photo) => (
                  <div key={photo} className="relative h-16 w-16 overflow-hidden rounded-lg border border-border">
                    <Image src={photo} alt="" fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => handleReport(review._id)}
              disabled={reportedIds.includes(review._id)}
              className="mt-2 flex items-center gap-1 text-xs text-muted underline disabled:no-underline disabled:opacity-50"
            >
              <Flag className="h-3 w-3" />
              {reportedIds.includes(review._id) ? t('reportSuccess') : t('report')}
            </button>
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
          <label className="mb-2 block text-sm">
            {t('fitLabel')}
            <select
              value={fit}
              onChange={(event) => setFit(event.target.value as ReviewFit | '')}
              className="ms-2 rounded-md border border-border bg-background px-2 py-1 text-sm"
            >
              <option value="">{t('fitUnset')}</option>
              {FITS.map((value) => (
                <option key={value} value={value}>
                  {t(`fit.${value}`)}
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

          <div className="mt-2">
            {photos.length > 0 && (
              <div className="mb-2 flex gap-2">
                {photos.map((photo) => (
                  <div key={photo} className="relative h-14 w-14 overflow-hidden rounded-lg border border-border">
                    <Image src={photo} alt="" fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handlePhotoUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || photos.length >= 5}
              className="rounded-md border border-border px-3 py-1 text-xs hover:border-brand-gold disabled:opacity-50"
            >
              {isUploading ? t('uploading') : t('addPhotos')}
            </button>
          </div>

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
