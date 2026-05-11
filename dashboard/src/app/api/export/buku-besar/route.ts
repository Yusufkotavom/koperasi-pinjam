import { getLedgerKasReport } from "@/actions/akuntansi"
import { auth } from "@/lib/auth"
import { csvResponse } from "@/lib/export-utils"

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { searchParams } = new URL(request.url)
  const report = await getLedgerKasReport({
    kasJenis: searchParams.get("kasJenis") ?? undefined,
    accountId: searchParams.get("accountId") ?? undefined,
    periodMode: searchParams.get("periodMode") ?? undefined,
    month: searchParams.get("month") ?? undefined,
    year: searchParams.get("year") ?? undefined,
    week: searchParams.get("week") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  })

  const rows = report.data.map((row) => ({
    tanggal: new Date(row.tanggal).toISOString().slice(0, 10),
    kategori: row.kategori,
    detail_jenis: row.detail.jenis,
    detail_nama: row.detail.nama,
    detail_nomor_anggota: row.detail.nomorAnggota ?? "",
    detail_referensi: row.detail.referensi ?? "",
    detail_metode: row.detail.metode ?? "",
    detail_kategori_kas: row.detail.kategoriKas ?? "",
    deskripsi: row.deskripsi,
    debit: row.debit,
    kredit: row.kredit,
    saldo: row.saldo,
    input_oleh: row.inputOleh,
    bukti_url: row.buktiUrl ?? "",
  }))

  return csvResponse(rows, `laporan-buku-besar-${new Date().toISOString().slice(0, 10)}.csv`)
}
