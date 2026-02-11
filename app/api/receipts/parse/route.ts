import { NextResponse } from 'next/server';
import { TextractClient, AnalyzeExpenseCommand } from '@aws-sdk/client-textract';

import type { ReceiptItem } from '@/lib/types';
import { supabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/jpg']);

function parseNumber(value?: string) {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.\-]/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function getFieldValue(fields: any[], types: string[]) {
  const found = fields.find((field) => types.includes(field.Type?.Text ?? ''));
  return found?.ValueDetection?.Text ?? '';
}

function extractLineItems(response: any): ReceiptItem[] {
  const items: ReceiptItem[] = [];
  const documents = response?.ExpenseDocuments ?? [];

  documents.forEach((doc: any) => {
    const groups = doc.LineItemGroups ?? [];
    groups.forEach((group: any) => {
      const lines = group.LineItems ?? [];
      lines.forEach((line: any, idx: number) => {
        const fields = line.LineItemExpenseFields ?? [];
        const name =
          getFieldValue(fields, ['ITEM', 'DESCRIPTION', 'NAME']) || `Item ${idx + 1}`;
        const sku = getFieldValue(fields, ['SKU', 'PRODUCT_CODE', 'ITEM_CODE']) || '';
        const unit = getFieldValue(fields, ['UNIT', 'UNIT_OF_MEASURE']) || '';
        const quantity = parseNumber(getFieldValue(fields, ['QUANTITY'])) ?? 1;
        const unitPrice =
          parseNumber(getFieldValue(fields, ['UNIT_PRICE', 'PRICE'])) ?? null;
        const totalPrice = parseNumber(getFieldValue(fields, ['PRICE', 'AMOUNT', 'TOTAL']));
        const resolvedUnitPrice =
          unitPrice ?? (totalPrice !== null ? totalPrice / Math.max(1, quantity) : 0);
        const resolvedTotal =
          totalPrice !== null ? totalPrice : resolvedUnitPrice * Math.max(1, quantity);

        items.push({
          id: `${sku || name}-${idx}`,
          sku,
          name,
          quantity,
          unit: unit || 'pc',
          unitPrice: resolvedUnitPrice,
          totalPrice: resolvedTotal,
        });
      });
    });
  });

  return items;
}

function extractReceiptDate(response: any) {
  const documents = response?.ExpenseDocuments ?? [];
  for (const doc of documents) {
    const fields = doc.SummaryFields ?? [];
    const dateValue = getFieldValue(fields, ['INVOICE_RECEIPT_DATE', 'DATE']);
    if (dateValue) {
      const parsed = new Date(dateValue);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }
  return null;
}

async function parseWithGemini(bytes: Uint8Array, fileType: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY');
  }

  const base64 = Buffer.from(bytes).toString('base64');

  const payload = {
    system_instruction: {
      parts: [
        {
          text:
            'You extract receipt line items. Return JSON with keys: items (array), receiptDate (ISO string or null). ' +
            'Each item must include: sku, name, quantity, unit, unitPrice, totalPrice. Use numeric values for quantities and prices.',
        },
      ],
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text:
              'Extract line items from this receipt. If any field is missing, set a sensible default (unit: "pc", quantity: 1).',
          },
          {
            inline_data: {
              mime_type: fileType,
              data: base64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
      response_mime_type: 'application/json',
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini error: ${text}`);
  }

  const data = await response.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error('Gemini returned empty response');
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Gemini response was not valid JSON');
  }

  const items: ReceiptItem[] = (parsed.items || []).map((item: any, index: number) => ({
    id: `${item.sku || item.name || 'item'}-${index}`,
    sku: String(item.sku || ''),
    name: String(item.name || `Item ${index + 1}`),
    quantity: Number(item.quantity) || 1,
    unit: String(item.unit || 'pc'),
    unitPrice: Number(item.unitPrice) || 0,
    totalPrice: Number(item.totalPrice) || 0,
  }));

  const receiptDate = parsed.receiptDate ? new Date(parsed.receiptDate) : null;

  return {
    items,
    receiptDate: receiptDate && !Number.isNaN(receiptDate.getTime()) ? receiptDate : null,
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Missing receipt file' }, { status: 400 });
    }

    if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Only JPG or PNG images are supported for Textract right now.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    if (!supabaseServer) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 400 }
      );
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${Date.now()}_${safeName}`;
    const bucket = process.env.SUPABASE_RECEIPTS_BUCKET || 'receipts';
    const ttlEnv = Number(process.env.SUPABASE_RECEIPTS_SIGNED_URL_TTL);
    const ttlSeconds = Number.isFinite(ttlEnv) ? ttlEnv : 60 * 60 * 24 * 7;

    const { error: uploadError } = await supabaseServer.storage
      .from(bucket)
      .upload(fileName, Buffer.from(bytes), {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Failed to upload receipt: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: signedUrlData, error: signedUrlError } = await supabaseServer.storage
      .from(bucket)
      .createSignedUrl(fileName, ttlSeconds);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      return NextResponse.json(
        { error: signedUrlError?.message || 'Failed to generate receipt URL' },
        { status: 500 }
      );
    }

    let items: ReceiptItem[] = [];
    let receiptDate: Date | null = null;
    let usedFallback = false;

    try {
      const parsed = await parseWithGemini(bytes, file.type);
      items = parsed.items;
      receiptDate = parsed.receiptDate;
    } catch (error) {
      usedFallback = true;
      const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !region) {
        return NextResponse.json(
          {
            error:
              'Missing GEMINI_API_KEY and AWS credentials or region. Set GEMINI_API_KEY or AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION.',
          },
          { status: 400 }
        );
      }

      const client = new TextractClient({ region });
      const command = new AnalyzeExpenseCommand({
        Document: { Bytes: bytes },
      });
      const response = await client.send(command);

      items = extractLineItems(response);
      receiptDate = extractReceiptDate(response);
    }

    return NextResponse.json({
      items,
      receiptDate: receiptDate ? receiptDate.toISOString() : null,
      fileUrl: signedUrlData.signedUrl,
      usedFallback,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse receipt' },
      { status: 500 }
    );
  }
}
