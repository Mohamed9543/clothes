'use client';

import Image from 'next/image';
import { Heart } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { Look } from '@/types';

export function LookCard({ look }: { look: Look }) {
  return (
    <Link
      href={`/lookbook/${look._id}`}
      className="group block overflow-hidden rounded-xl border border-border bg-surface"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-background">
        <Image
          src={look.images[0]}
          alt={look.caption ?? look.authorName}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      </div>
      <div className="flex items-center justify-between p-3">
        <p className="truncate text-sm font-medium">{look.authorName}</p>
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
          <Heart className="h-3.5 w-3.5" fill={look.likeCount > 0 ? 'currentColor' : 'none'} />
          {look.likeCount}
        </span>
      </div>
    </Link>
  );
}
