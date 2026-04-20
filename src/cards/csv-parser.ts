/**
 * Minimal CSV parser supporting:
 *   - quoted fields (commas, newlines, and "" escapes inside quotes)
 *   - unquoted fields
 *   - CRLF or LF line endings
 *   - a header row producing row objects keyed by column name
 *
 * Returns an array of records (header → cell value) plus the raw header order.
 */
export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

export function parseCsv(text: string): ParsedCsv {
  const cells = tokenize(text);
  if (cells.length === 0) {
    return { headers: [], rows: [] };
  }
  const [headerRow, ...dataRows] = cells;
  const headers = headerRow.map((h) => h.trim());

  const rows: Record<string, string>[] = [];
  for (const row of dataRows) {
    if (row.length === 1 && row[0] === "") continue; // skip blank lines
    const record: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      record[headers[i]] = (row[i] ?? "").trim();
    }
    rows.push(record);
  }

  return { headers, rows };
}

function tokenize(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;
  // Strip a leading UTF-8 BOM so CSVs authored by Excel / our own
  // `downloadCardsExport` (which adds a BOM for Excel rendering) still
  // round-trip through the loader cleanly.
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      current.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\r") {
      // swallow; \n on the next iteration ends the row
      i++;
      continue;
    }
    if (ch === "\n") {
      current.push(field);
      rows.push(current);
      current = [];
      field = "";
      i++;
      continue;
    }

    field += ch;
    i++;
  }

  // trailing field / row
  if (field.length > 0 || current.length > 0) {
    current.push(field);
    rows.push(current);
  }

  return rows;
}
