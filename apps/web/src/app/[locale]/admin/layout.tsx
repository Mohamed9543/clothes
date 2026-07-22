'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/context/auth-context';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('admin');
  const router = useRouter();
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
      <nav className="mb-8 flex gap-4 border-b border-border">
        <Link
          href="/admin/produits"
          className="border-b-2 border-transparent px-1 pb-3 text-sm font-medium hover:border-brand-gold"
        >
          {t('tabProducts')}
        </Link>
        <Link
          href="/admin/commandes"
          className="border-b-2 border-transparent px-1 pb-3 text-sm font-medium hover:border-brand-gold"
        >
          {t('tabOrders')}
        </Link>
        <Link
          href="/admin/avis"
          className="border-b-2 border-transparent px-1 pb-3 text-sm font-medium hover:border-brand-gold"
        >
          {t('tabReviews')}
        </Link>
      </nav>
      {children}
    </div>
  );
}
