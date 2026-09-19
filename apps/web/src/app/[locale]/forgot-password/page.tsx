'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { ApiError, apiFetch } from '@/lib/api';
import { setResetState } from '@/lib/password-reset';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
      setResetState({ email });
      router.push('/verify-code');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : tCommon('error'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-2 text-2xl font-semibold">{t('forgotTitle')}</h1>
      <p className="mb-4 text-sm text-muted">{t('forgotSubtitle')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          type="email"
          placeholder={t('email')}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-brand-terracotta">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-brand-terracotta px-6 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {t('sendCode')}
        </button>
      </form>

      <p className="mt-6 text-sm">
        <Link href="/login" className="text-brand-terracotta underline">
          {t('backToLogin')}
        </Link>
      </p>
    </div>
  );
}
