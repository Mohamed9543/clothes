'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/produits');
  }, [router]);

  return null;
}
