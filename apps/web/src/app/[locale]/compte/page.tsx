'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Gift, LogOut, Package, User as UserIcon } from 'lucide-react';
import { LOYALTY_TND_PER_POINT_REDEEMED } from '@libas/shared';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/context/auth-context';

export default function AccountPage() {
  const t = useTranslations('account');
  const tNav = useTranslations('nav');
  const tAvatar = useTranslations('avatar');
  const tAdmin = useTranslations('admin');
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  if (!authLoading && !user) {
    return null;
  }

  const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : '';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">{t('title')}</h1>

      {user && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-terracotta text-lg font-semibold text-white">
              {initials || <UserIcon className="h-6 w-6" />}
            </div>
            <div>
              <p className="font-medium">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-muted">{user.email}</p>
              {isAdmin && (
                <span className="mt-1 inline-block rounded-full bg-brand-terracotta/10 px-2 py-0.5 text-xs font-medium text-brand-terracotta">
                  {tAdmin('roleAdmin')}
                </span>
              )}
              {!isAdmin && (
                <Link
                  href="/avatar"
                  className="mt-1 inline-block text-sm text-brand-terracotta underline"
                >
                  {tAvatar('myAvatar')}
                </Link>
              )}
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-brand-gold"
          >
            <LogOut className="h-4 w-4" />
            {tNav('logout')}
          </button>
        </div>
      )}

      {user && !isAdmin && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
          <Gift className="h-5 w-5 text-brand-terracotta" />
          <div>
            <p className="text-sm font-medium">
              {t('loyaltyPoints', { points: user.loyaltyPoints })}
            </p>
            <p className="text-xs text-muted">
              {t('loyaltyPointsValue', {
                value: Math.round(user.loyaltyPoints * LOYALTY_TND_PER_POINT_REDEEMED * 100) / 100,
              })}
            </p>
          </div>
        </div>
      )}

      {isAdmin ? (
        <Link
          href="/admin"
          className="flex items-center gap-2 rounded-xl border border-border bg-surface p-4 text-sm font-medium hover:border-brand-gold"
        >
          <Package className="h-4 w-4" />
          {tAdmin('title')}
        </Link>
      ) : (
        <Link
          href="/commandes"
          className="flex items-center gap-2 rounded-xl border border-border bg-surface p-4 text-sm font-medium hover:border-brand-gold"
        >
          <Package className="h-4 w-4" />
          {t('myOrders')}
        </Link>
      )}
    </div>
  );
}
