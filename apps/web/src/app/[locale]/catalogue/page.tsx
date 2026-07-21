'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { ProductCard } from '@/components/product-card';
import { API_URL } from '@/lib/server-api';
import type { PaginatedResult, Product, ProductAudience, ProductType } from '@/types';

const AUDIENCES: ProductAudience[] = ['men', 'women', 'kids'];
const TYPES: ProductType[] = [
  'pull',
  'pantalon',
  'chemise',
  'robe',
  'veste',
  'chaussure',
  'accessoire',
];

export default function CataloguePage() {
  const t = useTranslations('catalog');
  const router = useRouter();
  const searchParams = useSearchParams();

  const audience = searchParams.get('audience') ?? '';
  const type = searchParams.get('type') ?? '';
  const search = searchParams.get('search') ?? '';
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') ?? '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') ?? '');

  const [result, setResult] = useState<PaginatedResult<Product> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (audience) params.set('audience', audience);
    if (type) params.set('type', type);
    if (search) params.set('search', search);
    if (searchParams.get('minPrice')) params.set('minPrice', searchParams.get('minPrice')!);
    if (searchParams.get('maxPrice')) params.set('maxPrice', searchParams.get('maxPrice')!);
    return params.toString();
  }, [audience, type, search, searchParams]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetch(`${API_URL}/products?${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/catalogue?${params.toString()}`);
  }

  function applyPriceRange() {
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set('minPrice', minPrice);
    else params.delete('minPrice');
    if (maxPrice) params.set('maxPrice', maxPrice);
    else params.delete('maxPrice');
    router.push(`/catalogue?${params.toString()}`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">{t('title')}</h1>

      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <aside className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-medium">{t('audience')}</p>
            <div className="flex flex-wrap gap-2 md:flex-col">
              <button
                onClick={() => updateParam('audience', '')}
                className={`rounded-full border px-3 py-1 text-sm md:text-start ${audience === '' ? 'border-brand-terracotta text-brand-terracotta' : 'border-border'}`}
              >
                {t('all')}
              </button>
              {AUDIENCES.map((value) => (
                <button
                  key={value}
                  onClick={() => updateParam('audience', value)}
                  className={`rounded-full border px-3 py-1 text-sm md:text-start ${audience === value ? 'border-brand-terracotta text-brand-terracotta' : 'border-border'}`}
                >
                  {t(value)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">{t('type')}</p>
            <div className="flex flex-wrap gap-2 md:flex-col">
              <button
                onClick={() => updateParam('type', '')}
                className={`rounded-full border px-3 py-1 text-sm md:text-start ${type === '' ? 'border-brand-terracotta text-brand-terracotta' : 'border-border'}`}
              >
                {t('all')}
              </button>
              {TYPES.map((value) => (
                <button
                  key={value}
                  onClick={() => updateParam('type', value)}
                  className={`rounded-full border px-3 py-1 text-sm md:text-start ${type === value ? 'border-brand-terracotta text-brand-terracotta' : 'border-border'}`}
                >
                  {t(value)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">{t('priceRange')}</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                placeholder={t('minPrice')}
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                className="w-20 rounded-md border border-border bg-surface px-2 py-1 text-sm"
              />
              <span>-</span>
              <input
                type="number"
                min={0}
                placeholder={t('maxPrice')}
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                className="w-20 rounded-md border border-border bg-surface px-2 py-1 text-sm"
              />
            </div>
            <div className="mt-2 flex gap-2">
              <button
                onClick={applyPriceRange}
                className="rounded-md bg-brand-terracotta px-3 py-1 text-sm text-white"
              >
                {t('apply')}
              </button>
              <button
                onClick={() => {
                  setMinPrice('');
                  setMaxPrice('');
                  router.push('/catalogue');
                }}
                className="rounded-md border border-border px-3 py-1 text-sm"
              >
                {t('reset')}
              </button>
            </div>
          </div>
        </aside>

        <div>
          {!isLoading && (
            <p className="mb-4 text-sm text-muted">
              {t('resultsCount', { count: result?.total ?? 0 })}
            </p>
          )}

          {!isLoading && result?.items.length === 0 && (
            <p className="text-sm text-muted">{t('noResults')}</p>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {result?.items.map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
