'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboardIcon,
  PackageIcon,
  ShoppingCartIcon,
  UtensilsCrossedIcon,
  TrendingUpIcon,
  BellIcon,
  SettingsIcon,
  ChefHatIcon,
} from '@/components/icons';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
  { href: '/ingredients', label: 'Ingredients', icon: PackageIcon },
  { href: '/purchases', label: 'Purchases', icon: ShoppingCartIcon },
  { href: '/recipes-pos', label: 'Recipes & POS', icon: UtensilsCrossedIcon },
  { href: '/analytics', label: 'Analytics', icon: TrendingUpIcon },
  { href: '/alerts', label: 'Alerts', icon: BellIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function Sidebar() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <aside className="w-64 bg-slate-900 text-white h-full flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-lg">
            <div className="p-2 bg-teal-600 rounded-lg">
              <ChefHatIcon className="w-5 h-5" />
            </div>
            CostPilot
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-slate-900 text-white h-full flex flex-col border-r border-slate-800">
      <div className="p-6 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <div className="p-2 bg-teal-600 rounded-lg">
            <ChefHatIcon className="w-5 h-5" />
          </div>
          CostPilot
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="px-4 py-3 bg-slate-800 rounded-lg text-sm">
          <p className="text-slate-400">Signed in as</p>
          <p className="font-medium text-white">Manila Bites Restaurant</p>
        </div>
      </div>
    </aside>
  );
}
