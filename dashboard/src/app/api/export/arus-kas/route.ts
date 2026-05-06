import { getArusKasReport } from "@/actions/kas"
import { auth } from "@/lib/auth"
import { csvResponse } from "@/lib/export-utils"

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { searchParams } = new URL(request.url)
  const groupBy = searchParams.get("groupBy") === "WEEK" ? "WEEK" : "MONTH"
  const from = searchParams.get("from") ?? undefined
  const to = searchParams.get("to") ?? undefined
  const report = await getArusKasReport({ groupBy, from, to })

  const rows = report.data.map((row) => ({
    periode: row.key,
    kas_masuk: row.masuk,
    kas_keluar: row.keluar,
    surplus: row.surplus,
  }))

  rows.push({
    periode: "TOTAL",
    kas_masuk: report.totals.masuk,
    kas_keluar: report.totals.keluar,
    surplus: report.totals.surplus,
  })

  return csvResponse(rows, `laporan-arus-kas-${new Date().toISOString().slice(0, 10)}.csv`)
}

