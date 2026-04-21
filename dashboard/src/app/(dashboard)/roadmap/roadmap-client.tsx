"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppLink } from "@/components/app-link"
import {
  CheckCircle2,
  CircleDashed,
  Circle,
  Search,
  Sparkles,
  Wrench,
} from "lucide-react"
import { cn } from "@/lib/utils"

type FeatureStatus = "DONE" | "IN_PROGRESS" | "PLANNED"

type FeatureItem = {
  title: string
  status: FeatureStatus
  href?: string
  notes?: string
}

type FeatureSection = {
  title: string
  description?: string
  items: FeatureItem[]
}

function getSafeHref(href: string): string | null {
  // Next.js App Router: <Link href="/x/[id]"> is not supported at runtime.
  if (href.includes("[")) {
    if (href.startsWith("/nasabah/")) return "/nasabah"
    if (href.startsWith("/kelompok/")) return "/kelompok"
    if (href.startsWith("/pengajuan/")) return "/pengajuan"
    if (href.startsWith("/pembayaran/")) return "/pembayaran"
    if (href.startsWith("/dokumen/")) return null
    return null
  }
  return href
}

const sections: FeatureSection[] = [
  {
    title: "Akses & Keamanan",
    description: "Autentikasi dan proteksi halaman dashboard.",
    items: [
      { title: "Login (NextAuth)", status: "DONE", href: "/login" },
      { title: "Proteksi route dashboard (redirect jika tidak login)", status: "DONE" },
    ],
  },
  {
    title: "Overview",
    description: "Ringkasan cepat kondisi koperasi dan shortcut modul.",
    items: [
      { title: "Dashboard overview (stat + quick menu)", status: "DONE", href: "/" },
      { title: "Ringkasan arus kas 6 bulan (chart)", status: "DONE", href: "/" },
      { title: "Top tunggakan per kelompok (Top 5)", status: "DONE", href: "/" },
    ],
  },
  {
    title: "Master Data",
    description: "Data inti nasabah, kelompok, dan kolektor.",
    items: [
      { title: "Nasabah (daftar + detail)", status: "DONE", href: "/nasabah" },
      { title: "Nasabah baru", status: "DONE", href: "/nasabah/baru" },
      { title: "Edit nasabah", status: "DONE", href: "/nasabah", notes: "Route: /nasabah/[id]/edit" },
      { title: "Kelompok (daftar + detail)", status: "DONE", href: "/kelompok" },
      { title: "Kelompok baru", status: "DONE", href: "/kelompok/baru" },
      { title: "Edit kelompok", status: "DONE", href: "/kelompok", notes: "Route: /kelompok/[id]/edit" },
      { title: "Kolektor (management)", status: "DONE", href: "/kolektor" },
    ],
  },
  {
    title: "Transaksi Pinjaman",
    description: "Pengajuan, approval, pencairan, dan pembayaran angsuran.",
    items: [
      { title: "Pengajuan pinjaman (daftar)", status: "DONE", href: "/pengajuan" },
      { title: "Pengajuan baru", status: "DONE", href: "/pengajuan/baru" },
      { title: "Detail pengajuan", status: "DONE", href: "/pengajuan", notes: "Route: /pengajuan/[id]" },
      { title: "Approval pengajuan", status: "DONE", href: "/pengajuan", notes: "Route: /pengajuan/[id]/approve" },
      { title: "Pencairan", status: "DONE", href: "/pencairan" },
      { title: "Pembayaran angsuran (daftar)", status: "DONE", href: "/pembayaran" },
      { title: "Pembatalan pembayaran", status: "DONE", href: "/pembayaran", notes: "Route: /pembayaran/[id]/pembatalan" },
    ],
  },
  {
    title: "Kas Masuk Keluar",
    description: "Arus kas sederhana untuk pencatatan pemasukan dan pengeluaran.",
    items: [
      { title: "Kas masuk/keluar (riwayat + input + approval + kategori)", status: "DONE", href: "/kas" },
      { title: "Upload bukti transaksi kas", status: "DONE", notes: "API upload kas" },
    ],
  },
  {
    title: "Dokumen Cetak",
    description: "Dokumen operasional berbasis data transaksi.",
    items: [
      { title: "Kuitansi", status: "DONE", notes: "Route: /dokumen/kuitansi/[id]" },
      { title: "Dokumen pencairan", status: "DONE", notes: "Route: /dokumen/pencairan/[id]" },
      { title: "Kartu angsuran", status: "DONE", notes: "Route: /dokumen/kartu-angsuran/[id]" },
    ],
  },
  {
    title: "Monitoring",
    description: "Kontrol tunggakan dan kinerja kolektor.",
    items: [
      { title: "Monitoring tunggakan", status: "DONE", href: "/monitoring/tunggakan" },
      { title: "Rekap kolektor", status: "DONE", href: "/monitoring/kolektor" },
    ],
  },
  {
    title: "Laporan",
    description: "Laporan keuangan dan operasional.",
    items: [
      { title: "Transaksi per user", status: "DONE", href: "/laporan/transaksi-per-user" },
      { title: "Buku besar", status: "DONE", href: "/laporan/buku-besar" },
      { title: "Neraca", status: "DONE", href: "/laporan/neraca" },
      { title: "Rekonsiliasi", status: "DONE", href: "/laporan/rekonsiliasi" },
      { title: "Arus kas", status: "DONE", href: "/laporan/arus-kas" },
      { title: "Laba rugi", status: "DONE", href: "/laporan/laba-rugi" },
      { title: "Per kelompok", status: "DONE", href: "/laporan/per-kelompok" },
      { title: "History pembayaran", status: "DONE", href: "/laporan/history-pembayaran" },
    ],
  },
  {
    title: "Akuntansi",
    description: "COA, mapping kategori, dan mode akuntansi.",
    items: [
      { title: "Mapping kategori transaksi", status: "DONE", href: "/akuntansi/mapping-kategori" },
      { title: "Daftar akun (COA) untuk mode PROPER", status: "DONE", href: "/akuntansi/akun" },
    ],
  },
  {
    title: "Pengaturan",
    description: "Konfigurasi company dan preferensi aplikasi.",
    items: [
      { title: "Company settings", status: "DONE", href: "/settings" },
      { title: "Pengaturan mode akuntansi", status: "DONE", href: "/settings" },
      { title: "Ranking settings (indikator)", status: "DONE", href: "/settings" },
    ],
  },
  {
    title: "Marketing",
    description: "Halaman presentasi untuk publik/penawaran.",
    items: [
      { title: "Home marketing", status: "DONE", href: "/home" },
      { title: "Penawaran", status: "DONE", href: "/penawaran" },
    ],
  },
  {
    title: "Roadmap Berikutnya",
    description: "Yang terlihat ada di UI tapi belum selesai/tersambung penuh.",
    items: [
      { title: "Global search di TopBar (hasil real, bukan placeholder)", status: "IN_PROGRESS" },
      { title: "Notifikasi (bell) + panel notifikasi", status: "PLANNED" },
      { title: "Support page (menu Support)", status: "PLANNED" },
      { title: "Feedback page (menu Feedback)", status: "PLANNED" },
      { title: "Manajemen role/permission di UI", status: "PLANNED" },
      { title: "Audit log viewer (riwayat tindakan)", status: "PLANNED" },
      { title: "Import/Export data (CSV/Excel)", status: "PLANNED" },
    ],
  },
]

const statusMeta: Record<FeatureStatus, { label: string; icon: React.ElementType; className: string; chip: string }> = {
  DONE: {
    label: "Selesai",
    icon: CheckCircle2,
    className: "text-emerald-600",
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0",
  },
  IN_PROGRESS: {
    label: "Proses",
    icon: Wrench,
    className: "text-amber-600",
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-0",
  },
  PLANNED: {
    label: "Rencana",
    icon: CircleDashed,
    className: "text-slate-500",
    chip: "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300 border-0",
  },
}

function normalize(s: string) {
  return s.toLowerCase().trim()
}

function statusFromTab(tab: string): FeatureStatus | "ALL" {
  if (tab === "done") return "DONE"
  if (tab === "progress") return "IN_PROGRESS"
  if (tab === "planned") return "PLANNED"
  return "ALL"
}

export function RoadmapClient() {
  const [tab, setTab] = React.useState("all")
  const [query, setQuery] = React.useState("")

  const queryNorm = normalize(query)
  const tabStatus = statusFromTab(tab)

  const filteredSections = React.useMemo(() => {
    const matchesQuery = (item: FeatureItem) => {
      if (!queryNorm) return true
      const haystack = [item.title, item.href, item.notes].filter(Boolean).join(" ")
      return normalize(haystack).includes(queryNorm)
    }

    return sections
      .map((section) => {
        const items = section.items.filter((item) => {
          if (tabStatus !== "ALL" && item.status !== tabStatus) return false
          return matchesQuery(item)
        })
        return { ...section, items }
      })
      .filter((s) => s.items.length > 0)
  }, [queryNorm, tabStatus])

  const counts = React.useMemo(() => {
    const allItems = sections.flatMap((s) => s.items)
    const count = (status: FeatureStatus) => allItems.filter((i) => i.status === status).length
    return {
      total: allItems.length,
      done: count("DONE"),
      progress: count("IN_PROGRESS"),
      planned: count("PLANNED"),
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Total fitur</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{counts.total}</p>
                <p className="mt-1 text-xs text-muted-foreground">Semua modul yang tercatat di roadmap.</p>
              </div>
              <div className="rounded-2xl p-3 bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800/60">
                <Sparkles className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Selesai</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-600">{counts.done}</p>
                <p className="mt-1 text-xs text-muted-foreground">Fitur yang sudah tersedia.</p>
              </div>
              <div className="rounded-2xl p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100/80 dark:border-emerald-900/40">
                <CheckCircle2 className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Proses + Rencana</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{counts.progress + counts.planned}</p>
                <p className="mt-1 text-xs text-muted-foreground">Pekerjaan yang masih berjalan atau berikutnya.</p>
              </div>
              <div className="rounded-2xl p-3 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border border-amber-100/80 dark:border-amber-900/40">
                <Wrench className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Checklist fitur</CardTitle>
              <CardDescription>Filter berdasarkan status dan cari cepat berdasarkan judul atau path.</CardDescription>
            </div>
            <div className="relative w-full sm:w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari fitur, contoh: pembayaran"
                className="pl-9 h-9 bg-slate-50 border-slate-100 focus-visible:bg-white focus-visible:border-slate-200 transition-all dark:bg-slate-900 dark:border-slate-800 dark:focus-visible:bg-slate-950"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <Tabs value={tab} onValueChange={setTab} className="space-y-5">
            <div className="bg-white p-1.5 rounded-xl border border-slate-100 w-full sm:w-max dark:bg-slate-950 dark:border-slate-800 transition-all">
              <TabsList className="bg-transparent gap-1.5 h-auto p-0 flex flex-col sm:flex-row w-full sm:w-max">
                <TabsTrigger value="all" className="w-full justify-start sm:justify-center data-[state=active]:bg-secondary data-[state=active]:shadow-sm rounded-lg h-10 sm:h-8 px-4 text-[11px] font-bold uppercase tracking-wider">
                  Semua <Badge className="bg-muted text-muted-foreground border-0 h-4 px-1.5 text-[9px] font-black">{counts.total}</Badge>
                </TabsTrigger>
                <TabsTrigger value="done" className="w-full justify-start sm:justify-center data-[state=active]:bg-secondary data-[state=active]:shadow-sm rounded-lg h-10 sm:h-8 px-4 text-[11px] font-bold uppercase tracking-wider">
                  Selesai <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 h-4 px-1.5 text-[9px] font-black">{counts.done}</Badge>
                </TabsTrigger>
                <TabsTrigger value="progress" className="w-full justify-start sm:justify-center data-[state=active]:bg-secondary data-[state=active]:shadow-sm rounded-lg h-10 sm:h-8 px-4 text-[11px] font-bold uppercase tracking-wider">
                  Proses <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-0 h-4 px-1.5 text-[9px] font-black">{counts.progress}</Badge>
                </TabsTrigger>
                <TabsTrigger value="planned" className="w-full justify-start sm:justify-center data-[state=active]:bg-secondary data-[state=active]:shadow-sm rounded-lg h-10 sm:h-8 px-4 text-[11px] font-bold uppercase tracking-wider">
                  Rencana <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300 border-0 h-4 px-1.5 text-[9px] font-black">{counts.planned}</Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            {["all", "done", "progress", "planned"].map((tabValue) => (
              <TabsContent key={tabValue} value={tabValue} className="space-y-6">
                {filteredSections.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-muted/20 p-8 text-center">
                    <p className="text-sm font-semibold">Tidak ada hasil</p>
                    <p className="mt-1 text-xs text-muted-foreground">Coba ganti filter atau kata kunci pencarian.</p>
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setQuery("")
                          setTab("all")
                        }}
                        className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                ) : null}

                {filteredSections.map((section) => (
                  <Card key={section.title} className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-base font-semibold">{section.title}</CardTitle>
                          {section.description ? (
                            <CardDescription>{section.description}</CardDescription>
                          ) : null}
                        </div>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {section.items.length} item
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {section.items.map((item, idx) => {
                          const meta = statusMeta[item.status]
                          const Icon = meta.icon
                          return (
                            <div key={`${item.title}-${idx}`} className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 px-3 py-2.5">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex items-start gap-2.5">
                                  <div className={cn("mt-0.5 shrink-0", meta.className)}>
                                    {item.status === "DONE" ? (
                                      <CheckCircle2 className="size-4" />
                                    ) : item.status === "IN_PROGRESS" ? (
                                      <Wrench className="size-4" />
                                    ) : (
                                      <Circle className="size-4" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                      {item.title}
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                      <Badge className={cn("h-5 px-2 text-[10px] font-bold uppercase tracking-wider", meta.chip)}>
                                        <Icon className="size-3" />
                                        {meta.label}
                                      </Badge>
                                      {item.href ? (
                                        <Badge variant="outline" className="h-5 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                          {item.href}
                                        </Badge>
                                      ) : null}
                                    </div>
                                    {item.notes ? (
                                      <>
                                        <Separator className="my-2 bg-slate-100 dark:bg-slate-800" />
                                        <p className="text-xs text-muted-foreground">{item.notes}</p>
                                      </>
                                    ) : null}
                                  </div>
                                </div>
                                {item.href && getSafeHref(item.href) ? (
                                  <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="shrink-0 h-8 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                                  >
                                    <AppLink href={getSafeHref(item.href)!}>Buka</AppLink>
                                  </Button>
                                ) : item.href ? (
                                  <Badge className="shrink-0 bg-slate-100 text-slate-600 dark:bg-slate-900/40 dark:text-slate-300 border-0 h-8 px-3 rounded-full">
                                    Detail by ID
                                  </Badge>
                                ) : null}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
