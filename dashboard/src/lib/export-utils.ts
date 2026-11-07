export type CsvRow = Record<string, string | number | boolean | null | undefined>

export interface ExportReportHeader {
  title: string
  companyName?: string
  generatedAt?: string
  filterInfo?: string[]
}

export interface CsvOptions {
  header?: ExportReportHeader
  totalRow?: CsvRow
}

function csvEscape(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) return ""
  const raw = String(value)
  if (raw.startsWith('="') && raw.endsWith('"')) {
    return raw
  }
  if (raw.includes(",") || raw.includes("\"") || raw.includes("\n") || raw.includes(";")) {
    return `"${raw.replace(/"/g, "\"\"")}"`
  }
  return raw
}

export function formatDateId(date: Date | string | null | undefined): string {
  if (!date) return "-"
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return "-"
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export function formatDateTimeId(date: Date | string | null | undefined): string {
  if (!date) return "-"
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return "-"
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, "0")
  const minutes = String(d.getMinutes()).padStart(2, "0")
  return `${day}/${month}/${year} ${hours}:${minutes} WIB`
}

export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "-"
  const cleaned = phone.replace(/[^\d+]/g, "")
  if (cleaned.startsWith("0") && cleaned.length >= 10) {
    return cleaned.replace(/(\d{4})(\d{3,4})(\d+)/, "$1-$2-$3")
  }
  return cleaned || "-"
}

export function formatExcelText(value: string | number | null | undefined): string {
  if (!value) return ""
  const str = String(value).trim()
  if (!str) return ""
  return `="${str}"`
}

export function rowsToCsv(rows: CsvRow[], options?: CsvOptions) {
  const lines: string[] = []

  if (options?.header) {
    const { title, companyName, generatedAt, filterInfo } = options.header
    if (companyName) {
      lines.push(csvEscape(companyName.toUpperCase()))
    }
    if (title) {
      lines.push(csvEscape(title.toUpperCase()))
    }
    if (generatedAt) {
      lines.push(csvEscape(`Waktu Unduh: ${generatedAt}`))
    }
    if (filterInfo && filterInfo.length > 0) {
      lines.push(csvEscape(`Filter: ${filterInfo.join(" | ")}`))
    }
    lines.push("") // Blank row separator
  }

  if (rows.length === 0) {
    lines.push("info")
    lines.push(csvEscape("Tidak ada data yang sesuai filter"))
    return `${lines.join("\n")}\n`
  }

  const headers = Object.keys(rows[0])
  lines.push(headers.map(csvEscape).join(","))

  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(","))
  }

  if (options?.totalRow) {
    lines.push(headers.map((header) => csvEscape(options.totalRow![header] ?? "")).join(","))
  }

  return `${lines.join("\n")}\n`
}

export function csvResponse(rows: CsvRow[], filename: string, options?: CsvOptions) {
  const csv = rowsToCsv(rows, options)
  return new Response(`\uFEFF${csv}`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}
