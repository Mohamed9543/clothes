'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { AUTH_PATHS } from '@/lib/auth-paths';

export function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const tBrand = useTranslations('brand');
  const year = new Date().getFullYear();
  const pathname = usePathname();

  if (AUTH_PATHS.includes(pathname)) {
    return null;
  }

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="text-lg font-semibold">{tBrand('name')}</p>
          <p className="mt-2 text-sm text-muted">{tBrand('tagline')}</p>
        </div>
        <div>
          <p className="font-medium">{t('about')}</p>
          <p className="mt-2 text-sm text-muted">{t('aboutText')}</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <Link href="/a-propos" className="hover:text-brand-terracotta">
            {tNav('about')}
          </Link>
          <span className="text-muted">{t('help')}</span>
          <span className="text-muted">{t('contact')}</span>
          <span className="text-muted">{t('terms')}</span>
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted">
        © {year} {tBrand('name')} — {t('rights')}
      </div>
    </footer>
  );
}
