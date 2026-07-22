'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from '@/i18n/navigation';

export function AdminRedirect() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user?.role === 'admin') {
      router.replace('/admin');
    }
  }, [isLoading, user, router]);

  return null;
}
