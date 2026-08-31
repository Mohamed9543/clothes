import Image from 'next/image';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { AdminRedirect } from '@/components/admin-redirect';
import { ProductCard } from '@/components/product-card';
import { OutfitCard } from '@/components/outfit-card';
import { serverApiFetch } from '@/lib/server-api';
import { buildAlternates } from '@/lib/seo';
import type { Outfit, PaginatedResult, Product } from '@/types';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  return {
    title: t('heroTitle'),
    description: t('heroSubtitle'),
    alternates: buildAlternates(locale, '/'),
  };
}

export default async function HomePage() {
  const t = await getTranslations('home');
  const featured = await serverApiFetch<PaginatedResult<Product>>('/products?limit=8');
  const outfits = await serverApiFetch<Outfit[]>('/outfits/featured');

  return (
    <div>
      <AdminRedirect />
      <section className="relative overflow-hidden border-b border-border">
        <Image
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {t('heroTitle')}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/80">{t('heroSubtitle')}</p>
          <Link
            href="/catalogue"
            className="mt-8 inline-block rounded-full bg-brand-terracotta px-6 py-3 text-sm font-medium text-white hover:opacity-90"
          >
            {t('heroCta')}
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-xl font-semibold">{t('categoriesTitle')}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(
            [
              { href: '/catalogue?audience=men', label: t('categoryMen') },
              { href: '/catalogue?audience=women', label: t('categoryWomen') },
              { href: '/catalogue?audience=kids', label: t('categoryKids') },
            ] as const
          ).map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className="flex h-32 items-center justify-center rounded-xl border border-border bg-surface text-lg font-medium hover:border-brand-gold"
            >
              {category.label}
            </Link>
          ))}
        </div>
      </section>

      {outfits && outfits.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-12">
          <h2 className="mb-6 text-xl font-semibold">{t('outfitsTitle')}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {outfits.map((outfit) => (
              <OutfitCard key={outfit._id} outfit={outfit} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="mb-6 text-xl font-semibold">{t('featuredTitle')}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featured?.items.map((product) => <ProductCard key={product._id} product={product} />)}
        </div>
      </section>
    </div>
  );
}
