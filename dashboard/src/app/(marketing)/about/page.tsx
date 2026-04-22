import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MarketingFooter, MarketingHeader } from "../_components/marketing-shell"

export const metadata = {
  title: "About — KoperasiApp",
  description: "Tentang KoperasiApp, platform digital untuk operasional koperasi simpan pinjam yang lebih rapi dan transparan.",
}

const values = [
  "Keputusan pengurus harus lahir dari data yang jelas.",
  "Tim lapangan perlu alat yang cepat, bukan formulir yang membuat kerja lambat.",
  "Setiap transaksi harus mudah ditelusuri saat audit dan rapat anggota.",
]

export default function AboutPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8fbf5] text-slate-950">
      <MarketingHeader />
      <main id="main-content">
        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="space-y-6">
              <p className="text-sm font-black uppercase text-[#0f766e]">About</p>
              <h1 className="[font-family:Georgia,serif] text-5xl font-black leading-tight text-wrap-balance sm:text-6xl">
                Dibangun untuk ritme kerja koperasi Indonesia.
              </h1>
              <p className="text-lg leading-8 text-slate-600">
                KoperasiApp membantu pengurus, bendahara, admin, dan kolektor mengurangi pekerjaan rangkap. Fokusnya sederhana: proses pinjaman lebih rapi, kas lebih mudah dicocokkan, dan laporan lebih cepat dibaca.
              </p>
              <Button asChild className="bg-[#f97316] text-white hover:bg-[#ea580c] focus-visible:ring-[#f97316]">
                <Link href="/contact">
                  Bicara dengan Tim
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <Image
                src="/snitch/project/settings_user_role_management/settings.png"
                alt="Pengaturan role user dan data koperasi di KoperasiApp"
                fill
                className="object-cover"
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-black uppercase text-[#0f766e]">Prinsip produk</p>
              <h2 className="[font-family:Georgia,serif] mt-4 text-4xl font-black leading-tight text-wrap-balance">
                Software koperasi harus membantu orang bekerja lebih tenang.
              </h2>
            </div>
            <div className="grid gap-4">
              {values.map((value) => (
                <div key={value} className="flex gap-4 rounded-lg border border-slate-200 bg-[#f8fbf5] p-5">
                  <CheckCircle2 className="mt-1 size-5 shrink-0 text-[#0f766e]" aria-hidden="true" />
                  <p className="text-lg font-semibold leading-8 text-slate-800">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  )
}

