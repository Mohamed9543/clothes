'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/context/auth-context';
import { apiFetch } from '@/lib/api';
import type { ReturnRequest } from '@/types';

export default function ReturnsPage() {
  const t = useTranslations('returns');
  const locale = useLocale();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [returns, setReturns] = useState<ReturnRequest[] | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      apiFetch<ReturnRequest[]>('/returns', { auth: true }).then(setReturns);
    }
  }, [user]);

  if (!authLoading && !user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">{t('title')}</h1>

      {returns?.length === 0 && <p className="text-muted">{t('empty')}</p>}

      <div className="space-y-4">
        {returns?.map((ret) => (
          <div key={ret._id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">
                {ret.type === 'return' ? t('requestReturn') : t('requestExchange')} — #
                {ret._id.slice(-6)}
              </p>
              <span className="rounded-full border border-border px-3 py-1 text-xs">
                {t(`status.${ret.status}`)}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">
              {new Date(ret.createdAt).toLocaleDateString(locale)}
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {ret.items.map((item, index) => (
                <li key={index}>
                  {item.quantity} × {item.size} / {item.color}
                  {item.exchangeSize && ` → ${item.exchangeSize} / ${item.exchangeColor}`}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-muted">{ret.reason}</p>
            {ret.refundAmount != null && (
              <p className="mt-2 text-sm font-medium text-green-700">
                {t('refundAmount')}: {ret.refundAmount}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
