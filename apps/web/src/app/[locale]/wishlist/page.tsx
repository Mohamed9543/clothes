'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/context/auth-context';
import { useWishlist } from '@/context/wishlist-context';
import { ProductCard } from '@/components/product-card';
import { apiFetch } from '@/lib/api';
import type { Product, Wishlist } from '@/types';

export default function WishlistPage() {
  const t = useTranslations('wishlist');
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { lists, removeFromList, createList } = useWishlist();

  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const activeList: Wishlist | undefined =
    lists.find((list) => list._id === activeListId) ?? lists.find((list) => list.isDefault) ?? lists[0];

  useEffect(() => {
    if (!activeList || activeList.productIds.length === 0) {
      setProducts({});
      return;
    }
    let cancelled = false;
    apiFetch<Product[]>(`/products/by-ids?ids=${activeList.productIds.join(',')}`).then((items) => {
      if (cancelled) return;
      const map: Record<string, Product> = {};
      for (const product of items) map[product._id] = product;
      setProducts(map);
    });
    return () => {
      cancelled = true;
    };
  }, [activeList]);

  if (!authLoading && !user) {
    return null;
  }

  async function handleCreateList(event: React.FormEvent) {
    event.preventDefault();
    if (!newListName.trim()) return;
    setIsCreating(true);
    try {
      await createList(newListName.trim());
      setNewListName('');
    } finally {
      setIsCreating(false);
    }
  }

  const items = activeList ? activeList.productIds.map((id) => products[id]).filter(Boolean) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">{t('title')}</h1>

      {lists.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {lists.map((list) => (
            <button
              key={list._id}
              onClick={() => setActiveListId(list._id)}
              className={`rounded-full border px-3 py-1 text-sm ${
                activeList?._id === list._id
                  ? 'border-brand-terracotta text-brand-terracotta'
                  : 'border-border'
              }`}
            >
              {list.name}
            </button>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="mb-4 text-muted">{t('empty')}</p>
          <Link href="/catalogue" className="text-brand-terracotta underline">
            {t('browseCatalog')}
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {items.map((product) => (
            <div key={product._id} className="relative">
              <ProductCard product={product} />
              <button
                onClick={() => activeList && void removeFromList(activeList._id, product._id)}
                className="mt-2 w-full text-center text-xs text-brand-terracotta underline"
              >
                {t('remove')}
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleCreateList} className="mt-10 flex max-w-sm gap-2">
        <input
          value={newListName}
          onChange={(event) => setNewListName(event.target.value)}
          placeholder={t('newListPlaceholder')}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isCreating}
          className="shrink-0 rounded-md border border-border px-4 py-2 text-sm hover:border-brand-gold disabled:opacity-50"
        >
          {t('createList')}
        </button>
      </form>
    </div>
  );
}
