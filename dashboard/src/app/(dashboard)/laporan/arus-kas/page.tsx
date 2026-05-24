import { getArusKasFilterOptions, getArusKasReport } from "@/actions/kas"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

export default async function ArusKasLaporanPage({
  searchParams,
}: {
  searchParams?: Promise<{
    tanggalDari?: string
    tanggalSampai?: string
    jenis?: "MASUK" | "KELUAR"
    kasJenis?: "TUNAI" | "BANK"
    kategori?: string
  }>
}) {
  const sp = await searchParams
  const filters = {
    tanggalDari: sp?.tanggalDari,
    tanggalSampai: sp?.tanggalSampai,
    jenis: sp?.jenis,
    kasJenis: sp?.kasJenis,
    kategori: sp?.kategori,
  }

  const [options, report] = await Promise.all([getArusKasFilterOptions(), getArusKasReport(filters)])
  const bulanData = report.monthly
  const maxVal = Math.max(...bulanData.flatMap((d) => [d.masuk, d.keluar, Math.abs(d.surplus)]), 1)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laporan Arus Kas</h1>
          <p className="text-muted-foreground text-sm">Filter detail transaksi masuk/keluar</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <form className="grid grid-cols-1 md:grid-cols-6 gap-3" action="/laporan/arus-kas">
            <Input type="date" name="tanggalDari" defaultValue={filters.tanggalDari} />
            <Input type="date" name="tanggalSampai" defaultValue={filters.tanggalSampai} />
            <select name="jenis" defaultValue={filters.jenis ?? ""} className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="">Semua jenis</option>
              <option value="MASUK">Kas Masuk</option>
              <option value="KELUAR">Kas Keluar</option>
            </select>
            <select name="kasJenis" defaultValue={filters.kasJenis ?? ""} className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="">Semua kas</option>
              <option value="TUNAI">Tunai</option>
              <option value="BANK">Bank</option>
            </select>
            <select name="kategori" defaultValue={filters.kategori ?? ""} className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="">Semua kategori</option>
              {options.kategori.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <Button type="submit">Terapkan</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-4 gap-4">
        {[
          { label: "Total Kas Masuk", value: fmt(report.summary.totalMasuk), color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Kas Keluar", value: fmt(report.summary.totalKeluar), color: "text-red-600", bg: "bg-red-50" },
          { label: "Net Surplus", value: fmt(report.summary.totalSurplus), color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Jumlah Transaksi", value: `${report.summary.totalTransaksi} trx`, color: "text-violet-600", bg: "bg-violet-50" },
        ].map((s) => (
          <Card key={s.label} className={`${s.bg} border-0`}>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Perbandingan Arus Kas Per Bulan</CardTitle>
              <CardDescription>Berdasarkan rentang tanggal filter</CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm inline-block bg-emerald-500" /> Masuk</span>
              <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm inline-block bg-rose-400" /> Keluar</span>
              <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm inline-block bg-blue-400" /> Surplus</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4 h-52 pb-6 border-b">
            {bulanData.map((d) => (
              <div key={d.bulan} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-end gap-1 w-full" style={{ height: "160px" }}>
                  <div className="flex-1 bg-emerald-500 rounded-t opacity-90" style={{ height: `${(d.masuk / maxVal) * 100}%` }} title={fmt(d.masuk)} />
                  <div className="flex-1 bg-rose-400 rounded-t opacity-80" style={{ height: `${(d.keluar / maxVal) * 100}%` }} title={fmt(d.keluar)} />
                  <div className="flex-1 bg-blue-400 rounded-t opacity-70" style={{ height: `${(Math.abs(d.surplus) / maxVal) * 100}%` }} title={fmt(d.surplus)} />
                </div>
                <span className="text-xs text-muted-foreground text-center">{d.bulan}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rincian Periode</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium">Periode</th>
                <th className="text-right px-4 py-3 font-medium text-emerald-600">Kas Masuk</th>
                <th className="text-right px-4 py-3 font-medium text-red-500">Kas Keluar</th>
                <th className="text-right px-4 py-3 font-medium text-blue-600">Surplus</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {bulanData.map((row, i) => (
                <tr key={row.bulan} className={`border-b hover:bg-muted/20 ${i === bulanData.length - 1 ? "font-semibold" : ""}`}>
                  <td className="px-4 py-3">{row.bulan}</td>
                  <td className="px-4 py-3 text-right text-emerald-600">{fmt(row.masuk)}</td>
                  <td className="px-4 py-3 text-right text-red-500">{fmt(row.keluar)}</td>
                  <td className="px-4 py-3 text-right text-blue-600 font-semibold">{fmt(row.surplus)}</td>
                  <td className="px-4 py-3 text-center">
                    {row.surplus >= 0
                      ? <Badge className="bg-emerald-100 text-emerald-700">Surplus</Badge>
                      : <Badge className="bg-red-100 text-red-700">Defisit</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
