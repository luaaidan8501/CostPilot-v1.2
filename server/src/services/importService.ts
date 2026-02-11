import { parseCsv } from '../utils/csv';
import { suggestMappings } from '../utils/autoMap';
import { validateRows } from '../utils/validation';
import type { CsvType, ImportJob } from '../domain/inventoryImport';

export interface ImportUploadResult {
  job: ImportJob;
  detectedColumns: string[];
  suggestedMappings: ReturnType<typeof suggestMappings>;
  previewRows: Array<{ rowIndex: number; data: Record<string, string> }>;
}

export function buildImportDraft(
  restaurantId: string,
  csvType: CsvType,
  fileName: string,
  fileContents: string
): ImportUploadResult {
  const rows = parseCsv(fileContents);
  if (rows.length < 2) {
    throw new Error('CSV must include header and at least one data row.');
  }

  const headers = rows[0];
  const suggestedMappings = suggestMappings(headers);
  const previewRows = rows.slice(1, 16).map((row, index) => {
    const data: Record<string, string> = {};
    headers.forEach((header, colIndex) => {
      data[header] = row[colIndex] ?? '';
    });
    return { rowIndex: index + 2, data };
  });

  const job: ImportJob = {
    id: 'draft',
    restaurant_id: restaurantId,
    csv_type: csvType,
    status: 'uploaded',
    file_name: fileName,
    detected_columns: headers,
    column_mappings: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return { job, detectedColumns: headers, suggestedMappings, previewRows };
}

export function validateImport(
  rows: Record<string, string>[],
  csvType: CsvType,
  columnMappings: Record<string, string>
) {
  return validateRows(rows, csvType, columnMappings);
}
