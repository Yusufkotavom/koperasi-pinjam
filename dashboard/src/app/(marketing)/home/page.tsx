import Image from "next/image"
import Link from "next/link"
import { ArrowRight, FileText, Gauge, PlayCircle, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MarketingFooter, MarketingHeader } from "../_components/marketing-shell"
import { metrics, processSteps, productFeatures, testimonials, trustPoints } from "../_components/marketing-data"

export const metadata = {
  title: "KoperasiApp — Sistem Digital Koperasi Simpan Pinjam",
  description:
    "Landing page KoperasiApp untuk operasional koperasi simpan pinjam: nasabah, pinjaman, pembayaran, kas, risiko, dan laporan.",
}

export default function HomeMarketingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8fbf5] text-slate-950">
      <MarketingHeader />
      <main id="main-content">
        <section className="relative isolate min-h-[calc(100svh-4rem)] overflow-hidden bg-[#14213d] text-white">
          <Image
            src="/snitch/project/vault_cooperative_management_landing_page/screen.png"
            alt="Tampilan landing KoperasiApp untuk koperasi simpan pinjam"
            fill
            className="absolute inset-0 -z-20 object-cover opacity-60"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(20,33,61,0.94),rgba(20,33,61,0.76)_48%,rgba(15,118,110,0.56))]" aria-hidden="true" />
          <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-7xl items-center px-4 py-14 sm:px-6 lg:px-8">
            <div className="max-w-3xl space-y-8 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2">
              <div className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-[#fde68a] backdrop-blur">
                <ShieldCheck className="size-4" aria-hidden="true" />
                Sistem operasional koperasi yang siap diaudit
              </div>
              <div className="space-y-5">
                <h1 className="[font-family:Georgia,serif] text-5xl font-black leading-[1.02] text-wrap-balance sm:text-6xl lg:text-7xl">
                  Rapikan Pinjaman Koperasi dalam Satu Portal
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-100 sm:text-xl">
                  Kelola anggota, pengajuan, pencairan, angsuran, kas, dan laporan tanpa rekap manual yang tercecer.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 bg-[#f97316] px-6 text-base font-bold text-white hover:bg-[#ea580c] focus-visible:ring-[#f97316]">
                  <Link href="/contact">
                    Jadwalkan Demo Koperasi
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 border-white/50 bg-white/10 px-6 text-base font-bold text-white hover:bg-white hover:text-[#14213d] focus-visible:ring-white">
                  <Link href="/product">
                    <PlayCircle className="size-4" aria-hidden="true" />
                    Lihat Produk
                  </Link>
                </Button>
              </div>
              <div className="grid gap-3 pt-3 sm:grid-cols-3">
                {metrics.map((metric) => (
                  <div key={metric.value} className="border-l-2 border-[#facc15] bg-white/10 px-4 py-3 backdrop-blur">
                    <div className="text-3xl font-black text-[#facc15]">{metric.value}</div>
                    <p className="mt-1 text-sm leading-5 text-slate-100">{metric.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Kepercayaan produk" className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6 md:grid-cols-3 lg:px-8">
            {trustPoints.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="flex min-w-0 items-center gap-3 text-sm font-semibold text-slate-700">
                  <Icon className="size-5 shrink-0 text-[#0f766e]" aria-hidden="true" />
                  <span className="min-w-0 break-words">{item.label}</span>
                </div>
              )
            })}
          </div>
        </section>

        <section className="bg-[#f8fbf5] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl space-y-4">
              <p className="text-sm font-black uppercase text-[#0f766e]">Masalah yang sering terjadi</p>
              <h2 className="[font-family:Georgia,serif] text-4xl font-black leading-tight text-wrap-balance sm:text-5xl">
                Angka pinjaman berubah cepat. Rekap manual sering terlambat.
              </h2>
              <p className="text-lg leading-8 text-slate-600">
                Ketika data anggota, kas, jadwal angsuran, dan laporan berada di tempat berbeda, pengurus sulit mengambil keputusan tepat waktu. KoperasiApp menyatukan alur harian agar tim kantor dan lapangan melihat data yang sama.
              </p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {["Pengajuan tertunda karena berkas dan plafon tidak terlacak.", "Tunggakan baru terlihat setelah laporan manual selesai.", "Kas harian sulit dicocokkan dengan pembayaran anggota."].map((item) => (
                <div key={item} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <Gauge className="mb-5 size-6 text-[#f97316]" aria-hidden="true" />
                  <p className="text-base font-semibold leading-7 text-slate-800">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
              <div className="space-y-4">
                <p className="text-sm font-black uppercase text-[#0f766e]">Fitur inti</p>
                <h2 className="[font-family:Georgia,serif] text-4xl font-black leading-tight text-wrap-balance sm:text-5xl">
                  Dari anggota baru sampai laporan pengurus.
                </h2>
              </div>
              <p className="text-lg leading-8 text-slate-600">
                Setiap modul dirancang mengikuti ritme koperasi simpan pinjam: input cepat, keputusan jelas, bukti transaksi tersimpan, dan angka mudah dipertanggungjawabkan.
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {productFeatures.map((feature) => {
                const Icon = feature.icon
                return (
                  <article key={feature.title} className="overflow-hidden rounded-lg border border-slate-200 bg-[#f8fbf5] shadow-sm">
                    <div className="relative aspect-[16/10] bg-slate-100">
                      <Image
                        src={feature.image}
                        alt={`Screenshot modul ${feature.title} KoperasiApp`}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-6">
                      <div className="mb-4 grid size-10 place-items-center rounded-lg bg-[#0f766e] text-white">
                        <Icon className="size-5" aria-hidden="true" />
                      </div>
                      <h3 className="text-xl font-black text-slate-950">{feature.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{feature.description}</p>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#14213d] px-4 py-20 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div className="space-y-5">
                <p className="text-sm font-black uppercase text-[#facc15]">Cara kerja</p>
                <h2 className="[font-family:Georgia,serif] text-4xl font-black leading-tight text-wrap-balance sm:text-5xl">
                  Implementasi dibuat bertahap, bukan mengganggu operasional.
                </h2>
                <p className="text-lg leading-8 text-slate-300">
                  Mulai dari data inti, lalu aktifkan proses pinjaman, pembayaran, monitoring, dan laporan sesuai kesiapan tim.
                </p>
                <Button asChild className="bg-[#f97316] text-white hover:bg-[#ea580c] focus-visible:ring-[#f97316]">
                  <Link href="/contact">
                    Diskusikan Alur Koperasi
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
              <ol className="grid gap-4">
                {processSteps.map((step, index) => (
                  <li key={step.title} className="grid gap-4 rounded-lg border border-white/20 bg-white/10 p-5 sm:grid-cols-[3rem_1fr]">
                    <span className="grid size-12 place-items-center rounded-lg bg-[#facc15] text-lg font-black text-[#14213d]">
                      {index + 1}
                    </span>
                    <span>
                      <span className="block text-lg font-black text-white">{step.title}</span>
                      <span className="mt-2 block leading-7 text-slate-300">{step.description}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl space-y-4">
              <p className="text-sm font-black uppercase text-[#0f766e]">Bukti sosial</p>
              <h2 className="[font-family:Georgia,serif] text-4xl font-black leading-tight text-wrap-balance sm:text-5xl">
                Pengurus ingin angka yang bisa dipercaya.
              </h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {testimonials.map((item) => (
                <figure key={item.name} className="rounded-lg border border-slate-200 bg-[#f8fbf5] p-6">
                  <blockquote className="text-base leading-7 text-slate-800">“{item.quote}”</blockquote>
                  <figcaption className="mt-6 border-t border-slate-200 pt-4">
                    <div className="font-black text-slate-950">{item.name}</div>
                    <div className="text-sm text-slate-600">{item.role}</div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f8fbf5] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase text-[#0f766e]">Siap melihat alurnya?</p>
              <h2 className="[font-family:Georgia,serif] mt-3 text-4xl font-black leading-tight text-wrap-balance">
                Bawa contoh proses koperasi kamu, kami bantu petakan demonya.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Cocok untuk pengurus, manajer, admin, kolektor, dan bendahara yang ingin satu sumber data operasional.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Button asChild size="lg" className="bg-[#f97316] text-white hover:bg-[#ea580c] focus-visible:ring-[#f97316]">
                <Link href="/contact">
                  Jadwalkan Demo
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-slate-300 text-slate-900 hover:bg-slate-100 focus-visible:ring-[#0f766e]">
                <Link href="/penawaran">
                  <FileText className="size-4" aria-hidden="true" />
                  Buat Penawaran
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  )
}
