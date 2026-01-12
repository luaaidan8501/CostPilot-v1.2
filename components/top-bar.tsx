'use client';

import { useRestaurant } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { CalendarIcon, LogOutIcon, Settings2Icon } from '@/components/icons';
import { useRouter } from 'next/navigation';
import { loadDemoRestaurant, unloadRestaurant } from '@/lib/db';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function TopBar() {
  const router = useRouter();
  const { data: restaurant } = useRestaurant();
  const { toast } = useToast();

  const handleLogout = () => {
    router.push('/login');
  };

  const handleToggleDemo = () => {
    if (restaurant?.name === 'Manila Bites Restaurant') {
      unloadRestaurant();
      toast({ title: 'Demo unloaded', description: 'Active restaurant cleared.' });
    } else {
      loadDemoRestaurant();
      toast({ title: 'Demo loaded', description: 'Manila Bites Restaurant activated.' });
    }
    router.refresh();
  };

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{restaurant?.name}</h1>
            <p className="text-sm text-slate-500">{restaurant?.region}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
            <CalendarIcon className="w-4 h-4 text-slate-600" />
            <Select defaultValue="30days">
              <SelectTrigger className="w-auto border-0 bg-transparent focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="ghost" size="icon" className="text-slate-600">
            <Settings2Icon className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-slate-600"
            onClick={handleLogout}
          >
            <LogOutIcon className="w-5 h-5" />
          </Button>

          {/* Debug panel (temporary, visible in UI) */}
          <div className="ml-4 text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 max-w-xs">
            <div className="text-slate-500 font-medium mb-1">Debug</div>
            <pre className="whitespace-pre-wrap max-h-20 overflow-auto text-[11px] text-slate-700 mb-1">{JSON.stringify(restaurant, null, 2)}</pre>
            <div className="space-y-1">
              <Button
                size="sm"
                variant="outline"
                className="w-full text-[11px] h-6"
                onClick={handleToggleDemo}
              >
                {restaurant?.name === 'Manila Bites Restaurant' ? 'Unload Demo' : 'Load Demo'}
              </Button>
              <a href="/api/debug/restaurant" className="text-teal-600 underline text-[11px] inline-block">/api/debug/restaurant</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
