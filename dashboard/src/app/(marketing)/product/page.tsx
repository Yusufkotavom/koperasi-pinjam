import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CheckCircle2, MonitorCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MarketingFooter, MarketingHeader } from "../_components/marketing-shell"
import { productFeatures, productPlans } from "../_components/marketing-data"

export const metadata = {
  title: "Product — KoperasiApp",
  description: "Fitur produk KoperasiApp untuk koperasi simpan pinjam: nasabah, pinjaman, pembayaran, kas, risiko, dan akuntansi.",
}

export default function ProductPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8fbf5] text-slate-950">
      <MarketingHeader />
      <main id="main-content">
        <section className="bg-[#14213d] px-4 py-20 text-white sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-[#fde68a]">
                <MonitorCheck className="size-4" aria-hidden="true" />
                Product Suite
              </div>
              <h1 className="[font-family:Georgia,serif] text-5xl font-black leading-tight text-wrap-balance sm:text-6xl">
                Semua pekerjaan koperasi dalam alur yang sama.
              </h1>
              <p className="text-lg leading-8 text-slate-200">
                KoperasiApp menghubungkan administrasi anggota, pinjaman, angsuran, kas, dan laporan supaya keputusan pengurus memakai data yang sama.
              </p>
              <Button asChild className="bg-[#f97316] text-white hover:bg-[#ea580c] focus-visible:ring-[#f97316]">
                <Link href="/contact">
                  Minta Demo Produk
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-white/20 bg-white/10 shadow-2xl">
              <Image
                src="/snitch/project/cooperative_manager_dashboard/dashboard.png"
                alt="Dashboard KoperasiApp dengan ringkasan pinjaman dan performa pembayaran"
                fill
                className="object-cover"
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl space-y-4">
              <p className="text-sm font-black uppercase text-[#0f766e]">Modul produk</p>
              <h2 className="[font-family:Georgia,serif] text-4xl font-black leading-tight text-wrap-balance">
                Pilih modul sesuai kebutuhan tim.
              </h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {productFeatures.map((feature) => {
                const Icon = feature.icon
                return (
                  <article key={feature.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                    <Icon className="size-7 text-[#0f766e]" aria-hidden="true" />
                    <h3 className="mt-5 text-xl font-black">{feature.title}</h3>
                    <p className="mt-3 leading-7 text-slate-600">{feature.description}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl space-y-4">
              <p className="text-sm font-black uppercase text-[#0f766e]">Paket penerapan</p>
              <h2 className="[font-family:Georgia,serif] text-4xl font-black leading-tight text-wrap-balance">
                Mulai kecil, lalu tingkatkan kontrol saat tim siap.
              </h2>
            </div>
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {productPlans.map((plan) => (
                <article key={plan.name} className="rounded-lg border border-slate-200 bg-[#f8fbf5] p-6 shadow-sm">
                  <div className="text-sm font-bold uppercase text-[#0f766e]">{plan.price}</div>
                  <h3 className="mt-3 text-2xl font-black">{plan.name}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{plan.description}</p>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-3 text-sm font-semibold text-slate-700">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#0f766e]" aria-hidden="true" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  )
}
