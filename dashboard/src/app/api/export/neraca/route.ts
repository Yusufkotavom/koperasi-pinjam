import { getNeracaSederhana } from "@/actions/akuntansi"
import { auth } from "@/lib/auth"
import { csvResponse, type CsvRow } from "@/lib/export-utils"

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { searchParams } = new URL(request.url)
  const data = await getNeracaSederhana({
    periodMode: searchParams.get("periodMode") ?? undefined,
    month: searchParams.get("month") ?? undefined,
    year: searchParams.get("year") ?? undefined,
    week: searchParams.get("week") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  })

  const rows: CsvRow[] = []
  for (const row of data.aset) rows.push({ kelompok: "ASET", code: row.code, label: row.label, nilai: row.nilai })
  for (const row of data.kewajiban) rows.push({ kelompok: "KEWAJIBAN", code: row.code, label: row.label, nilai: row.nilai })
  for (const row of data.ekuitas) rows.push({ kelompok: "EKUITAS", code: row.code, label: row.label, nilai: row.nilai })
  rows.push({ kelompok: "TOTAL", code: "ASET", label: "Total Aset", nilai: data.totals.totalAset })
  rows.push({ kelompok: "TOTAL", code: "K+E", label: "Total Kewajiban + Ekuitas", nilai: data.totals.totalKewajibanEkuitas })
  rows.push({ kelompok: "TOTAL", code: "SELISIH", label: "Selisih", nilai: data.totals.selisih })

  return csvResponse(rows, `laporan-neraca-${new Date().toISOString().slice(0, 10)}.csv`)
}

