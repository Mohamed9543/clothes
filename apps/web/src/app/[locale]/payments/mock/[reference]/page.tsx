'use client';

import { use, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { apiFetch, ApiError } from '@/lib/api';

interface PageProps {
  params: Promise<{ reference: string }>;
}

// Dev-only stand-in for a real payment gateway's hosted checkout page — lets
// the demo flow exercise the full pending -> paid/failed lifecycle without a
// real Konnect/Flouci merchant account. Clearly labeled as a simulation.
export default function MockPaymentPage({ params }: PageProps) {
  const { reference } = use(params);
  const t = useTranslations('payments');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<'paid' | 'failed' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function simulate(outcome: 'paid' | 'failed') {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/payments/mock/${reference}/simulate`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ outcome }),
      });
      setResult(outcome);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('simulateError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">
          {result === 'paid' ? t('simulatedPaidTitle') : t('simulatedFailedTitle')}
        </h1>
        <button
          onClick={() => router.push('/commandes')}
          className="mt-6 inline-block rounded-full bg-brand-terracotta px-6 py-3 text-sm font-medium text-white hover:opacity-90"
        >
          {t('viewOrders')}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">{t('mockConfirmTitle')}</h1>
      <p className="mt-2 text-sm text-muted">{t('mockConfirmSubtitle')}</p>

      {error && <p className="mt-4 text-sm text-brand-terracotta">{error}</p>}

      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={() => simulate('paid')}
          disabled={isSubmitting}
          className="rounded-full bg-brand-terracotta px-6 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {t('simulateSuccess')}
        </button>
        <button
          onClick={() => simulate('failed')}
          disabled={isSubmitting}
          className="rounded-full border border-border px-6 py-3 text-sm hover:border-brand-gold disabled:opacity-50"
        >
          {t('simulateFailure')}
        </button>
      </div>
    </div>
  );
}
