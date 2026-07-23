'use client';

import { ShoppingBag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { Link } from '@/i18n/navigation';
import { AccountMenu } from './account-menu';
import { LocaleSwitcher } from './locale-switcher';
import { SearchBar } from './search-bar';
import { ThemeToggle } from './theme-toggle';

export function Navbar() {
  const t = useTranslations('nav');
  const tBrand = useTranslations('brand');
  const { user } = useAuth();
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        {user?.role !== 'admin' && (
          <Link href="/" className="shrink-0 text-xl font-semibold tracking-tight text-foreground">
            {tBrand('name')}
          </Link>
        )}

        <nav className="hidden items-center gap-5 text-sm font-medium md:flex">
          {user?.role === 'admin' ? (
            <Link
              href="/admin"
              className="shrink-0 text-xl font-semibold tracking-tight text-foreground hover:text-brand-terracotta"
            >
              {t('admin')}
            </Link>
          ) : (
            <>
              <Link href="/catalogue" className="hover:text-brand-terracotta">
                {t('catalog')}
              </Link>
              <Link href="/a-propos" className="hover:text-brand-terracotta">
                {t('about')}
              </Link>
            </>
          )}
        </nav>

        {user?.role !== 'admin' && <SearchBar />}

        <div className="ms-auto flex items-center gap-3">
          <ThemeToggle />
          <LocaleSwitcher />

          {user?.role !== 'admin' && (
            <Link
              href="/panier"
              className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-background"
              aria-label={t('cart')}
            >
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-terracotta px-1 text-[10px] font-semibold text-white">
                  {itemCount}
                </span>
              )}
            </Link>
          )}

          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
