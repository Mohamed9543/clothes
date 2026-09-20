'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';

// Password field with a show/hide (eye) toggle, styled like the plain inputs
// on the auth pages (login/register/reset-password).
export function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const t = useTranslations('auth');
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex items-center rounded-md border border-border bg-surface pe-1 focus-within:ring-1 focus-within:ring-brand-terracotta">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`w-full bg-transparent px-3 py-2 text-sm outline-none ${props.className ?? ''}`}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? t('hidePassword') : t('showPassword')}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-muted hover:text-foreground"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
