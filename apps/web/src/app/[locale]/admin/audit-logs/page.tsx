'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api';
import type { AuditLogEntry, PaginatedResult } from '@/types';

export default function AdminAuditLogsPage() {
  const t = useTranslations('auditLogs');
  const locale = useLocale();

  const [result, setResult] = useState<PaginatedResult<AuditLogEntry> | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    apiFetch<PaginatedResult<AuditLogEntry>>(`/audit-logs/admin/all?page=${page}&limit=50`, {
      auth: true,
    }).then(setResult);
  }, [page]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>

      {result?.items.length === 0 && <p className="text-muted">{t('empty')}</p>}

      {result && result.items.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                <th className="p-3 text-start">{t('colAdmin')}</th>
                <th className="p-3 text-start">{t('colAction')}</th>
                <th className="p-3 text-start">{t('colTarget')}</th>
                <th className="p-3 text-start">{t('colDate')}</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((log) => (
                <tr key={log._id} className="border-b border-border last:border-0">
                  <td className="p-3">{log.adminName}</td>
                  <td className="p-3">{log.action}</td>
                  <td className="p-3">
                    {log.targetType} #{log.targetId.slice(-6)}
                    {log.details && <span className="text-muted"> — {log.details}</span>}
                  </td>
                  <td className="p-3">{new Date(log.createdAt).toLocaleString(locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result && result.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-border px-3 py-1 disabled:opacity-40"
          >
            {t('previous')}
          </button>
          <span className="text-muted">
            {page} / {result.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(result.totalPages, p + 1))}
            disabled={page >= result.totalPages}
            className="rounded-md border border-border px-3 py-1 disabled:opacity-40"
          >
            {t('next')}
          </button>
        </div>
      )}
    </div>
  );
}
