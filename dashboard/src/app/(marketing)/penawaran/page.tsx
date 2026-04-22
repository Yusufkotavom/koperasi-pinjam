import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PrintButton } from "@/components/print-button"
import Image from "next/image"
import {
  ArrowRight,
  BarChart3,
  Layers3,
  LineChart,
  Sparkles,
  Target,
  WalletCards,
  CheckCircle2,
  AlertCircle,
  Zap,
  ShieldCheck,
  Users,
} from "lucide-react"
import { labelForGroup, scanPenawaranScreenshots } from "./_lib/screenshots"

export const metadata = {
  title: "Proposal Penawaran KoperasiApp — Transformasi Digital Koperasi",
  description:
    "Dokumen resmi penawaran sistem informasi koperasi simpan pinjam: Terstruktur, aman, dan siap operasional.",
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
    <div className="flex flex-col gap-1 border-l-4 border-emerald-600 pl-4 py-1">
      <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Ditujukan Kepada</span>
      <span className="text-2xl font-black text-slate-900 tracking-tight">{to}</span>
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
    <div className="space-y-3">
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold tracking-wide text-emerald-700 uppercase">
        {eyebrow}
      </div>
      <h2 className="font-heading text-3xl font-black tracking-tight text-slate-900 sm:text-4xl text-wrap-balance">
        {title}
      </h2>
      <p className="max-w-3xl text-lg text-slate-600 leading-relaxed">{desc}</p>
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
    <div className="min-h-screen bg-slate-50 selection:bg-emerald-100 print:bg-white text-slate-900 font-sans">
      {/* Top bar */}
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-200 grid place-items-center">
              <Layers3 className="size-5" aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-sm tracking-tight text-slate-900 uppercase">KoperasiApp</div>
              <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Official Proposal</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="hidden sm:flex font-semibold text-slate-600 hover:text-emerald-600 focus-visible:ring-emerald-500">
              <Link href="/">Kembali</Link>
            </Button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" aria-hidden="true" />
            <PrintButton />
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 font-bold focus-visible:ring-emerald-500">
              <Link href="/login">Coba Demo</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Proposal Header / Hero */}
      <header className="relative bg-white pt-16 pb-24 border-b overflow-hidden print:pt-4 print:pb-12">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50 -skew-x-12 translate-x-1/2 print:hidden" aria-hidden="true" />
        
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-16 lg:grid-cols-12 lg:items-center">
            <div className="space-y-8 lg:col-span-8">
              <div className="space-y-4">
                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 px-3 py-1 text-xs font-black uppercase tracking-widest rounded-md">
                  PROPOSAL SISTEM INFORMASI
                </Badge>
                <h1 className="font-heading text-5xl font-black tracking-tight text-slate-950 sm:text-6xl leading-[1.05] text-wrap-balance">
                  Modernisasi Operasional & <span className="text-emerald-600">Digitalisasi Finansial</span> Koperasi.
                </h1>
              </div>

              <RecipientLine to={recipient} />

              <p className="max-w-2xl text-xl text-slate-600 leading-relaxed italic border-l-2 border-slate-200 pl-6 text-pretty">
                “Mengubah tumpukan kertas menjadi wawasan digital yang akurat. Kami hadir untuk memastikan setiap transaksi tercatat, setiap risiko terukur, dan setiap laporan siap dipertanggungjawabkan.”
              </p>

              <div className="flex flex-wrap gap-4 pt-4 print:hidden">
                <Button asChild size="lg" className="h-14 px-8 bg-slate-950 hover:bg-slate-900 text-white font-bold rounded-xl shadow-xl shadow-slate-200 focus-visible:ring-slate-400">
                  <Link href="#fitur">
                    Review Spesifikasi Modul
                    <ArrowRight className="ml-2 size-5" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 px-8 border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-slate-700 focus-visible:ring-slate-400">
                  <Link href="#pricing">Lihat Skema Harga</Link>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-4 print:hidden">
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-emerald-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4">
                  <Sparkles className="size-6 text-emerald-200 animate-pulse" aria-hidden="true" />
                </div>
                <div className="space-y-6 relative">
                  <div className="space-y-2">
                    <div className="text-xs font-black text-emerald-600 uppercase tracking-widest">Target Utama</div>
                    <div className="text-3xl font-black tracking-tight text-slate-900">Zero Chaos</div>
                  </div>
                  <ul className="space-y-4">
                    {[
                      { icon: <Zap className="size-4 text-amber-500" aria-hidden="true" />, text: "Input data 3x lebih cepat" },
                      { icon: <ShieldCheck className="size-4 text-emerald-500" aria-hidden="true" />, text: "Audit trail di tiap klik" },
                      { icon: <BarChart3 className="size-4 text-blue-500" aria-hidden="true" />, text: "Laporan instan (One-click)" },
                      { icon: <Target className="size-4 text-red-500" aria-hidden="true" />, text: "Reduksi NPL (Kredit Macet)" }
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                        <div className="size-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform">
                          {item.icon}
                        </div>
                        {item.text}
                      </li>
                    ))}
                  </ul>
                  <Separator aria-hidden="true" />
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                     <div className="text-[10px] font-black text-emerald-700 uppercase mb-1">Status Penawaran</div>
                     <div className="text-sm font-bold text-emerald-900">Berlaku s/d Akhir Tahun 2024</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-24 px-4 py-24 sm:px-6 print:space-y-12 print:py-12">
        {/* The Problem SECTION */}
        <section className="grid lg:grid-cols-2 gap-16 items-center">
           <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-rose-600 text-xs font-black uppercase tracking-widest">
                <AlertCircle className="size-4" aria-hidden="true" /> Tantangan Operasional
              </div>
              <h2 className="text-4xl font-black tracking-tight leading-tight text-wrap-balance">Masalah Klasik yang Menghambat Pertumbuhan Koperasi.</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Tanpa sistem yang terintegrasi, tim Anda akan terus terjebak dalam siklus yang tidak efisien:
              </p>
              <div className="space-y-4">
                 {[
                   "Data nasabah tersebar di berbagai buku/excel (berisiko hilang/double).",
                   "Proses approval pinjaman yang lambat karena dokumen fisik harus berpindah tangan.",
                   "Kesulitan memantau NPL (Kredit Macet) secara real-time per wilayah.",
                   "Pembuatan laporan bulanan yang memakan waktu berhari-hari."
                 ].map((text, i) => (
                   <div key={i} className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                      <div className="font-bold text-slate-400 text-lg" aria-hidden="true">0{i+1}</div>
                      <div className="text-sm font-medium text-slate-700 leading-relaxed">{text}</div>
                   </div>
                 ))}
              </div>
           </div>
           <div className="bg-slate-900 rounded-[2rem] p-10 text-white space-y-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" aria-hidden="true" />
              <div className="space-y-2">
                <div className="text-emerald-500 text-xs font-black uppercase">Solusi Kami</div>
                <h3 className="text-3xl font-bold tracking-tight italic">“Satu Kebenaran Data.”</h3>
              </div>
              <p className="text-slate-400 leading-relaxed text-pretty">
                KoperasiApp menggabungkan semua titik data ke dalam satu dashboard tunggal. Tidak ada lagi duplikasi, tidak ada lagi perdebatan data.
              </p>
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <div className="text-3xl font-black text-emerald-500">100%</div>
                    <div className="text-xs text-slate-400 uppercase font-bold">Paperless Ready</div>
                 </div>
                 <div className="space-y-1">
                    <div className="text-3xl font-black text-emerald-500">Real-time</div>
                    <div className="text-xs text-slate-400 uppercase font-bold">Reporting Speed</div>
                 </div>
              </div>
           </div>
        </section>

        {/* Fitur + Screenshot SECTION */}
        <section id="fitur" className="space-y-12">
          <SectionTitle
            eyebrow="Eksplorasi Modul"
            title="Fitur yang Dirancang Khusus untuk Koperasi."
            desc="Setiap baris kode ditulis untuk mempercepat langkah kerja Anda. Di bawah ini adalah ringkasan modul utama yang akan Anda dapatkan."
          />

          <div className="grid gap-6 lg:grid-cols-2">
            {[
              {
                title: "1. Manajemen Master Data & Nasabah",
                icon: <Users className="size-5" aria-hidden="true" />,
                menus: "/nasabah • /kelompok • /kolektor",
                items: [
                  "Profil Nasabah 360°: Riwayat pinjaman, tunggakan, and dokumen.",
                  "Validasi NPL: Deteksi risiko sejak dini berdasarkan histori.",
                  "Group Management: Kelola nasabah berbasis wilayah/kelompok.",
                  "Role-based Access: Batasi akses data sesuai jabatan petugas."
                ]
              },
              {
                title: "2. Workflow Pinjaman & Pencairan",
                icon: <WalletCards className="size-5" aria-hidden="true" />,
                menus: "/pengajuan • /pencairan • /dokumen",
                items: [
                  "Digital Application: Form pengajuan cepat + upload jaminan.",
                  "Auto-Schedule: Jadwal angsuran terbuat otomatis saat pencairan.",
                  "Print-Ready: Cetak Bukti Pencairan & Kartu Angsuran dalam detik.",
                  "Approval Log: Jejak audit siapa yang menyetujui setiap plafon."
                ]
              },
              {
                title: "3. Penerimaan Angsuran & Kas",
                icon: <BarChart3 className="size-5" aria-hidden="true" />,
                menus: "/pembayaran • /kas",
                items: [
                  "Smart Search: Cari tagihan via Nama, NIK, atau No. Kontrak.",
                  "Payment Proof: Upload bukti transfer atau input tunai harian.",
                  "Double Entry Logic: Kas masuk/keluar terkunci per kategori.",
                  "Digital Receipt: Generate kuitansi resmi untuk setiap transaksi."
                ]
              },
              {
                title: "4. Monitoring & Pelaporan Keuangan",
                icon: <LineChart className="size-5" aria-hidden="true" />,
                menus: "/monitoring • /laporan",
                items: [
                  "Aging Report: Pantau tunggakan 1–7, 8–30, s/d NPL > 60 hari.",
                  "Ranking Risiko: Klasifikasi nasabah A/B/C/D secara otomatis.",
                  "Financial Reports: Laba Rugi, Neraca, and Buku Besar Kas.",
                  "Collector Performance: Pantau efektivitas penagihan per petugas."
                ]
              }
            ].map((modul, i) => (
              <Card key={i} className="border-slate-200 bg-white hover:border-emerald-200 transition-colors group shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 transition-colors border border-slate-100 shadow-inner" aria-hidden="true">
                      {modul.icon}
                    </div>
                    <CardTitle className="text-lg font-bold">{modul.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="bg-slate-50 px-3 py-2 rounded-lg font-mono text-[10px] text-slate-500 uppercase tracking-tighter border border-slate-100">
                     Sitemap: {modul.menus}
                   </div>
                   <ul className="space-y-3">
                     {modul.items.map((item, j) => (
                       <li key={j} className="flex gap-3 text-sm text-slate-600 leading-relaxed">
                         <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                         {item}
                       </li>
                     ))}
                   </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-12 pt-12">
            <div className="text-center space-y-2">
               <h3 className="text-2xl font-black tracking-tight">Antarmuka Sistem (Visual Proof)</h3>
               <p className="text-slate-500">Cuplikan layar nyata dari KoperasiApp Dashboard</p>
            </div>
            
            {groups.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed rounded-3xl text-slate-400">
                Gambar dashboard sedang di-generate…
              </div>
            ) : (
              <div className="grid gap-12 sm:grid-cols-2">
                {shots.map((s, i) => (
                  <div key={i} className="group space-y-3">
                    <div className="relative aspect-[16/10] rounded-2xl border border-slate-200 overflow-hidden shadow-sm group-hover:shadow-xl group-hover:border-emerald-200 transition-all duration-500">
                      <Image
                        src={s.url}
                        alt={`Screenshot of ${s.name.split('.')[0].replace(/-/g, ' ')} module`}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                    </div>
                    <div className="flex items-center justify-between px-2">
                      <div className="font-bold text-sm tracking-tight text-slate-800 uppercase">{s.name.split('.')[0].replace(/-/g, ' ')}</div>
                      <Badge variant="outline" className="text-[10px] uppercase font-black">{labelForGroup(s.group)}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Pricing SECTION */}
        <section id="pricing" className="space-y-12">
          <SectionTitle
            eyebrow="Investasi Sistem"
            title="Skema Harga yang Transparan & Kompetitif."
            desc="Pilih paket yang paling sesuai dengan kapasitas anggota dan kebutuhan fitur koperasi Anda saat ini."
          />

          <div className="grid gap-8 lg:grid-cols-3">
            {[
              {
                name: "CORE",
                price: "Rp 75 Juta",
                desc: "Solusi esensial untuk koperasi yang ingin mulai digitalisasi.",
                features: ["Master Data (500 Anggota)", "Workflow Pinjaman Dasar", "Laporan Kas Harian", "Handover & Training 1x"],
                color: "slate"
              },
              {
                name: "PRO",
                popular: true,
                price: "Rp 150 Juta",
                desc: "Paket lengkap untuk kontrol operasional yang lebih ketat.",
                features: ["Unlimited Anggota", "Full Accounting Mode", "Monitoring NPL & Aging", "Support Priority 3 Bulan"],
                color: "emerald"
              },
              {
                name: "ENTERPRISE",
                price: "Mulai Rp 250 Juta",
                desc: "Kustomisasi penuh untuk skala besar atau multi-cabang.",
                features: ["Multi-Branch System", "Custom Document Workflow", "Integration API Support", "On-site Implementation"],
                color: "slate"
              }
            ].map((p, i) => (
              <div key={i} className={`relative p-8 rounded-3xl border ${p.popular ? 'border-emerald-600 bg-white shadow-2xl shadow-emerald-100' : 'border-slate-200 bg-slate-50/50'} flex flex-col h-full`}>
                {p.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                    Paling Banyak Dipilih
                  </div>
                )}
                <div className="mb-8">
                  <div className={`text-xs font-black mb-2 ${p.popular ? 'text-emerald-600' : 'text-slate-400'} uppercase tracking-widest`}>{p.name}</div>
                  <div className="text-4xl font-black text-slate-950 mb-4 tracking-tighter">{p.price}</div>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">{p.desc}</p>
                </div>
                <Separator className="mb-8" aria-hidden="true" />
                <ul className="space-y-4 mb-10 flex-grow">
                   {p.features.map((f, j) => (
                     <li key={j} className="flex gap-3 text-sm font-semibold text-slate-700">
                       <CheckCircle2 className={`size-4 ${p.popular ? 'text-emerald-600' : 'text-slate-400'} shrink-0`} aria-hidden="true" />
                       {f}
                     </li>
                   ))}
                </ul>
                <Button className={`w-full h-12 font-bold rounded-xl focus-visible:ring-emerald-500 ${p.popular ? 'bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-200' : 'bg-slate-950 hover:bg-slate-900'}`}>
                  Pilih Paket {p.name}
                </Button>
              </div>
            ))}
          </div>

          <div className="p-8 rounded-3xl border border-emerald-100 bg-emerald-50/50 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
             <div className="space-y-1">
                <div className="font-bold text-emerald-900 italic">“Butuh Penyesuaian Khusus?”</div>
                <p className="text-sm text-emerald-700 font-medium">Kami siap mendiskusikan kustomisasi fitur yang sesuai dengan SOP unik koperasi Anda.</p>
             </div>
             <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold whitespace-nowrap h-12 px-8 rounded-xl focus-visible:ring-emerald-500">
                Jadwalkan Konsultasi
             </Button>
          </div>
        </section>

        {/* Closing / Final CTA */}
        <section className="bg-slate-950 rounded-[3rem] p-12 lg:p-20 text-center space-y-10 relative overflow-hidden shadow-2xl shadow-slate-200">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-emerald-600/10 blur-[120px]" aria-hidden="true" />
           <div className="relative space-y-6 max-w-3xl mx-auto">
              <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.1] text-wrap-balance">Siap Bertransformasi Menjadi Koperasi Digital?</h2>
              <p className="text-slate-400 text-lg leading-relaxed text-pretty">
                Ribuan data sudah kami kelola, ratusan jam operasional sudah kami pangkas. Sekarang giliran Anda memberikan pelayanan terbaik untuk anggota.
              </p>
           </div>
           <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button asChild size="lg" className="h-14 px-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg rounded-2xl shadow-2xl shadow-emerald-500/20 focus-visible:ring-emerald-500">
                <Link href="/login">Mulai Demo Sekarang</Link>
              </Button>
              <div className="print:hidden">
                <PrintButton variant="outline" size="lg" className="h-14 px-10 border-white/20 text-white hover:bg-white/5 font-bold rounded-2xl focus-visible:ring-white/40" />
              </div>
           </div>
           <p className="relative text-xs text-slate-500 font-bold uppercase tracking-widest pt-4">
              © 2024 KoperasiApp • Enterprise Grade Software
           </p>
        </section>
      </main>

      <footer className="py-12 border-t bg-white print:hidden">
        <div className="mx-auto max-w-6xl px-4 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm" aria-hidden="true">K</div>
              <span className="font-black text-slate-900 tracking-tight">KoperasiApp Official</span>
           </div>
           <div className="flex gap-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>Security Audited</span>
              <span>•</span>
              <span>SLA Guaranteed</span>
              <span>•</span>
              <span>24/7 Support</span>
           </div>
        </div>
      </footer>
    </div>
  )
}
