import { getLedgerKasReport } from "@/actions/akuntansi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

export default async function BukuBesarPage({
  searchParams,
}: {
  searchParams?: Promise<{ kasJenis?: string; accountId?: string; periodMode?: string; month?: string; year?: string; week?: string; from?: string; to?: string }>
}) {
  const sp = await searchParams
  const report = await getLedgerKasReport({
    kasJenis: sp?.kasJenis,
    accountId: sp?.accountId,
    periodMode: sp?.periodMode,
    month: sp?.month,
    year: sp?.year,
    week: sp?.week,
    from: sp?.from,
    to: sp?.to,
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Buku Besar</h1>
        <p className="text-muted-foreground text-sm">Mutasi akun dari jurnal double-entry</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filter Periode</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/laporan/buku-besar" className="grid grid-cols-1 md:grid-cols-7 gap-3">
            <select name="accountId" defaultValue={report.account?.id ?? ""} className="h-9 rounded-md border bg-background px-3 text-sm">
              {report.accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.code} — {account.name}
                </option>
              ))}
            </select>
            <select name="periodMode" defaultValue={report.period.mode} className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="MONTH">Bulanan</option>
              <option value="WEEK">Mingguan</option>
              <option value="CUSTOM">Custom</option>
            </select>
            <Input name="month" defaultValue={String(report.period.month)} placeholder="Bulan" />
            <Input name="year" defaultValue={String(report.period.year)} placeholder="Tahun" />
            <Input name="week" defaultValue={String(report.period.week)} placeholder="Minggu" />
            <Input name="from" type="date" defaultValue={report.period.fromInput} />
            <Input name="to" type="date" defaultValue={report.period.toInput} />
            <Button type="submit">Terapkan</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Opening Balance</p>
            <p className="text-xl font-bold">{fmt(report.openingBalance)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Closing Balance</p>
            <p className="text-xl font-bold">{fmt(report.closingBalance)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Transaksi</p>
            <p className="text-xl font-bold">{report.data.length.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Periode {report.period.label} ·{" "}
            <Badge variant="outline">{report.account ? `${report.account.code} · ${report.account.name}` : "Tidak ada akun"}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Tanggal</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Bukti</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Kredit</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Input</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    Belum ada transaksi pada periode ini.
                  </TableCell>
                </TableRow>
              ) : (
                report.data.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/30">
                    <TableCell className="text-xs text-muted-foreground">{new Date(r.tanggal).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell className="font-mono text-xs">{r.kategori}</TableCell>
                    <TableCell className="text-sm">{r.deskripsi}</TableCell>
                    <TableCell className="text-xs">
                      {r.buktiUrl ? (
                        <a className="text-blue-700 underline" href={r.buktiUrl} target="_blank" rel="noreferrer">
                          Lihat
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-emerald-700 font-medium">{r.debit ? fmt(r.debit) : "-"}</TableCell>
                    <TableCell className="text-right text-red-600 font-medium">{r.kredit ? fmt(r.kredit) : "-"}</TableCell>
                    <TableCell className="text-right font-semibold">{fmt(r.saldo)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.inputOleh}</TableCell>
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
