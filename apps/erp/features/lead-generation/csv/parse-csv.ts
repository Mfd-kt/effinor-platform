/**
 * Parser CSV minimaliste, sans dépendance externe.
 * Gère :
 *  - BOM UTF-8
 *  - Auto-détection du délimiteur (`,` ou `;`) d'après la première ligne
 *  - Guillemets doubles avec échappement `""`
 *  - CRLF / LF
 *  - Lignes vides (ignorées)
 *
 * Volontairement simple — couvre 99% des CSV exportés d'Excel, Google Sheets,
 * Dropcontact, data achetée. Si un cas bord casse, on switchera vers papaparse.
 */

export type ParsedCsv = {
  delimiter: ',' | ';'
  headers: string[]
  rows: Record<string, string>[]
  totalLines: number
}

export function parseCsv(text: string): ParsedCsv {
  // 1. BOM
  let t = text
  if (t.charCodeAt(0) === 0xfeff) t = t.slice(1)

  // 2. Délimiteur
  const firstLineEnd = t.search(/\r?\n/)
  const firstLine = firstLineEnd >= 0 ? t.slice(0, firstLineEnd) : t
  const semis = (firstLine.match(/;/g) ?? []).length
  const commas = (firstLine.match(/,/g) ?? []).length
  const delimiter: ',' | ';' = semis > commas ? ';' : ','

  // 3. Tokenize
  const records: string[][] = []
  let field = ''
  let record: string[] = []
  let inQuotes = false

  const push = () => {
    record.push(field)
    field = ''
  }
  const flush = () => {
    if (record.length === 0 && field === '') return
    record.push(field)
    field = ''
    records.push(record)
    record = []
  }

  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (inQuotes) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else {
      if (c === '"') {
        inQuotes = true
      } else if (c === delimiter) {
        push()
      } else if (c === '\r') {
        // On gère via '\n' juste après. Si seul (vieux Mac), on flush.
        if (t[i + 1] !== '\n') {
          flush()
        }
      } else if (c === '\n') {
        flush()
      } else {
        field += c
      }
    }
  }
  if (field.length > 0 || record.length > 0) {
    flush()
  }

  if (records.length === 0) {
    return { delimiter, headers: [], rows: [], totalLines: 0 }
  }

  const headers = records[0]!.map((h) => h.trim())
  const rows: Record<string, string>[] = []

  for (let r = 1; r < records.length; r++) {
    const raw = records[r]!
    // Ligne vide (tous champs blancs) → ignorer
    if (raw.every((v) => v.trim().length === 0)) continue
    const obj: Record<string, string> = {}
    for (let h = 0; h < headers.length; h++) {
      obj[headers[h]!] = (raw[h] ?? '').trim()
    }
    rows.push(obj)
  }

  return {
    delimiter,
    headers,
    rows,
    totalLines: records.length,
  }
}
