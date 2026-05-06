import { getLaporanTransaksiUserReport } from "@/actions/pembayaran"
import { auth } from "@/lib/auth"
import { csvResponse } from "@/lib/export-utils"

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { searchParams } = new URL(request.url)
  const report = await getLaporanTransaksiUserReport({
    kelompokId: searchParams.get("kelompokId") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    periodMode: searchParams.get("periodMode") ?? undefined,
    month: searchParams.get("month") ?? undefined,
    year: searchParams.get("year") ?? undefined,
    week: searchParams.get("week") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  })

  const rows = report.data.map((row) => ({
    nasabah: row.namaLengkap,
    nomor_anggota: row.nomorAnggota,
    kelompok: row.kelompok,
    total_tagihan: row.totalTagihan,
    total_dibayar: row.totalDibayar,
    kurang_angsuran: row.kurangAngsuran,
    outstanding: row.outstanding,
    selesai: row.selesai,
    belum_jatuh_tempo: row.belumJatuhTempo,
    telat: row.telat,
    ranking: row.ranking,
  }))

  return csvResponse(rows, `laporan-transaksi-per-user-${new Date().toISOString().slice(0, 10)}.csv`)
}

