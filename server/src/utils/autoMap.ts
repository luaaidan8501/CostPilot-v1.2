import { normalizeHeader } from './csv';
import type { CsvType } from '../domain/inventoryImport';

export type CanonicalField =
  | 'item_id'
  | 'sku'
  | 'name'
  | 'unit'
  | 'category'
  | 'location'
  | 'par_level'
  | 'movement_date'
  | 'qty_in'
  | 'qty_out'
  | 'unit_cost'
  | 'movement_type'
  | 'reason'
  | 'purchase_date'
  | 'invoice_number'
  | 'supplier'
  | 'purchase_qty'
  | 'purchase_unit'
  | 'purchase_unit_cost'
  | 'purchase_total';

export const requiredByType: Record<CsvType, CanonicalField[]> = {
  items: ['name', 'unit'],
  movements: ['movement_date', 'sku', 'qty_in'],
  purchases: ['purchase_date', 'purchase_qty', 'purchase_unit'],
};

export const fieldSynonyms: Record<CanonicalField, string[]> = {
  item_id: ['item_id', 'itemid', 'product_id', 'item code'],
  sku: ['sku', 'plu', 'barcode', 'product code', 'item code'],
  name: ['name', 'item', 'item name', 'product', 'description'],
  unit: ['unit', 'uom', 'unit of measure'],
  category: ['category', 'group', 'department'],
  location: ['location', 'store', 'branch', 'outlet'],
  par_level: ['par', 'par level', 'min stock'],
  movement_date: ['date', 'movement date', 'timestamp', 'transaction date'],
  qty_in: ['qty in', 'quantity in', 'received', 'in', 'qty_received'],
  qty_out: ['qty out', 'quantity out', 'used', 'out', 'qty_used'],
  unit_cost: ['unit cost', 'unit price', 'cost', 'price per unit'],
  movement_type: ['type', 'movement type', 'reason type'],
  reason: ['reason', 'note', 'remarks'],
  purchase_date: ['date', 'purchase date', 'invoice date', 'received date'],
  invoice_number: ['invoice', 'invoice number', 'po', 'reference'],
  supplier: ['supplier', 'vendor', 'supplier name'],
  purchase_qty: ['qty', 'quantity', 'purchase qty', 'received qty'],
  purchase_unit: ['unit', 'uom', 'unit of measure'],
  purchase_unit_cost: ['unit cost', 'unit price', 'price per unit'],
  purchase_total: ['total', 'amount', 'line total', 'total amount'],
};

export function similarityScore(a: string, b: string) {
  const aNorm = normalizeHeader(a);
  const bNorm = normalizeHeader(b);
  if (aNorm === bNorm) return 1;
  if (aNorm.includes(bNorm) || bNorm.includes(aNorm)) return 0.85;
  const aTokens = new Set(aNorm.split(' '));
  const bTokens = new Set(bNorm.split(' '));
  const overlap = Array.from(aTokens).filter((token) => bTokens.has(token)).length;
  const denom = Math.max(1, Math.max(aTokens.size, bTokens.size));
  return overlap / denom;
}

export function suggestMappings(headers: string[]) {
  const suggestions: Array<{ source: string; canonical: CanonicalField; confidence: number }> = [];
  const normalized = headers.map((header) => normalizeHeader(header));

  Object.entries(fieldSynonyms).forEach(([canonical, synonyms]) => {
    let bestIndex = -1;
    let bestScore = 0;
    normalized.forEach((header, index) => {
      synonyms.forEach((synonym) => {
        const score = similarityScore(header, synonym);
        if (score > bestScore) {
          bestScore = score;
          bestIndex = index;
        }
      });
    });
    if (bestIndex !== -1 && bestScore >= 0.6) {
      suggestions.push({
        source: headers[bestIndex],
        canonical: canonical as CanonicalField,
        confidence: Math.round(bestScore * 100),
      });
    }
  });

  return suggestions;
}
