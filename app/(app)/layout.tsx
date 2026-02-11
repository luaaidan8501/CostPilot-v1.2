'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/top-bar';
import { useSetupComplete } from '@/lib/hooks';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const setupComplete = useSetupComplete();

  useEffect(() => {
    if (setupComplete) return;
    const allowedPaths = new Set([
      '/onboarding',
      '/setup/menu',
      '/setup/recipes',
      '/setup/complete',
    ]);
    if (!allowedPaths.has(pathname)) {
      router.replace('/setup/menu');
    }
  }, [pathname, router, setupComplete]);

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
