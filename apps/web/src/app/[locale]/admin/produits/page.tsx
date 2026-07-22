'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api';
import { localize } from '@/lib/localized';
import { ProductForm } from '@/components/admin/product-form';
import type { PaginatedResult, Product } from '@/types';

export default function AdminProductsPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [products, setProducts] = useState<Product[] | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const loadProducts = useCallback(async () => {
    const result = await apiFetch<PaginatedResult<Product>>('/products/admin/all?limit=100', {
      auth: true,
    });
    setProducts(result.items);
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  async function toggleActive(product: Product) {
    await apiFetch(`/products/${product._id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ isActive: !product.isActive }),
    });
    void loadProducts();
  }

  async function handleDelete(product: Product) {
    if (!window.confirm(t('confirmDelete'))) return;
    await apiFetch(`/products/${product._id}`, { method: 'DELETE', auth: true });
    void loadProducts();
  }

  function handleSaved() {
    setIsCreating(false);
    setEditingProduct(null);
    void loadProducts();
  }

  if (isCreating) {
    return (
      <ProductForm onSaved={handleSaved} onCancel={() => setIsCreating(false)} />
    );
  }

  if (editingProduct) {
    return (
      <ProductForm
        product={editingProduct}
        onSaved={handleSaved}
        onCancel={() => setEditingProduct(null)}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setIsCreating(true)}
          className="rounded-full bg-brand-terracotta px-6 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {t('newProduct')}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-start text-sm">
          <thead>
            <tr className="border-b border-border text-start text-xs text-muted">
              <th className="p-3 text-start">{t('colName')}</th>
              <th className="p-3 text-start">{t('colPrice')}</th>
              <th className="p-3 text-start">{t('colAudience')}</th>
              <th className="p-3 text-start">{t('colType')}</th>
              <th className="p-3 text-start">{t('colStock')}</th>
              <th className="p-3 text-start">{t('colStatus')}</th>
              <th className="p-3 text-start">{t('colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {products?.map((product) => (
              <tr key={product._id} className="border-b border-border last:border-0">
                <td className="p-3">{localize(product.name, locale)}</td>
                <td className="p-3">
                  {product.price} {tCommon('currency')}
                </td>
                <td className="p-3">{product.audience}</td>
                <td className="p-3">{product.type}</td>
                <td className="p-3">{product.stock}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      product.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {product.isActive ? t('statusActive') : t('statusInactive')}
                  </span>
                </td>
                <td className="space-x-2 rtl:space-x-reverse p-3 whitespace-nowrap">
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="text-brand-terracotta underline"
                  >
                    {t('edit')}
                  </button>
                  <button onClick={() => toggleActive(product)} className="underline">
                    {product.isActive ? t('deactivate') : t('activate')}
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    className="text-red-600 underline"
                  >
                    {t('delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
