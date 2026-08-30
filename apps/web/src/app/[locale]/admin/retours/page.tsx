'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api';
import type { ReturnRequest, ReturnStatus } from '@/types';

const STATUSES: ReturnStatus[] = [
  'requested',
  'accepted',
  'return_shipped',
  'received',
  'completed',
  'rejected',
];

export default function AdminReturnsPage() {
  const t = useTranslations('admin');
  const tReturns = useTranslations('returns');
  const locale = useLocale();

  const [returns, setReturns] = useState<ReturnRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadReturns = useCallback(async () => {
    const result = await apiFetch<ReturnRequest[]>('/returns/admin/all', { auth: true });
    setReturns(result);
  }, []);

  useEffect(() => {
    void loadReturns();
  }, [loadReturns]);

  async function updateStatus(ret: ReturnRequest, status: ReturnStatus) {
    setError(null);
    try {
      await apiFetch(`/returns/admin/${ret._id}/status`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({ status }),
      });
      void loadReturns();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveError'));
    }
  }

  if (returns?.length === 0) {
    return <p className="text-muted">{tReturns('empty')}</p>;
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-brand-terracotta">{error}</p>}
      {returns?.map((ret) => (
        <div key={ret._id} className="rounded-xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium">
                {ret.type === 'return' ? tReturns('requestReturn') : tReturns('requestExchange')} — #
                {ret._id.slice(-6)}
              </p>
              <p className="text-sm text-muted">
                {t('colOrder')} #{ret.orderId.slice(-6)}
              </p>
              <p className="text-sm text-muted">
                {new Date(ret.createdAt).toLocaleDateString(locale)}
              </p>
            </div>
            <select
              value={ret.status}
              onChange={(event) => updateStatus(ret, event.target.value as ReturnStatus)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {tReturns(`status.${status}`)}
                </option>
              ))}
            </select>
          </div>

          <ul className="mt-3 space-y-1 text-sm">
            {ret.items.map((item, index) => (
              <li key={index}>
                {item.quantity} × {item.size} / {item.color}
                {item.exchangeSize && ` → ${item.exchangeSize} / ${item.exchangeColor}`}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-muted">{ret.reason}</p>
          {ret.refundAmount != null && (
            <p className="mt-2 text-sm font-medium text-green-700">
              {tReturns('refundAmount')}: {ret.refundAmount}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
