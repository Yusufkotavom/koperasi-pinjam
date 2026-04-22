import Link from "next/link"
import { ArrowRight, BookOpenText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MarketingFooter, MarketingHeader } from "../_components/marketing-shell"
import { blogPosts } from "../_components/marketing-data"

export const metadata = {
  title: "Blog — KoperasiApp",
  description: "Artikel operasional koperasi simpan pinjam: risiko tunggakan, pengajuan pinjaman, dan laporan keuangan.",
}

export default function BlogPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8fbf5] text-slate-950">
      <MarketingHeader />
      <main id="main-content">
        <section className="bg-[#14213d] px-4 py-20 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-[#fde68a]">
                <BookOpenText className="size-4" aria-hidden="true" />
                Blog Koperasi
              </div>
              <h1 className="[font-family:Georgia,serif] text-5xl font-black leading-tight text-wrap-balance sm:text-6xl">
                Catatan praktis untuk koperasi yang ingin lebih rapi.
              </h1>
              <p className="text-lg leading-8 text-slate-200">
                Panduan singkat tentang operasional pinjaman, risiko, kas, dan laporan yang bisa langsung dibahas bersama tim.
              </p>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
            {blogPosts.map((post) => (
              <article key={post.slug} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="rounded-md bg-[#0f766e]/10 px-2 py-1 font-bold text-[#0f766e]">{post.category}</span>
                  <span className="text-slate-500">{post.readTime}</span>
                </div>
                <h2 className="mt-5 text-2xl font-black leading-snug text-wrap-balance">{post.title}</h2>
                <p className="mt-4 leading-7 text-slate-600">{post.excerpt}</p>
                <Link
                  href="/contact"
                  className="mt-6 inline-flex items-center gap-2 rounded-md text-sm font-bold text-[#0f766e] hover:text-[#115e59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]"
                >
                  Bahas Topik Ini
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-lg border border-slate-200 bg-[#f8fbf5] p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="[font-family:Georgia,serif] text-3xl font-black text-wrap-balance">Butuh artikel sesuai masalah koperasi kamu?</h2>
              <p className="mt-2 leading-7 text-slate-600">Kirim konteks operasionalnya, kami bantu susun checklist yang bisa dipakai tim.</p>
            </div>
            <Button asChild className="bg-[#f97316] text-white hover:bg-[#ea580c] focus-visible:ring-[#f97316]">
              <Link href="/contact">
                Kirim Pertanyaan
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  )
}

