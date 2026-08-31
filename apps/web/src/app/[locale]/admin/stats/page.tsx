'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiFetch } from '@/lib/api';
import { localize } from '@/lib/localized';
import type { DashboardStats, StatsPeriod } from '@/types';

const COLORS = ['#c96f4a', '#d4a24c', '#7a8f6b', '#5b7a9e', '#9e5b8a', '#8a8a8a'];
const PERIODS: StatsPeriod[] = ['day', 'week', 'month', 'year'];

export default function AdminStatsPage() {
  const t = useTranslations('stats');
  const tCommon = useTranslations('common');
  const tCatalog = useTranslations('catalog');
  const locale = useLocale();

  const [period, setPeriod] = useState<StatsPeriod>('month');
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    apiFetch<DashboardStats>(`/stats/dashboard?period=${period}`, { auth: true }).then(setStats);
  }, [period]);

  if (!stats) {
    return <p className="text-muted">{tCommon('loading')}</p>;
  }

  const conversionPercent = Math.round(stats.chatbotConversion.rate * 100);

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <select
          value={period}
          onChange={(event) => setPeriod(event.target.value as StatsPeriod)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
        >
          {PERIODS.map((value) => (
            <option key={value} value={value}>
              {t(`period.${value}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-muted">{t('totalRevenue')}</p>
          <p className="mt-1 text-2xl font-semibold">
            {stats.totalRevenue} {tCommon('currency')}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-muted">{t('totalOrders')}</p>
          <p className="mt-1 text-2xl font-semibold">{stats.totalOrders}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-muted">{t('chatbotConversion')}</p>
          <p className="mt-1 text-2xl font-semibold">{conversionPercent}%</p>
          <p className="text-xs text-muted">
            {t('converted', { count: stats.chatbotConversion.converted })} /{' '}
            {t('totalRecommendations', { count: stats.chatbotConversion.totalRecommendations })}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-muted">{t('returnsRequested')}</p>
          <p className="mt-1 text-2xl font-semibold">{stats.returnsStats.requestedCount}</p>
          <p className="text-xs text-muted">
            {t('returnsRefunded', { count: stats.returnsStats.completedCount })} — {stats.returnsStats.refundedAmount} {tCommon('currency')}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-muted">{t('reviewStats')}</p>
          <p className="mt-1 text-2xl font-semibold">{stats.reviewStats.avgRating.toFixed(1)} / 5</p>
          <p className="text-xs text-muted">{t('reviewCount', { count: stats.reviewStats.count })}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-muted">{t('outfitsCount')}</p>
          <p className="mt-1 text-2xl font-semibold">{stats.outfitsCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-muted">{t('tryOnUsage')}</p>
          <p className="mt-1 text-2xl font-semibold">{stats.tryOnUsageCount}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="mb-4 font-medium">{t('revenueByMonth')}</p>
        <div className="h-72 w-full">
          <ResponsiveContainer>
            <BarChart data={stats.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#c96f4a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="mb-4 font-medium">{t('popularSizes')}</p>
          {stats.popularSizes.length === 0 ? (
            <p className="text-sm text-muted">{t('noData')}</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer>
                <BarChart data={stats.popularSizes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="value" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#7a8f6b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="mb-4 font-medium">{t('popularColors')}</p>
          {stats.popularColors.length === 0 ? (
            <p className="text-sm text-muted">{t('noData')}</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer>
                <BarChart data={stats.popularColors}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="value" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#5b7a9e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="mb-4 font-medium">{t('salesByAudience')}</p>
          {stats.salesByAudience.length === 0 ? (
            <p className="text-sm text-muted">{t('noData')}</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={stats.salesByAudience}
                    dataKey="revenue"
                    nameKey="audience"
                    outerRadius={90}
                    label={(entry) => tCatalog(entry.name as unknown as Parameters<typeof tCatalog>[0])}
                  >
                    {stats.salesByAudience.map((entry, index) => (
                      <Cell key={entry.audience} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="mb-4 font-medium">{t('languageDistribution')}</p>
          {stats.languageDistribution.length === 0 ? (
            <p className="text-sm text-muted">{t('noData')}</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={stats.languageDistribution}
                    dataKey="count"
                    nameKey="language"
                    outerRadius={90}
                    label={(entry) => String(entry.name)}
                  >
                    {stats.languageDistribution.map((entry, index) => (
                      <Cell key={entry.language} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="overflow-x-auto rounded-xl border border-border bg-surface p-4">
          <p className="mb-4 font-medium">{t('topProducts')}</p>
          {stats.topProducts.length === 0 ? (
            <p className="text-sm text-muted">{t('noData')}</p>
          ) : (
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted">
                  <th className="p-2 text-start">{t('colProduct')}</th>
                  <th className="p-2 text-start">{t('colQuantity')}</th>
                  <th className="p-2 text-start">{t('colRevenue')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.map((product) => (
                  <tr key={product.productId} className="border-b border-border last:border-0">
                    <td className="p-2">{localize(product.name, locale)}</td>
                    <td className="p-2">{product.quantity}</td>
                    <td className="p-2">
                      {product.revenue} {tCommon('currency')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-surface p-4">
          <p className="mb-4 font-medium">{t('topCategories')}</p>
          {stats.topCategories.length === 0 ? (
            <p className="text-sm text-muted">{t('noData')}</p>
          ) : (
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted">
                  <th className="p-2 text-start">{t('colProduct')}</th>
                  <th className="p-2 text-start">{t('colQuantity')}</th>
                  <th className="p-2 text-start">{t('colRevenue')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.topCategories.map((category) => (
                  <tr key={category.type} className="border-b border-border last:border-0">
                    <td className="p-2">{tCatalog(category.type)}</td>
                    <td className="p-2">{category.quantity}</td>
                    <td className="p-2">
                      {category.revenue} {tCommon('currency')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
