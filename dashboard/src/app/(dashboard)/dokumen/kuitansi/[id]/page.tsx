import { getPembayaranById } from "@/actions/pembayaran"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PrintButton } from "@/components/print-button"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import { CompanyDocumentHeader } from "@/components/print/company-document-header"
import { formatPembayaranModeLabel, parsePembayaranCatatan } from "@/lib/pembayaran-notes"
import { getCompanyInfo } from "@/actions/settings"
import { terbilang } from "@/lib/terbilang"

export const metadata = {
  title: "Kuitansi Resmi Pembayaran",
}

function fmt(n: number | string | null | undefined) {
  if (n === null || n === undefined) return "Rp 0"
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n))
}

export default async function KuitansiPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [pembayaran, companyInfo] = await Promise.all([
    getPembayaranById(id),
    getCompanyInfo(),
  ])

  if (!pembayaran) {
    notFound()
  }

  const { pinjaman } = pembayaran
  const { pengajuan } = pinjaman
  const { nasabah, kelompok } = pengajuan
  const parsedCatatan = parsePembayaranCatatan(pembayaran.catatan)
  const modeLabel = formatPembayaranModeLabel(parsedCatatan.mode)
  const totalBayarNum = Number(pembayaran.totalBayar)
  const nominalTerbilang = terbilang(totalBayarNum)

  const receiptSignerName =
    companyInfo.receiptSignerName?.trim() ||
    pembayaran.inputOleh?.name ||
    "Kasir / Petugas Koperasi"

  const tanggalBayarStr = format(
    new Date(pembayaran.tanggalBayar),
    "dd MMMM yyyy, HH:mm 'WIB'",
    { locale: idLocale }
  )

  const tanggalCetakStr = format(new Date(), "dd MMMM yyyy", { locale: idLocale })

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-4xl mx-auto bg-slate-100/70 min-h-screen text-slate-900 print:bg-white print:p-0 print:m-0">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: #ffffff !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-none {
            border: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .page-break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Navigasi & Tombol Aksi */}
      <div className="print:hidden flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <Link href="/pembayaran">
          <Button variant="outline" size="sm" className="gap-2 text-slate-700">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Daftar Pembayaran
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/nasabah/${nasabah.id}`}>
            <Button variant="ghost" size="sm" className="text-slate-600">
              Profil Nasabah
            </Button>
          </Link>
          <PrintButton />
        </div>
      </div>

      {/* Area Lembar Kuitansi Resmi */}
      <div
        id="printable-area"
        className="bg-white rounded-2xl border-2 border-slate-800 p-8 sm:p-10 shadow-lg relative print:shadow-none print:border-2 print:border-slate-800 print:p-8"
      >
        {/* Kop Surat Koperasi */}
        <CompanyDocumentHeader
          documentTitle="KUITANSI PEMBAYARAN"
          documentNumber={`NO. BUKTI: ${pembayaran.nomorTransaksi}`}
        />

        {/* Status Pembayaran Badge & Waktu */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-y border-slate-200 py-2.5 mb-6 bg-slate-50/80 px-4 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Metode Transaksi:</span>
            <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 uppercase">
              {pembayaran.metode || "TUNAI"}
            </span>
            {modeLabel && (
              <span className="text-emerald-800 bg-emerald-100 font-semibold px-2 py-0.5 rounded">
                {modeLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Waktu Transaksi:</span>
            <span className="font-semibold text-slate-800">{tanggalBayarStr}</span>
          </div>
        </div>

        {/* Formulir Kuitansi Formal */}
        <div className="space-y-4 text-xs sm:text-sm">
          {/* Baris 1: Diterima Dari */}
          <div className="grid grid-cols-[160px_1fr] items-start border-b border-slate-100 pb-3">
            <span className="font-semibold text-slate-600 uppercase tracking-wide text-xs">
              Telah Diterima Dari
            </span>
            <div>
              <p className="text-base font-bold text-slate-900">{nasabah.namaLengkap}</p>
              <div className="flex flex-wrap gap-x-4 text-xs text-slate-500 mt-0.5">
                <span>No. Anggota: <strong className="text-slate-800 font-mono">{nasabah.nomorAnggota}</strong></span>
                {nasabah.nik && <span>NIK: <strong className="text-slate-800 font-mono">{nasabah.nik}</strong></span>}
                {kelompok && <span>Kelompok: <strong className="text-slate-800">{kelompok.nama}</strong></span>}
              </div>
            </div>
          </div>

          {/* Baris 2: Uang Sejumlah (Terbilang) */}
          <div className="grid grid-cols-[160px_1fr] items-center border-b border-slate-100 pb-3">
            <span className="font-semibold text-slate-600 uppercase tracking-wide text-xs">
              Uang Sejumlah
            </span>
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-lg p-3">
              <p className="font-serif italic font-semibold text-slate-900 text-sm sm:text-base leading-relaxed tracking-wide">
                # {nominalTerbilang} #
              </p>
            </div>
          </div>

          {/* Baris 3: Untuk Pembayaran */}
          <div className="grid grid-cols-[160px_1fr] items-start border-b border-slate-100 pb-3">
            <span className="font-semibold text-slate-600 uppercase tracking-wide text-xs">
              Untuk Pembayaran
            </span>
            <div className="space-y-1">
              <p className="font-medium text-slate-800">
                Angsuran Pinjaman No. Kontrak{" "}
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                  {pinjaman.nomorKontrak}
                </span>
              </p>
              {parsedCatatan.userNote && (
                <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-200">
                  Catatan: {parsedCatatan.userNote}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabel Breakdown Rincian Alokasi Keuangan */}
        <div className="my-6">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Rincian Alokasi Pembayaran:
          </p>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="p-2.5 font-bold">Komponen Pembayaran</th>
                  <th className="p-2.5 font-bold text-right w-44">Jumlah (Rupiah)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                <tr>
                  <td className="p-2.5 text-slate-700">Porsi Angsuran Pokok Pinjaman</td>
                  <td className="p-2.5 text-right font-mono font-semibold text-slate-900">
                    {fmt(Number(pembayaran.pokok))}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-700">Porsi Jasa / Bunga Pinjaman</td>
                  <td className="p-2.5 text-right font-mono font-semibold text-slate-900">
                    {fmt(Number(pembayaran.bunga))}
                  </td>
                </tr>
                {Number(pembayaran.denda) > 0 && (
                  <tr className="bg-rose-50/30">
                    <td className="p-2.5 text-rose-700 font-medium">Denda Keterlambatan</td>
                    <td className="p-2.5 text-right font-mono font-bold text-rose-700">
                      {fmt(Number(pembayaran.denda))}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300">
                <tr>
                  <td className="p-2.5 text-slate-900 uppercase text-xs">Total Diterima Kasir</td>
                  <td className="p-2.5 text-right font-mono text-sm text-emerald-800">
                    {fmt(totalBayarNum)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Informasi Status Sisa Saldo */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-8 text-xs">
          <div>
            <span className="text-slate-500 block">Sisa Pokok Pinjaman Setelah Pembayaran Ini:</span>
            <span className="text-base font-extrabold font-mono text-slate-900">
              {fmt(Number(pinjaman.sisaPinjaman))}
            </span>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-100/80 px-2.5 py-1 rounded-full text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" /> Pembayaran Terverifikasi Sistem
            </span>
          </div>
        </div>

        {/* Nominal Besar & Tanda Tangan */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end pt-4">
          {/* Kotak Nominal Bold */}
          <div className="border-2 border-slate-900 rounded-xl p-4 bg-slate-900 text-white text-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300 block mb-1">
              Jumlah Diterima
            </span>
            <span className="text-2xl font-black font-mono tracking-tight">
              {fmt(totalBayarNum)}
            </span>
          </div>

          {/* Tanda Tangan Pembayar */}
          <div className="text-center text-xs">
            <p className="text-slate-500 font-medium mb-16">Penyetor / Nasabah</p>
            <p className="font-bold text-slate-900 border-t border-slate-400 pt-1.5 uppercase">
              {nasabah.namaLengkap}
            </p>
            <p className="text-[10px] text-slate-500">Anggota #{nasabah.nomorAnggota}</p>
          </div>

          {/* Tanda Tangan Penerima Kasir */}
          <div className="text-center text-xs">
            <p className="text-slate-500 font-medium mb-1">
              Diterima di Kantor Koperasi,
            </p>
            <p className="text-[11px] text-slate-500 mb-14">{tanggalCetakStr}</p>
            <p className="font-bold text-slate-900 border-t border-slate-400 pt-1.5 uppercase">
              {receiptSignerName}
            </p>
            <p className="text-[10px] text-slate-500">Kasir / Bagian Keuangan</p>
          </div>
        </div>

        {/* Watermark Jika Dibatalkan */}
        {pembayaran.isBatalkan && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
            <div className="text-red-600 text-7xl sm:text-8xl font-black uppercase rotate-[-25deg] tracking-widest border-8 border-red-600 p-8 rounded-3xl">
              DIBATALKAN
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
