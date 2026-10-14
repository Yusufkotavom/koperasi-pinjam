import { notFound } from "next/navigation"
import Link from "next/link"
import { getPengajuanById } from "@/actions/pengajuan"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, CheckCircle2, Clock, Package } from "lucide-react"
import { ApprovalForm } from "./approval-form"
import { BatalkanPencairanCard } from "./batalkan-pencairan-card"
import { CatatDpDialog } from "./catat-dp-dialog"
import { getCompanyInfo } from "@/actions/settings"
import { formatDateId, normalizeTimeZone } from "@/lib/datetime"
import { buildRencanaAngsuran, periodeLabel } from "@/lib/angsuran"

const statusMap: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-gray-100 text-gray-600" },
  DIAJUKAN: { label: "Diajukan", cls: "bg-blue-100 text-blue-700" },
  DISURVEY: { label: "Disurvey", cls: "bg-violet-100 text-violet-700" },
  DISETUJUI: { label: "Disetujui", cls: "bg-emerald-100 text-emerald-700" },
  DITOLAK: { label: "Ditolak", cls: "bg-red-100 text-red-700" },
  DICAIRKAN: { label: "Dicairkan", cls: "bg-teal-100 text-teal-700" },
  SELESAI: { label: "Selesai", cls: "bg-gray-100 text-gray-600" },
}

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

function docTitle(url: string) {
  const clean = url.split("?")[0]
  return clean.split("/").filter(Boolean).pop() ?? url
}

export default async function PengajuanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [pengajuan, company] = await Promise.all([getPengajuanById(id), getCompanyInfo()])
  if (!pengajuan) notFound()
  const timeZone = normalizeTimeZone(company.timeZone)

  const badge = statusMap[pengajuan.status] ?? { label: pengajuan.status, cls: "" }
  const plafon = Number(pengajuan.plafonDiajukan)
  const bungaPct = Number(pengajuan.bungaPerBulan) * 100
  const rencana = buildRencanaAngsuran(plafon, pengajuan.tenor, Number(pengajuan.bungaPerBulan))
  const angsuranPerBulan = rencana.totalAngsuran
  const pl = periodeLabel(pengajuan.tenorType)

  const timeline = [
    { status: "DIAJUKAN", label: "Diajukan", date: pengajuan.tanggalPengajuan, done: true },
    { status: "DISURVEY", label: "Survey", date: pengajuan.tanggalSurvey, done: !!pengajuan.tanggalSurvey },
    { status: "DISETUJUI", label: "Approval", date: pengajuan.tanggalApproval, done: !!pengajuan.tanggalApproval },
    { status: "DICAIRKAN", label: "Pencairan", date: null, done: pengajuan.status === "DICAIRKAN" || pengajuan.status === "SELESAI" },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/pengajuan"><ArrowLeft className="size-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Detail Pengajuan</h1>
            <p className="text-muted-foreground text-sm font-mono text-xs">{pengajuan.id.slice(0, 12)}...</p>
          </div>
        </div>
        <Badge className={`${badge.cls} text-sm px-3 py-1`}>{badge.label}</Badge>
      </div>

      {/* Timeline */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {timeline.map((t, i) => (
              <div key={t.label} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold ${t.done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
                    {i + 1}
                  </div>
                  <span className="text-xs text-center">{t.label}</span>
                  {t.date && <span className="text-xs text-muted-foreground">{formatDateId(t.date, { timeZone })}</span>}
                </div>
                {i < timeline.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-5 ${t.done ? "bg-emerald-500" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Info Pengajuan */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Rincian Pengajuan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              {[
                { label: "Nasabah", value: pengajuan.nasabah.namaLengkap },
                { label: "Kelompok", value: pengajuan.kelompok?.nama ?? "—" },
                { label: "Jenis Pinjaman", value: pengajuan.jenisPinjaman === "BARANG" ? "Kredit Barang" : pengajuan.jenisPinjaman },
                { label: pengajuan.jenisPinjaman === "BARANG" ? "Pokok Talangan Diajukan" : "Plafon Diajukan", value: fmt(plafon) },
                { label: "Plafon Disetujui", value: pengajuan.plafonDisetujui ? fmt(Number(pengajuan.plafonDisetujui)) : "—" },
                { label: "Tenor", value: `${pengajuan.tenor} ${pl.unit}` },
                { label: "Bunga Flat", value: `${bungaPct.toFixed(2)}% ${pl.per}` },
                { label: "Est. Angsuran", value: fmt(angsuranPerBulan) },
                { label: "Est. Cicilan Terakhir", value: fmt(rencana.totalTerakhir) },
                { label: "Tujuan Pinjaman", value: pengajuan.tujuanPinjaman ?? "—" },
                { label: "Agunan", value: pengajuan.agunan ?? "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-medium">{value}</p>
                </div>
              ))}
            </div>

            {/* Rincian Khusus Kredit Barang (Opsi A) */}
            {pengajuan.jenisPinjaman === "BARANG" && (
              <>
                <Separator />
                <div className="bg-amber-50/70 border border-amber-300 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="size-4 text-amber-800" />
                      <h3 className="text-sm font-semibold text-amber-900">Rincian Kredit Barang &amp; DP</h3>
                    </div>
                    {pengajuan.dpTerbayar ? (
                      <Badge className="bg-emerald-600 text-white flex items-center gap-1 text-xs">
                        <CheckCircle2 className="size-3" /> DP Terbayar
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-500 text-amber-800 bg-amber-100 flex items-center gap-1 text-xs">
                        <Clock className="size-3" /> Menunggu DP
                      </Badge>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Nama Barang</p>
                      <p className="font-semibold text-foreground text-sm">{pengajuan.namaBarang ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Toko / Vendor Rekanan</p>
                      <p className="font-medium text-foreground">{pengajuan.vendorBarang ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Harga Barang OTR</p>
                      <p className="font-semibold text-foreground">{pengajuan.hargaBarang ? fmt(Number(pengajuan.hargaBarang)) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Uang Muka (DP) Nasabah</p>
                      <p className="font-semibold text-amber-800">{pengajuan.uangMuka ? fmt(Number(pengajuan.uangMuka)) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pokok Talangan Koperasi</p>
                      <p className="font-bold text-foreground">{fmt(plafon)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status DP di Kasir</p>
                      <p className="font-medium text-foreground">
                        {pengajuan.dpTerbayar
                          ? `Diterima ${pengajuan.tanggalBayarDp ? formatDateId(pengajuan.tanggalBayarDp, { timeZone }) : ""}`
                          : "Belum Diterima"}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {(pengajuan.catatanPengajuan || pengajuan.dokumenPendukungUrls.length > 0) && (
              <>
                <Separator />
                {pengajuan.catatanPengajuan && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Catatan Pengajuan</p>
                    <p className="text-sm bg-muted/40 rounded-md p-3">{pengajuan.catatanPengajuan}</p>
                  </div>
                )}
                {pengajuan.dokumenPendukungUrls.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Dokumen Pendukung</p>
                    <div className="space-y-2">
                      {pengajuan.dokumenPendukungUrls.map((url) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded border px-3 py-2 hover:bg-muted/30"
                        >
                          <div className="text-sm font-medium truncate">{docTitle(url)}</div>
                          <div className="text-xs text-muted-foreground truncate">{url}</div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {pengajuan.catatanApproval && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Catatan Approval</p>
                  <p className="text-sm bg-muted/40 rounded-md p-3">{pengajuan.catatanApproval}</p>
                  <p className="text-xs text-muted-foreground mt-1">oleh {pengajuan.approver?.name ?? "—"}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Action Panel */}
        <div className="space-y-4">
          {/* Panel Penerimaan DP Kredit Barang jika belum terbayar */}
          {pengajuan.jenisPinjaman === "BARANG" && !pengajuan.dpTerbayar && pengajuan.status !== "DITOLAK" && pengajuan.status !== "SELESAI" && (
            <Card className="border-amber-300 bg-amber-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                  <Package className="size-4 text-amber-700" /> Uang Muka (DP) Belum Diterima
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <p className="text-amber-800 leading-relaxed">
                  Nasabah wajib menyetorkan uang muka sebesar{" "}
                  <strong>{fmt(Number(pengajuan.uangMuka || 0))}</strong> ke kas koperasi sebelum pinjaman dapat dicairkan.
                </p>
                <CatatDpDialog
                  pengajuanId={pengajuan.id}
                  nominalDp={Number(pengajuan.uangMuka || 0)}
                  namaBarang={pengajuan.namaBarang}
                  namaNasabah={pengajuan.nasabah.namaLengkap}
                />
              </CardContent>
            </Card>
          )}

          {pengajuan.status === "DIAJUKAN" && (
            <ApprovalForm pengajuanId={id} plafonDiajukan={plafon} bungaDiajukanPct={bungaPct} tipeTenor={pengajuan.tenorType} />
          )}

          {pengajuan.status === "DISETUJUI" && (
            <Card className="bg-teal-50 border-teal-200">
              <CardContent className="p-4 text-center space-y-3">
                <p className="text-sm font-medium text-teal-800">Pengajuan Disetujui!</p>
                {pengajuan.jenisPinjaman === "BARANG" && !pengajuan.dpTerbayar ? (
                  <p className="text-xs text-amber-800 bg-amber-100 p-2 rounded">
                    ⚠️ DP nasabah belum diterima di kasir. Silakan catat penerimaan DP di atas sebelum melanjutkan ke pencairan.
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-teal-700">Lanjutkan ke proses pencairan pinjaman.</p>
                    <Button asChild className="w-full bg-teal-600 hover:bg-teal-700">
                      <Link href={`/pencairan?id=${id}`}>Proses Pencairan</Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
          {pengajuan.pinjaman && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Data Pinjaman</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kontrak</span>
                  <span className="font-mono text-xs font-bold">{pengajuan.pinjaman.nomorKontrak}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sisa Pinjaman</span>
                  <span className="font-bold text-blue-700">{fmt(Number(pengajuan.pinjaman.sisaPinjaman))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tgl. Cair</span>
                  <span>{formatDateId(pengajuan.pinjaman.tanggalCair, { timeZone })}</span>
                </div>
                <div className="pt-2 mt-2 border-t">
                  <div className="grid gap-2">
                    <Button asChild variant="outline" className="w-full text-indigo-700 border-indigo-200 bg-indigo-50 hover:bg-indigo-100">
                      <Link href={`/dokumen/kartu-angsuran/${pengajuan.pinjaman.id}`}>
                        Dokumen Angsuran/Cicilan
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full text-slate-700 border-slate-200 bg-slate-50 hover:bg-slate-100">
                      <Link href={`/dokumen/pencairan/${pengajuan.id}`}>
                        Dokumen Bukti Pencairan
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {pengajuan.status === "DICAIRKAN" && pengajuan.pinjaman && (
            <BatalkanPencairanCard
              pengajuanId={pengajuan.id}
              hasPembayaran={pengajuan.pinjaman._count.pembayaran > 0}
            />
          )}
        </div>
      </div>
    </div>
  )
}
