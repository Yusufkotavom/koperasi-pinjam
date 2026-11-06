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
    <div className="p-3 sm:p-6 max-w-3xl mx-auto min-h-screen text-slate-900 print:p-0 print:m-0 print:max-w-none print:min-h-0 print:w-full">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .doc-sheet {
            padding: 0 !important;
            border: 2px solid #1e293b !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
        }
      `}</style>

      {/* Navigasi & Tombol Aksi (Screen Only) */}
      <div className="print:hidden flex justify-between items-center bg-white p-3.5 mb-4 rounded-xl border border-slate-200 shadow-sm">
        <Link href="/pembayaran">
          <Button variant="outline" size="sm" className="gap-2 text-slate-700 h-8">
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Daftar Pembayaran
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/nasabah/${nasabah.id}`}>
            <Button variant="ghost" size="sm" className="text-slate-600 h-8 text-xs">
              Profil Nasabah
            </Button>
          </Link>
          <PrintButton />
        </div>
      </div>

      {/* Area Lembar Kuitansi Resmi */}
      <div
        id="printable-area"
        className="doc-sheet bg-white rounded-xl border-2 border-slate-800 p-6 sm:p-8 shadow-md relative print:shadow-none print:border-2 print:border-slate-800 print:p-6 print:rounded-none"
      >
        {/* Kop Surat Koperasi */}
        <CompanyDocumentHeader
          documentTitle="KUITANSI PEMBAYARAN"
          documentNumber={`NO. BUKTI: ${pembayaran.nomorTransaksi}`}
          compact={true}
        />

        {/* Status Pembayaran Badge & Waktu */}
        <div className="flex flex-wrap items-center justify-between gap-2 border border-slate-200 py-1.5 px-3 mb-3.5 bg-slate-50/90 rounded text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Metode:</span>
            <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 uppercase text-[10.5px]">
              {pembayaran.metode || "TUNAI"}
            </span>
            {modeLabel && (
              <span className="text-emerald-800 bg-emerald-100 font-semibold px-2 py-0.5 rounded text-[10.5px]">
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
        <div className="space-y-2.5 text-xs">
          {/* Baris 1: Diterima Dari */}
          <div className="grid grid-cols-[130px_1fr] items-start border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-600 uppercase tracking-wide text-[10.5px]">
              Telah Diterima Dari
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">{nasabah.namaLengkap}</p>
              <div className="flex flex-wrap gap-x-3 text-[10.5px] text-slate-500 mt-0.5">
                <span>No. Anggota: <strong className="text-slate-800 font-mono">{nasabah.nomorAnggota}</strong></span>
                {nasabah.nik && <span>NIK: <strong className="text-slate-800 font-mono">{nasabah.nik}</strong></span>}
                {kelompok && <span>Kelompok: <strong className="text-slate-800">{kelompok.nama}</strong></span>}
              </div>
            </div>
          </div>

          {/* Baris 2: Uang Sejumlah (Terbilang) */}
          <div className="grid grid-cols-[130px_1fr] items-center border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-600 uppercase tracking-wide text-[10.5px]">
              Uang Sejumlah
            </span>
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-md p-2">
              <p className="font-serif italic font-semibold text-slate-900 text-xs sm:text-sm leading-snug">
                # {nominalTerbilang} #
              </p>
            </div>
          </div>

          {/* Baris 3: Untuk Pembayaran */}
          <div className="grid grid-cols-[130px_1fr] items-start border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-600 uppercase tracking-wide text-[10.5px]">
              Untuk Pembayaran
            </span>
            <div className="space-y-0.5">
              <p className="font-medium text-slate-800 text-xs">
                Angsuran Pinjaman No. Kontrak{" "}
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                  {pinjaman.nomorKontrak}
                </span>
              </p>
              {parsedCatatan.userNote && (
                <p className="text-[10.5px] text-slate-600 italic bg-slate-50 p-1.5 rounded border border-slate-200">
                  Catatan: {parsedCatatan.userNote}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabel Breakdown Rincian Alokasi Keuangan */}
        <div className="my-3">
          <p className="text-[10.5px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            Rincian Alokasi Pembayaran:
          </p>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 text-[10.5px]">
                <tr>
                  <th className="py-1.5 px-2.5 font-bold">Komponen Pembayaran</th>
                  <th className="py-1.5 px-2.5 font-bold text-right w-40">Jumlah (Rupiah)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-[11px]">
                <tr>
                  <td className="py-1 px-2.5 text-slate-700">Porsi Angsuran Pokok Pinjaman</td>
                  <td className="py-1 px-2.5 text-right font-mono font-semibold text-slate-900">
                    {fmt(Number(pembayaran.pokok))}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 px-2.5 text-slate-700">Porsi Jasa / Bunga Pinjaman</td>
                  <td className="py-1 px-2.5 text-right font-mono font-semibold text-slate-900">
                    {fmt(Number(pembayaran.bunga))}
                  </td>
                </tr>
                {Number(pembayaran.denda) > 0 && (
                  <tr className="bg-rose-50/40">
                    <td className="py-1 px-2.5 text-rose-700 font-medium">Denda Keterlambatan</td>
                    <td className="py-1 px-2.5 text-right font-mono font-bold text-rose-700">
                      {fmt(Number(pembayaran.denda))}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-300">
                <tr>
                  <td className="py-1.5 px-2.5 text-slate-900 uppercase text-[10.5px]">Total Diterima Kasir</td>
                  <td className="py-1.5 px-2.5 text-right font-mono text-xs sm:text-sm text-emerald-800">
                    {fmt(totalBayarNum)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Informasi Status Sisa Saldo */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2.5 mb-4 text-[11px]">
          <div>
            <span className="text-slate-500 block text-[10px]">Sisa Pokok Pinjaman Setelah Pembayaran Ini:</span>
            <span className="text-sm font-extrabold font-mono text-slate-900">
              {fmt(Number(pinjaman.sisaPinjaman))}
            </span>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-100/90 px-2 py-0.5 rounded text-[10.5px]">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Pembayaran Terverifikasi
            </span>
          </div>
        </div>

        {/* Nominal Besar & Tanda Tangan */}
        <div className="grid grid-cols-3 gap-4 items-end pt-2">
          {/* Kotak Nominal Bold */}
          <div className="border-2 border-slate-900 rounded-lg p-2.5 bg-slate-900 text-white text-center">
            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-300 block mb-0.5">
              Jumlah Diterima
            </span>
            <span className="text-base sm:text-lg font-black font-mono tracking-tight">
              {fmt(totalBayarNum)}
            </span>
          </div>

          {/* Tanda Tangan Pembayar */}
          <div className="text-center text-[10.5px]">
            <p className="text-slate-500 font-medium">Penyetor / Nasabah</p>
            <div className="h-10 flex items-center justify-center">
              <span className="text-[8.5px] text-slate-300 italic">( Tanda Tangan )</span>
            </div>
            <p className="font-bold text-slate-900 border-t border-slate-400 pt-0.5 uppercase truncate">
              {nasabah.namaLengkap}
            </p>
            <p className="text-[9px] text-slate-500">Anggota #{nasabah.nomorAnggota}</p>
          </div>

          {/* Tanda Tangan Penerima Kasir */}
          <div className="text-center text-[10.5px]">
            <p className="text-slate-500 font-medium leading-none">
              Diterima di Kantor Koperasi,
            </p>
            <p className="text-[9.5px] text-slate-500 mt-0.5">{tanggalCetakStr}</p>
            <div className="h-8 flex items-center justify-center">
              <span className="text-[8.5px] text-slate-300 italic">[ Cap & Ttd ]</span>
            </div>
            <p className="font-bold text-slate-900 border-t border-slate-400 pt-0.5 uppercase truncate">
              {receiptSignerName}
            </p>
            <p className="text-[9px] text-slate-500">Kasir / Keuangan</p>
          </div>
        </div>

        {/* Watermark Jika Dibatalkan */}
        {pembayaran.isBatalkan && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
            <div className="text-red-600 text-6xl sm:text-7xl font-black uppercase rotate-[-25deg] tracking-widest border-8 border-red-600 p-6 rounded-3xl">
              DIBATALKAN
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
