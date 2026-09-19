'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/context/auth-context';

// Pages reachable without being logged in.
const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/verify-code', '/reset-password'];

// Sends visitors who aren't logged in to /login. Session tokens live in
// localStorage, so this has to be a client-side check rather than middleware.
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_PATHS.includes(pathname);
  const mustLogin = !isLoading && !user && !isPublic;

  useEffect(() => {
    if (mustLogin) router.replace('/login');
  }, [mustLogin, router]);

  // Hold back protected content while the session loads or the redirect happens.
  if (!isPublic && (isLoading || mustLogin)) return null;
  return <>{children}</>;
}
