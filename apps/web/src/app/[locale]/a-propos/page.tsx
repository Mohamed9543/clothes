import { getTranslations } from 'next-intl/server';

export default async function AboutPage() {
  const t = await getTranslations('about');

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">{t('title')}</h1>
      <p className="mb-4 text-muted">{t('text1')}</p>
      <p className="text-muted">{t('text2')}</p>
    </div>
  );
}
