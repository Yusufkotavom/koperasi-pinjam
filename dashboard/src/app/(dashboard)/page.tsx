import { getDashboardStats } from "@/actions/dashboard"
import Link from "next/link"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "./_components/dashboard-header"
import {
  Users, Banknote, TrendingUp, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Clock, UserPlus, ClipboardList,
  HandCoins, WalletCards, Layers3, BarChart3,
} from "lucide-react"

function fmt(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}Jt`
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}Rb`
  return `Rp ${n.toLocaleString("id-ID")}`
}

function BarChart({ data }: { data: { bulan: string; masuk: number; keluar: number }[] }) {
  const max = Math.max(...data.flatMap((d) => [d.masuk, d.keluar]), 1)
  return (
    <div className="flex items-end gap-3 h-40 pt-2">
      {data.map((d) => (
        <div key={d.bulan} className="flex-1 flex flex-col items-center gap-1">
          <div className="flex items-end gap-0.5 w-full" style={{ height: "120px" }}>
            <div className="flex-1 bg-emerald-500 rounded-t-sm opacity-90" style={{ height: `${(d.masuk / max) * 100}%` }} />
            <div className="flex-1 bg-rose-400 rounded-t-sm opacity-80" style={{ height: `${(d.keluar / max) * 100}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">{d.bulan}</span>
        </div>
      ))}
    </div>
  )
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })
  const currentTime = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })

  const surplusBulanIni = stats.arusKas6Bulan.at(-1)
  const surplusVal = (surplusBulanIni?.masuk ?? 0) - (surplusBulanIni?.keluar ?? 0)

  const statCards = [
    { title: "Total Nasabah Aktif", value: stats.totalNasabah.toLocaleString("id-ID"), change: "Nasabah aktif", trend: "up", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Pinjaman Aktif", value: stats.pinjamanAktif.toLocaleString("id-ID"), change: "Kontrak berjalan", trend: "up", icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Total Outstanding", value: fmt(stats.totalOutstanding), change: "Sisa pokok pinjaman", trend: "neutral", icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50" },
    { title: "Total Tunggakan", value: fmt(stats.totalTunggakan), change: "Angsuran belum dibayar", trend: "down", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  ]

  const quickMenus = [
    {
      title: "Tambah Nasabah",
      description: "Input anggota baru",
      href: "/nasabah/baru",
      icon: UserPlus,
      className: "from-sky-500 to-cyan-500",
    },
    {
      title: "Ajukan Pinjaman",
      description: "Buat pengajuan baru",
      href: "/pengajuan/baru",
      icon: ClipboardList,
      className: "from-emerald-500 to-teal-500",
    },
    {
      title: "Proses Pencairan",
      description: "Tindak lanjut pengajuan",
      href: "/pencairan",
      icon: HandCoins,
      className: "from-amber-500 to-orange-500",
    },
    {
      title: "Catat Pembayaran",
      description: "Input angsuran masuk",
      href: "/pembayaran",
      icon: WalletCards,
      className: "from-violet-500 to-fuchsia-500",
    },
    {
      title: "Data Kelompok",
      description: "Kelola kelompok nasabah",
      href: "/kelompok",
      icon: Layers3,
      className: "from-slate-700 to-slate-900",
    },
    {
      title: "Laporan Kas",
      description: "Pantau laporan utama",
      href: "/laporan/arus-kas",
      icon: BarChart3,
      className: "from-rose-500 to-pink-500",
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        title="Dashboard Overview"
        description="Ringkasan cepat kondisi koperasi, arus kas, tunggakan, dan notifikasi penagihan hari ini."
        dateLabel={today}
        initialTimeLabel={currentTime}
        notificationCount={stats.penagihanHariIni}
      />

      {/* Quick Menu */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Quick Menu</CardTitle>
              <CardDescription>Akses cepat ke modul yang paling sering dipakai</CardDescription>
            </div>
            <Badge variant="outline" className="hidden sm:inline-flex">
              Fast access
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            {quickMenus.map((menu) => (
              <Button key={menu.href} asChild variant="outline" className="h-auto items-stretch justify-start p-0">
                <Link href={menu.href} className="w-full">
                  <div className="flex h-full w-full flex-col gap-3 rounded-lg p-4 text-left transition-colors hover:bg-muted/50">
                    <div className={`inline-flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br ${menu.className} text-white shadow-sm`}>
                      <menu.icon className="size-4.5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold leading-none">{menu.title}</p>
                      <p className="text-xs text-muted-foreground">{menu.description}</p>
                    </div>
                  </div>
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className={`text-xs flex items-center gap-1 ${stat.trend === "up" ? "text-emerald-600" : stat.trend === "down" ? "text-red-500" : "text-muted-foreground"}`}>
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

      {/* Chart + Top Tunggakan */}
      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Arus Kas Bulanan</CardTitle>
                <CardDescription>6 bulan terakhir</CardDescription>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="size-2 bg-emerald-500 rounded-sm inline-block" /> Masuk</span>
                <span className="flex items-center gap-1"><span className="size-2 bg-rose-400 rounded-sm inline-block" /> Keluar</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <BarChart data={stats.arusKas6Bulan} />
            {surplusVal !== 0 && (
              <div className="mt-3 p-3 bg-emerald-50 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Surplus Bulan Ini</p>
                  <p className="font-bold text-emerald-700">{fmt(surplusVal)}</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  {surplusBulanIni?.bulan}
                </Badge>
              </div>
            )}
            {surplusVal === 0 && (
              <div className="mt-3 p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground text-center">
                Belum ada data kas bulan ini. Mulai input transaksi di menu Arus Kas.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top 5 Tunggakan Kelompok</CardTitle>
            <CardDescription>Outstanding tertinggi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.topTunggakan.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">🎉 Tidak ada tunggakan saat ini.</p>
            ) : (
              stats.topTunggakan.map((item, i) => (
                <div key={item.nama} className="flex items-center gap-3">
                  <div className={`size-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? "bg-red-100 text-red-700" : i === 1 ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.nama}</p>
                    <p className="text-xs text-muted-foreground">{item.wilayah} · {item.count} angsuran</p>
                  </div>
                  <span className="text-sm font-semibold text-red-600 flex-shrink-0">{fmt(item.total)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {stats.penagihanHariIni > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-start gap-3">
            <Clock className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900 text-sm">Penagihan Hari Ini</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Terdapat <strong>{stats.penagihanHariIni} angsuran</strong> yang jatuh tempo hari ini.
                Pastikan kolektor sudah mendapat jadwal kunjungan.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
