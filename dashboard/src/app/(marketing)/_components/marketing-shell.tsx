import Link from "next/link"
import { ArrowRight, BarChart3, Layers3, LogIn, Mail, MessageCircle, PhoneCall } from "lucide-react"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/", label: "Home" },
  { href: "/product", label: "Product" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
]

export function MarketingHeader() {
  const whatsappUrl = "https://wa.me/6281200002026?text=Halo%20KoperasiApp%2C%20saya%20ingin%20demo%20dan%20tanya%20fitur."

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-[#f8fbf5]/95 backdrop-blur supports-[backdrop-filter]:bg-[#f8fbf5]/80">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-950 focus-visible:ring-2 focus-visible:ring-[#0f766e]"
      >
        Lewati ke Konten Utama
      </a>
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 text-slate-950 hover:text-[#0f766e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]"
          aria-label="KoperasiApp Home"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#0f766e] text-white shadow-[0_10px_30px_rgba(15,118,110,0.22)]">
            <Layers3 className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-black">KoperasiApp</span>
            <span className="block truncate text-xs font-medium text-slate-500">Simpan Pinjam Digital</span>
          </span>
        </Link>

        <nav aria-label="Navigasi Utama" className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition-colors duration-150 hover:bg-white hover:text-[#0f766e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            className="text-slate-700 hover:bg-white hover:text-[#0f766e] focus-visible:ring-[#0f766e]"
          >
            <Link href="/login">
              <LogIn className="size-4" aria-hidden="true" />
              Masuk
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="hidden bg-white/70 text-slate-700 hover:bg-white hover:text-[#0f766e] focus-visible:ring-[#0f766e] md:inline-flex"
          >
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              <MessageCircle className="size-4" aria-hidden="true" />
              WhatsApp
            </a>
          </Button>
          <Button asChild className="bg-[#f97316] text-white hover:bg-[#ea580c] focus-visible:ring-[#f97316]">
            <Link href="/contact">
              Jadwalkan Demo
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
      <nav aria-label="Navigasi Mobile" className="border-t border-slate-200 px-4 py-2 md:hidden">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition-colors duration-150 hover:bg-white hover:text-[#0f766e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  )
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-[#14213d] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.3fr_0.8fr_0.8fr] lg:px-8">
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-3 hover:text-[#facc15] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#facc15]">
            <span className="grid size-10 place-items-center rounded-lg bg-[#0f766e] text-white">
              <Layers3 className="size-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-black">KoperasiApp</span>
          </Link>
          <p className="max-w-md text-sm leading-6 text-slate-300">
            Platform operasional koperasi simpan pinjam untuk pengajuan, pencairan, angsuran, kas, dan laporan yang siap diaudit.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-slate-300">
            <span className="inline-flex items-center gap-2">
              <PhoneCall className="size-4" aria-hidden="true" />
              +62 812-0000-2026
            </span>
            <span className="inline-flex items-center gap-2">
              <Mail className="size-4" aria-hidden="true" />
              hello@koperasiapp.id
            </span>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-white">Halaman</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link className="hover:text-[#facc15] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#facc15]" href={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold text-white">Produk</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <BarChart3 className="size-4 text-[#facc15]" aria-hidden="true" />
              Monitoring Tunggakan
            </li>
            <li>Pengajuan & Pencairan</li>
            <li>Kas & Akuntansi</li>
            <li>Dokumen Siap Cetak</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-slate-400">
        © 2026 KoperasiApp. Dibuat untuk koperasi simpan pinjam yang ingin bergerak lebih rapi.
      </div>
    </footer>
  )
}
