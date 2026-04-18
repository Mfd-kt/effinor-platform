/**
 * Parse CSV minimal (virgule, guillemets doubles, échappement "").
 * Gère retours chariot \n et \r\n.
 */
export function parseCsvRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let i = 0;
  let inQuotes = false;
  const len = input.length;

  while (i < len) {
    const c = input[i]!;

    if (inQuotes) {
      if (c === '"') {
        if (i + 1 < len && input[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      cell += c;
      i++;
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(cell);
      cell = "";
      i++;
      continue;
    }
    if (c === "\n" || c === "\r") {
      if (c === "\r" && i + 1 < len && input[i + 1] === "\n") {
        i++;
      }
      row.push(cell);
      cell = "";
      rows.push(row);
      row = [];
      i++;
      continue;
    }
    cell += c;
    i++;
  }

  row.push(cell);
  const lastEmpty = row.length === 0 || row.every((x) => x.trim() === "");
  if (!lastEmpty || rows.length === 0) {
    rows.push(row);
  }

  return rows;
}

/** Retire les lignes entièrement vides (toutes cellules vides après trim). */
export function dropEmptyCsvRows(rows: string[][]): string[][] {
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}
