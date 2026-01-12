'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHatIcon, CheckCircle2Icon } from '@/components/icons';
import { useSaveRestaurant } from '@/lib/hooks';
import { useToast } from '@/components/ui/use-toast';

const philippineRegions = [
  'NCR',
  'CALABARZON',
  'MIMAROPA',
  'Bicol Region',
  'Western Visayas',
  'Central Visayas',
  'Eastern Visayas',
  'Zamboanga Peninsula',
  'Northern Mindanao',
  'Davao Region',
  'SOCCSKSARGEN',
  'CARAGA',
  'Autonomous Region in Muslim Mindanao',
  'Cordillera Administrative Region',
  'Ilocos Region',
  'Cagayan Valley',
];

const cuisineTypes = [
  'Filipino',
  'Asian Fusion',
  'Fast Casual',
  'Fine Dining',
  'Seafood',
  'Barbecue',
  'Vegetarian',
  'Other',
];

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    restaurantName: '',
    seatingCapacity: '',
    region: '',
    city: '',
    cuisine: '',
    targetFoodCost: '',
    minFoodCost: '',
    maxFoodCost: '',
    posProvider: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const saveRestaurant = useSaveRestaurant();

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Save restaurant info to DB
      const newRestaurant = {
        id: '1',
        name: formData.restaurantName,
        seatingCapacity: parseInt(formData.seatingCapacity),
        region: formData.region,
        city: '', // Can be added later
        cuisine: formData.cuisine,
        targetFoodCostPercentage: parseInt(formData.targetFoodCost),
        targetFoodCostRange: {
          min: parseInt(formData.minFoodCost),
          max: parseInt(formData.maxFoodCost),
        },
        categoryTargets: {},
        defaultCurrency: 'PHP',
        timezone: 'Asia/Manila',
      };

      saveRestaurant(newRestaurant);
      toast({
        title: 'Restaurant saved!',
        description: `${formData.restaurantName} has been saved. Proceeding to menu setup.`,
      });

      // Redirect to menu setup instead of dashboard
      router.push('/setup/menu');
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const isStepValid = () => {
    if (step === 1) {
      return formData.restaurantName && formData.seatingCapacity && formData.region && formData.cuisine;
    }
    if (step === 2) {
      return formData.targetFoodCost && formData.minFoodCost && formData.maxFoodCost;
    }
    return formData.posProvider;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4 pt-4">
          <div className="flex items-center justify-center mb-2">
            <div className="p-2 bg-teal-100 rounded-lg">
              <ChefHatIcon className="w-6 h-6 text-teal-700" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome to CostPilot</h1>
          <p className="text-slate-600 text-sm">Let's set up your restaurant</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  i < step
                    ? 'bg-teal-600 text-white'
                    : i === step
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {i < step ? <CheckCircle2Icon className="w-6 h-6" /> : i}
              </div>
              {i < 3 && <div className="w-8 h-1 bg-slate-200" />}
            </div>
          ))}
        </div>

        {/* Step 1: Restaurant Basics */}
        {step === 1 && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Restaurant Basics</CardTitle>
              <CardDescription className="text-xs">Tell us about your restaurant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="restaurantName" className="text-xs">Restaurant Name</Label>
                <Input
                  id="restaurantName"
                  name="restaurantName"
                  placeholder="e.g., Manila Bites"
                  className="h-8 text-sm"
                  value={formData.restaurantName}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="seatingCapacity" className="text-xs">Seating Capacity</Label>
                <Input
                  id="seatingCapacity"
                  name="seatingCapacity"
                  type="number"
                  placeholder="e.g., 25"
                  className="h-8 text-sm"
                  value={formData.seatingCapacity}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="region" className="text-xs">Region</Label>
                <Select value={formData.region} onValueChange={(value) => handleSelectChange('region', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your region" />
                  </SelectTrigger>
                  <SelectContent>
                    {philippineRegions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="cuisine" className="text-xs">Primary Cuisine</Label>
                <Select value={formData.cuisine} onValueChange={(value) => handleSelectChange('cuisine', value)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select cuisine" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuisineTypes.map((cuisine) => (
                      <SelectItem key={cuisine} value={cuisine}>
                        {cuisine}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Food Cost Target */}
        {step === 2 && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Food Cost Target</CardTitle>
              <CardDescription className="text-xs">Set your target food cost %</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="bg-teal-50 border border-teal-200 rounded p-2 text-xs text-teal-700">
                <p>Track dishes against target range (typical: 28–32%).</p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="targetFoodCost" className="text-xs">Target Food Cost %</Label>
                <Input
                  id="targetFoodCost"
                  name="targetFoodCost"
                  type="number"
                  placeholder="e.g., 30"
                  className="h-8 text-sm"
                  value={formData.targetFoodCost}
                  onChange={handleChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="minFoodCost" className="text-xs">Minimum %</Label>
                  <Input
                    id="minFoodCost"
                    name="minFoodCost"
                    type="number"
                    placeholder="e.g., 28"
                    className="h-8 text-sm"
                    value={formData.minFoodCost}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="maxFoodCost" className="text-xs">Maximum %</Label>
                  <Input
                    id="maxFoodCost"
                    name="maxFoodCost"
                    type="number"
                    placeholder="e.g., 32"
                    className="h-8 text-sm"
                    value={formData.maxFoodCost}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: POS Integration */}
        {step === 3 && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">POS Integration</CardTitle>
              <CardDescription className="text-xs">What POS system do you use?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700">
                <p>We'll connect via API/CSV. For now, explore with sample data.</p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="posProvider" className="text-xs">POS Provider</Label>
                <Select value={formData.posProvider} onValueChange={(value) => handleSelectChange('posProvider', value)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select your POS" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No POS / Manual</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                    <SelectItem value="toast">Toast</SelectItem>
                    <SelectItem value="clover">Clover</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={step === 1}
            className="w-1/2 h-9 text-sm"
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={!isStepValid()}
            className="w-1/2 h-9 text-sm bg-teal-600 hover:bg-teal-700"
          >
            {step === 3 ? 'Finish Setup' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
