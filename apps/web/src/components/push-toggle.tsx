'use client';

import { Bell, BellOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { getPushSubscription, isPushSupported, subscribeToPush, unsubscribeFromPush } from '@/lib/push';

export function PushToggle() {
  const t = useTranslations('push');
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSupported(isPushSupported());
    getPushSubscription()
      .then((subscription) => setSubscribed(Boolean(subscription)))
      .finally(() => setIsLoading(false));
  }, []);

  async function toggle() {
    setError(null);
    setIsLoading(true);
    try {
      if (subscribed) {
        await unsubscribeFromPush();
        setSubscribed(false);
      } else {
        await subscribeToPush();
        setSubscribed(true);
      }
    } catch {
      setError(t('error'));
    } finally {
      setIsLoading(false);
    }
  }

  if (!supported) {
    return null;
  }

  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
      {subscribed ? (
        <Bell className="h-5 w-5 text-brand-terracotta" />
      ) : (
        <BellOff className="h-5 w-5 text-muted" />
      )}
      <div className="flex-1">
        <p className="text-sm font-medium">{subscribed ? t('enabledTitle') : t('disabledTitle')}</p>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
      <Button variant="outline" size="sm" onClick={toggle} disabled={isLoading}>
        {isLoading ? <Spinner /> : subscribed ? t('disable') : t('enable')}
      </Button>
    </div>
  );
}
