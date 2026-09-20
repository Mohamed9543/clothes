'use client';

import { Heart, ShoppingBag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { Link, usePathname } from '@/i18n/navigation';
import { AUTH_PATHS } from '@/lib/auth-paths';
import { AccountMenu } from './account-menu';
import { LocaleSwitcher } from './locale-switcher';
import { NotificationBell } from './notification-bell';
import { SearchBar } from './search-bar';
import { ThemeToggle } from './theme-toggle';

export function Navbar() {
  const t = useTranslations('nav');
  const tBrand = useTranslations('brand');
  const { user } = useAuth();
  const { itemCount } = useCart();
  const { defaultList } = useWishlist();
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.includes(pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        {user?.role !== 'admin' && (
          <Link href="/" className="shrink-0 text-xl font-semibold tracking-tight text-foreground">
            {tBrand('name')}
          </Link>
        )}

        {!isAuthPage && (
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
                <Link href="/lookbook" className="hover:text-brand-terracotta">
                  {t('lookbook')}
                </Link>
                <Link href="/a-propos" className="hover:text-brand-terracotta">
                  {t('about')}
                </Link>
              </>
            )}
          </nav>
        )}

        {!isAuthPage && user?.role !== 'admin' && <SearchBar />}

        <div className="ms-auto flex items-center gap-3">
          <ThemeToggle />
          <LocaleSwitcher />

          {!isAuthPage && user?.role !== 'admin' && (
            <Link
              href="/wishlist"
              className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-background"
              aria-label={t('wishlist')}
            >
              <Heart className="h-5 w-5" />
              {(defaultList?.productIds.length ?? 0) > 0 && (
                <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-terracotta px-1 text-[10px] font-semibold text-white">
                  {defaultList?.productIds.length}
                </span>
              )}
            </Link>
          )}

          {!isAuthPage && user?.role !== 'admin' && (
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

          {!isAuthPage && (
            <>
              <NotificationBell />
              <AccountMenu />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
