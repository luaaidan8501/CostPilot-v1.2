'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIngredients, useRecipes, useSalesRecords, useSetSalesRecords } from '@/lib/hooks';
import type { SalesRecord } from '@/lib/types';

type DateRangeOption = '7d' | '30d' | 'month';

function getDateRange(option: DateRangeOption) {
  const end = new Date();
  const start = new Date(end);

  if (option === '7d') {
    start.setDate(end.getDate() - 7);
  } else if (option === '30d') {
    start.setDate(end.getDate() - 30);
  } else {
    start.setDate(1);
  }

  return { start, end };
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '_');
}

const headerAliases: Record<string, string[]> = {
  date: ['date', 'transaction_date', 'sale_date', 'business_date', 'datetime', 'timestamp'],
  item_name: [
    'item_name',
    'item',
    'menu_item',
    'product',
    'product_name',
    'description',
    'item_description',
    'plu',
    'sku',
  ],
  quantity: ['quantity', 'qty', 'count', 'units', 'unit_count', 'sold_qty', 'sales_qty'],
  net_sales: ['net_sales', 'net', 'net_amount', 'net_total', 'net_revenue'],
  gross_sales: ['gross_sales', 'gross', 'gross_amount', 'gross_total', 'gross_revenue'],
};

function resolveHeaderIndex(headers: string[], key: keyof typeof headerAliases) {
  const candidates = headerAliases[key];
  return candidates.map((candidate) => headers.indexOf(candidate)).find((index) => index !== -1) ?? -1;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let current: string[] = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && next === '"') {
      value += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      current.push(value);
      value = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        i += 1;
      }
      current.push(value);
      if (current.some((cell) => cell.trim().length > 0)) {
        rows.push(current);
      }
      current = [];
      value = '';
      continue;
    }

    value += char;
  }

  if (value.length > 0 || current.length > 0) {
    current.push(value);
    if (current.some((cell) => cell.trim().length > 0)) {
      rows.push(current);
    }
  }

  return rows;
}

export default function InventoryPage() {
  const [rangeOption, setRangeOption] = useState<DateRangeOption>('7d');
  const [importSummary, setImportSummary] = useState<{
    total: number;
    imported: number;
    skipped: number;
    unmapped: string[];
  } | null>(null);
  const dateRange = useMemo(() => getDateRange(rangeOption), [rangeOption]);

  const { data: ingredients } = useIngredients();
  const { data: recipes } = useRecipes();
  const { data: salesRecords } = useSalesRecords(dateRange);
  const setSalesRecords = useSetSalesRecords();

  const { usageRows, totalServings, estimatedCost } = useMemo(() => {
    const usageMap = new Map<
      string,
      { ingredientName: string; unit: string; totalQty: number; totalCost: number }
    >();
    let servings = 0;
    let cost = 0;

    salesRecords.forEach((record) => {
      const recipe = recipes.find((r) => r.posItemId === record.posItemId);
      if (!recipe) return;

      servings += record.quantity;
      recipe.ingredients.forEach((ing) => {
        const totalQty = record.quantity * ing.quantityPerPortion;
        const totalCost = totalQty * ing.costPerUnit;
        const key = ing.ingredientId;
        const existing = usageMap.get(key);

        if (existing) {
          existing.totalQty += totalQty;
          existing.totalCost += totalCost;
        } else {
          usageMap.set(key, {
            ingredientName: ing.ingredientName,
            unit: ing.unit,
            totalQty,
            totalCost,
          });
        }
      });
    });

    const rows = Array.from(usageMap.entries()).map(([id, data]) => {
      const ingredient = ingredients.find((ing) => ing.id === id);
      return {
        id,
        ingredientName: data.ingredientName,
        unit: data.unit,
        totalQty: data.totalQty,
        totalCost: data.totalCost,
        benchmarkPrice: ingredient?.benchmarkPrice ?? null,
      };
    });

    rows.forEach((row) => {
      cost += row.totalCost;
    });

    return { usageRows: rows, totalServings: servings, estimatedCost: cost };
  }, [ingredients, recipes, salesRecords]);

  const handleDownloadTemplate = () => {
    const header = [
      'date',
      'item_name',
      'quantity',
      'gross_sales',
      'discounts',
      'net_sales',
      'tax',
      'service_charge',
      'category',
      'location',
    ];
    const example = [
      '2025-11-12',
      'Chicken Burger',
      '120',
      '14400',
      '0',
      '14400',
      '0',
      '0',
      'Mains',
      'Manila',
    ];
    const csv = `${header.join(',')}\n${example.join(',')}\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'costpilot_sales_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = async (file: File) => {
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length < 2) {
      setImportSummary({ total: 0, imported: 0, skipped: 0, unmapped: [] });
      return;
    }

    const header = rows[0].map(normalizeHeader);
    const rowData = rows.slice(1);
    const dateIndex = resolveHeaderIndex(header, 'date');
    const nameIndex = resolveHeaderIndex(header, 'item_name');
    const qtyIndex = resolveHeaderIndex(header, 'quantity');

    if (dateIndex === -1 || nameIndex === -1 || qtyIndex === -1) {
      setImportSummary({ total: 0, imported: 0, skipped: rows.length - 1, unmapped: [] });
      return;
    }

    const newRecords: SalesRecord[] = [];
    const unmapped = new Set<string>();
    let skipped = 0;

    rowData.forEach((row, index) => {
      const dateValue = row[dateIndex]?.trim();
      const itemName = row[nameIndex]?.trim();
      const quantityValue = row[qtyIndex]?.trim();

      if (!dateValue || !itemName || !quantityValue) {
        skipped += 1;
        return;
      }

      const quantity = Number.parseFloat(quantityValue);
      const parsedDate = new Date(dateValue);
      if (Number.isNaN(quantity) || Number.isNaN(parsedDate.getTime())) {
        skipped += 1;
        return;
      }

      const matchedItem = recipes.find((recipe) =>
        recipe.posItemName.toLowerCase() === itemName.toLowerCase()
      );

      if (!matchedItem) {
        unmapped.add(itemName);
        skipped += 1;
        return;
      }

      newRecords.push({
        id: `csv_${Date.now()}_${index}`,
        posItemId: matchedItem.posItemId,
        posItemName: matchedItem.posItemName,
        date: parsedDate,
        quantity,
      });
    });

    setSalesRecords(newRecords);
    setImportSummary({
      total: rowData.length,
      imported: newRecords.length,
      skipped,
      unmapped: Array.from(unmapped).slice(0, 5),
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Theoretical Inventory</h1>
          <p className="text-slate-600 mt-1">
            Estimated ingredient usage based on recipes and POS sales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={rangeOption} onValueChange={(value) => setRangeOption(value as DateRangeOption)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="month">This month</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="file"
            accept=".csv"
            className="hidden"
            id="sales-csv-upload"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                handleCsvUpload(file);
                event.currentTarget.value = '';
              }
            }}
          />
          <Button variant="outline" onClick={handleDownloadTemplate}>
            Download CSV Template
          </Button>
          <Button variant="outline" onClick={() => document.getElementById('sales-csv-upload')?.click()}>
            Upload CSV
          </Button>
        </div>
      </div>

      {importSummary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">CSV Import Summary</CardTitle>
            <CardDescription className="text-xs">Most recent upload</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-700 space-y-1">
            <p>Total rows: {importSummary.total}</p>
            <p>Imported: {importSummary.imported}</p>
            <p>Skipped: {importSummary.skipped}</p>
            <p>
              Unmatched items:{' '}
              {importSummary.unmapped.length === 0 ? 'None' : importSummary.unmapped.join(', ')}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Servings Sold</CardTitle>
            <CardDescription className="text-xs">From POS sales in range</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{totalServings}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ingredients Used</CardTitle>
            <CardDescription className="text-xs">Unique ingredients consumed</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{usageRows.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estimated COGS</CardTitle>
            <CardDescription className="text-xs">Based on recipe cost per unit</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">₱ {estimatedCost.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ingredient Usage</CardTitle>
          <CardDescription>Calculated from recipe quantities per serving</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingredient</TableHead>
                  <TableHead className="text-right">Qty Used</TableHead>
                  <TableHead className="text-right">Unit</TableHead>
                  <TableHead className="text-right">Est. Cost</TableHead>
                  <TableHead className="text-right">Benchmark</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500">
                      No sales data in this range
                    </TableCell>
                  </TableRow>
                ) : (
                  usageRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.ingredientName}</TableCell>
                      <TableCell className="text-right">{row.totalQty.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{row.unit}</TableCell>
                      <TableCell className="text-right">₱ {row.totalCost.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        {row.benchmarkPrice === null ? '—' : `₱ ${row.benchmarkPrice}`}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
