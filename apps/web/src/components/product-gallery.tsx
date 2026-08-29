'use client';

import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import { useState } from 'react';

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [selected, setSelected] = useState(0);
  const current = images[selected];

  return (
    <div>
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-surface">
        {current ? (
          <Image
            src={current}
            alt={alt}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <ImageOff className="h-12 w-12" />
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image}
              onClick={() => setSelected(index)}
              className={`relative h-16 w-14 shrink-0 overflow-hidden rounded-lg border ${
                index === selected ? 'border-brand-terracotta' : 'border-border'
              }`}
            >
              <Image src={image} alt="" fill className="object-cover" sizes="56px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
