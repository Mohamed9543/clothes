'use client';

import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/cn';

export function LikeButton({ lookId, initialLikeCount }: { lookId: string; initialLikeCount: number }) {
  const t = useTranslations('lookbook');
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    apiFetch<{ liked: boolean }>(`/looks/${lookId}/like-status`, { auth: true })
      .then((result) => {
        if (!cancelled) setLiked(result.liked);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [lookId, user]);

  async function toggle() {
    if (!user || isLoading) return;
    setIsLoading(true);
    try {
      const result = await apiFetch<{ liked: boolean; likeCount: number }>(`/looks/${lookId}/like`, {
        method: 'POST',
        auth: true,
      });
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={!user || isLoading}
      aria-label={t('like')}
      className={cn(
        'flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-brand-gold disabled:opacity-50',
        liked && 'border-brand-terracotta text-brand-terracotta',
      )}
    >
      <Heart className="h-4 w-4" fill={liked ? 'currentColor' : 'none'} />
      {likeCount}
    </button>
  );
}
