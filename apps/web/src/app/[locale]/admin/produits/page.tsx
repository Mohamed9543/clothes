'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { apiDownload, apiFetch, apiUpload } from '@/lib/api';
import { localize } from '@/lib/localized';
import { ProductForm } from '@/components/admin/product-form';
import { StockAdjustModal } from '@/components/admin/stock-adjust-modal';
import type { AdminProduct, ImportSummary, PaginatedResult } from '@/types';

export default function AdminProductsPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<AdminProduct | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProducts = useCallback(async () => {
    const result = await apiFetch<PaginatedResult<AdminProduct>>('/products/admin/all?limit=100', {
      auth: true,
    });
    setProducts(result.items);
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  async function handleExport() {
    await apiDownload('/products/admin/export', { auth: true, filename: 'produits.csv' });
  }

  async function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const summary = await apiUpload<ImportSummary>('/products/admin/import', formData, {
        auth: true,
      });
      setImportSummary(summary);
      void loadProducts();
    } finally {
      setIsImporting(false);
    }
  }

  async function toggleActive(product: AdminProduct) {
    await apiFetch(`/products/${product._id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ isActive: !product.isActive }),
    });
    void loadProducts();
  }

  async function handleDelete(product: AdminProduct) {
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
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <button
          onClick={handleExport}
          className="rounded-full border border-border px-6 py-2 text-sm font-medium hover:bg-background"
        >
          {t('exportCsv')}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          hidden
          onChange={handleImportFile}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="rounded-full border border-border px-6 py-2 text-sm font-medium hover:bg-background disabled:opacity-50"
        >
          {t('importCsv')}
        </button>
        <button
          onClick={() => setIsCreating(true)}
          className="rounded-full bg-brand-terracotta px-6 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {t('newProduct')}
        </button>
      </div>

      {importSummary && (
        <div className="mb-4 rounded-xl border border-border bg-surface p-4 text-sm">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-medium">{t('importResultTitle')}</p>
            <button onClick={() => setImportSummary(null)} className="text-muted underline">
              {t('close')}
            </button>
          </div>
          <p>{t('importCreated', { count: importSummary.created })}</p>
          <p>{t('importUpdated', { count: importSummary.updated })}</p>
          {importSummary.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-red-700">{t('importErrors', { count: importSummary.errors.length })}</p>
              <ul className="mt-1 list-inside list-disc text-red-700">
                {importSummary.errors.map((error) => (
                  <li key={error.row}>{t('importRowError', { row: error.row, message: error.message })}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-start text-sm">
          <thead>
            <tr className="border-b border-border text-start text-xs text-muted">
              <th className="p-3 text-start">{t('colName')}</th>
              <th className="p-3 text-start">{t('colPrice')}</th>
              <th className="p-3 text-start">{t('colAudience')}</th>
              <th className="p-3 text-start">{t('colType')}</th>
              <th className="p-3 text-start">{t('totalStock')}</th>
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
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      product.isOutOfStock
                        ? 'bg-red-100 text-red-800'
                        : product.isLowStock
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {product.totalStock}
                  </span>
                </td>
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
                  <button onClick={() => setAdjustingProduct(product)} className="underline">
                    {t('adjustStock')}
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

      {adjustingProduct && (
        <StockAdjustModal
          product={adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
          onAdjusted={loadProducts}
        />
      )}
    </div>
  );
}
