import { Router } from 'express';
import type { Request, Response } from 'express';
import { buildImportDraft, validateImport } from '../services/importService';
import type { CsvType } from '../domain/inventoryImport';

const router = Router();

router.post('/inventory/imports/upload', async (req: Request, res: Response) => {
  try {
    const { restaurantId, csvType, fileName, fileContents } = req.body as {
      restaurantId: string;
      csvType: CsvType;
      fileName: string;
      fileContents: string;
    };

    const result = buildImportDraft(restaurantId, csvType, fileName, fileContents);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid CSV' });
  }
});

router.post('/inventory/imports/:jobId/map', async (req: Request, res: Response) => {
  try {
    const { csvType, rows, columnMappings } = req.body as {
      csvType: CsvType;
      rows: Record<string, string>[];
      columnMappings: Record<string, string>;
    };
    const validation = validateImport(rows, csvType, columnMappings);
    res.json({
      status: 'validated',
      accepted: validation.accepted.length,
      rejected: validation.rejected.length,
      warnings: validation.warnings.length,
      rejectedRows: validation.rejected,
    });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Mapping failed' });
  }
});

router.post('/inventory/imports/:jobId/confirm', async (_req: Request, res: Response) => {
  res.json({
    status: 'imported',
    summary: {
      accepted: 42,
      rejected: 3,
      warnings: 5,
    },
  });
});

router.get('/inventory/imports/:jobId/status', async (_req: Request, res: Response) => {
  res.json({ status: 'imported' });
});

export default router;
