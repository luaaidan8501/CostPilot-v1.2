'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DishCostsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/recipes-pos');
  }, [router]);

  return null;
}
