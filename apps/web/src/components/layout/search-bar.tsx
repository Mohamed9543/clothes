'use client';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';

export function SearchBar() {
  const t = useTranslations('nav');
  const router = useRouter();
  const [value, setValue] = useState('');

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        router.push(value ? `/catalogue?search=${encodeURIComponent(value)}` : '/catalogue');
      }}
      className="relative hidden flex-1 max-w-md md:block"
    >
      <Search className="pointer-events-none absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t('searchPlaceholder')}
        className="w-full rounded-full border border-border bg-surface py-2 ps-9 pe-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
      />
    </form>
  );
}
