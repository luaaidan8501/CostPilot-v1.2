'use client';

import { useRestaurant } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { CalendarIcon, LogOutIcon, Settings2Icon } from '@/components/icons';
import { useRouter } from 'next/navigation';
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

  const handleLogout = () => {
    router.push('/login');
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
        </div>
      </div>
    </div>
  );
}
