import { getRekonsiliasiKasList } from "@/actions/akuntansi"
import { auth } from "@/lib/auth"
import { csvResponse } from "@/lib/export-utils"

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { searchParams } = new URL(request.url)
  const year = searchParams.get("year") ?? undefined
  const data = await getRekonsiliasiKasList({ year })

  const rows = data.rows.map((row) => ({
    account: row.account.name,
    period_month: row.periodMonth,
    period_year: row.periodYear,
    saldo_buku: Number(row.saldoBook),
    saldo_statement: Number(row.saldoStatement),
    selisih: Number(row.selisih),
    status: row.status,
    dibuat_oleh: row.createdBy.name,
    catatan: row.catatan ?? "",
    bukti_url: row.buktiUrl ?? "",
  }))

  return csvResponse(rows, `laporan-rekonsiliasi-${new Date().toISOString().slice(0, 10)}.csv`)
}
