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
        <Link href="/pencairan">
          <Button variant="outline" size="sm" className="gap-2 text-slate-700">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Antrean Pencairan
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/dokumen/kartu-angsuran/${pinjaman.id}`}>
            <Button variant="ghost" size="sm" className="text-slate-600">
              Kartu Angsuran
            </Button>
          </Link>
          <PrintButton />
        </div>
      </div>

      {/* Lembar Bukti Pencairan Resmi */}
      <div
        id="printable-area"
        className="bg-white rounded-2xl border-2 border-slate-800 p-8 sm:p-10 shadow-lg relative print:shadow-none print:border-2 print:border-slate-800 print:p-8"
      >
        {/* Kop Surat Koperasi */}
        <CompanyDocumentHeader
          documentTitle="BUKTI PENCAIRAN PINJAMAN"
          documentNumber={`KONTRAK: ${pinjaman.nomorKontrak}`}
        />

        {/* Sub Header Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-y border-slate-200 py-2.5 mb-6 bg-slate-50/80 px-4 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">No. Pengajuan:</span>
            <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              {pengajuan.nomorPengajuan}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded font-semibold bg-emerald-100 text-emerald-800">
              Fasilitas {pengajuan.jenisPinjaman}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Tanggal Realisasi:</span>
            <span className="font-semibold text-slate-900">{tanggalCairStr}</span>
          </div>
        </div>

        {/* Data Debitur & Pinjaman */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-6">
          {/* Box Kiri: Debitur */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200 font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Penerima Dana (Debitur)
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-1 pt-1">
              <span className="text-slate-500">Nama Lengkap</span>
              <span className="font-bold text-slate-900">: {nasabah.namaLengkap}</span>

              <span className="text-slate-500">No. Anggota</span>
              <span className="font-mono font-semibold text-slate-800">: {nasabah.nomorAnggota}</span>

              <span className="text-slate-500">NIK (KTP)</span>
              <span className="font-mono text-slate-800">: {nasabah.nik || "—"}</span>

              <span className="text-slate-500">No. HP / WA</span>
              <span className="text-slate-800">: {nasabah.noHp || "—"}</span>

              <span className="text-slate-500">Kelompok</span>
              <span className="text-slate-800">: {kelompok ? kelompok.nama : "Individu"}</span>

              <span className="text-slate-500">Alamat</span>
              <span className="text-slate-700 leading-relaxed">: {nasabah.alamat || "—"}</span>
            </div>
          </div>

          {/* Box Kanan: Ringkasan Fasilitas */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200 font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              <Banknote className="w-3.5 h-3.5 text-blue-600" />
              Ketentuan Fasilitas Pinjaman
            </div>
            <div className="grid grid-cols-[110px_1fr] gap-1 pt-1">
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

              <span className="text-slate-500">Jatuh Tempo Akhir</span>
              <span className="text-rose-700 font-semibold">: {tanggalJatuhTempoStr}</span>

              <span className="text-slate-500">Sumber Dana</span>
              <span className="text-slate-800 uppercase">
                : {pinjaman.sumberDana || "KAS KOPERASI"}
              </span>
            </div>
          </div>
        </div>

        {/* Khusus Kredit Barang: Panel Informasi Barang & DP */}
        {isBarang && (
          <div className="mb-6 border border-amber-300 rounded-xl p-4 bg-amber-50/60 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200 mb-2">
              <span className="font-bold text-amber-900 uppercase tracking-wide">
                Rincian Fasilitas Kredit Barang (Opsi A)
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> DP LUNAS
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-amber-700 block text-[11px]">Nama Barang</span>
                <span className="font-bold text-slate-900">{pengajuan.namaBarang || "—"}</span>
              </div>
              <div>
                <span className="text-amber-700 block text-[11px]">Vendor / Toko</span>
                <span className="font-semibold text-slate-900">{pengajuan.vendorBarang || "—"}</span>
              </div>
              <div>
                <span className="text-amber-700 block text-[11px]">Harga Asli Barang</span>
                <span className="font-bold text-slate-900">{fmt(Number(pengajuan.hargaBarang || 0))}</span>
              </div>
              <div>
                <span className="text-amber-700 block text-[11px]">Uang Muka (DP) Disetor</span>
                <span className="font-bold text-emerald-700">{fmt(Number(pengajuan.uangMuka || 0))}</span>
              </div>
            </div>
          </div>
        )}

        {/* Rincian Realisasi Pencairan (Tabel Finansial) */}
        <div className="mb-6">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Perhitungan Realisasi Dana Diterima:
          </p>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="p-2.5 font-bold">Keterangan Komponen</th>
                  <th className="p-2.5 font-bold text-right w-44">Jumlah (Rupiah)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                <tr>
                  <td className="p-2.5 font-medium text-slate-800">
                    Plafon Pinjaman Pokok Disetujui
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                    {fmt(Number(pinjaman.pokokPinjaman))}
                  </td>
                </tr>

                {Number(pinjaman.potonganAdmin) > 0 && (
                  <tr className="bg-slate-50/50">
                    <td className="p-2.5 text-rose-600 italic">
                      Dikurangi: Biaya Administrasi
                    </td>
                    <td className="p-2.5 text-right font-mono text-rose-600 font-medium">
                      - {fmt(Number(pinjaman.potonganAdmin))}
                    </td>
                  </tr>
                )}

                {Number(pinjaman.potonganProvisi) > 0 && (
                  <tr className="bg-slate-50/50">
                    <td className="p-2.5 text-rose-600 italic">
                      Dikurangi: Biaya Provisi / Premi Risiko
                    </td>
                    <td className="p-2.5 text-right font-mono text-rose-600 font-medium">
                      - {fmt(Number(pinjaman.potonganProvisi))}
                    </td>
                  </tr>
                )}

                <tr className="bg-emerald-50/60 font-bold border-t-2 border-slate-300">
                  <td className="p-3 text-emerald-950 uppercase text-xs">
                    Total Dana Bersih Diterima (Nilai Cair Net)
                  </td>
                  <td className="p-3 text-right font-mono text-base text-emerald-800">
                    {fmt(nilaiCairNum)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Uang Sejumlah (Terbilang) */}
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 mb-6 text-xs sm:text-sm">
          <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block mb-0.5">
            Terbilang Dana Diterima:
          </span>
          <p className="font-serif italic font-semibold text-slate-900 leading-relaxed">
            # {nilaiCairTerbilang} #
          </p>
        </div>

        {/* Klausul Pernyataan Debitur */}
        <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/70 text-[11px] text-slate-600 leading-relaxed mb-8">
          <p className="font-bold text-slate-800 uppercase tracking-wide mb-1">
            Pernyataan Tanda Terima & Akad Pinjaman:
          </p>
          <p>
            Dengan menandatangani bukti ini, saya (<strong className="text-slate-900">{nasabah.namaLengkap}</strong>) menyatakan telah menerima dana pinjaman secara penuh dan benar sesuai rincian di atas. Saya berjanji dan mengikatkan diri untuk mematuhi seluruh kewajiban angsuran sebesar <strong className="text-slate-900">{fmt(Number(pinjaman.totalAngsuran))}</strong> per {periodeLabel.toLowerCase()} sampai dengan lunas sesuai jadwal yang ditetapkan koperasi.
          </p>
        </div>

        {/* Area Tanda Tangan Formal */}
        <div className="grid grid-cols-3 gap-6 pt-2 text-center text-xs">
          <div>
            <p className="text-slate-500 font-medium">Penerima Dana (Debitur)</p>
            <div className="h-20 flex items-end justify-center">
              <span className="text-[10px] text-slate-400 italic">Materai jika perlu</span>
            </div>
            <p className="font-bold text-slate-900 border-t border-slate-400 pt-1.5 uppercase">
              {nasabah.namaLengkap}
            </p>
            <p className="text-[10px] text-slate-500">Anggota #{nasabah.nomorAnggota}</p>
          </div>

          <div>
            <p className="text-slate-500 font-medium">Petugas Kasir / Bendahara</p>
            <div className="h-20" />
            <p className="font-bold text-slate-900 border-t border-slate-400 pt-1.5">
              ( ......................................... )
            </p>
            <p className="text-[10px] text-slate-500">Bagian Keuangan / Kas</p>
          </div>

          <div>
            <p className="text-slate-500 font-medium">
              {companyInfo.name || "Koperasi"},{" "}
              <span className="font-normal">{tanggalCairStr}</span>
            </p>
            <div className="h-20 flex items-center justify-center">
              <span className="text-[10px] text-slate-400 italic">[ Cap & Tanda Tangan ]</span>
            </div>
            <p className="font-bold text-slate-900 border-t border-slate-400 pt-1.5 uppercase">
              {receiptSignerName}
            </p>
            <p className="text-[10px] text-slate-500">Pengurus / Pejabat Persetujuan</p>
          </div>
        </div>
      </div>
    </div>
  )
}
