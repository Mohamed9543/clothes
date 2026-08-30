'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/context/auth-context';
import { apiFetch } from '@/lib/api';
import type { AppNotification } from '@/types';

const POLL_INTERVAL_MS = 30000;

export function NotificationBell() {
  const t = useTranslations('notifications');
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    async function refreshCount() {
      const result = await apiFetch<{ count: number }>('/notifications/unread-count', { auth: true });
      setUnreadCount(result.count);
    }

    void refreshCount();
    const interval = setInterval(refreshCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user]);

  async function handleOpen() {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      const result = await apiFetch<AppNotification[]>('/notifications', { auth: true });
      setNotifications(result);
    }
  }

  async function handleClickNotification(notification: AppNotification) {
    if (!notification.isRead) {
      await apiFetch(`/notifications/${notification._id}/read`, { method: 'PATCH', auth: true });
      setUnreadCount((count) => Math.max(0, count - 1));
    }
    setIsOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  }

  async function handleMarkAllRead() {
    await apiFetch('/notifications/read-all', { method: 'PATCH', auth: true });
    setNotifications((current) => current.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        aria-label={t('title')}
        className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-background"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-terracotta px-1 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute end-0 top-11 z-50 w-80 rounded-xl border border-border bg-surface shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <p className="text-sm font-medium">{t('title')}</p>
            <button onClick={handleMarkAllRead} className="text-xs text-brand-terracotta underline">
              {t('markAllRead')}
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="p-4 text-sm text-muted">{t('empty')}</p>
            )}
            {notifications.map((notification) => (
              <button
                key={notification._id}
                onClick={() => handleClickNotification(notification)}
                className={`block w-full border-b border-border px-4 py-3 text-start text-sm last:border-0 hover:bg-background ${
                  notification.isRead ? 'text-muted' : 'font-medium'
                }`}
              >
                <p>{notification.message}</p>
                <p className="mt-1 text-xs text-muted">
                  {new Date(notification.createdAt).toLocaleString(locale)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
