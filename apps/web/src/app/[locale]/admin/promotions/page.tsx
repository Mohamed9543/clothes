'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiFetch, ApiError } from '@/lib/api';
import type { Coupon, DiscountType } from '@/types';

export default function AdminPromotionsPage() {
  const t = useTranslations('admin');

  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('percent');
  const [value, setValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadCoupons = useCallback(async () => {
    const result = await apiFetch<Coupon[]>('/promotions/admin/all', { auth: true });
    setCoupons(result);
  }, []);

  useEffect(() => {
    void loadCoupons();
  }, [loadCoupons]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      await apiFetch('/promotions/admin', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          code,
          discountType,
          value: Number(value),
          minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
          expiresAt: expiresAt || undefined,
        }),
      });
      setCode('');
      setValue('');
      setMinOrderAmount('');
      setExpiresAt('');
      void loadCoupons();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('saveError'));
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive(coupon: Coupon) {
    await apiFetch(`/promotions/admin/${coupon._id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ isActive: !coupon.isActive }),
    });
    void loadCoupons();
  }

  async function handleDelete(coupon: Coupon) {
    if (!window.confirm(t('confirmDeleteCoupon'))) return;
    await apiFetch(`/promotions/admin/${coupon._id}`, { method: 'DELETE', auth: true });
    void loadCoupons();
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleCreate}
        className="space-y-3 rounded-xl border border-border bg-surface p-4"
      >
        <h2 className="font-medium">{t('newCoupon')}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            required
            placeholder={t('couponCode')}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as DiscountType)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="percent">{t('discountPercent')}</option>
            <option value="fixed">{t('discountFixed')}</option>
          </select>
          <input
            required
            type="number"
            min={0}
            step="0.01"
            placeholder={t('couponValue')}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="number"
            min={0}
            placeholder={t('minOrderAmount')}
            value={minOrderAmount}
            onChange={(e) => setMinOrderAmount(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="date"
            placeholder={t('expiresAt')}
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-sm text-brand-terracotta">{error}</p>}
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-full bg-brand-terracotta px-6 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {t('save')}
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-start text-sm">
          <thead>
            <tr className="border-b border-border text-start text-xs text-muted">
              <th className="p-3 text-start">{t('couponCode')}</th>
              <th className="p-3 text-start">{t('couponValue')}</th>
              <th className="p-3 text-start">{t('minOrderAmount')}</th>
              <th className="p-3 text-start">{t('colStatus')}</th>
              <th className="p-3 text-start">{t('colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {coupons?.map((coupon) => (
              <tr key={coupon._id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium">{coupon.code}</td>
                <td className="p-3">
                  {coupon.value}
                  {coupon.discountType === 'percent' ? '%' : ''}
                </td>
                <td className="p-3">{coupon.minOrderAmount}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {coupon.isActive ? t('statusActive') : t('statusInactive')}
                  </span>
                </td>
                <td className="space-x-2 rtl:space-x-reverse p-3 whitespace-nowrap">
                  <button onClick={() => toggleActive(coupon)} className="underline">
                    {coupon.isActive ? t('deactivate') : t('activate')}
                  </button>
                  <button onClick={() => handleDelete(coupon)} className="text-red-600 underline">
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
