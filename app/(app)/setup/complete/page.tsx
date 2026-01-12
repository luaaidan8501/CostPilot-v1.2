'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2Icon } from '@/components/icons';
import { usePosItems, useRecipes } from '@/lib/hooks';

export default function SetupCompletePage() {
  const router = useRouter();
  const { data: posItems } = usePosItems();
  const { data: recipes } = useRecipes();

  const completedRecipes = recipes.filter(r => posItems.find(p => p.id === r.posItemId)).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardContent className="text-center py-12">
          <div className="text-5xl mb-6 flex justify-center">
            <div className="text-teal-600">
              <CheckCircle2Icon className="w-16 h-16" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">All Set! 🎉</h1>
          
          <div className="space-y-2 mb-6 text-slate-600">
            <p><span className="font-semibold text-slate-900">{posItems.length}</span> menu items added</p>
            <p><span className="font-semibold text-slate-900">{completedRecipes}</span> recipes created</p>
            <p className="text-sm mt-4">You're ready to start logging purchases and tracking food costs!</p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => router.push('/dashboard')}
              className="w-full bg-teal-600 hover:bg-teal-700 h-10"
            >
              Go to Dashboard
            </Button>
            <Button 
              onClick={() => router.push('/purchases')}
              variant="outline"
              className="w-full h-10"
            >
              Log First Purchase
            </Button>
          </div>

          <p className="text-xs text-slate-500 mt-6">
            You can edit recipes and menu items anytime from the Recipes & POS page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
