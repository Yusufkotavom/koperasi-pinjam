export type CsvRow = Record<string, string | number | boolean | null | undefined>

function csvEscape(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) return ""
  const raw = String(value)
  if (raw.includes(",") || raw.includes("\"") || raw.includes("\n")) {
    return `"${raw.replace(/"/g, "\"\"")}"`
  }
  return raw
}

export function rowsToCsv(rows: CsvRow[]) {
  if (rows.length === 0) return "info\nTidak ada data\n"
  const headers = Object.keys(rows[0])
  const lines = [headers.join(",")]
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(","))
  }
  return `${lines.join("\n")}\n`
}

export function csvResponse(rows: CsvRow[], filename: string) {
  const csv = rowsToCsv(rows)
  return new Response(`\uFEFF${csv}`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}

