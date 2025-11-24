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

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      router.push('/dashboard');
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
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-teal-100 rounded-lg">
              <ChefHatIcon className="w-8 h-8 text-teal-700" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome to CostPilot</h1>
          <p className="text-slate-600 mt-2">Let's set up your restaurant</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
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
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Basics</CardTitle>
              <CardDescription>Tell us about your restaurant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="restaurantName">Restaurant Name</Label>
                <Input
                  id="restaurantName"
                  name="restaurantName"
                  placeholder="e.g., Manila Bites Restaurant"
                  value={formData.restaurantName}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seatingCapacity">Seating Capacity</Label>
                <Input
                  id="seatingCapacity"
                  name="seatingCapacity"
                  type="number"
                  placeholder="e.g., 25"
                  value={formData.seatingCapacity}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
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
              <div className="space-y-2">
                <Label htmlFor="cuisine">Primary Cuisine</Label>
                <Select value={formData.cuisine} onValueChange={(value) => handleSelectChange('cuisine', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cuisine type" />
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
          <Card>
            <CardHeader>
              <CardTitle>Food Cost Target</CardTitle>
              <CardDescription>Set your target food cost percentage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 text-sm text-teal-700">
                <p>We'll track your dishes against this target range. A typical range is 28–32%.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetFoodCost">Target Food Cost %</Label>
                <Input
                  id="targetFoodCost"
                  name="targetFoodCost"
                  type="number"
                  placeholder="e.g., 30"
                  value={formData.targetFoodCost}
                  onChange={handleChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minFoodCost">Minimum %</Label>
                  <Input
                    id="minFoodCost"
                    name="minFoodCost"
                    type="number"
                    placeholder="e.g., 28"
                    value={formData.minFoodCost}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxFoodCost">Maximum %</Label>
                  <Input
                    id="maxFoodCost"
                    name="maxFoodCost"
                    type="number"
                    placeholder="e.g., 32"
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
          <Card>
            <CardHeader>
              <CardTitle>POS Integration</CardTitle>
              <CardDescription>What POS system do you use?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                <p>We'll connect via API/CSV later. For now, we'll generate sample POS data so you can explore CostPilot.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="posProvider">POS Provider</Label>
                <Select value={formData.posProvider} onValueChange={(value) => handleSelectChange('posProvider', value)}>
                  <SelectTrigger>
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
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={step === 1}
            className="w-full"
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={!isStepValid()}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            {step === 3 ? 'Finish Setup' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
