export function parseNumber(value?: string) {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.\-]/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function normalizeUnit(value?: string) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (['kg', 'kilogram', 'kilograms'].includes(normalized)) return 'kg';
  if (['g', 'gram', 'grams'].includes(normalized)) return 'g';
  if (['l', 'liter', 'liters'].includes(normalized)) return 'L';
  if (['ml', 'milliliter', 'milliliters'].includes(normalized)) return 'mL';
  if (['pc', 'pcs', 'piece', 'pieces'].includes(normalized)) return 'pc';
  return value.trim();
}
