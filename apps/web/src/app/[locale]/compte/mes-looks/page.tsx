'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/context/auth-context';
import { apiFetch } from '@/lib/api';
import { SubmitLookForm } from '@/components/lookbook/submit-look-form';
import type { Look } from '@/types';

export default function MyLooksPage() {
  const t = useTranslations('lookbook');
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [looks, setLooks] = useState<Look[] | null>(null);

  const loadLooks = useCallback(async () => {
    const result = await apiFetch<Look[]>('/looks/mine', { auth: true });
    setLooks(result);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) void loadLooks();
  }, [user, loadLooks]);

  if (!authLoading && !user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">{t('myLooksTitle')}</h1>

      <div className="mb-8">
        <SubmitLookForm onSubmitted={loadLooks} />
      </div>

      {looks?.length === 0 && <p className="text-sm text-muted">{t('noLooksMine')}</p>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {looks?.map((look) => (
          <div key={look._id} className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="relative aspect-[3/4] overflow-hidden bg-background">
              <Image src={look.images[0]} alt={look.caption ?? ''} fill className="object-cover" />
            </div>
            <div className="p-3 text-sm">
              <p className="text-muted">{t('likesCount', { count: look.likeCount })}</p>
              <p className={look.isHidden ? 'text-muted' : 'text-green-700'}>
                {look.isHidden ? t('statusHidden') : t('statusVisible')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
