'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiFetch, ApiError } from '@/lib/api';
import type { Order, ReturnType } from '@/types';

interface ReturnRequestFormProps {
  order: Order;
  onDone: () => void;
  onCancel: () => void;
}

export function ReturnRequestForm({ order, onDone, onCancel }: ReturnRequestFormProps) {
  const t = useTranslations('returns');

  const [type, setType] = useState<ReturnType>('return');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [exchangeSize, setExchangeSize] = useState('');
  const [exchangeColor, setExchangeColor] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedItem = order.items[selectedIndex];

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await apiFetch('/returns', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          orderId: order._id,
          type,
          reason,
          items: [
            {
              productId: selectedItem.productId,
              size: selectedItem.size,
              color: selectedItem.color,
              quantity,
              ...(type === 'exchange' ? { exchangeSize, exchangeColor } : {}),
            },
          ],
        }),
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('genericError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 rounded-lg border border-border bg-background p-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setType('return')}
          className={`rounded-md border px-3 py-2 text-sm ${type === 'return' ? 'border-brand-terracotta text-brand-terracotta' : 'border-border'}`}
        >
          {t('requestReturn')}
        </button>
        <button
          type="button"
          onClick={() => setType('exchange')}
          className={`rounded-md border px-3 py-2 text-sm ${type === 'exchange' ? 'border-brand-terracotta text-brand-terracotta' : 'border-border'}`}
        >
          {t('requestExchange')}
        </button>
      </div>

      <select
        value={selectedIndex}
        onChange={(e) => setSelectedIndex(Number(e.target.value))}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
      >
        {order.items.map((item, index) => (
          <option key={`${item.productId}-${item.size}-${item.color}`} value={index}>
            {item.size} / {item.color} (×{item.quantity})
          </option>
        ))}
      </select>

      <input
        type="number"
        min={1}
        max={selectedItem?.quantity ?? 1}
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        className="w-24 rounded-md border border-border bg-surface px-3 py-2 text-sm"
      />

      {type === 'exchange' && (
        <div className="grid grid-cols-2 gap-3">
          <input
            required
            placeholder={t('exchangeSize')}
            value={exchangeSize}
            onChange={(e) => setExchangeSize(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
          />
          <input
            required
            placeholder={t('exchangeColor')}
            value={exchangeColor}
            onChange={(e) => setExchangeColor(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>
      )}

      <textarea
        required
        placeholder={t('reason')}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
      />

      {error && <p className="text-sm text-brand-terracotta">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-brand-terracotta px-6 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {t('submit')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-border px-6 py-2 text-sm hover:border-brand-gold"
        >
          {t('cancel')}
        </button>
      </div>
    </form>
  );
}
