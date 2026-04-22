import Link from "next/link"
import { ArrowRight, Mail, MapPin, PhoneCall } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MarketingFooter, MarketingHeader } from "../_components/marketing-shell"

export const metadata = {
  title: "Contact — KoperasiApp",
  description: "Hubungi KoperasiApp untuk demo sistem koperasi simpan pinjam dan diskusi alur operasional.",
}

const contactMethods = [
  { icon: PhoneCall, title: "Telepon", value: "+62 812-0000-2026" },
  { icon: Mail, title: "Email", value: "hello@koperasiapp.id" },
  { icon: MapPin, title: "Area Implementasi", value: "Remote & onsite sesuai kebutuhan" },
]

export default function ContactPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8fbf5] text-slate-950">
      <MarketingHeader />
      <main id="main-content">
        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              <p className="text-sm font-black uppercase text-[#0f766e]">Contact</p>
              <h1 className="[font-family:Georgia,serif] text-5xl font-black leading-tight text-wrap-balance sm:text-6xl">
                Ceritakan alur koperasi kamu.
              </h1>
              <p className="text-lg leading-8 text-slate-600">
                Kami akan bantu petakan demo berdasarkan proses nyata: pengajuan, survey, pencairan, pembayaran, kas, dan laporan pengurus.
              </p>
              <div className="grid gap-4">
                {contactMethods.map((method) => {
                  const Icon = method.icon
                  return (
                    <div key={method.title} className="flex gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                      <Icon className="mt-1 size-5 shrink-0 text-[#0f766e]" aria-hidden="true" />
                      <div>
                        <h2 className="font-black">{method.title}</h2>
                        <p className="mt-1 text-slate-600">{method.value}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <form action="/contact" method="get" className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="[font-family:Georgia,serif] text-3xl font-black">Jadwalkan Demo</h2>
              <p className="mt-2 leading-7 text-slate-600">Isi data singkat agar percakapan pertama langsung tajam.</p>
              <div className="mt-8 grid gap-5">
                <label className="grid gap-2 text-sm font-bold text-slate-800" htmlFor="contact-name">
                  Nama
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Contoh: Siti Aminah…"
                    className="h-12 rounded-md border border-slate-300 bg-white px-4 text-base font-normal text-slate-950 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400 focus-visible:border-[#0f766e] focus-visible:ring-2 focus-visible:ring-[#0f766e]/30"
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold text-slate-800" htmlFor="contact-email">
                  Email
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    spellCheck={false}
                    placeholder="nama@koperasi.co.id…"
                    className="h-12 rounded-md border border-slate-300 bg-white px-4 text-base font-normal text-slate-950 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400 focus-visible:border-[#0f766e] focus-visible:ring-2 focus-visible:ring-[#0f766e]/30"
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold text-slate-800" htmlFor="contact-organization">
                  Nama Koperasi
                  <input
                    id="contact-organization"
                    name="organization"
                    type="text"
                    autoComplete="organization"
                    placeholder="Contoh: KSP Sejahtera Bersama…"
                    className="h-12 rounded-md border border-slate-300 bg-white px-4 text-base font-normal text-slate-950 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400 focus-visible:border-[#0f766e] focus-visible:ring-2 focus-visible:ring-[#0f766e]/30"
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold text-slate-800" htmlFor="contact-message">
                  Kebutuhan Utama
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={5}
                    autoComplete="off"
                    placeholder="Contoh: ingin merapikan tunggakan dan laporan kas…"
                    className="resize-y rounded-md border border-slate-300 bg-white px-4 py-3 text-base font-normal text-slate-950 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400 focus-visible:border-[#0f766e] focus-visible:ring-2 focus-visible:ring-[#0f766e]/30"
                  />
                </label>
                <Button type="submit" className="h-12 bg-[#f97316] text-base font-bold text-white hover:bg-[#ea580c] focus-visible:ring-[#f97316]">
                  Kirim Permintaan Demo
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
                <p className="text-sm leading-6 text-slate-500">
                  Atau kirim langsung ke{" "}
                  <Link href="mailto:hello@koperasiapp.id" className="font-bold text-[#0f766e] hover:text-[#115e59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]">
                    hello@koperasiapp.id
                  </Link>
                  .
                </p>
              </div>
            </form>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  )
}

