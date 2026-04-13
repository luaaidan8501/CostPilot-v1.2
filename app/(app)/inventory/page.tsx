'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIngredients, usePosItems, useRecipes, useSalesRecords, useSetSalesRecords } from '@/lib/hooks';
import type { SalesRecord } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { mockIngredients, mockPosItems, mockRecipes, mockSalesRecords } from '@/lib/mock-data';
import {
  CanonicalField,
  CsvType,
  ImportJobDraft,
  canonicalFieldLabels,
  parseCsv,
  requiredFieldsByType,
  suggestMappings,
} from '@/lib/inventory-import';

type DateRangeOption = '7d' | '30d' | 'month';
type ImportStep = 'upload' | 'map' | 'preview' | 'summary';

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

const optionalFieldsByType: Record<CsvType, CanonicalField[]> = {
  items: ['sku', 'category', 'location', 'par_level', 'item_id'],
  movements: ['qty_out', 'unit_cost', 'movement_type', 'reason', 'location'],
  purchases: ['invoice_number', 'supplier', 'purchase_unit_cost', 'purchase_total', 'location'],
};

function buildPreviewRows(
  rows: string[][],
  headers: string[],
  mapping: Record<CanonicalField, string>,
  csvType: CsvType
) {
  const required = requiredFieldsByType[csvType];
  return rows.slice(1, 16).map((row, index) => {
    const data: Record<string, string> = {};
    const errors: string[] = [];
    const warnings: string[] = [];

    Object.entries(mapping).forEach(([canonical, source]) => {
      if (!source) return;
      const colIndex = headers.indexOf(source);
      data[canonical] = colIndex >= 0 ? row[colIndex] ?? '' : '';
    });

    required.forEach((field) => {
      if (!mapping[field] || !data[field]?.toString().trim()) {
        errors.push(`${canonicalFieldLabels[field]} is required.`);
      }
    });

    if (data.purchase_qty && Number.isNaN(Number.parseFloat(data.purchase_qty))) {
      warnings.push('Quantity is not numeric.');
    }

    return {
      rowIndex: index + 2,
      data,
      errors,
      warnings,
    };
  });
}

export default function InventoryPage() {
  const [rangeOption, setRangeOption] = useState<DateRangeOption>('7d');
  const [importOpen, setImportOpen] = useState(false);
  const [importStep, setImportStep] = useState<ImportStep>('upload');
  const [csvType, setCsvType] = useState<CsvType>('purchases');
  const [importDraft, setImportDraft] = useState<ImportJobDraft | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<CanonicalField, string>>({});
  const [importSummary, setImportSummary] = useState<{
    total: number;
    accepted: number;
    rejected: number;
    warnings: number;
  } | null>(null);
  const dateRange = useMemo(() => getDateRange(rangeOption), [rangeOption]);

  const { data: ingredients } = useIngredients();
  const { data: posItems } = usePosItems();
  const { data: recipes } = useRecipes();
  const { data: salesRecords } = useSalesRecords(dateRange);
  const setSalesRecords = useSetSalesRecords();

  const activeIngredients = ingredients.length ? ingredients : mockIngredients;
  const activePosItems = posItems.length ? posItems : mockPosItems;
  const activeRecipes = recipes.length ? recipes : mockRecipes;
  const activeSalesRecords = salesRecords.length ? salesRecords : mockSalesRecords;

  const { usageRows, totalServings, estimatedCost, dishRows } = useMemo(() => {
    const usageMap = new Map<
      string,
      { ingredientName: string; unit: string; totalQty: number; totalCost: number }
    >();
    const dishMap = new Map<string, { name: string; servings: number }>();
    let servings = 0;
    let cost = 0;

    activeSalesRecords.forEach((record) => {
      const recipe = activeRecipes.find((r) => r.posItemId === record.posItemId);
      if (!recipe) return;

      servings += record.quantity;
      const dishName =
        activePosItems.find((item) => item.id === record.posItemId)?.name ||
        record.posItemName;
      const dishEntry = dishMap.get(record.posItemId);
      if (dishEntry) {
        dishEntry.servings += record.quantity;
      } else {
        dishMap.set(record.posItemId, { name: dishName, servings: record.quantity });
      }

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
      const ingredient = activeIngredients.find((ing) => ing.id === id);
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

    const dishRows = Array.from(dishMap.entries())
      .map(([id, data]) => ({ id, name: data.name, servings: data.servings }))
      .sort((a, b) => b.servings - a.servings);

    return { usageRows: rows, totalServings: servings, estimatedCost: cost, dishRows };
  }, [activeIngredients, activeRecipes, activeSalesRecords, activePosItems]);

  const handleDownloadTemplate = () => {
    const header =
      csvType === 'purchases'
        ? ['invoice', 'date', 'supplier', 'sku', 'item', 'qty', 'unit', 'unit_cost', 'total']
        : csvType === 'movements'
        ? ['date', 'sku', 'qty_in', 'qty_out', 'unit_cost', 'reason']
        : ['sku', 'item', 'unit', 'category', 'location'];
    const example =
      csvType === 'purchases'
        ? ['INV-1001', '2026-02-01', 'Golden Poultry', 'SKU-1001', 'Chicken Thigh', '10', 'kg', '180', '1800']
        : csvType === 'movements'
        ? ['2026-02-01', 'SKU-1001', '10', '0', '180', 'Received shipment']
        : ['SKU-1001', 'Chicken Thigh', 'kg', 'Meat', 'Manila'];
    const csv = `${header.join(',')}\n${example.join(',')}\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `costpilot_${csvType}_template.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = async (file: File) => {
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length < 2) {
      setImportSummary({ total: 0, accepted: 0, rejected: 0, warnings: 0 });
      return;
    }

    const headers = rows[0];
    const suggestions = suggestMappings(headers);
    const mapping: Record<CanonicalField, string> = {};

    suggestions.forEach((suggestion) => {
      mapping[suggestion.canonical] = suggestion.source;
    });

    const previewRows = buildPreviewRows(rows, headers, mapping, csvType);

    setImportDraft({
      jobId: `draft_${Date.now()}`,
      csvType,
      detectedColumns: headers,
      suggestedMappings: suggestions,
      previewRows,
      rawRows: rows,
    });
    setColumnMapping(mapping);
    setImportStep('map');
  };

  const updateMapping = (field: CanonicalField, value: string) => {
    setColumnMapping((current) => ({ ...current, [field]: value }));
  };

  const handlePreview = () => {
    if (!importDraft) return;
    const previewRows = buildPreviewRows(
      importDraft.rawRows,
      importDraft.detectedColumns,
      columnMapping,
      importDraft.csvType
    );
    setImportDraft({ ...importDraft, previewRows });
    setImportStep('preview');
  };

  const handleConfirm = () => {
    if (!importDraft) return;
    const total = 50;
    const rejected = importDraft.previewRows.filter((row) => row.errors.length > 0).length;
    const warnings = importDraft.previewRows.filter((row) => row.warnings.length > 0).length;
    setImportSummary({
      total,
      accepted: total - rejected,
      rejected,
      warnings,
    });
    setImportStep('summary');
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
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            Import CSV
          </Button>
        </div>
      </div>

      {importSummary && importStep === 'summary' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">CSV Import Summary</CardTitle>
            <CardDescription className="text-xs">Most recent upload</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-700 space-y-1">
            <p>Total rows: {importSummary.total}</p>
            <p>Accepted: {importSummary.accepted}</p>
            <p>Rejected: {importSummary.rejected}</p>
            <p>Warnings: {importSummary.warnings}</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Dish Servings</CardTitle>
          <CardDescription>Servings sold per dish in this range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dish</TableHead>
                  <TableHead className="text-right">Servings Sold</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dishRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-slate-500">
                      No sales data in this range
                    </TableCell>
                  </TableRow>
                ) : (
                  dishRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="text-right">{row.servings}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Import Inventory CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file, map columns, preview, and import.
            </DialogDescription>
          </DialogHeader>

          {importStep === 'upload' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={csvType} onValueChange={(value) => setCsvType(value as CsvType)}>
                  <SelectTrigger className="w-full sm:w-52">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchases">Purchases</SelectItem>
                    <SelectItem value="movements">Inventory Movements</SelectItem>
                    <SelectItem value="items">Inventory Items</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={handleDownloadTemplate}>
                  Download Template
                </Button>
              </div>
              <Input
                type="file"
                accept=".csv"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    handleCsvUpload(file);
                    event.currentTarget.value = '';
                  }
                }}
              />
            </div>
          )}

          {importStep === 'map' && importDraft && (
            <div className="space-y-4">
              <div className="text-sm text-slate-600">
                Map your columns to CostPilot fields. Required fields are marked.
              </div>
              <div className="space-y-2">
                {[...requiredFieldsByType[importDraft.csvType], ...optionalFieldsByType[importDraft.csvType]].map(
                  (field) => (
                    <div key={field} className="flex items-center gap-3">
                      <div className="w-48 text-sm font-medium">
                        {canonicalFieldLabels[field]}
                        {requiredFieldsByType[importDraft.csvType].includes(field) ? ' *' : ''}
                      </div>
                      <Select
                        value={columnMapping[field] || ''}
                        onValueChange={(value) => updateMapping(field, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {importDraft.detectedColumns.map((column) => (
                            <SelectItem key={column} value={column}>
                              {column}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setImportStep('upload')}>
                  Back
                </Button>
                <Button onClick={handlePreview}>Preview</Button>
              </div>
            </div>
          )}

          {importStep === 'preview' && importDraft && (
            <div className="space-y-4">
              <div className="text-sm text-slate-600">Preview the first 15 rows.</div>
              <div className="overflow-x-auto max-h-[45vh]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      {requiredFieldsByType[importDraft.csvType].map((field) => (
                        <TableHead key={field}>{canonicalFieldLabels[field]}</TableHead>
                      ))}
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importDraft.previewRows.map((row) => (
                      <TableRow key={row.rowIndex}>
                        <TableCell>{row.rowIndex}</TableCell>
                        {requiredFieldsByType[importDraft.csvType].map((field) => (
                          <TableCell key={field}>{row.data[field] || '—'}</TableCell>
                        ))}
                        <TableCell className="text-xs text-slate-500">
                          {row.errors[0] || row.warnings[0] || 'OK'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setImportStep('map')}>
                  Back
                </Button>
                <Button onClick={handleConfirm}>Import</Button>
              </div>
            </div>
          )}

          {importStep === 'summary' && importSummary && (
            <div className="space-y-4">
              <div className="text-sm text-slate-600">Import completed.</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Total rows</p>
                  <p className="text-lg font-semibold">{importSummary.total}</p>
                </div>
                <div>
                  <p className="text-slate-500">Accepted</p>
                  <p className="text-lg font-semibold">{importSummary.accepted}</p>
                </div>
                <div>
                  <p className="text-slate-500">Rejected</p>
                  <p className="text-lg font-semibold">{importSummary.rejected}</p>
                </div>
                <div>
                  <p className="text-slate-500">Warnings</p>
                  <p className="text-lg font-semibold">{importSummary.warnings}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setImportOpen(false)}>Done</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
