export type CsvType = 'items' | 'movements' | 'purchases';

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

export interface ImportColumnSuggestion {
  source: string;
  canonical: CanonicalField;
  confidence: number;
}

export interface ImportJobPreviewRow {
  rowIndex: number;
  data: Record<string, string>;
  errors: string[];
  warnings: string[];
}

export interface ImportJobDraft {
  jobId: string;
  csvType: CsvType;
  detectedColumns: string[];
  suggestedMappings: ImportColumnSuggestion[];
  previewRows: ImportJobPreviewRow[];
  rawRows: string[][];
}

export const requiredFieldsByType: Record<CsvType, CanonicalField[]> = {
  items: ['name', 'unit'],
  movements: ['movement_date', 'sku', 'qty_in'],
  purchases: ['purchase_date', 'sku', 'purchase_qty', 'purchase_unit'],
};

export const canonicalFieldLabels: Record<CanonicalField, string> = {
  item_id: 'Item ID',
  sku: 'SKU',
  name: 'Item Name',
  unit: 'Unit',
  category: 'Category',
  location: 'Location',
  par_level: 'Par Level',
  movement_date: 'Movement Date',
  qty_in: 'Qty In',
  qty_out: 'Qty Out',
  unit_cost: 'Unit Cost',
  movement_type: 'Movement Type',
  reason: 'Reason',
  purchase_date: 'Purchase Date',
  invoice_number: 'Invoice / PO #',
  supplier: 'Supplier',
  purchase_qty: 'Purchase Qty',
  purchase_unit: 'Purchase Unit',
  purchase_unit_cost: 'Purchase Unit Cost',
  purchase_total: 'Purchase Total',
};

export const fieldSynonyms: Record<CanonicalField, string[]> = {
  item_id: ['item_id', 'itemid', 'item code', 'product_id'],
  sku: ['sku', 'plu', 'product code', 'item code', 'barcode'],
  name: ['name', 'item', 'item name', 'product', 'description'],
  unit: ['unit', 'uom', 'unit of measure'],
  category: ['category', 'group', 'department'],
  location: ['location', 'store', 'branch', 'outlet'],
  par_level: ['par', 'par level', 'min stock'],
  movement_date: ['date', 'movement date', 'timestamp', 'transaction date'],
  qty_in: ['qty in', 'quantity in', 'in', 'received', 'qty_received'],
  qty_out: ['qty out', 'quantity out', 'out', 'used', 'sold'],
  unit_cost: ['unit cost', 'cost', 'unit price', 'price per unit'],
  movement_type: ['type', 'movement type', 'reason type'],
  reason: ['reason', 'note', 'remarks'],
  purchase_date: ['date', 'purchase date', 'invoice date', 'received date'],
  invoice_number: ['invoice', 'invoice number', 'po', 'po number', 'reference'],
  supplier: ['supplier', 'vendor', 'supplier name'],
  purchase_qty: ['qty', 'quantity', 'purchase qty', 'received qty'],
  purchase_unit: ['unit', 'uom', 'unit of measure'],
  purchase_unit_cost: ['unit cost', 'unit price', 'price per unit'],
  purchase_total: ['total', 'amount', 'line total'],
};

export function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[\s\-]+/g, ' ');
}

export function similarityScore(a: string, b: string) {
  const aNorm = normalizeHeader(a);
  const bNorm = normalizeHeader(b);
  if (aNorm === bNorm) return 1;
  if (aNorm.includes(bNorm) || bNorm.includes(aNorm)) return 0.8;
  const aTokens = new Set(aNorm.split(' '));
  const bTokens = new Set(bNorm.split(' '));
  const overlap = Array.from(aTokens).filter((token) => bTokens.has(token)).length;
  const denom = Math.max(1, Math.max(aTokens.size, bTokens.size));
  return overlap / denom;
}

export function suggestMappings(headers: string[]) {
  const suggestions: ImportColumnSuggestion[] = [];
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

export function parseCsv(text: string) {
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
