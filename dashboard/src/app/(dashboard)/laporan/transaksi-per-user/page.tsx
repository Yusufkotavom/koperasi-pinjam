import Link from "next/link"
import { getLaporanTransaksiUserReport } from "@/actions/pembayaran"
import { getRankingConfig } from "@/actions/settings"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { explainRanking } from "@/lib/ranking"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

export default async function TransaksiPerUserPage({
  searchParams,
}: {
  searchParams?: Promise<{ kelompokId?: string; search?: string; view?: string }>
}) {
  const sp = await searchParams
  const view = sp?.view === "kelompok" ? "kelompok" : "user"
  const report = await getLaporanTransaksiUserReport({
    kelompokId: sp?.kelompokId,
    search: sp?.search,
  })
  const rankingConfig = await getRankingConfig()

  const search = sp?.search ?? ""
  const kelompokId = sp?.kelompokId ?? ""

  function rankingBadge(rank: string) {
    if (rank === "A") return <Badge className="bg-emerald-100 text-emerald-700">A - Sangat Lancar</Badge>
    if (rank === "B") return <Badge className="bg-blue-100 text-blue-700">B - Lancar</Badge>
    if (rank === "C") return <Badge className="bg-amber-100 text-amber-700">C - Perlu Pantau</Badge>
    return <Badge className="bg-red-100 text-red-700">D - Risiko</Badge>
  }

  const kelompokSummary = (() => {
    if (view !== "kelompok") return []
    const rankOrder: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 }
    type KelompokAgg = {
      kelompok: string
      nasabahCount: number
      totalTagihan: number
      totalDibayar: number
      kurangAngsuran: number
      outstanding: number
      selesai: number
      belumJatuhTempo: number
      telat: number
      rankA: number
      rankB: number
      rankC: number
      rankD: number
      worstRank: "A" | "B" | "C" | "D"
    }
    const map = new Map<string, KelompokAgg>()
    for (const row of report.data) {
      const key = row.kelompok || "-"
      const prev = map.get(key) ?? {
        kelompok: key,
        nasabahCount: 0,
        totalTagihan: 0,
        totalDibayar: 0,
        kurangAngsuran: 0,
        outstanding: 0,
        selesai: 0,
        belumJatuhTempo: 0,
        telat: 0,
        rankA: 0,
        rankB: 0,
        rankC: 0,
        rankD: 0,
        worstRank: "A",
      }
      prev.nasabahCount += 1
      prev.totalTagihan += row.totalTagihan
      prev.totalDibayar += row.totalDibayar
      prev.kurangAngsuran += row.kurangAngsuran
      prev.outstanding += row.outstanding
      prev.selesai += row.selesai
      prev.belumJatuhTempo += row.belumJatuhTempo
      prev.telat += row.telat
      if (row.ranking === "A") prev.rankA += 1
      else if (row.ranking === "B") prev.rankB += 1
      else if (row.ranking === "C") prev.rankC += 1
      else prev.rankD += 1
      if (rankOrder[row.ranking] > rankOrder[prev.worstRank]) prev.worstRank = row.ranking
      map.set(key, prev)
    }
    return Array.from(map.values()).sort((a, b) => b.outstanding - a.outstanding)
  })()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Laporan Transaksi User</h1>
        <p className="text-muted-foreground text-sm">Gabungan per kelompok + history pembayaran user/nasabah</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <form className="grid grid-cols-1 md:grid-cols-4 gap-3" action="/laporan/transaksi-per-user">
            <Input name="search" defaultValue={search} placeholder="Cari user/nasabah (nama, anggota, NIK)" />
            <select name="kelompokId" defaultValue={kelompokId} className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="">Semua kelompok</option>
              {report.kelompokOptions.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
            <select name="view" defaultValue={view} className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="user">Lihat by user</option>
              <option value="kelompok">Lihat by kelompok</option>
            </select>
            <Button type="submit">Terapkan</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Tagihan</p><p className="font-bold">{fmt(report.summary.totalTagihan)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Dibayar</p><p className="font-bold text-emerald-600">{fmt(report.summary.totalDibayar)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Kurang Angsuran</p><p className="font-bold text-red-600">{fmt(report.summary.kurang)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Outstanding</p><p className="font-bold text-blue-600">{fmt(report.summary.outstanding)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Rank A</p><p className="font-bold">{report.summary.rankA.toLocaleString("id-ID")}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Anomali Pencatatan</p><p className="font-bold text-amber-700">{report.summary.anomaliPembayaran.toLocaleString("id-ID")} trx</p><p className="text-xs text-muted-foreground">{fmt(report.summary.anomaliNominal)}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {view === "kelompok" ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Kelompok</TableHead>
                  <TableHead className="text-right">Nasabah</TableHead>
                  <TableHead className="text-right">Telat</TableHead>
                  <TableHead className="text-right">Kurang</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Ranking (worst)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kelompokSummary.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">Belum ada data kelompok untuk filter ini.</TableCell>
                  </TableRow>
                ) : kelompokSummary.map((k) => (
                  <TableRow key={k.kelompok}>
                    <TableCell className="font-medium">{k.kelompok}</TableCell>
                    <TableCell className="text-right">{k.nasabahCount.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right text-red-600">{k.telat.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right">{fmt(k.kurangAngsuran)}</TableCell>
                    <TableCell className="text-right">{fmt(k.outstanding)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{k.worstRank}</Badge>
                      <span className="ml-2 text-xs text-muted-foreground">
                        A:{k.rankA} B:{k.rankB} C:{k.rankC} D:{k.rankD}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>User/Nasabah</TableHead>
                  <TableHead>Kelompok</TableHead>
                  <TableHead className="text-right">Selesai</TableHead>
                  <TableHead className="text-right">Belum JT</TableHead>
                  <TableHead className="text-right">Telat</TableHead>
                  <TableHead className="text-right">Kurang</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Ranking</TableHead>
                  <TableHead className="text-right">Anomali</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-12 text-center text-muted-foreground">Belum ada data transaksi user untuk filter ini.</TableCell>
                  </TableRow>
                ) : report.data.map((r) => {
                  const explain = explainRanking({ telat: r.telat, kurangAngsuran: r.kurangAngsuran }, rankingConfig)
                  return (
                    <TableRow key={r.nasabahId}>
                      <TableCell>
                        <p className="font-medium">{r.namaLengkap}</p>
                        <p className="text-xs text-muted-foreground font-mono">{r.nomorAnggota}</p>
                      </TableCell>
                      <TableCell>{r.kelompok}</TableCell>
                      <TableCell className="text-right">{r.selesai.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right">{r.belumJatuhTempo.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right text-red-600">{r.telat.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right">{fmt(r.kurangAngsuran)}</TableCell>
                      <TableCell className="text-right">{fmt(r.outstanding)}</TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex">{rankingBadge(r.ranking)}</span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">
                            <div className="text-xs space-y-1">
                              <div className="font-semibold">Alasan Ranking</div>
                              <div>{explain.summary}</div>
                              <div className="pt-1">
                                {explain.rules.map((line) => (
                                  <div key={line}>{line}</div>
                                ))}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-right">{r.anomaliPembayaran > 0 ? <Badge className="bg-amber-100 text-amber-700">{r.anomaliPembayaran}</Badge> : "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/nasabah/${r.nasabahId}`}>Detail</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
