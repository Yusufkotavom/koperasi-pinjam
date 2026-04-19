import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PrintButton } from "@/components/print-button"
import Image from "next/image"
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  ClipboardCheck,
  FileText,
  Fingerprint,
  Layers3,
  LineChart,
  LockKeyhole,
  Sparkles,
  Target,
  Upload,
  WalletCards,
} from "lucide-react"
import { labelForGroup, scanPenawaranScreenshots } from "./_lib/screenshots"

export const metadata = {
  title: "Penawaran KoperasiApp",
  description:
    "Landing page penawaran: sistem informasi koperasi simpan pinjam yang rapi, terukur, dan siap operasional.",
}

function normalizeRecipient(raw: string) {
  const cleaned = raw
    .replace(/^customer\?=/i, "")
    .replace(/^customer=/i, "")
    .replace(/^to=/i, "")
    .replace(/\s+/g, " ")
    .trim()
  return cleaned
}

function RecipientLine({ to }: { to: string }) {
  return (
    <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/60 px-4 py-2 text-sm text-slate-700 backdrop-blur">
      <span className="text-xs font-semibold text-slate-500">Ditujukan kepada</span>
      <span className="font-semibold text-slate-900">{to}</span>
      <span className="text-xs text-slate-500">|</span>
      <span className="text-xs text-slate-500">
        Ubah lewat URL: <span className="font-mono">/penawaran?to=PT%20Adikarya</span>
      </span>
    </div>
  )
}

function SectionTitle({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string
  title: string
  desc: string
}) {
  return (
    <div className="space-y-2">
      <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur">
        <span className="size-1.5 rounded-full bg-cyan-500" />
        {eyebrow}
      </div>
      <h2 className="font-heading text-2xl font-black tracking-tight sm:text-3xl">
        {title}
      </h2>
      <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">{desc}</p>
    </div>
  )
}

function Pill({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/90">
      <Icon className="size-3.5 text-cyan-200" />
      <span className="font-medium">{label}</span>
    </div>
  )
}

export default async function PenawaranPage({
  searchParams,
}: {
  searchParams?: Promise<{ to?: string; company?: string }>
}) {
  const sp = await searchParams
  const recipient = normalizeRecipient(sp?.to ?? sp?.company ?? "Calon Mitra")
  const shots = await scanPenawaranScreenshots()
  const grouped = shots.reduce<Record<string, typeof shots>>((acc, s) => {
    acc[s.group] = acc[s.group] ?? []
    acc[s.group].push(s)
    return acc
  }, {})
  const groups = Object.keys(grouped).sort((a, b) => a.localeCompare(b))

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6fbff] via-background to-[#f7f9ff] print:bg-white">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-gradient-to-br from-cyan-700 to-teal-900 text-white shadow-sm grid place-items-center">
              <Layers3 className="size-4.5" />
            </div>
            <div className="leading-tight">
              <div className="font-heading text-sm font-extrabold tracking-tight">KoperasiApp</div>
              <div className="text-xs text-muted-foreground">Dokumen penawaran sistem</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="gap-2">
              <Link href="/login">
                Masuk
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <PrintButton />
          </div>
        </div>
      </div>

      {/* Hero */}
      <header className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(900px 500px at 20% 10%, rgba(68,216,241,0.35), transparent 60%), radial-gradient(750px 420px at 80% 20%, rgba(244,187,140,0.22), transparent 55%), radial-gradient(700px 520px at 50% 100%, rgba(0,104,118,0.16), transparent 60%)",
          }}
        />
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-[64px] border border-slate-200/70 bg-white/40 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14 print:pt-8">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="space-y-6 lg:col-span-7">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-slate-900 text-white hover:bg-slate-900">
                  Penawaran Sistem
                </Badge>
                <Badge variant="outline">Koperasi Simpan Pinjam</Badge>
                <Badge variant="outline">Web Dashboard</Badge>
              </div>

              <h1 className="font-heading text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Portal operasional koperasi yang rapi, terukur, dan siap dipakai harian.
              </h1>
              <RecipientLine to={recipient} />
              <p className="max-w-2xl text-base text-slate-700 sm:text-lg">
                KoperasiApp menyatukan alur <strong>nasabah</strong>, <strong>pengajuan</strong>,{" "}
                <strong>pencairan</strong>, <strong>pembayaran</strong>, <strong>arus kas</strong>,
                monitoring, dan laporan, dengan dokumen otomatis dan indikator ranking yang bisa dijelaskan.
                Targetnya sederhana: tim lapangan cepat jalan, tim kantor bisa audit, pimpinan bisa memantau.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="h-11 gap-2 bg-[#004250] hover:bg-[#00313b]">
                  <Link href="/login">
                    Coba Dashboard
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-11 gap-2">
                  <Link href="#scope">
                    Lihat Ruang Lingkup
                    <FileText className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-11 gap-2">
                  <Link href="#fitur">
                    Fitur + Screenshot
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200/70 bg-white/50 p-4 backdrop-blur">
                <div className="text-xs font-semibold text-slate-700">Yang kita optimalkan:</div>
                <Badge variant="secondary" className="bg-cyan-900 text-white hover:bg-cyan-900">
                  Kecepatan input
                </Badge>
                <Badge variant="secondary" className="bg-slate-900 text-white hover:bg-slate-900">
                  Audit trail
                </Badge>
                <Badge variant="secondary" className="bg-amber-600 text-white hover:bg-amber-600">
                  Dokumen siap print
                </Badge>
                <Badge variant="secondary" className="bg-teal-700 text-white hover:bg-teal-700">
                  Monitoring real-time
                </Badge>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-slate-200/70 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-[0_28px_90px_-50px_rgba(2,6,23,0.8)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Sparkles className="size-4 text-cyan-200" />
                      Paket Penawaran
                    </div>
                    <div className="text-2xl font-black tracking-tight">KoperasiApp Core</div>
                    <div className="text-xs text-white/70">
                      Fokus: operasional pinjaman dan kontrol arus kas harian.
                    </div>
                  </div>
                  <Badge className="bg-white/10 text-white hover:bg-white/10">v1</Badge>
                </div>

                <div className="mt-5 grid gap-2">
                  <Pill icon={Upload} label="Upload dokumen pendukung pengajuan" />
                  <Pill icon={FileText} label="Dokumen bukti pencairan + kartu angsuran" />
                  <Pill icon={BarChart3} label="Laporan: by user dan by kelompok" />
                  <Pill icon={Target} label="Ranking A/B/C/D dengan alasan (tooltip)" />
                </div>

                <Separator className="my-5 bg-white/10" />
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Metode implementasi</span>
                    <span className="font-semibold">Bertahap, minim gangguan</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Output dokumen</span>
                    <span className="font-semibold">Siap print / PDF</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Kontrol akses</span>
                    <span className="font-semibold">Role-based</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/60 p-4 text-sm text-slate-700 backdrop-blur">
                <span className="font-semibold">Catatan penawaran:</span> halaman ini memang ditulis seperti dokumen.
                Tombol <span className="font-semibold">Cetak / Simpan PDF</span> akan menghasilkan format rapi untuk dibagikan.
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-14 px-4 pb-16 sm:px-6 print:space-y-10 print:pb-0">
        {/* Scope */}
        <section id="scope" className="space-y-6">
          <SectionTitle
            eyebrow="Ruang Lingkup"
            title="Fitur yang dipakai harian, bukan sekadar demo."
            desc="KoperasiApp dirancang untuk meringkas langkah, memperjelas status, dan mengunci bukti. Setiap modul punya output yang bisa dipertanggungjawabkan."
          />

          <div className="grid gap-4 lg:grid-cols-3">
            {[
              {
                icon: ClipboardCheck,
                title: "Pengajuan Pinjaman",
                points: [
                  "Form cepat dengan simulasi angsuran",
                  "Upload dokumen pendukung (PDF/gambar)",
                  "Catatan pengajuan untuk konteks keputusan",
                ],
              },
              {
                icon: WalletCards,
                title: "Pencairan & Pembayaran",
                points: [
                  "Pencairan menghasilkan pinjaman + jadwal otomatis",
                  "Pembayaran terekam dan bisa diaudit",
                  "Dokumen bukti pencairan dan kartu angsuran siap print",
                ],
              },
              {
                icon: LineChart,
                title: "Monitoring & Laporan",
                points: [
                  "Tunggakan, telat, outstanding, dan anomali pencatatan",
                  "Laporan transaksi: by user atau by kelompok",
                  "Ranking A/B/C/D lengkap dengan alasan",
                ],
              },
            ].map((c) => (
              <Card key={c.title} className="border-slate-200/70 bg-white/70 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="grid size-9 place-items-center rounded-xl bg-muted text-foreground">
                      <c.icon className="size-4" />
                    </span>
                    {c.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {c.points.map((p) => (
                    <div key={p} className="flex items-start gap-2">
                      <BadgeCheck className="mt-0.5 size-4 text-emerald-600" />
                      <span className="text-slate-700">{p}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Fitur + Screenshot */}
        <section id="fitur" className="space-y-6">
          <SectionTitle
            eyebrow="Fitur Lengkap"
            title="Modul lengkap sesuai operasional koperasi, ditulis per alur kerja."
            desc="Di bawah ini adalah breakdown fitur berdasarkan modul yang memang sudah ada di codebase saat ini. Screenshot dipakai sebagai bukti visual sementara."
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-slate-200/70 bg-white/70 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">1. Master Data (Nasabah, Kelompok, Kolektor)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-700">
                <div className="rounded-2xl border bg-white/70 p-4">
                  <div className="text-xs font-semibold text-slate-600">Menu</div>
                  <div className="mt-1 font-mono text-xs">/nasabah • /kelompok • /kolektor</div>
                </div>
                {[
                  "Nasabah: tambah/edit profil, relasi ke kelompok dan kolektor, lampiran dokumen (upload).",
                  "Profil nasabah menampilkan indikator: telat, kurang angsuran, outstanding, anomali pencatatan, dan ranking A/B/C/D beserta alasan.",
                  "Kelompok: data kelompok, wilayah, dan pengelompokan nasabah untuk reporting.",
                  "Kolektor: manajemen data kolektor dan tabel role user untuk kontrol akses lapangan vs kantor.",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-2">
                    <BadgeCheck className="mt-0.5 size-4 text-emerald-600" />
                    <span>{t}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-slate-200/70 bg-white/70 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">2. Workflow Pinjaman (Pengajuan → Approval → Pencairan)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-700">
                <div className="rounded-2xl border bg-white/70 p-4">
                  <div className="text-xs font-semibold text-slate-600">Menu</div>
                  <div className="mt-1 font-mono text-xs">/pengajuan • /pencairan • /dokumen</div>
                </div>
                {[
                  "Pengajuan pinjaman: form cepat + simulasi angsuran, field catatan, dan upload dokumen pendukung (PDF/gambar, max 5MB/file).",
                  "Approval: setujui/tolak, simpan catatan approval, dan jejak siapa yang approve.",
                  "Pencairan: membentuk pinjaman + jadwal angsuran otomatis, sekaligus mencatat transaksi kas keluar kategori PENCAIRAN.",
                  "Dokumen: kartu angsuran/cicilan dan bukti pencairan siap print/PDF setelah pencairan diproses.",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-2">
                    <BadgeCheck className="mt-0.5 size-4 text-emerald-600" />
                    <span>{t}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-slate-200/70 bg-white/70 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">3. Pembayaran Angsuran (Jatuh Tempo, Denda, Kuitansi)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-700">
                <div className="rounded-2xl border bg-white/70 p-4">
                  <div className="text-xs font-semibold text-slate-600">Menu</div>
                  <div className="mt-1 font-mono text-xs">/pembayaran • /dokumen/kuitansi</div>
                </div>
                {[
                  "Daftar angsuran jatuh tempo yang belum dibayar, lengkap dengan aging dan estimasi denda.",
                  "Input pembayaran untuk jadwal tertentu, dukung penyesuaian metadata (tanggal/metode/bukti/catatan).",
                  "Kuitansi pembayaran siap print/PDF untuk arsip dan nasabah.",
                  "Alur pembatalan pembayaran tersedia untuk koreksi transaksi yang salah input (dengan alasan).",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-2">
                    <BadgeCheck className="mt-0.5 size-4 text-emerald-600" />
                    <span>{t}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-slate-200/70 bg-white/70 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">4. Arus Kas (Kas Masuk/Keluar + Manajemen Kategori)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-700">
                <div className="rounded-2xl border bg-white/70 p-4">
                  <div className="text-xs font-semibold text-slate-600">Menu</div>
                  <div className="mt-1 font-mono text-xs">/kas</div>
                </div>
                {[
                  "Input kas masuk/keluar harian dengan histori transaksi dan ringkasan saldo.",
                  "Kategori pembukuan dikelola lewat tab Add Category (master data) agar konsisten.",
                  "Aturan penting: kategori MASUK dan KELUAR tidak boleh sama (dikunci di sisi server).",
                  "Transaksi pencairan otomatis tercatat sebagai kas keluar kategori PENCAIRAN.",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-2">
                    <BadgeCheck className="mt-0.5 size-4 text-emerald-600" />
                    <span>{t}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border-slate-200/70 bg-white/70 backdrop-blur lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">5. Monitoring</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-700">
                <div className="rounded-2xl border bg-white/70 p-4">
                  <div className="text-xs font-semibold text-slate-600">Menu</div>
                  <div className="mt-1 font-mono text-xs">/monitoring/tunggakan • /monitoring/kolektor</div>
                </div>
                {[
                  "Aging report tunggakan (1-7, 8-30, 31-60, >60/NPL).",
                  "Filter: tanggal, kolektor, kelompok, wilayah.",
                  "Ringkasan NPL ratio untuk kontrol kualitas portofolio.",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-2">
                    <BadgeCheck className="mt-0.5 size-4 text-emerald-600" />
                    <span>{t}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-slate-200/70 bg-white/70 backdrop-blur lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">6. Laporan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-700">
                <div className="rounded-2xl border bg-white/70 p-4">
                  <div className="text-xs font-semibold text-slate-600">Menu</div>
                  <div className="mt-1 font-mono text-xs">
                    /laporan/transaksi-per-user • /laporan/laba-rugi • /laporan/history-pembayaran • /laporan/per-kelompok • /laporan/arus-kas
                  </div>
                </div>
                {[
                  "Laporan Transaksi User: view by user atau by kelompok, lengkap ranking + tooltip alasan ranking.",
                  "Laporan Laba Rugi: ringkasan pendapatan/beban per kategori kas.",
                  "History pembayaran dan laporan per kelompok untuk kebutuhan evaluasi operasional.",
                  "Template laporan arus kas (bisa dihubungkan ke data transaksi untuk periode lebih panjang).",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-2">
                    <BadgeCheck className="mt-0.5 size-4 text-emerald-600" />
                    <span>{t}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200/70 bg-gradient-to-br from-white to-[#f2fbff]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">7. Governance (Role, Audit, Konfigurasi Ranking)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <div className="rounded-2xl border bg-white/70 p-4">
                <div className="text-xs font-semibold text-slate-600">Menu</div>
                <div className="mt-1 font-mono text-xs">/settings</div>
              </div>
              {[
                "Role-based access: ADMIN/TELLER/MANAGER/PIMPINAN/KOLEKTOR/SURVEYOR/AKUNTANSI sesuai kebutuhan.",
                "Audit & approval log (fondasi) untuk jejak aksi penting: approval pengajuan, pencairan, pembayaran, kas.",
                "Konfigurasi threshold ranking A/B/C/D dapat diubah di Settings, dan setiap badge ranking memiliki alasan yang transparan (tooltip).",
              ].map((t) => (
                <div key={t} className="flex items-start gap-2">
                  <BadgeCheck className="mt-0.5 size-4 text-emerald-600" />
                  <span>{t}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {shots.length === 0 ? (
            <Card className="border-slate-200/70 bg-white/70 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Screenshot belum tersedia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-700">
                <p>
                  Saya belum menemukan gambar di{" "}
                  <span className="font-mono">dashboard/public/snitch/project</span>.
                </p>
                <div className="rounded-2xl border bg-white/70 p-4 text-xs">
                  <div className="font-semibold">Struktur yang didukung</div>
                  <div className="mt-2 font-mono">
                    public/snitch/project/dashboard.png
                    <br />
                    public/snitch/project/pengajuan/form.png
                    <br />
                    public/snitch/project/kas/input.webp
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-10">
              {groups.map((g) => (
                <section key={g} className="space-y-4">
                  <div className="flex items-end justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="font-heading text-2xl font-black tracking-tight">{labelForGroup(g)}</h3>
                      <p className="text-xs text-muted-foreground">{grouped[g].length} layar</p>
                    </div>
                    <Badge variant="outline" className="hidden sm:inline-flex">Module</Badge>
                  </div>
                  <Separator />
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {grouped[g].map((s) => (
                      <Card key={s.url} className="overflow-hidden border-slate-200/70 bg-white/70 backdrop-blur">
                          <CardContent className="p-0">
                            <a href={s.url} target="_blank" rel="noreferrer" className="block">
                              <Image
                                src={s.url}
                                alt={s.name}
                                width={1280}
                                height={800}
                                className="aspect-[16/10] w-full object-cover"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              />
                            </a>
                            <div className="border-t p-3">
                              <div className="text-sm font-semibold truncate">{s.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{s.url}</div>
                            </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>

        {/* Why not generic */}
        <section className="space-y-6">
          <SectionTitle
            eyebrow="Yang Dibedakan"
            title="Desain keputusan: cepat di input, jelas di audit."
            desc="Landing page ini bukan brosur kosongan. Di bawah ini adalah detail yang biasanya bikin sistem koperasi gagal dipakai, lalu kita benahi dari akar."
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-slate-200/70 bg-gradient-to-br from-white to-[#f2fbff]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Dokumen bukan pelengkap</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-700">
                <p>
                  Saat pencairan disetujui, sistem menutup “ruang abu-abu” dengan output dokumen:
                  <strong> bukti pencairan</strong> (untuk arsip dan nasabah) dan{" "}
                  <strong>kartu angsuran</strong> (untuk kontrol pembayaran). Ini mengurangi “transaksi lisan”
                  dan mempercepat pembuktian saat ada selisih.
                </p>
                <div className="rounded-xl border bg-white/70 p-3">
                  <div className="text-xs font-semibold text-slate-600">Hasil yang diharapkan:</div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <Badge className="justify-center bg-slate-900 text-white hover:bg-slate-900">Arsip rapi</Badge>
                    <Badge className="justify-center bg-amber-600 text-white hover:bg-amber-600">Print siap</Badge>
                    <Badge className="justify-center bg-teal-700 text-white hover:bg-teal-700">Minim dispute</Badge>
                    <Badge className="justify-center bg-cyan-900 text-white hover:bg-cyan-900">Audit cepat</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/70 bg-gradient-to-br from-white to-[#fff7f0]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Kategori kas yang disiplin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-700">
                <p>
                  Arus kas sering rusak bukan karena angka, tapi karena{" "}
                  <strong>kategori yang tidak konsisten</strong>. Di sini, kategori masuk dan keluar{" "}
                  <strong>tidak boleh sama</strong> dan dikelola lewat tab <strong>Add Category</strong>.
                  Akibatnya, laporan lebih stabil dan perbandingan bulan-ke-bulan lebih “bersih”.
                </p>
                <div className="rounded-xl border bg-white/70 p-3">
                  <div className="text-xs font-semibold text-slate-600">Contoh yang kita cegah:</div>
                  <p className="mt-1 text-xs text-slate-600">
                    “OPERASIONAL” dipakai untuk pemasukan dan pengeluaran sekaligus, lalu laporan jadi tidak jelas.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Security / control */}
        <section className="space-y-6">
          <SectionTitle
            eyebrow="Kontrol & Keamanan"
            title="Akses berbasis peran + jejak audit."
            desc="Bukan soal jargon. Tujuannya supaya perubahan status, input transaksi, dan keputusan punya penanggung jawab."
          />

          <div className="grid gap-4 lg:grid-cols-3">
            {[
              {
                icon: LockKeyhole,
                title: "Role-based access",
                desc: "Hak akses dipisahkan: admin, teller, manager/pimpinan, kolektor, dan lainnya.",
              },
              {
                icon: Fingerprint,
                title: "Audit log",
                desc: "Setiap aksi penting dapat dicatat: create/update/delete, approval, pencairan, kas.",
              },
              {
                icon: FileText,
                title: "Bukti & dokumen",
                desc: "Upload dokumen pendukung pengajuan dan dokumen hasil pencairan untuk arsip.",
              },
            ].map((i) => (
              <Card key={i.title} className="border-slate-200/70 bg-white/70">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="grid size-9 place-items-center rounded-xl bg-muted">
                      <i.icon className="size-4" />
                    </span>
                    {i.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-700">{i.desc}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Delivery */}
        <section className="space-y-6">
          <SectionTitle
            eyebrow="Metode Deliver"
            title="Bukan build lalu ditinggal: kita rancang supaya dipakai."
            desc="Penawaran ini diasumsikan untuk kebutuhan operasional. Fokusnya mengurangi langkah, memperjelas status, dan membuat output yang bisa dibawa ke rapat."
          />

          <div className="grid gap-4 lg:grid-cols-12">
            <Card className="border-slate-200/70 bg-white/70 lg:col-span-7">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tahapan implementasi yang realistis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-700">
                {[
                  {
                    step: "1",
                    title: "Mapping proses & data",
                    desc: "Konfirmasi alur: pengajuan, survey, approval, pencairan, pembayaran, kas, laporan.",
                  },
                  {
                    step: "2",
                    title: "Konfigurasi akses per role",
                    desc: "Definisikan siapa bisa approval, siapa input kas, dan standar bukti dokumen.",
                  },
                  {
                    step: "3",
                    title: "Onboarding pemakaian",
                    desc: "Training singkat: input yang benar, cara baca ranking, dan cara tarik dokumen.",
                  },
                ].map((t) => (
                  <div key={t.step} className="flex gap-3 rounded-2xl border bg-white/70 p-3">
                    <div className="grid size-8 place-items-center rounded-xl bg-slate-900 text-white text-xs font-black">
                      {t.step}
                    </div>
                    <div>
                      <div className="font-semibold">{t.title}</div>
                      <div className="text-xs text-muted-foreground">{t.desc}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-slate-200/70 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white lg:col-span-5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="size-4 text-cyan-200" />
                  Stack & Teknologi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-white/85">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Frontend</span>
                  <span className="font-semibold">Next.js (App Router) + React</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">UI</span>
                  <span className="font-semibold">Tailwind + shadcn</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Backend</span>
                  <span className="font-semibold">Server Actions</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Database</span>
                  <span className="font-semibold">PostgreSQL + Prisma</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Auth</span>
                  <span className="font-semibold">NextAuth</span>
                </div>
                <Separator className="my-3 bg-white/10" />
                <p className="text-xs text-white/70">
                  Catatan: pilihan stack ini membuat perubahan alur bisnis cepat diimplementasi,
                  namun tetap terstruktur karena skema data terdefinisi dan migrasi terkontrol.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="space-y-6">
          <SectionTitle
            eyebrow="Pricing Plan"
            title="Harga yang bisa dipertanggungjawabkan, bukan angka asal."
            desc="Kisaran di bawah mengikuti pola pasar jasa pembuatan aplikasi web di Indonesia: sederhana puluhan juta, menengah hingga ratusan juta, enterprise di atas itu. Finalnya ditentukan oleh scope, integrasi, dan SLA."
          />

          <div className="grid gap-4 lg:grid-cols-4">
            {[
              {
                name: "Basic",
                price: "Rp 75–120 juta",
                sub: "Untuk koperasi kecil yang butuh operasional inti cepat jalan.",
                tags: ["Core modules", "Dokumen print", "1 lingkungan (prod)"],
                bullets: [
                  "Nasabah, pengajuan, pencairan, pembayaran, arus kas",
                  "Dokumen: bukti pencairan + kartu angsuran",
                  "Laporan dasar + ranking tooltip",
                  "Training 1 sesi + handover",
                ],
              },
              {
                name: "Premium",
                price: "Rp 150–250 juta",
                sub: "Untuk tim yang butuh kontrol lebih ketat + laporan lebih kaya.",
                tags: ["Workflow", "Audit & role", "Hardening"],
                bullets: [
                  "Semua Basic + penyesuaian SOP (approval, kategori, dokumen)",
                  "Audit trail lebih lengkap + aturan data lebih ketat",
                  "Laporan by user/by kelompok + monitoring tunggakan",
                  "UAT terstruktur + perbaikan pasca UAT",
                ],
              },
              {
                name: "Enterprise",
                price: "Mulai Rp 300 juta",
                sub: "Untuk kebutuhan multi-cabang, integrasi, dan SLA.",
                tags: ["Integrasi", "SLA", "Observability"],
                bullets: [
                  "Integrasi (API/legacy), SSO/role kompleks (opsional)",
                  "Audit & approval multi-level (opsional)",
                  "Monitoring + dashboard KPI pimpinan",
                  "SLA support + incident response",
                ],
              },
              {
                name: "Custom",
                price: "Sesuai scope",
                sub: "Jika Anda ingin roadmap bertahap seperti product development.",
                tags: ["Sprint", "Backlog", "Retainer"],
                bullets: [
                  "Pengerjaan sprint dengan backlog prioritas",
                  "Estimasi per fitur + change request jelas",
                  "Retainer maintenance bulanan (opsional)",
                  "Continuous improvement + analitik penggunaan",
                ],
              },
            ].map((p) => (
              <Card key={p.name} className="border-slate-200/70 bg-white/70 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>{p.name}</span>
                    <Badge variant="outline">Plan</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="space-y-1">
                    <div className="text-xl font-black tracking-tight text-slate-950">{p.price}</div>
                    <div className="text-xs text-muted-foreground">{p.sub}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {p.tags.map((t) => (
                      <Badge key={t} className="bg-muted text-foreground hover:bg-muted">{t}</Badge>
                    ))}
                  </div>
                  <Separator />
                  <div className="space-y-2 text-xs text-slate-700">
                    {p.bullets.map((b) => (
                      <div key={b} className="flex items-start gap-2">
                        <BadgeCheck className="mt-0.5 size-4 text-emerald-600" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-slate-200/70 bg-gradient-to-br from-white to-[#f2fbff]">
            <CardContent className="p-5 text-sm text-slate-700">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <div className="font-semibold">Maintenance (opsional)</div>
                  <div className="text-xs text-muted-foreground">
                    Umumnya 10–20% dari biaya awal per tahun, atau retainer bulanan (support + bugfix + minor improvement).
                  </div>
                </div>
                <div className="rounded-2xl border bg-white/70 px-4 py-3 text-xs">
                  <div className="font-semibold">Contoh retainer</div>
                  <div className="mt-1">Rp 3–10 juta/bulan (jam support + SLA dasar)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 backdrop-blur print:border-slate-300 print:bg-white">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
            <div className="space-y-2 lg:col-span-8">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-semibold">
                <Sparkles className="size-3.5 text-cyan-600" />
                Next step
              </div>
              <h3 className="font-heading text-2xl font-black tracking-tight">
                Mau versi yang sesuai SOP koperasi Anda?
              </h3>
              <p className="text-sm text-muted-foreground">
                Kita bisa kunci nama kategori, format dokumen, rule ranking, dan alur approval sesuai SOP koperasi.
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:col-span-4">
              <Button asChild className="h-11 gap-2 bg-[#004250] hover:bg-[#00313b]">
                <Link href="/login">
                  Masuk dan mulai
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <div className="print:hidden">
                <PrintButton />
              </div>
            </div>
          </div>
        </section>

        <footer className="pb-10 text-xs text-muted-foreground print:pb-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>Dokumen penawaran KoperasiApp.</div>
            <div className="flex items-center gap-2">
              <span className="inline-flex size-1.5 rounded-full bg-cyan-500" />
              Fokus: operasional, audit, dan dokumen.
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
