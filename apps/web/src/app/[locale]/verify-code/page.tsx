'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { ApiError, apiFetch } from '@/lib/api';
import { getResetState, setResetState } from '@/lib/password-reset';

export default function VerifyCodePage() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [email, setEmail] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const state = getResetState();
    if (!state) {
      router.replace('/forgot-password');
      return;
    }
    setEmail(state.email);
  }, [router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email) return;
    setError(null);
    setNotice(null);
    setIsSubmitting(true);
    try {
      await apiFetch('/auth/verify-reset-code', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      });
      setResetState({ email, code });
      router.push('/reset-password');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : tCommon('error'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (!email) return;
    setError(null);
    setNotice(null);
    setIsSubmitting(true);
    try {
      await apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
      setCode('');
      setNotice(t('codeResent'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : tCommon('error'));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!email) return null;

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-2 text-2xl font-semibold">{t('verifyTitle')}</h1>
      <p className="mb-4 text-sm text-muted">{t('codeSentTo', { email })}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          placeholder={t('code')}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-center text-lg tracking-[0.5em]"
        />
        {error && <p className="text-sm text-brand-terracotta">{error}</p>}
        {notice && <p className="text-sm text-muted">{notice}</p>}
        <button
          type="submit"
          disabled={isSubmitting || code.length !== 6}
          className="w-full rounded-full bg-brand-terracotta px-6 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {t('verifyCta')}
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => void handleResend()}
          className="w-full text-sm text-brand-terracotta underline disabled:opacity-50"
        >
          {t('resendCode')}
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
