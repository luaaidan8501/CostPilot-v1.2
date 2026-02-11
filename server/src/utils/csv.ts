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

export function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[\s\-]+/g, ' ');
}
