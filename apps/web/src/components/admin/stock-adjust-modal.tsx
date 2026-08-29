'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import type { Product, StockMovement, StockMovementReason } from '@/types';

const REASONS: StockMovementReason[] = ['restock', 'correction', 'damage'];

interface StockAdjustModalProps {
  product: Product;
  onClose: () => void;
  onAdjusted: () => void;
}

export function StockAdjustModal({ product, onClose, onAdjusted }: StockAdjustModalProps) {
  const t = useTranslations('admin');
  const locale = useLocale();

  const [selectedSku, setSelectedSku] = useState(product.variants[0]?.sku ?? '');
  const [quantityChange, setQuantityChange] = useState('');
  const [reason, setReason] = useState<StockMovementReason>('restock');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<StockMovement[] | null>(null);

  useEffect(() => {
    apiFetch<StockMovement[]>(`/products/${product._id}/stock-movements`, { auth: true }).then(
      setHistory,
    );
  }, [product._id]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const variant = product.variants.find((v) => v.sku === selectedSku);
    if (!variant) {
      setError(t('saveError'));
      return;
    }
    setIsSaving(true);
    try {
      await apiFetch(`/products/${product._id}/stock-adjust`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({
          size: variant.size,
          color: variant.color,
          quantityChange: Number(quantityChange),
          reason,
          note: note || undefined,
        }),
      });
      setQuantityChange('');
      setNote('');
      const updated = await apiFetch<StockMovement[]>(
        `/products/${product._id}/stock-movements`,
        { auth: true },
      );
      setHistory(updated);
      onAdjusted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('saveError'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-surface p-4">
        <button onClick={onClose} aria-label={t('close')} className="absolute end-4 top-4">
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-4 font-medium">{t('adjustStockTitle')}</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted">{t('selectSize')}</label>
            <select
              value={selectedSku}
              onChange={(e) => setSelectedSku(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {product.variants.map((variant) => (
                <option key={variant.sku} value={variant.sku}>
                  {variant.size} / {variant.color} ({variant.stock})
                </option>
              ))}
            </select>
          </div>

          <input
            required
            type="number"
            placeholder={t('quantityChange')}
            value={quantityChange}
            onChange={(e) => setQuantityChange(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />

          <div>
            <label className="mb-1 block text-xs text-muted">{t('reason')}</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as StockMovementReason)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {t(`reason${r.charAt(0).toUpperCase()}${r.slice(1)}` as 'reasonRestock')}
                </option>
              ))}
            </select>
          </div>

          <input
            placeholder={t('note')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />

          {error && <p className="text-sm text-brand-terracotta">{error}</p>}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-full bg-brand-terracotta px-6 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {t('adjustStock')}
          </button>
        </form>

        <h3 className="mb-2 mt-6 text-sm font-medium">{t('history')}</h3>
        {history?.length === 0 && <p className="text-sm text-muted">{t('noHistory')}</p>}
        <ul className="space-y-2 text-sm">
          {history?.map((movement) => (
            <li key={movement._id} className="rounded-md border border-border p-2">
              <div className="flex justify-between">
                <span>
                  {movement.size}
                  {movement.color ? ` / ${movement.color}` : ''} ·{' '}
                  {t(
                    `reason${movement.reason.charAt(0).toUpperCase()}${movement.reason.slice(1)}` as 'reasonRestock',
                  )}
                </span>
                <span className={movement.quantityChange < 0 ? 'text-red-600' : 'text-green-700'}>
                  {movement.quantityChange > 0 ? '+' : ''}
                  {movement.quantityChange}
                </span>
              </div>
              <div className="text-xs text-muted">
                {new Date(movement.createdAt).toLocaleString(locale)}
                {movement.note ? ` — ${movement.note}` : ''}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
