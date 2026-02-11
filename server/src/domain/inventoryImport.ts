export type CsvType = 'items' | 'movements' | 'purchases';

export interface InventoryItemCanonical {
  item_id?: string;
  sku?: string;
  name: string;
  unit: string;
  category?: string;
  location?: string;
  par_level?: number;
}

export interface InventoryMovementCanonical {
  movement_date: Date;
  sku: string;
  qty_in?: number;
  qty_out?: number;
  unit_cost?: number;
  movement_type?: string;
  reason?: string;
  location?: string;
}

export interface PurchaseCanonical {
  purchase_date: Date;
  invoice_number?: string;
  supplier?: string;
  sku?: string;
  name?: string;
  purchase_qty: number;
  purchase_unit: string;
  purchase_unit_cost?: number;
  purchase_total?: number;
  location?: string;
}

export interface ImportProfile {
  id: string;
  restaurant_id: string;
  name: string;
  csv_type: CsvType;
  vendor_hint?: string;
  column_mappings: Record<string, string>;
  transforms?: Record<string, string>;
  defaults?: Record<string, string>;
  validation_rules?: Record<string, string>;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ImportJob {
  id: string;
  restaurant_id: string;
  csv_type: CsvType;
  status: 'uploaded' | 'mapped' | 'validated' | 'imported' | 'failed';
  file_name: string;
  file_url?: string;
  detected_columns: string[];
  column_mappings: Record<string, string>;
  summary?: Record<string, unknown>;
  error_log?: Array<{ row: number; message: string }>;
  created_at: string;
  updated_at: string;
}

export interface ImportRow {
  rowIndex: number;
  raw: Record<string, string>;
  normalized: Record<string, unknown>;
  errors: string[];
  warnings: string[];
}
