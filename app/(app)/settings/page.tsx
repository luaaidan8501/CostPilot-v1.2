'use client';

import { useState } from 'react';
import { useRestaurant } from '@/lib/hooks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const regions = ['NCR', 'CALABARZON', 'MIMAROPA', 'Bicol Region', 'Central Visayas'];
const timezones = ['Asia/Manila', 'UTC', 'UTC+8'];

export default function SettingsPage() {
  const { data: restaurant } = useRestaurant();
  const [settings, setSettings] = useState({
    restaurantName: restaurant?.name || '',
    region: restaurant?.region || '',
    timezone: restaurant?.timezone || '',
    currency: restaurant?.defaultCurrency || '',
    targetFoodCost: restaurant?.targetFoodCostPercentage || 30,
    minFoodCost: restaurant?.targetFoodCostRange.min || 28,
    maxFoodCost: restaurant?.targetFoodCostRange.max || 32,
    enableBenchmarkPrices: true,
    enableAlerts: true,
  });

  const handleChange = (field: string, value: any) => {
    setSettings({ ...settings, [field]: value });
  };

  const handleSave = () => {
    // Handle save
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-1">Manage your restaurant and app preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="targets">Targets</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic restaurant information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="restaurantName">Restaurant Name</Label>
                <Input
                  id="restaurantName"
                  value={settings.restaurantName}
                  onChange={(e) => handleChange('restaurantName', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Select value={settings.region} onValueChange={(value) => handleChange('region', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={settings.timezone} onValueChange={(value) => handleChange('timezone', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={settings.currency} onValueChange={(value) => handleChange('currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PHP">Philippine Peso (PHP)</SelectItem>
                    <SelectItem value="USD">US Dollar (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Preferences</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Enable Benchmark Prices</p>
                    <p className="text-sm text-slate-600">Compare your prices with market benchmarks</p>
                  </div>
                  <Switch checked={settings.enableBenchmarkPrices} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Enable Alerts</p>
                    <p className="text-sm text-slate-600">Receive notifications for important changes</p>
                  </div>
                  <Switch checked={settings.enableAlerts} />
                </div>
              </div>

              <Button className="w-full bg-teal-600 hover:bg-teal-700" onClick={handleSave}>
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Food Cost Targets */}
        <TabsContent value="targets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Food Cost Targets</CardTitle>
              <CardDescription>Set target percentages for your restaurant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="targetFoodCost">Overall Target %</Label>
                <Input
                  id="targetFoodCost"
                  type="number"
                  value={settings.targetFoodCost}
                  onChange={(e) => handleChange('targetFoodCost', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minFoodCost">Minimum %</Label>
                  <Input
                    id="minFoodCost"
                    type="number"
                    value={settings.minFoodCost}
                    onChange={(e) => handleChange('minFoodCost', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxFoodCost">Maximum %</Label>
                  <Input
                    id="maxFoodCost"
                    type="number"
                    value={settings.maxFoodCost}
                    onChange={(e) => handleChange('maxFoodCost', e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Category Targets</h3>
                {[
                  { category: 'Mains', target: 30 },
                  { category: 'Appetizers', target: 28 },
                  { category: 'Drinks', target: 20 },
                  { category: 'Desserts', target: 25 },
                ].map((item) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">{item.category}</span>
                    <div className="w-20">
                      <Input
                        type="number"
                        defaultValue={item.target}
                        className="text-right"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Button className="w-full bg-teal-600 hover:bg-teal-700" onClick={handleSave}>
                Save Targets
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Units */}
        <TabsContent value="units" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Units & Measurement</CardTitle>
              <CardDescription>Set your preferred measurement units</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Weight Unit</p>
                    <p className="text-sm text-slate-600">Default for weight measurements</p>
                  </div>
                  <Select defaultValue="kg">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilogram (kg)</SelectItem>
                      <SelectItem value="g">Gram (g)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Volume Unit</p>
                    <p className="text-sm text-slate-600">Default for liquid measurements</p>
                  </div>
                  <Select defaultValue="L">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Liter (L)</SelectItem>
                      <SelectItem value="mL">Milliliter (mL)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <div>
                    <p className="font-medium text-slate-900">Show Metric Only</p>
                    <p className="text-sm text-slate-600">Hide imperial units</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>Connect your services and data sources</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">POS System</p>
                    <p className="text-sm text-slate-600">Connect your point of sale system</p>
                  </div>
                  <Button variant="outline">Connect</Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">Ingredient Price Sources</p>
                    <p className="text-sm text-slate-600">Enable benchmark price data</p>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
              </div>

              <div className="space-y-2 bg-slate-50 p-4 rounded-lg text-sm">
                <p className="font-medium text-slate-900">Available Data Sources:</p>
                <ul className="list-disc list-inside text-slate-600 space-y-1">
                  <li>Government DA/DTI data</li>
                  <li>Online grocery prices</li>
                  <li>Your supplier invoices</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
