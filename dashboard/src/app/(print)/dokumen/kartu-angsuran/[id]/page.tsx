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
    <div className="p-3 sm:p-6 max-w-4xl mx-auto min-h-screen text-slate-900 print:p-0 print:m-0 print:max-w-none print:min-h-0 print:w-full">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 9mm;
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
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* Navigasi & Tombol Aksi (Screen Only) */}
      <div className="print:hidden flex flex-wrap justify-between items-center gap-3 bg-white p-3.5 mb-4 rounded-xl border border-slate-200 shadow-sm">
        <Link href={`/nasabah/${nasabah.id}`}>
          <Button variant="outline" size="sm" className="gap-2 text-slate-700 h-8">
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Profil Nasabah
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/pinjaman/${pinjaman.id}`}>
            <Button variant="ghost" size="sm" className="text-slate-600 h-8 text-xs">
              Detail Pinjaman
            </Button>
          </Link>
          <PrintButton />
        </div>
      </div>

      {/* Lembar Dokumen Fisik (Strict 1-Page A4) */}
      <div
        id="printable-area"
        className="doc-sheet bg-white rounded-xl border border-slate-300 p-5 sm:p-7 shadow-md relative print:shadow-none print:border-none print:p-0 print:rounded-none"
      >
        {/* Kop Surat Koperasi */}
        <CompanyDocumentHeader
          documentTitle="KARTU ANGSURAN PINJAMAN"
          documentNumber={`KONTRAK: ${pinjaman.nomorKontrak}`}
          compact={true}
        />

        {/* Sub Header Badge & Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 border border-slate-200 py-1.5 px-3 mb-2.5 bg-slate-50 rounded text-[11px]">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-slate-600 text-[10px]">
              Fasilitas:
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded font-semibold bg-emerald-100 text-emerald-800 text-[10.5px]">
              Pinjaman {pengajuan.jenisPinjaman} ({periodeLabel}an)
            </span>
            {pengajuan.jenisPinjaman === "BARANG" && (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-100 text-amber-800">
                Kredit Barang
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-slate-600 text-[10px]">
              Status:
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold tracking-wide uppercase ${
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
        <div className="grid grid-cols-2 gap-2.5 text-[11px] mb-2.5">
          {/* Kolom Kiri: Identitas Nasabah */}
          <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/40">
            <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200 font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Identitas Debitur (Anggota)
            </div>
            <div className="grid grid-cols-[85px_1fr] gap-0.5 pt-1 text-[10.5px]">
              <span className="text-slate-500">Nama</span>
              <span className="font-bold text-slate-900 truncate">: {nasabah.namaLengkap}</span>

              <span className="text-slate-500">No. Anggota</span>
              <span className="font-mono font-semibold text-slate-800">: {nasabah.nomorAnggota}</span>

              <span className="text-slate-500">NIK (KTP)</span>
              <span className="font-mono text-slate-800">: {nasabah.nik || "—"}</span>

              <span className="text-slate-500">No. HP / WA</span>
              <span className="text-slate-800">: {nasabah.noHp || "—"}</span>

              <span className="text-slate-500">Kelompok</span>
              <span className="text-slate-800 truncate">
                : {kelompok ? `${kelompok.nama} (${kelompok.kode})` : "Individu"}
              </span>

              <span className="text-slate-500">Alamat</span>
              <span className="text-slate-700 truncate">: {nasabah.alamat || "—"}</span>
            </div>
          </div>

          {/* Kolom Kanan: Detail Fasilitas Pinjaman */}
          <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/40">
            <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200 font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              <Clock className="w-3 h-3 text-blue-600" />
              Rincian Kontrak Pinjaman
            </div>
            <div className="grid grid-cols-[95px_1fr] gap-0.5 pt-1 text-[10.5px]">
              <span className="text-slate-500">No. Kontrak</span>
              <span className="font-mono font-bold text-slate-900">: {pinjaman.nomorKontrak}</span>

              <span className="text-slate-500">Tgl Realisasi</span>
              <span className="font-semibold text-slate-800">
                : {format(new Date(pinjaman.tanggalCair), "dd/MM/yyyy")}
              </span>

              <span className="text-slate-500">Plafon Pokok</span>
              <span className="font-bold text-slate-900">: {fmt(totalPokok)}</span>

              <span className="text-slate-500">Tenor & Cicilan</span>
              <span className="font-semibold text-slate-800">
                : {pinjaman.tenor} {periodeLabel} ({fmt(tagihanPerPeriode)}/{periodeLabel.toLowerCase()})
              </span>

              <span className="text-slate-500">Bunga ({Number(pinjaman.bungaPerBulan)}%)</span>
              <span className="text-slate-800">: Total {fmt(totalBunga)}</span>

              <span className="text-slate-500">Jatuh Tempo</span>
              <span className="font-semibold text-rose-700">
                : {format(new Date(pinjaman.tanggalJatuhTempo), "dd/MM/yyyy")}
              </span>
            </div>
          </div>
        </div>

        {/* Ringkasan Progres Pinjaman */}
        <div className="grid grid-cols-4 gap-2 mb-2.5">
          <div className="border border-slate-200 rounded p-1.5 bg-white text-center">
            <span className="text-[9px] uppercase font-bold text-slate-500 block leading-none mb-0.5">
              Total Kewajiban
            </span>
            <span className="text-[11px] sm:text-xs font-black text-slate-900 font-mono">
              {fmt(grandTotalKewajiban)}
            </span>
          </div>
          <div className="border border-slate-200 rounded p-1.5 bg-emerald-50/60 text-center">
            <span className="text-[9px] uppercase font-bold text-emerald-700 block leading-none mb-0.5">
              Sudah Dibayar
            </span>
            <span className="text-[11px] sm:text-xs font-black text-emerald-800 font-mono">
              {fmt(totalNominalTerbayar)}
            </span>
          </div>
          <div className="border border-slate-200 rounded p-1.5 bg-rose-50/60 text-center">
            <span className="text-[9px] uppercase font-bold text-rose-700 block leading-none mb-0.5">
              Sisa Pokok
            </span>
            <span className="text-[11px] sm:text-xs font-black text-rose-700 font-mono">
              {fmt(sisaPokokAktual)}
            </span>
          </div>
          <div className="border border-slate-200 rounded p-1.5 bg-blue-50/60 text-center">
            <span className="text-[9px] uppercase font-bold text-blue-700 block leading-none mb-0.5">
              Progres Cicilan
            </span>
            <span className="text-[11px] sm:text-xs font-black text-blue-800 font-mono">
              {jumlahCicilanLunas}/{totalCicilan} ({Math.round((jumlahCicilanLunas / totalCicilan) * 100)}%)
            </span>
          </div>
        </div>

        {/* Tabel Jadwal Angsuran & Lembar Kontrol */}
        <div className="mb-2.5 overflow-hidden rounded-lg border border-slate-300">
          <table className="w-full text-[10px] text-left border-collapse leading-tight">
            <thead>
              <tr className="bg-slate-800 text-white font-semibold tracking-wider text-[9.5px]">
                <th className="py-1 px-1.5 text-center w-7 border-r border-slate-700">Ke</th>
                <th className="py-1 px-1.5 text-center w-20 border-r border-slate-700">Jatuh Tempo</th>
                <th className="py-1 px-1.5 text-right w-16 border-r border-slate-700">Pokok</th>
                <th className="py-1 px-1.5 text-right w-16 border-r border-slate-700">Bunga</th>
                <th className="py-1 px-1.5 text-right w-20 border-r border-slate-700">Tagihan</th>
                <th className="py-1 px-1.5 text-right w-20 border-r border-slate-700">Sisa Pokok</th>
                <th className="py-1 px-1.5 text-center w-20 border-r border-slate-700">Tgl Bayar</th>
                <th className="py-1 px-1.5 text-right w-20 border-r border-slate-700">Jml Bayar</th>
                <th className="py-1 px-1.5 text-center w-24">Bukti / Paraf</th>
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
                    className={`${
                      isPaid
                        ? "bg-emerald-50/40"
                        : isOverdue
                          ? "bg-rose-50/50"
                          : j.angsuranKe % 2 === 0
                            ? "bg-slate-50/50"
                            : "bg-white"
                    }`}
                  >
                    <td className="py-0.5 px-1.5 text-center font-bold text-slate-800 border-r border-slate-200">
                      {j.angsuranKe}
                    </td>
                    <td className="py-0.5 px-1.5 text-center text-slate-700 border-r border-slate-200 whitespace-nowrap">
                      {format(new Date(j.tanggalJatuhTempo), "dd/MM/yyyy")}
                    </td>
                    <td className="py-0.5 px-1.5 text-right font-mono text-slate-600 border-r border-slate-200">
                      {fmt(Number(j.pokok))}
                    </td>
                    <td className="py-0.5 px-1.5 text-right font-mono text-slate-600 border-r border-slate-200">
                      {fmt(Number(j.bunga))}
                    </td>
                    <td className="py-0.5 px-1.5 text-right font-mono font-bold text-slate-900 border-r border-slate-200">
                      {fmt(Number(j.total))}
                    </td>
                    <td className="py-0.5 px-1.5 text-right font-mono text-slate-600 border-r border-slate-200">
                      {fmt(runningPrincipal)}
                    </td>

                    {/* Kolom Realisasi Bayar */}
                    <td className="py-0.5 px-1.5 text-center border-r border-slate-200 whitespace-nowrap">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-800 text-[9.5px]">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          {format(
                            new Date(j.tanggalBayar || bayar?.tanggalBayar || j.tanggalJatuhTempo),
                            "dd/MM/yy"
                          )}
                        </span>
                      ) : isOverdue ? (
                        <span className="text-[9px] font-bold text-rose-600 uppercase flex items-center justify-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" /> Lewat
                        </span>
                      ) : (
                        <span className="text-slate-300 font-mono text-[9px]">.. / .. / ..</span>
                      )}
                    </td>

                    <td className="py-0.5 px-1.5 text-right font-mono border-r border-slate-200">
                      {isPaid ? (
                        <span className="font-bold text-emerald-800">
                          {fmt(Number(bayar?.totalBayar || j.total))}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[9.5px]">Rp ..........</span>
                      )}
                    </td>

                    <td className="py-0.5 px-1.5 text-center">
                      {isPaid ? (
                        <span className="font-mono text-[8.5px] text-slate-600 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                          {bayar?.nomorTransaksi || "LUNAS"}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[9px]">[ &nbsp;&nbsp;&nbsp;&nbsp; ]</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-slate-100 font-bold border-t border-slate-300 text-slate-900 text-[9.5px]">
              <tr>
                <td colSpan={2} className="py-1 px-1.5 text-center uppercase tracking-wider">
                  Total
                </td>
                <td className="py-1 px-1.5 text-right font-mono">{fmt(totalPokok)}</td>
                <td className="py-1 px-1.5 text-right font-mono">{fmt(totalBunga)}</td>
                <td className="py-1 px-1.5 text-right font-mono">{fmt(grandTotalKewajiban)}</td>
                <td colSpan={4} className="py-1 px-1.5 text-right text-slate-600 font-normal">
                  Sisa Kewajiban:{" "}
                  <span className="font-bold font-mono text-rose-700">
                    {fmt(Math.max(0, grandTotalKewajiban - totalNominalTerbayar))}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Klausul & Lembar Tanda Tangan Pengesahan (Single Page Bottom) */}
        <div className="space-y-2 pt-0.5">
          {/* Ketentuan Resmi Ringkas */}
          <div className="border border-slate-200 rounded p-2 bg-slate-50/60 text-[9.5px] text-slate-600 leading-snug">
            <span className="font-bold text-slate-800 uppercase tracking-wide mr-1">
              Ketentuan:
            </span>
            <span>
              1. Kartu ini bukti kontrol resmi {companyInfo.name || "Koperasi"}. Harap dibawa setiap pembayaran. 2. Pembayaran sah hanya bila tercatat pada sistem pembukuan resmi dan disertakan paraf/kuitansi. 3. Keterlambatan dapat dikenakan denda sesuai peraturan yang berlaku.
            </span>
          </div>

          {/* Area Tanda Tangan Formal Compact */}
          <div className="grid grid-cols-3 gap-4 pt-1 text-center text-[10.5px]">
            <div>
              <p className="text-slate-500 font-medium">Peminjam / Debitur</p>
              <div className="h-10 flex items-center justify-center">
                <span className="text-[8.5px] text-slate-300 italic">( Tanda Tangan )</span>
              </div>
              <p className="font-bold text-slate-900 border-t border-slate-400 pt-0.5 uppercase truncate">
                {nasabah.namaLengkap}
              </p>
              <p className="text-[9px] text-slate-500">Anggota #{nasabah.nomorAnggota}</p>
            </div>

            <div>
              <p className="text-slate-500 font-medium">Petugas Kolektor / AO</p>
              <div className="h-10" />
              <p className="font-bold text-slate-900 border-t border-slate-400 pt-0.5">
                ( ..................................... )
              </p>
              <p className="text-[9px] text-slate-500">Petugas Lapangan</p>
            </div>

            <div>
              <p className="text-slate-500 font-medium">
                {companyInfo.name || "Koperasi"},{" "}
                <span className="font-normal">{todayStr}</span>
              </p>
              <div className="h-10 flex items-center justify-center">
                <span className="text-[8.5px] text-slate-300 italic">[ Cap & Tanda Tangan ]</span>
              </div>
              <p className="font-bold text-slate-900 border-t border-slate-400 pt-0.5 uppercase truncate">
                {signerOfficer}
              </p>
              <p className="text-[9px] text-slate-500">Pengurus / Manajemen</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
