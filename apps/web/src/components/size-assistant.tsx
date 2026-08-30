'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/context/auth-context';
import { apiFetch } from '@/lib/api';
import type { SizeRecommendation } from '@/types';

export function SizeAssistant({ productId }: { productId: string }) {
  const t = useTranslations('sizeAssistant');
  const { user } = useAuth();
  const [recommendation, setRecommendation] = useState<SizeRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setRecommendation(null);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    apiFetch<SizeRecommendation>(`/size-assistant/recommend/${productId}`, { auth: true })
      .then((data) => {
        if (!cancelled) setRecommendation(data);
      })
      .catch(() => {
        if (!cancelled) setRecommendation(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, productId]);

  if (!user) return null;
  if (isLoading) return <p className="text-xs text-muted">{t('loading')}</p>;
  if (!recommendation) return null;

  if (recommendation.confidence === 'none') {
    return (
      <p className="text-xs text-muted">
        {recommendation.message}{' '}
        <Link href="/avatar" className="text-brand-terracotta underline">
          {t('fillProfile')}
        </Link>
      </p>
    );
  }

  const confidenceLabel =
    recommendation.confidence === 'high' ? t('confidenceHigh') : t('confidenceMedium');

  return (
    <p className="rounded-md bg-background px-3 py-2 text-xs text-foreground">
      <span className="font-medium">{t('title')}</span> {recommendation.recommendedSize} —{' '}
      {confidenceLabel}
    </p>
  );
}
