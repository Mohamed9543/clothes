'use client';

import { useLocale } from 'next-intl';
import { routing, type Locale } from '@/i18n/routing';
import { usePathname, useRouter } from '@/i18n/navigation';

const LABELS: Record<Locale, string> = {
  ar: 'العربية',
  tn: 'تونسي',
  fr: 'Français',
  en: 'English',
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <select
      aria-label="Language"
      value={locale}
      onChange={(event) => {
        const nextLocale = event.target.value as Locale;
        router.replace(pathname, { locale: nextLocale });
      }}
      className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
    >
      {routing.locales.map((value) => (
        <option key={value} value={value}>
          {LABELS[value]}
        </option>
      ))}
    </select>
  );
}
