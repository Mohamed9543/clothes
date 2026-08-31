'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/context/auth-context';

const NAV_ITEMS = [
  { href: '/admin/produits', labelKey: 'tabProducts' },
  { href: '/admin/commandes', labelKey: 'tabOrders' },
  { href: '/admin/retours', labelKey: 'tabReturns' },
  { href: '/admin/avis', labelKey: 'tabReviews' },
  { href: '/admin/stats', labelKey: 'tabStats' },
  { href: '/admin/tenues', labelKey: 'tabOutfits' },
  { href: '/admin/promotions', labelKey: 'tabPromotions' },
  { href: '/admin/utilisateurs', labelKey: 'tabUsers' },
  { href: '/admin/modeles-3d', labelKey: 'tabModels3d' },
  { href: '/admin/audit-logs', labelKey: 'tabAuditLogs' },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('admin');
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return null;
  }

  if (!user) {
    return null;
  }

  if (user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="mb-4 text-muted">{t('accessDenied')}</p>
        <Link href="/" className="text-brand-terracotta underline">
          {t('backToSite')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">{t('title')}</h1>
      <div className="flex flex-col gap-8 md:flex-row">
        <nav className="flex shrink-0 flex-row gap-1 overflow-x-auto md:w-56 md:flex-col md:overflow-visible">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-brand-terracotta text-white'
                    : 'hover:bg-surface hover:text-brand-terracotta'
                }`}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
