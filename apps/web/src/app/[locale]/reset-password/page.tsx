'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { ApiError, apiFetch } from '@/lib/api';
import { clearResetState, getResetState } from '@/lib/password-reset';
import { PasswordInput } from '@/components/auth/password-input';

export default function ResetPasswordPage() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [state, setState] = useState<{ email: string; code: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const saved = getResetState();
    if (!saved) {
      router.replace('/forgot-password');
    } else if (!saved.code) {
      router.replace('/verify-code');
    } else {
      setState({ email: saved.email, code: saved.code });
    }
  }, [router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!state) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ ...state, newPassword }),
      });
      clearResetState();
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : tCommon('error'));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!state) return null;

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-2 text-2xl font-semibold">{t('newPasswordTitle')}</h1>

      {done ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm">{t('resetSuccess')}</p>
          <Link
            href="/login"
            className="block w-full rounded-full bg-brand-terracotta px-6 py-3 text-center text-sm font-medium text-white hover:opacity-90"
          >
            {t('backToLogin')}
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted">{t('newPasswordSubtitle')}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordInput
              required
              minLength={8}
              autoComplete="new-password"
              placeholder={t('newPassword')}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            {error && <p className="text-sm text-brand-terracotta">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-brand-terracotta px-6 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {t('resetCta')}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
