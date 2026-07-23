'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { User as UserIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/context/auth-context';

export function AccountMenu() {
  const t = useTranslations('nav');
  const tAuth = useTranslations('auth');
  const tAdmin = useTranslations('admin');
  const tAvatar = useTranslations('avatar');
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen((value) => !value)}
        className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-background"
        aria-label={t('account')}
        aria-expanded={isOpen}
      >
        <UserIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute end-0 top-11 z-50 w-48 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg">
          {user ? (
            <>
              <Link
                href="/compte"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-sm hover:bg-background"
              >
                {t('account')}
              </Link>
              {user.role === 'admin' ? (
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 text-sm hover:bg-background"
                >
                  {tAdmin('title')}
                </Link>
              ) : (
                <Link
                  href="/avatar"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 text-sm hover:bg-background"
                >
                  {tAvatar('myAvatar')}
                </Link>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  void logout();
                }}
                className="block w-full px-4 py-2 text-start text-sm text-brand-terracotta hover:bg-background"
              >
                {t('logout')}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-sm hover:bg-background"
              >
                {tAuth('signIn')}
              </Link>
              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-sm hover:bg-background"
              >
                {tAuth('createAccount')}
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
