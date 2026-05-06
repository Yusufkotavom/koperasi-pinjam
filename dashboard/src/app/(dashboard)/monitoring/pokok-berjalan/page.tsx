import { getRunningPrincipalMonitoring } from "@/actions/dashboard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, CalendarClock, CircleDollarSign, Users, Wallet } from "lucide-react"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

function tenorBadge(tenorType: string) {
  if (tenorType === "MINGGUAN") {
    return <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100">MINGGUAN</Badge>
  }
  return <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100">BULANAN</Badge>
}

function statusBadge(status: string) {
  if (status === "MENUNGGAK") {
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">MENUNGGAK</Badge>
  }
  return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">AKTIF</Badge>
}

export default async function MonitoringPokokBerjalanPage({
  searchParams,
}: {
  searchParams?: Promise<{ tenorType?: "MINGGUAN" | "BULANAN" | "ALL"; status?: "AKTIF" | "MENUNGGAK" | "ALL"; search?: string }>
}) {
  const sp = await searchParams
  const filters = {
    tenorType: sp?.tenorType ?? "ALL",
    status: sp?.status ?? "ALL",
    search: sp?.search ?? "",
  }

  const data = await getRunningPrincipalMonitoring(filters)
  const baseQuery = new URLSearchParams()
  if (filters.tenorType && filters.tenorType !== "ALL") baseQuery.set("tenorType", filters.tenorType)
  if (filters.status && filters.status !== "ALL") baseQuery.set("status", filters.status)
  if (filters.search?.trim()) baseQuery.set("search", filters.search.trim())

  const exportOptions = [
    {
      mode: "detail",
      label: "Export Detail Kontrak",
      description: "Semua kolom kontrak + nasabah + indikator risiko.",
    },
    {
      mode: "summary",
      label: "Export Summary Snapshot",
      description: "Ringkasan total outstanding, nasabah, dan kontrak.",
    },
    {
      mode: "tenor",
      label: "Export Per Sistem",
      description: "Rekap per tenor: mingguan vs bulanan.",
    },
    {
      mode: "risk",
      label: "Export Prioritas Risiko",
      description: "Hanya kontrak overdue atau jatuh tempo 7 hari.",
    },
    {
      mode: "nasabah",
      label: "Export Rekap Per Nasabah",
      description: "Agregasi outstanding per nasabah berjalan.",
    },
  ] as const

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Monitoring Pokok Berjalan</h1>
        <p className="text-muted-foreground text-sm">Detail modal/pokok pinjaman yang masih outstanding, dipisah sistem mingguan dan bulanan.</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Filter Data</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-4 gap-3" action="/monitoring/pokok-berjalan">
            <select name="tenorType" defaultValue={filters.tenorType} className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="ALL">Semua Sistem</option>
              <option value="MINGGUAN">Mingguan</option>
              <option value="BULANAN">Bulanan</option>
            </select>
            <select name="status" defaultValue={filters.status} className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="ALL">Semua Status</option>
              <option value="AKTIF">Aktif</option>
              <option value="MENUNGGAK">Menunggak</option>
            </select>
            <Input name="search" defaultValue={filters.search} placeholder="Cari nama nasabah / no kontrak" />
            <Button type="submit">Terapkan</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Simulasi Export CSV (Excel-ready)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {exportOptions.map((opt) => {
            const query = new URLSearchParams(baseQuery)
            query.set("mode", opt.mode)
            const href = `/api/export/pokok-berjalan?${query.toString()}`
            return (
              <div key={opt.mode} className="rounded-lg border p-3 space-y-2">
                <p className="text-sm font-semibold leading-tight">{opt.label}</p>
                <p className="text-xs text-muted-foreground min-h-8">{opt.description}</p>
                <Button asChild size="sm" className="w-full">
                  <a href={href}>Unduh CSV</a>
                </Button>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs"><Wallet className="size-3.5" /> Outstanding</div>
            <p className="text-lg font-bold">{fmt(data.summary.totalOutstanding)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs"><CircleDollarSign className="size-3.5" /> Pokok Awal</div>
            <p className="text-lg font-bold">{fmt(data.summary.totalPrincipal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs"><Users className="size-3.5" /> Nasabah Berjalan</div>
            <p className="text-lg font-bold">{data.summary.totalBorrowers.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs"><AlertTriangle className="size-3.5" /> Overdue</div>
            <p className="text-lg font-bold text-red-600">{data.summary.overdueCount.toLocaleString("id-ID")} kontrak</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-cyan-100 bg-cyan-50/30">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wider text-cyan-700">Outstanding Mingguan</p>
            <p className="text-xl font-bold text-cyan-700">{fmt(data.summary.mingguanOutstanding)}</p>
          </CardContent>
        </Card>
        <Card className="border-violet-100 bg-violet-50/30">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wider text-violet-700">Outstanding Bulanan</p>
            <p className="text-xl font-bold text-violet-700">{fmt(data.summary.bulananOutstanding)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Detail Kontrak Berjalan</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nasabah</TableHead>
                <TableHead className="hidden md:table-cell">Kelompok</TableHead>
                <TableHead>No Kontrak</TableHead>
                <TableHead>Sistem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Pokok Awal</TableHead>
                <TableHead className="text-right">Sisa Pokok</TableHead>
                <TableHead className="text-center">Progress</TableHead>
                <TableHead className="text-center">Jatuh Tempo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-16 text-center text-muted-foreground">
                    Tidak ada data sesuai filter.
                  </TableCell>
                </TableRow>
              ) : (
                data.rows.map((row) => (
                  <TableRow key={row.id} className={row.overdue ? "bg-red-50/20" : row.due7Days ? "bg-amber-50/20" : ""}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold">{row.nasabah.namaLengkap}</span>
                        <span className="text-[10px] text-muted-foreground">{row.nasabah.nomorAnggota} · {row.nasabah.noHp}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">{row.kelompok.nama}</span>
                        <span className="text-[10px] text-muted-foreground">{row.kelompok.wilayah}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-[11px]">{row.nomorKontrak}</span>
                    </TableCell>
                    <TableCell>{tenorBadge(row.tenorType)}</TableCell>
                    <TableCell>{statusBadge(row.status)}</TableCell>
                    <TableCell className="text-right">{fmt(row.pokokPinjaman)}</TableCell>
                    <TableCell className="text-right font-semibold">{fmt(row.sisaPinjaman)}</TableCell>
                    <TableCell className="text-center">{row.progressPct.toFixed(1)}%</TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-1 text-xs">
                        <CalendarClock className="size-3.5" />
                        {new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(row.tanggalJatuhTempo))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
