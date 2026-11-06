import { getPengajuanById } from "@/actions/pengajuan"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, ShieldCheck, Banknote } from "lucide-react"
import { PrintButton } from "@/components/print-button"
import { CompanyDocumentHeader } from "@/components/print/company-document-header"
import { getCompanyInfo } from "@/actions/settings"
import { terbilang } from "@/lib/terbilang"

export const metadata = {
  title: "Bukti Pencairan Pinjaman Resmi",
}

function fmt(n: number | string | null | undefined) {
  if (n === null || n === undefined) return "Rp 0"
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n))
}

export default async function PencairanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [pengajuan, companyInfo] = await Promise.all([
    getPengajuanById(id),
    getCompanyInfo(),
  ])

  if (!pengajuan || !pengajuan.pinjaman) {
    notFound()
  }

  const { pinjaman, nasabah, kelompok, approver } = pengajuan
  const isBarang = pengajuan.jenisPinjaman === "BARANG"
  const periodeLabel = pinjaman.tenorType === "MINGGUAN" ? "Minggu" : "Bulan"
  const nilaiCairNum = Number(pinjaman.nilaiCair)
  const nilaiCairTerbilang = terbilang(nilaiCairNum)

  const receiptSignerName =
    companyInfo.receiptSignerName?.trim() ||
    approver?.name ||
    "Pimpinan / Pengurus Koperasi"

  const tanggalCairStr = format(
    new Date(pinjaman.tanggalCair),
    "dd MMMM yyyy",
    { locale: idLocale }
  )

  const tanggalJatuhTempoStr = format(
    new Date(pinjaman.tanggalJatuhTempo),
    "dd MMMM yyyy",
    { locale: idLocale }
  )

  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto min-h-screen text-slate-900 print:p-0 print:m-0 print:max-w-none print:min-h-0 print:w-full">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
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
        <Link href="/pencairan">
          <Button variant="outline" size="sm" className="gap-2 text-slate-700 h-8">
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Antrean Pencairan
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/dokumen/kartu-angsuran/${pinjaman.id}`}>
            <Button variant="ghost" size="sm" className="text-slate-600 h-8 text-xs">
              Kartu Angsuran
            </Button>
          </Link>
          <PrintButton />
        </div>
      </div>

      {/* Lembar Bukti Pencairan Resmi */}
      <div
        id="printable-area"
        className="doc-sheet bg-white rounded-xl border-2 border-slate-800 p-5 sm:p-7 shadow-md relative print:shadow-none print:border-2 print:border-slate-800 print:p-6 print:rounded-none"
      >
        {/* Kop Surat Koperasi */}
        <CompanyDocumentHeader
          documentTitle="BUKTI PENCAIRAN PINJAMAN"
          documentNumber={`KONTRAK: ${pinjaman.nomorKontrak}`}
          compact={true}
        />

        {/* Sub Header Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 border border-slate-200 py-1.5 px-3 mb-2.5 bg-slate-50/90 rounded text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">No. Pengajuan:</span>
            <span className="font-mono font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10.5px]">
              {pengajuan.nomorPengajuan}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded font-semibold bg-emerald-100 text-emerald-800 text-[10.5px]">
              Fasilitas {pengajuan.jenisPinjaman}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Realisasi:</span>
            <span className="font-semibold text-slate-900">{tanggalCairStr}</span>
          </div>
        </div>

        {/* Data Debitur & Pinjaman (2 Kolom Compact) */}
        <div className="grid grid-cols-2 gap-2.5 text-[11px] mb-2.5">
          {/* Box Kiri: Debitur */}
          <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/40">
            <div className="flex items-center gap-1 pb-1 border-b border-slate-200 font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Penerima Dana (Debitur)
            </div>
            <div className="grid grid-cols-[85px_1fr] gap-0.5 pt-1 text-[10.5px]">
              <span className="text-slate-500">Nama Lengkap</span>
              <span className="font-bold text-slate-900 truncate">: {nasabah.namaLengkap}</span>

              <span className="text-slate-500">No. Anggota</span>
              <span className="font-mono font-semibold text-slate-800">: {nasabah.nomorAnggota}</span>

              <span className="text-slate-500">NIK (KTP)</span>
              <span className="font-mono text-slate-800">: {nasabah.nik || "—"}</span>

              <span className="text-slate-500">No. HP / WA</span>
              <span className="text-slate-800">: {nasabah.noHp || "—"}</span>

              <span className="text-slate-500">Kelompok</span>
              <span className="text-slate-800 truncate">: {kelompok ? kelompok.nama : "Individu"}</span>

              <span className="text-slate-500">Alamat</span>
              <span className="text-slate-700 truncate">: {nasabah.alamat || "—"}</span>
            </div>
          </div>

          {/* Box Kanan: Ringkasan Fasilitas */}
          <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/40">
            <div className="flex items-center gap-1 pb-1 border-b border-slate-200 font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              <Banknote className="w-3 h-3 text-blue-600" />
              Ketentuan Fasilitas Pinjaman
            </div>
            <div className="grid grid-cols-[95px_1fr] gap-0.5 pt-1 text-[10.5px]">
              <span className="text-slate-500">Plafon Disetujui</span>
              <span className="font-bold text-slate-900">: {fmt(Number(pinjaman.pokokPinjaman))}</span>

              <span className="text-slate-500">Tenor Kredit</span>
              <span className="font-semibold text-slate-800">
                : {pinjaman.tenor} {periodeLabel} ({pinjaman.tenorType})
              </span>

              <span className="text-slate-500">Suku Bunga</span>
              <span className="text-slate-800">
                : {Number(pinjaman.bungaPerBulan)}% flat per {periodeLabel.toLowerCase()}
              </span>

              <span className="text-slate-500">Angsuran / {periodeLabel}</span>
              <span className="font-bold text-emerald-800">
                : {fmt(Number(pinjaman.totalAngsuran))}
              </span>

              <span className="text-slate-500">Jatuh Tempo</span>
              <span className="text-rose-700 font-semibold">: {tanggalJatuhTempoStr}</span>

              <span className="text-slate-500">Sumber Dana</span>
              <span className="text-slate-800 uppercase truncate">
                : {pinjaman.sumberDana || "KAS KOPERASI"}
              </span>
            </div>
          </div>
        </div>

        {/* Khusus Kredit Barang: Panel Informasi Barang & DP */}
        {isBarang && (
          <div className="mb-2.5 border border-amber-300 rounded-lg p-2.5 bg-amber-50/60 text-[10.5px]">
            <div className="flex items-center justify-between pb-1 border-b border-amber-200 mb-1.5">
              <span className="font-bold text-amber-900 uppercase tracking-wide text-[10px]">
                Rincian Fasilitas Kredit Barang (Opsi A)
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> DP LUNAS
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <span className="text-amber-700 block text-[9.5px]">Barang</span>
                <span className="font-bold text-slate-900 truncate block">{pengajuan.namaBarang || "—"}</span>
              </div>
              <div>
                <span className="text-amber-700 block text-[9.5px]">Vendor</span>
                <span className="font-semibold text-slate-900 truncate block">{pengajuan.vendorBarang || "—"}</span>
              </div>
              <div>
                <span className="text-amber-700 block text-[9.5px]">Harga Asli</span>
                <span className="font-bold text-slate-900">{fmt(Number(pengajuan.hargaBarang || 0))}</span>
              </div>
              <div>
                <span className="text-amber-700 block text-[9.5px]">DP Disetor</span>
                <span className="font-bold text-emerald-700">{fmt(Number(pengajuan.uangMuka || 0))}</span>
              </div>
            </div>
          </div>
        )}

        {/* Rincian Realisasi Pencairan (Tabel Finansial) */}
        <div className="mb-2.5">
          <p className="text-[10.5px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            Perhitungan Realisasi Dana Diterima:
          </p>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 text-[10.5px]">
                <tr>
                  <th className="py-1 px-2.5 font-bold">Keterangan Komponen</th>
                  <th className="py-1 px-2.5 font-bold text-right w-40">Jumlah (Rupiah)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-[11px]">
                <tr>
                  <td className="py-1 px-2.5 font-medium text-slate-800">
                    Plafon Pinjaman Pokok Disetujui
                  </td>
                  <td className="py-1 px-2.5 text-right font-mono font-bold text-slate-900">
                    {fmt(Number(pinjaman.pokokPinjaman))}
                  </td>
                </tr>

                {Number(pinjaman.potonganAdmin) > 0 && (
                  <tr className="bg-slate-50/50">
                    <td className="py-1 px-2.5 text-rose-600 italic">
                      Dikurangi: Biaya Administrasi
                    </td>
                    <td className="py-1 px-2.5 text-right font-mono text-rose-600 font-medium">
                      - {fmt(Number(pinjaman.potonganAdmin))}
                    </td>
                  </tr>
                )}

                {Number(pinjaman.potonganProvisi) > 0 && (
                  <tr className="bg-slate-50/50">
                    <td className="py-1 px-2.5 text-rose-600 italic">
                      Dikurangi: Biaya Provisi / Premi Risiko
                    </td>
                    <td className="py-1 px-2.5 text-right font-mono text-rose-600 font-medium">
                      - {fmt(Number(pinjaman.potonganProvisi))}
                    </td>
                  </tr>
                )}

                <tr className="bg-emerald-50/70 font-bold border-t border-slate-300">
                  <td className="py-1.5 px-2.5 text-emerald-950 uppercase text-[10.5px]">
                    Total Dana Bersih Diterima (Nilai Cair Net)
                  </td>
                  <td className="py-1.5 px-2.5 text-right font-mono text-xs sm:text-sm text-emerald-800">
                    {fmt(nilaiCairNum)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Uang Sejumlah (Terbilang) */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-2 mb-2 text-xs">
          <span className="text-[9.5px] uppercase font-bold text-emerald-800 tracking-wider block leading-none mb-0.5">
            Terbilang Dana Diterima:
          </span>
          <p className="font-serif italic font-semibold text-slate-900 leading-snug">
            # {nilaiCairTerbilang} #
          </p>
        </div>

        {/* Klausul Pernyataan Debitur */}
        <div className="border border-slate-200 rounded-lg p-2 bg-slate-50/60 text-[9.5px] text-slate-600 leading-snug mb-3">
          <p className="font-bold text-slate-800 uppercase tracking-wide mb-0.5">
            Pernyataan Tanda Terima & Akad Pinjaman:
          </p>
          <p>
            Dengan menandatangani bukti ini, saya (<strong className="text-slate-900">{nasabah.namaLengkap}</strong>) menyatakan telah menerima dana pinjaman secara penuh dan benar. Saya berjanji dan mengikatkan diri untuk mematuhi kewajiban angsuran sebesar <strong className="text-slate-900">{fmt(Number(pinjaman.totalAngsuran))}</strong> per {periodeLabel.toLowerCase()} sampai dengan lunas sesuai jadwal koperasi.
          </p>
        </div>

        {/* Area Tanda Tangan Formal */}
        <div className="grid grid-cols-3 gap-4 pt-1 text-center text-[10.5px]">
          <div>
            <p className="text-slate-500 font-medium">Penerima Dana (Debitur)</p>
            <div className="h-10 flex items-center justify-center">
              <span className="text-[8.5px] text-slate-300 italic">( Tanda Tangan )</span>
            </div>
            <p className="font-bold text-slate-900 border-t border-slate-400 pt-0.5 uppercase truncate">
              {nasabah.namaLengkap}
            </p>
            <p className="text-[9px] text-slate-500">Anggota #{nasabah.nomorAnggota}</p>
          </div>

          <div>
            <p className="text-slate-500 font-medium">Petugas Kasir / Kas</p>
            <div className="h-10" />
            <p className="font-bold text-slate-900 border-t border-slate-400 pt-0.5">
              ( ..................................... )
            </p>
            <p className="text-[9px] text-slate-500">Bagian Keuangan</p>
          </div>

          <div>
            <p className="text-slate-500 font-medium">
              {companyInfo.name || "Koperasi"},{" "}
              <span className="font-normal">{tanggalCairStr}</span>
            </p>
            <div className="h-10 flex items-center justify-center">
              <span className="text-[8.5px] text-slate-300 italic">[ Cap & Ttd ]</span>
            </div>
            <p className="font-bold text-slate-900 border-t border-slate-400 pt-0.5 uppercase truncate">
              {receiptSignerName}
            </p>
            <p className="text-[9px] text-slate-500">Pengurus / Pejabat</p>
          </div>
        </div>
      </div>
    </div>
  )
}
