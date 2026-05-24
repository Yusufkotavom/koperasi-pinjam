"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp, TrendingDown, Calendar, Users, Banknote,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle
} from "lucide-react"

function fmt(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}Jt`
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}Rb`
  return `Rp ${n.toLocaleString("id-ID")}`
}

type PinjamanDetailData = {
  summary: {
    totalPinjaman: number
    totalPiutang: number
    totalTunggakan: number
    totalBayarPeriode: number
    rasioTunggakan: number
  }
  periodStats: Array<{
    periode: string
    pembayaran: number
    countPembayaran: number
    jatuhTempo: number
    countJatuhTempo: number
    pencairan: number
    countPencairan: number
  }>
  detailPinjaman: Array<{
    id: string
    nomorKontrak: string
    nasabah: string
    nomorAnggota: string
    kelompok: string
    wilayah: string
    pokokPinjaman: number
    sisaPinjaman: number
    status: string
    tunggakan: number
    pembayaranTerakhir: {
      tanggal: Date
      jumlah: number
    } | null
  }>
}

type FilterOptions = {
  kolektor: Array<{ id: string; name: string }>
  kelompok: Array<{ id: string; nama: string }>
  wilayah: string[]
}

function PeriodChart({ data }: { data: PinjamanDetailData['periodStats'] }) {
  const maxValue = Math.max(...data.flatMap(d => [d.pembayaran, d.jatuhTempo, d.pencairan]), 1)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="size-2 bg-emerald-500 rounded-sm inline-block" /> Pembayaran
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 bg-blue-500 rounded-sm inline-block" /> Jatuh Tempo
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 bg-violet-500 rounded-sm inline-block" /> Pencairan
        </span>
      </div>

      <div className="flex items-end gap-2 h-40 pt-2">
        {data.map((d) => (
          <div key={d.periode} className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-end gap-0.5 w-full" style={{ height: "120px" }}>
              <div
                className="flex-1 bg-emerald-500 rounded-t-sm opacity-90"
                style={{ height: `${(d.pembayaran / maxValue) * 100}%` }}
              />
              <div
                className="flex-1 bg-blue-500 rounded-t-sm opacity-80"
                style={{ height: `${(d.jatuhTempo / maxValue) * 100}%` }}
              />
              <div
                className="flex-1 bg-violet-500 rounded-t-sm opacity-70"
                style={{ height: `${(d.pencairan / maxValue) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{d.periode}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface PinjamanDetailProps {
  data: PinjamanDetailData
  filterOptions: FilterOptions
  filters: {
    periode?: 'minggu' | 'bulan'
    tanggalDari?: string
    tanggalSampai?: string
    kolektorId?: string
    kelompokId?: string
    wilayah?: string
  }
}

export default function PinjamanDetail({ data, filterOptions, filters }: PinjamanDetailProps) {
  const [activeTab, setActiveTab] = useState("overview")

  const summaryCards = [
    {
      title: "Total Pinjaman Aktif",
      value: data.summary.totalPinjaman.toLocaleString("id-ID"),
      change: "Kontrak berjalan",
      trend: "neutral" as const,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Total Piutang",
      value: fmt(data.summary.totalPiutang),
      change: "Outstanding keseluruhan",
      trend: "neutral" as const,
      icon: Banknote,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      title: "Total Tunggakan",
      value: fmt(data.summary.totalTunggakan),
      change: `${data.summary.rasioTunggakan.toFixed(1)}% dari piutang`,
      trend: data.summary.rasioTunggakan > 10 ? "down" : "neutral",
      icon: Clock,
      color: data.summary.rasioTunggakan > 10 ? "text-red-600" : "text-amber-600",
      bg: data.summary.rasioTunggakan > 10 ? "bg-red-50" : "bg-amber-50"
    },
    {
      title: "Pembayaran Periode",
      value: fmt(data.summary.totalBayarPeriode),
      change: "Dalam periode filter",
      trend: "up" as const,
      icon: CheckCircle,
      color: "text-violet-600",
      bg: "bg-violet-50"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <form className="grid grid-cols-1 md:grid-cols-7 gap-3" action="/">
            <select
              name="periode"
              defaultValue={filters.periode ?? "bulan"}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="bulan">Per Bulan</option>
              <option value="minggu">Per Minggu</option>
            </select>
            <Input type="date" name="tanggalDari" defaultValue={filters.tanggalDari} />
            <Input type="date" name="tanggalSampai" defaultValue={filters.tanggalSampai} />
            <select
              name="kolektorId"
              defaultValue={filters.kolektorId ?? ""}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Semua kolektor</option>
              {filterOptions.kolektor.map((k) => (
                <option key={k.id} value={k.id}>{k.name}</option>
              ))}
            </select>
            <select
              name="kelompokId"
              defaultValue={filters.kelompokId ?? ""}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Semua kelompok</option>
              {filterOptions.kelompok.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
            <select
              name="wilayah"
              defaultValue={filters.wilayah ?? ""}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Semua wilayah</option>
              {filterOptions.wilayah.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
            <Button type="submit">Filter</Button>
          </form>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((stat) => (
          <Card key={stat.title} className="border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className={`text-xs flex items-center gap-1 ${
                    stat.trend === "up" ? "text-emerald-600" :
                    stat.trend === "down" ? "text-red-500" : "text-muted-foreground"
                  }`}>
                    {stat.trend === "up" && <ArrowUpRight className="size-3" />}
                    {stat.trend === "down" && <ArrowDownRight className="size-3" />}
                    {stat.change}
                  </p>
                </div>
                <div className={`${stat.bg} ${stat.color} p-2.5 rounded-xl`}>
                  <stat.icon className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Grafik Periode</TabsTrigger>
          <TabsTrigger value="detail">Detail Pinjaman</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Aktivitas Pinjaman {filters.periode === 'minggu' ? '8 Minggu' : '6 Bulan'} Terakhir
              </CardTitle>
              <CardDescription>
                Pembayaran, jatuh tempo, dan pencairan per {filters.periode || 'bulan'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PeriodChart data={data.periodStats} />
            </CardContent>
          </Card>

          {/* Period Stats Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statistik Per Periode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Periode</th>
                      <th className="text-right p-2">Pembayaran</th>
                      <th className="text-right p-2">Jatuh Tempo</th>
                      <th className="text-right p-2">Pencairan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.periodStats.map((period) => (
                      <tr key={period.periode} className="border-b">
                        <td className="p-2 font-medium">{period.periode}</td>
                        <td className="p-2 text-right">
                          <div className="text-emerald-600 font-semibold">{fmt(period.pembayaran)}</div>
                          <div className="text-xs text-muted-foreground">{period.countPembayaran} transaksi</div>
                        </td>
                        <td className="p-2 text-right">
                          <div className="text-blue-600 font-semibold">{fmt(period.jatuhTempo)}</div>
                          <div className="text-xs text-muted-foreground">{period.countJatuhTempo} angsuran</div>
                        </td>
                        <td className="p-2 text-right">
                          <div className="text-violet-600 font-semibold">{fmt(period.pencairan)}</div>
                          <div className="text-xs text-muted-foreground">{period.countPencairan} pinjaman</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detail" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detail Pinjaman Aktif</CardTitle>
              <CardDescription>
                {data.detailPinjaman.length} pinjaman dalam filter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Kontrak</th>
                      <th className="text-left p-2">Nasabah</th>
                      <th className="text-left p-2">Kelompok</th>
                      <th className="text-right p-2">Pokok</th>
                      <th className="text-right p-2">Sisa</th>
                      <th className="text-right p-2">Tunggakan</th>
                      <th className="text-center p-2">Status</th>
                      <th className="text-center p-2">Bayar Terakhir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.detailPinjaman.map((pinjaman) => (
                      <tr key={pinjaman.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <div className="font-medium">{pinjaman.nomorKontrak}</div>
                          <div className="text-xs text-muted-foreground">{pinjaman.nomorAnggota}</div>
                        </td>
                        <td className="p-2">
                          <div className="font-medium">{pinjaman.nasabah}</div>
                        </td>
                        <td className="p-2">
                          <div>{pinjaman.kelompok}</div>
                          <div className="text-xs text-muted-foreground">{pinjaman.wilayah}</div>
                        </td>
                        <td className="p-2 text-right font-semibold">
                          {fmt(pinjaman.pokokPinjaman)}
                        </td>
                        <td className="p-2 text-right font-semibold">
                          {fmt(pinjaman.sisaPinjaman)}
                        </td>
                        <td className="p-2 text-right">
                          {pinjaman.tunggakan > 0 ? (
                            <span className="text-red-600 font-semibold">
                              {fmt(pinjaman.tunggakan)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          <Badge
                            variant={pinjaman.status === "AKTIF" ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {pinjaman.status}
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          {pinjaman.pembayaranTerakhir ? (
                            <div>
                              <div className="text-xs font-medium">
                                {fmt(pinjaman.pembayaranTerakhir.jumlah)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(pinjaman.pembayaranTerakhir.tanggal).toLocaleDateString("id-ID")}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">Belum ada</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}