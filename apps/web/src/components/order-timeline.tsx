'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { OrderStatusHistoryEntry } from '@/types';

interface OrderTimelineProps {
  entries: OrderStatusHistoryEntry[];
}

export function OrderTimeline({ entries }: OrderTimelineProps) {
  const tOrderStatus = useTranslations('orderStatus');
  const tAdmin = useTranslations('admin');
  const locale = useLocale();

  return (
    <ol className="space-y-3 border-s-2 border-border ps-4">
      {entries.map((entry) => (
        <li key={entry._id} className="relative">
          <span className="absolute -start-[1.375rem] top-1 h-2.5 w-2.5 rounded-full bg-brand-terracotta" />
          <p className="font-medium">{tOrderStatus(entry.toStatus)}</p>
          <p className="text-xs text-muted">
            {new Date(entry.createdAt).toLocaleString(locale)}
            {entry.changedBy ? ` — ${tAdmin('changedByAdmin')}` : ` — ${tAdmin('initialStatus')}`}
          </p>
        </li>
      ))}
    </ol>
  );
}
