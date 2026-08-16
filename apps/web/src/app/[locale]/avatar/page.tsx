'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/context/auth-context';
import { apiFetch } from '@/lib/api';
import { AvatarCreator } from '@/components/avatar/avatar-creator';
import { AvatarViewer } from '@/components/avatar/avatar-viewer';
import type { Gender } from '@/types';

export default function AvatarPage() {
  const t = useTranslations('avatar');
  const router = useRouter();
  const { user, isLoading: authLoading, refreshUser } = useAuth();

  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showCreator, setShowCreator] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      setHeightCm(user.heightCm ? String(user.heightCm) : '');
      setWeightKg(user.weightKg ? String(user.weightKg) : '');
      setGender(user.gender ?? '');
    }
  }, [user]);

  if (!authLoading && !user) {
    return null;
  }

  async function saveMeasurements(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setSaved(false);
    try {
      await apiFetch('/users/me', {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({
          heightCm: heightCm ? Number(heightCm) : undefined,
          weightKg: weightKg ? Number(weightKg) : undefined,
          gender: gender || undefined,
        }),
      });
      await refreshUser();
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAvatar() {
    if (!window.confirm(t('confirmDeleteAvatar'))) return;
    await apiFetch('/users/me', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ avatarUrl: null }),
    });
    await refreshUser();
  }

  if (showCreator) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <AvatarCreator
          onClose={() => setShowCreator(false)}
          onSaved={async () => {
            await refreshUser();
            setShowCreator(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold">{t('title')}</h1>
      <p className="mb-8 text-sm text-muted">{t('intro')}</p>

      <section className="mb-8 rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-1 font-medium">{t('measurements')}</h2>
        <p className="mb-4 text-sm text-muted">{t('measurementsHint')}</p>
        <form onSubmit={saveMeasurements} className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm">{t('height')}</label>
            <input
              type="number"
              min={50}
              max={250}
              value={heightCm}
              onChange={(event) => setHeightCm(event.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">{t('weight')}</label>
            <input
              type="number"
              min={20}
              max={300}
              value={weightKg}
              onChange={(event) => setWeightKg(event.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">{t('gender')}</label>
            <select
              value={gender}
              onChange={(event) => setGender(event.target.value as Gender)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">-</option>
              <option value="male">{t('genderMale')}</option>
              <option value="female">{t('genderFemale')}</option>
              <option value="other">{t('genderOther')}</option>
            </select>
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-brand-terracotta px-6 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {t('save')}
            </button>
            {saved && <span className="ms-3 text-sm text-green-700">{t('saved')}</span>}
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="font-medium">{t('myAvatar')}</h2>
          <div className="flex gap-2">
            {user?.avatarUrl && (
              <button
                onClick={handleDeleteAvatar}
                className="rounded-full border border-border px-4 py-2 text-sm text-brand-terracotta hover:border-brand-terracotta"
              >
                {t('deleteAvatar')}
              </button>
            )}
            <button
              onClick={() => setShowCreator(true)}
              className="rounded-full border border-border px-4 py-2 text-sm hover:border-brand-gold"
            >
              {t('createAvatar')}
            </button>
          </div>
        </div>

        {user?.avatarUrl && user.avatarDisabled && (
          <p className="mb-4 text-sm text-brand-terracotta">{t('avatarDisabledMessage')}</p>
        )}

        {user?.avatarUrl ? (
          <AvatarViewer
            avatarUrl={user.avatarUrl}
            heightCm={user.heightCm}
            weightKg={user.weightKg}
            className="h-[420px] w-full overflow-hidden rounded-xl bg-background"
          />
        ) : (
          <p className="text-sm text-muted">{t('noAvatarYet')}</p>
        )}
      </section>
    </div>
  );
}
