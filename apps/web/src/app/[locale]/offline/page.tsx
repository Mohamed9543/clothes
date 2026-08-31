import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function OfflinePage() {
  const t = await getTranslations('offline');

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="mt-2 text-2xl font-semibold">{t('title')}</h1>
      <p className="mt-2 text-muted">{t('text')}</p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-full bg-brand-terracotta px-6 py-3 text-sm font-medium text-white hover:opacity-90"
      >
        {t('backHome')}
      </Link>
    </div>
  );
}
