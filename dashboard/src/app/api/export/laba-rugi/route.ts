import { getLabaRugiSummary } from "@/actions/kas"
import { auth } from "@/lib/auth"
import { csvResponse, type CsvRow } from "@/lib/export-utils"

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { searchParams } = new URL(request.url)
  const data = await getLabaRugiSummary({
    periodMode: searchParams.get("periodMode") ?? undefined,
    month: searchParams.get("month") ?? undefined,
    year: searchParams.get("year") ?? undefined,
    week: searchParams.get("week") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  })

  const rows: CsvRow[] = []
  for (const row of data.pendapatan) rows.push({ kelompok: "PENDAPATAN", label: row.label, jumlah: row.jumlah })
  for (const row of data.beban) rows.push({ kelompok: "BEBAN", label: row.label, jumlah: row.jumlah })
  rows.push({ kelompok: "TOTAL", label: "Total Pendapatan", jumlah: data.totalPendapatan })
  rows.push({ kelompok: "TOTAL", label: "Total Beban", jumlah: data.totalBeban })
  rows.push({ kelompok: "TOTAL", label: "Laba Bersih", jumlah: data.laba })

  return csvResponse(rows, `laporan-laba-rugi-${new Date().toISOString().slice(0, 10)}.csv`)
}

