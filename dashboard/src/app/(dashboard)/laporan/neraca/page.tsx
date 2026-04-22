import { getNeracaSederhana } from "@/actions/akuntansi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle2, TriangleAlert } from "lucide-react"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

function BalanceRow({ code, label, nilai }: { code?: string; label: string; nilai: number }) {
  return (
    <div className="grid grid-cols-[7rem_1fr_auto] items-center gap-3 text-sm">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {code ?? "-"}
      </span>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{fmt(nilai)}</span>
    </div>
  )
}

export default async function NeracaPage({
  searchParams,
}: {
  searchParams?: Promise<{ periodMode?: string; month?: string; year?: string; week?: string; from?: string; to?: string }>
}) {
  const sp = await searchParams
  const data = await getNeracaSederhana({
    periodMode: sp?.periodMode,
    month: sp?.month,
    year: sp?.year,
    week: sp?.week,
    from: sp?.from,
    to: sp?.to,
  })
  const rightTotal = data.totals.totalKewajibanEkuitas
  const balanced = data.totals.isBalanced

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Neraca Sederhana</h1>
          <p className="text-muted-foreground text-sm">
            Posisi sampai: {data.period.label}
          </p>
        </div>
        <Badge
          variant="outline"
          className={balanced ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}
        >
          {balanced ? <CheckCircle2 className="mr-1 size-3" /> : <TriangleAlert className="mr-1 size-3" />}
          {balanced ? "Balance" : "Tidak Balance"}
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filter Periode</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/laporan/neraca" className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <select name="periodMode" defaultValue={data.period.mode} className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="MONTH">Bulanan</option>
              <option value="WEEK">Mingguan</option>
              <option value="CUSTOM">Custom</option>
            </select>
            <Input name="month" defaultValue={String(data.period.month)} placeholder="Bulan" />
            <Input name="year" defaultValue={String(data.period.year)} placeholder="Tahun" />
            <Input name="week" defaultValue={String(data.period.week)} placeholder="Minggu" />
            <Input name="from" type="date" defaultValue={data.period.fromInput} />
            <Input name="to" type="date" defaultValue={data.period.toInput} />
            <Button type="submit">Terapkan</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        {[
          { label: "Total Aset", value: data.totals.totalAset, cls: "text-blue-700" },
          { label: "Kewajiban + Ekuitas", value: rightTotal, cls: "text-emerald-700" },
          { label: "Selisih", value: data.totals.selisih, cls: balanced ? "text-emerald-700" : "text-red-700" },
        ].map((item) => (
          <Card key={item.label} className="border-0 bg-muted/30">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={`mt-1 text-xl font-bold ${item.cls}`}>{fmt(item.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-base text-blue-700">Aset</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.aset.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada saldo aset.</p>
            ) : data.aset.map((r) => <BalanceRow key={r.code} code={r.code} label={r.label} nilai={r.nilai} />)}
            <Separator />
            <div className="flex justify-between font-bold tabular-nums">
              <span>Total Aset</span>
              <span className="text-blue-700">{fmt(data.totals.totalAset)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-base text-emerald-700">Kewajiban + Ekuitas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-amber-700">Kewajiban</h3>
                <span className="text-xs font-semibold text-muted-foreground">{fmt(data.totals.totalKewajiban)}</span>
              </div>
              {data.kewajiban.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada saldo kewajiban.</p>
              ) : data.kewajiban.map((r) => <BalanceRow key={r.code} code={r.code} label={r.label} nilai={r.nilai} />)}
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-emerald-700">Ekuitas</h3>
                <span className="text-xs font-semibold text-muted-foreground">{fmt(data.totals.totalEkuitas)}</span>
              </div>
              {data.ekuitas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada saldo ekuitas.</p>
              ) : data.ekuitas.map((r) => <BalanceRow key={r.code} code={r.code} label={r.label} nilai={r.nilai} />)}
            </div>
            <Separator />
            <div className="flex justify-between font-bold tabular-nums">
              <span>Total Kewajiban + Ekuitas</span>
              <span className="text-emerald-700">{fmt(rightTotal)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {!balanced && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">
            Neraca belum balance. Selisih {fmt(data.totals.selisih)} biasanya berarti ada transaksi lama yang belum memiliki jurnal,
            jurnal tidak balance, atau perubahan kas lama belum dibackfill. Jalankan Backfill Jurnal di Settings lalu cek Buku Besar.
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
              <CardTitle className="text-base">Ringkasan Aset Produktif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <BalanceRow code="KAS" label="Total Kas" nilai={data.totals.totalKas} />
              <BalanceRow code="NON_KAS" label="Aset Non Kas" nilai={data.totals.totalAset - data.totals.totalKas} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Persamaan Akuntansi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <BalanceRow code="ASET" label="Aset" nilai={data.totals.totalAset} />
              <BalanceRow code="K+E" label="Kewajiban + Ekuitas" nilai={rightTotal} />
              <BalanceRow code="SELISIH" label="Selisih" nilai={data.totals.selisih} />
            </CardContent>
          </Card>
      </div>

      <Card className="border-0 bg-muted/30">
        <CardContent className="p-4 text-sm text-muted-foreground">
          Catatan: Neraca dihitung dari jurnal posted. Jalankan backfill jurnal untuk data lama agar saldo historis ikut terbaca.
        </CardContent>
      </Card>
    </div>
  )
}
