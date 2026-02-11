import type { CsvType } from '../domain/inventoryImport';
import { parseDate, parseNumber, normalizeUnit } from './normalize';
import { requiredByType } from './autoMap';

export interface ValidationResult {
  accepted: Array<{ rowIndex: number; data: Record<string, unknown> }>;
  rejected: Array<{ rowIndex: number; reason: string }>;
  warnings: Array<{ rowIndex: number; warning: string }>;
}

export function validateRows(
  rows: Record<string, string>[],
  csvType: CsvType,
  mapping: Record<string, string>
): ValidationResult {
  const requiredFields = requiredByType[csvType];
  const accepted: ValidationResult['accepted'] = [];
  const rejected: ValidationResult['rejected'] = [];
  const warnings: ValidationResult['warnings'] = [];

  rows.forEach((row, index) => {
    const normalized: Record<string, unknown> = {};

    Object.entries(mapping).forEach(([canonical, source]) => {
      if (!source) return;
      normalized[canonical] = row[source];
    });

    const missing = requiredFields.find((field) => !normalized[field]);
    if (missing) {
      rejected.push({ rowIndex: index + 2, reason: `${missing} is required` });
      return;
    }

    if (normalized.purchase_date) {
      const parsed = parseDate(String(normalized.purchase_date));
      if (!parsed) {
        rejected.push({ rowIndex: index + 2, reason: 'Invalid purchase date' });
        return;
      }
      normalized.purchase_date = parsed;
    }

    if (normalized.movement_date) {
      const parsed = parseDate(String(normalized.movement_date));
      if (!parsed) {
        rejected.push({ rowIndex: index + 2, reason: 'Invalid movement date' });
        return;
      }
      normalized.movement_date = parsed;
    }

    if (normalized.purchase_qty) {
      const qty = parseNumber(String(normalized.purchase_qty));
      if (qty === null) {
        rejected.push({ rowIndex: index + 2, reason: 'Quantity is not numeric' });
        return;
      }
      normalized.purchase_qty = qty;
    }

    if (normalized.purchase_unit) {
      normalized.purchase_unit = normalizeUnit(String(normalized.purchase_unit));
    }

    accepted.push({ rowIndex: index + 2, data: normalized });
  });

  return { accepted, rejected, warnings };
}
