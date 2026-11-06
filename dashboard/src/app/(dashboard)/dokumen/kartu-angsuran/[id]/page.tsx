import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from "lucide-react"
import { PrintButton } from "@/components/print-button"
import { CompanyDocumentHeader } from "@/components/print/company-document-header"
import { getCompanyInfo } from "@/actions/settings"

export const metadata = {
  title: "Kartu Angsuran Pinjaman",
}

function fmt(n: number | string | null | undefined) {
  if (n === null || n === undefined) return "Rp 0"
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n))
}

export default async function KartuAngsuranPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [pinjaman, companyInfo] = await Promise.all([
    prisma.pinjaman.findUnique({
      where: { id },
      include: {
        pengajuan: {
          include: {
            nasabah: true,
            kelompok: true,
            approver: true,
            surveyor: true,
          },
        },
        jadwalAngsuran: {
          orderBy: { angsuranKe: "asc" },
        },
        pembayaran: {
          where: { isBatalkan: false },
          orderBy: { tanggalBayar: "asc" },
          include: {
            inputOleh: {
              select: { name: true },
            },
          },
        },
      },
    }),
    getCompanyInfo(),
  ])

  if (!pinjaman) {
    notFound()
  }

  const { pengajuan, jadwalAngsuran, pembayaran } = pinjaman
  const nasabah = pengajuan.nasabah
  const kelompok = pengajuan.kelompok

  // Kalkulasi agregat keuangan
  const totalPokok = Number(pinjaman.pokokPinjaman)
  const totalBunga = jadwalAngsuran.reduce((sum, j) => sum + Number(j.bunga), 0)
  const grandTotalKewajiban = totalPokok + totalBunga
  const tagihanPerPeriode = Number(pinjaman.totalAngsuran)
  const periodeLabel = pinjaman.tenorType === "MINGGUAN" ? "Minggu" : "Bulan"

  // Statistik Pembayaran
  const terbayarJadwal = jadwalAngsuran.filter((j) => j.sudahDibayar)
  const jumlahCicilanLunas = terbayarJadwal.length
  const totalCicilan = jadwalAngsuran.length
  const totalNominalTerbayar = pembayaran.reduce((sum, p) => sum + Number(p.totalBayar), 0)
  const sisaPokokAktual = Number(pinjaman.sisaPinjaman)

  // Map pembayaran by tanggal
  const pembayaranByDate = new Map<string, (typeof pembayaran)[0]>()
  for (const p of pembayaran) {
    const key = format(new Date(p.tanggalBayar), "yyyy-MM-dd")
    pembayaranByDate.set(key, p)
  }

  // Running balance calculation
  let runningPrincipal = totalPokok

  const signerOfficer =
    companyInfo.receiptSignerName?.trim() ||
    pengajuan.approver?.name ||
    "Petugas Operasional"

  const todayStr = format(new Date(), "dd MMMM yyyy", { locale: idLocale })

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto bg-slate-100/70 min-h-screen text-slate-900 print:bg-white print:p-0 print:m-0">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 12mm 12mm;
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

      {/* Navigasi & Tombol Aksi (Hidden saat cetak) */}
      <div className="print:hidden flex flex-wrap justify-between items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <Link href={`/nasabah/${nasabah.id}`}>
          <Button variant="outline" size="sm" className="gap-2 text-slate-700">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Profil Nasabah
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/pinjaman/${pinjaman.id}`}>
            <Button variant="ghost" size="sm" className="text-slate-600">
              Detail Pinjaman
            </Button>
          </Link>
          <PrintButton />
        </div>
      </div>

      {/* Lembar Dokumen Fisik */}
      <div
        id="printable-area"
        className="bg-white rounded-2xl border border-slate-300/80 p-8 sm:p-10 shadow-lg relative print:shadow-none print:border-none print:p-0 print:rounded-none"
      >
        {/* Kop Surat Koperasi */}
        <CompanyDocumentHeader
          documentTitle="KARTU ANGSURAN PINJAMAN"
          documentNumber={`KONTRAK: ${pinjaman.nomorKontrak}`}
        />

        {/* Sub Header Badge & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-y border-slate-200 py-3 mb-6 bg-slate-50/70 px-4 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Jenis Fasilitas:
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Pinjaman {pengajuan.jenisPinjaman} ({periodeLabel}an)
            </span>
            {pengajuan.jenisPinjaman === "BARANG" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800">
                Kredit Barang
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Status Pinjaman:
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${
                pinjaman.status === "LUNAS"
                  ? "bg-emerald-600 text-white"
                  : pinjaman.status === "MACET"
                    ? "bg-rose-600 text-white"
                    : "bg-blue-600 text-white"
              }`}
            >
              {pinjaman.status === "LUNAS" ? "✓ LUNAS" : pinjaman.status}
            </span>
          </div>
        </div>

        {/* Info Grid (Debitur & Pinjaman) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-6">
          {/* Kolom Kiri: Identitas Nasabah */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Identitas Debitur (Anggota)
            </div>
            <div className="grid grid-cols-[110px_1fr] gap-1.5 pt-1">
              <span className="text-slate-500">Nama Lengkap</span>
              <span className="font-bold text-slate-900">: {nasabah.namaLengkap}</span>

              <span className="text-slate-500">No. Anggota</span>
              <span className="font-mono font-semibold text-slate-800">: {nasabah.nomorAnggota}</span>

              <span className="text-slate-500">NIK (KTP)</span>
              <span className="font-mono text-slate-800">: {nasabah.nik || "—"}</span>

              <span className="text-slate-500">No. HP / WA</span>
              <span className="text-slate-800">: {nasabah.noHp || "—"}</span>

              <span className="text-slate-500">Kelompok / Resor</span>
              <span className="text-slate-800">
                : {kelompok ? `${kelompok.nama} (${kelompok.kode})` : "Individu / Mandiri"}
              </span>

              <span className="text-slate-500">Alamat Tinggal</span>
              <span className="text-slate-700 leading-relaxed">: {nasabah.alamat || "—"}</span>
            </div>
          </div>

          {/* Kolom Kanan: Detail Fasilitas Pinjaman */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Rincian Kontrak Pinjaman
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-1.5 pt-1">
              <span className="text-slate-500">No. Kontrak</span>
              <span className="font-mono font-bold text-slate-900">: {pinjaman.nomorKontrak}</span>

              <span className="text-slate-500">Tanggal Pencairan</span>
              <span className="font-semibold text-slate-800">
                : {format(new Date(pinjaman.tanggalCair), "dd MMMM yyyy", { locale: idLocale })}
              </span>

              <span className="text-slate-500">Plafon Pinjaman</span>
              <span className="font-bold text-slate-900">: {fmt(totalPokok)}</span>

              <span className="text-slate-500">Tenor Pinjaman</span>
              <span className="font-semibold text-slate-800">
                : {pinjaman.tenor} {periodeLabel} ({fmt(tagihanPerPeriode)} / {periodeLabel.toLowerCase()})
              </span>

              <span className="text-slate-500">Bunga Pinjaman</span>
              <span className="text-slate-800">
                : {Number(pinjaman.bungaPerBulan)}% flat per {periodeLabel.toLowerCase()} (Total: {fmt(totalBunga)})
              </span>

              <span className="text-slate-500">Jatuh Tempo Akhir</span>
              <span className="font-semibold text-rose-700">
                : {format(new Date(pinjaman.tanggalJatuhTempo), "dd MMMM yyyy", { locale: idLocale })}
              </span>

              {pengajuan.jenisPinjaman === "BARANG" && pengajuan.namaBarang && (
                <>
                  <span className="text-amber-700 font-medium">Barang & DP</span>
                  <span className="text-amber-900">
                    : {pengajuan.namaBarang} (DP: {fmt(Number(pengajuan.uangMuka || 0))})
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Ringkasan Progres Pinjaman */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="border border-slate-200 rounded-lg p-3 bg-white text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Kewajiban</span>
            <span className="text-sm font-extrabold text-slate-900">{fmt(grandTotalKewajiban)}</span>
          </div>
          <div className="border border-slate-200 rounded-lg p-3 bg-emerald-50/50 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Sudah Dibayar</span>
            <span className="text-sm font-extrabold text-emerald-700">{fmt(totalNominalTerbayar)}</span>
          </div>
          <div className="border border-slate-200 rounded-lg p-3 bg-rose-50/50 text-center">
            <span className="text-[10px] uppercase font-bold text-rose-700 block">Sisa Pokok</span>
            <span className="text-sm font-extrabold text-rose-700">{fmt(sisaPokokAktual)}</span>
          </div>
          <div className="border border-slate-200 rounded-lg p-3 bg-blue-50/50 text-center">
            <span className="text-[10px] uppercase font-bold text-blue-700 block">Progres Cicilan</span>
            <span className="text-sm font-extrabold text-blue-800">
              {jumlahCicilanLunas} / {totalCicilan} ({Math.round((jumlahCicilanLunas / totalCicilan) * 100)}%)
            </span>
          </div>
        </div>

        {/* Tabel Jadwal Angsuran & Lembar Kontrol */}
        <div className="mb-6 overflow-hidden rounded-xl border border-slate-300">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white font-semibold tracking-wider text-[11px]">
                <th className="p-2.5 text-center w-10 border-r border-slate-700">Ke</th>
                <th className="p-2.5 text-center w-28 border-r border-slate-700">Jatuh Tempo</th>
                <th className="p-2.5 text-right w-24 border-r border-slate-700">Pokok</th>
                <th className="p-2.5 text-right w-24 border-r border-slate-700">Jasa/Bunga</th>
                <th className="p-2.5 text-right w-28 border-r border-slate-700">Total Tagihan</th>
                <th className="p-2.5 text-right w-28 border-r border-slate-700">Sisa Pokok</th>
                <th className="p-2.5 text-center w-28 border-r border-slate-700">Tgl Bayar</th>
                <th className="p-2.5 text-right w-28 border-r border-slate-700">Jml Dibayar</th>
                <th className="p-2.5 text-center">Paraf / Bukti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {jadwalAngsuran.map((j) => {
                const payKey = j.tanggalBayar ? format(new Date(j.tanggalBayar), "yyyy-MM-dd") : null
                const bayar = payKey ? pembayaranByDate.get(payKey) : undefined
                const isPaid = j.sudahDibayar
                const isOverdue = !isPaid && new Date() > new Date(j.tanggalJatuhTempo)

                // Update running balance jika sudah lunas
                if (isPaid) {
                  runningPrincipal = Math.max(0, runningPrincipal - Number(j.pokok))
                }

                return (
                  <tr
                    key={j.id}
                    className={`page-break-inside-avoid transition-colors ${
                      isPaid
                        ? "bg-emerald-50/30"
                        : isOverdue
                          ? "bg-rose-50/40"
                          : j.angsuranKe % 2 === 0
                            ? "bg-slate-50/40"
                            : "bg-white"
                    }`}
                  >
                    <td className="p-2 text-center font-bold text-slate-800 border-r border-slate-200">
                      {j.angsuranKe}
                    </td>
                    <td className="p-2 text-center font-medium text-slate-700 border-r border-slate-200 whitespace-nowrap">
                      {format(new Date(j.tanggalJatuhTempo), "dd/MM/yyyy")}
                    </td>
                    <td className="p-2 text-right font-mono text-slate-600 border-r border-slate-200">
                      {fmt(Number(j.pokok))}
                    </td>
                    <td className="p-2 text-right font-mono text-slate-600 border-r border-slate-200">
                      {fmt(Number(j.bunga))}
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-slate-900 border-r border-slate-200">
                      {fmt(Number(j.total))}
                    </td>
                    <td className="p-2 text-right font-mono text-slate-600 border-r border-slate-200">
                      {fmt(runningPrincipal)}
                    </td>

                    {/* Kolom Realisasi Bayar */}
                    <td className="p-2 text-center border-r border-slate-200 whitespace-nowrap">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 text-[11px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {format(
                            new Date(j.tanggalBayar || bayar?.tanggalBayar || j.tanggalJatuhTempo),
                            "dd/MM/yyyy"
                          )}
                        </span>
                      ) : isOverdue ? (
                        <span className="text-[10px] font-bold text-rose-600 uppercase tracking-tight flex items-center justify-center gap-0.5">
                          <AlertTriangle className="w-3 h-3" /> Lewat JT
                        </span>
                      ) : (
                        <span className="text-slate-300 font-mono text-[10px]">.. / .. / 20..</span>
                      )}
                    </td>

                    <td className="p-2 text-right font-mono border-r border-slate-200">
                      {isPaid ? (
                        <span className="font-bold text-emerald-800">
                          {fmt(Number(bayar?.totalBayar || j.total))}
                        </span>
                      ) : (
                        <span className="text-slate-300">Rp ...........</span>
                      )}
                    </td>

                    <td className="p-2 text-center">
                      {isPaid ? (
                        <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {bayar?.nomorTransaksi || "LUNAS"}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[10px]">Paraf [ &nbsp;&nbsp;&nbsp;&nbsp; ]</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
              <tr>
                <td colSpan={2} className="p-2.5 text-center uppercase tracking-wider text-[11px]">
                  Total Rencana
                </td>
                <td className="p-2.5 text-right font-mono">{fmt(totalPokok)}</td>
                <td className="p-2.5 text-right font-mono">{fmt(totalBunga)}</td>
                <td className="p-2.5 text-right font-mono">{fmt(grandTotalKewajiban)}</td>
                <td colSpan={4} className="p-2.5 text-right text-[11px] text-slate-600 font-normal">
                  Sisa Total Kewajiban Saat Ini:{" "}
                  <span className="font-bold font-mono text-rose-700">
                    {fmt(Math.max(0, grandTotalKewajiban - totalNominalTerbayar))}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Klausul & Lembar Tanda Tangan Pengesahan */}
        <div className="page-break-inside-avoid space-y-6 pt-2">
          {/* Ketentuan Resmi */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/70 text-[11px] text-slate-600 leading-relaxed space-y-1">
            <p className="font-bold text-slate-800 uppercase tracking-wide">
              Ketentuan & Perhatian Pembayaran:
            </p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>
                Kartu Angsuran ini merupakan tanda bukti kontrol pinjaman sah yang diterbitkan oleh{" "}
                <span className="font-semibold text-slate-800">{companyInfo.name || "Koperasi"}</span>.
              </li>
              <li>
                Harap membawa kartu ini pada setiap pembayaran cicilan baik di kantor maupun kepada petugas kolektor lapangan.
              </li>
              <li>
                Pembayaran yang sah adalah pembayaran yang tercatat pada sistem pembukuan koperasi dan disertai kuitansi atau paraf petugas resmi.
              </li>
              <li>
                Keterlambatan pembayaran angsuran dari tanggal jatuh tempo dapat dikenakan denda sesuai peraturan operasional koperasi.
              </li>
            </ol>
          </div>

          {/* Area Tanda Tangan Formal */}
          <div className="grid grid-cols-3 gap-6 pt-4 text-center text-xs">
            <div>
              <p className="text-slate-500 font-medium">Peminjam / Debitur</p>
              <div className="h-20 flex items-end justify-center">
                <span className="text-[10px] text-slate-400 italic">Materai jika perlu</span>
              </div>
              <p className="font-bold text-slate-900 border-t border-slate-400 pt-1.5 uppercase">
                {nasabah.namaLengkap}
              </p>
              <p className="text-[10px] text-slate-500">Anggota #{nasabah.nomorAnggota}</p>
            </div>

            <div>
              <p className="text-slate-500 font-medium">Petugas Kolektor / AO</p>
              <div className="h-20" />
              <p className="font-bold text-slate-900 border-t border-slate-400 pt-1.5">
                ( ......................................... )
              </p>
              <p className="text-[10px] text-slate-500">Petugas Lapangan</p>
            </div>

            <div>
              <p className="text-slate-500 font-medium">
                {companyInfo.name || "Koperasi"},{" "}
                <span className="font-normal">{todayStr}</span>
              </p>
              <div className="h-20 flex items-center justify-center">
                <span className="text-[10px] text-slate-400 italic">[ Cap & Tanda Tangan ]</span>
              </div>
              <p className="font-bold text-slate-900 border-t border-slate-400 pt-1.5 uppercase">
                {signerOfficer}
              </p>
              <p className="text-[10px] text-slate-500">Pengurus / Manajemen Koperasi</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
