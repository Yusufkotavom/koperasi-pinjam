import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, FileText, Layers3, LogIn } from "lucide-react"

export const metadata = {
  title: "KoperasiApp",
  description:
    "Sistem informasi koperasi simpan pinjam: operasional, dokumen, monitoring, dan laporan.",
}

export default function HomeMarketingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6fbff] via-background to-[#f7f9ff]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          <div className="space-y-5 lg:col-span-7">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-gradient-to-br from-cyan-700 to-teal-900 text-white shadow-sm grid place-items-center">
                <Layers3 className="size-5" />
              </div>
              <div>
                <div className="font-heading text-xl font-black tracking-tight">KoperasiApp</div>
                <div className="text-sm text-muted-foreground">
                  Portal operasional koperasi simpan pinjam
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className="bg-slate-900 text-white hover:bg-slate-900">Proposal-ready</Badge>
              <Badge variant="outline">Dokumen print/PDF</Badge>
              <Badge variant="outline">Monitoring & laporan</Badge>
            </div>

            <h1 className="font-heading text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Satu portal untuk proses pinjaman, kas harian, dan kontrol risiko.
            </h1>
            <p className="max-w-2xl text-base text-slate-700 sm:text-lg">
              Cocok untuk tim yang ingin proses lebih rapi: data nasabah, pengajuan, pencairan, pembayaran,
              arus kas, monitoring tunggakan, dan laporan, termasuk dokumen siap cetak.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-11 gap-2 bg-[#004250] hover:bg-[#00313b]">
                <Link href="/penawaran">
                  Buka Dokumen Penawaran
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11 gap-2">
                <Link href="/login">
                  Masuk Portal
                  <LogIn className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <Card className="border-slate-200/70 bg-white/70 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="size-4" />
                  Buat Penawaran untuk Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-700">
                <p className="text-muted-foreground">
                  Isi nama perusahaan/instansi untuk otomatis tampil di sampul penawaran.
                </p>
                <form action="/penawaran" method="GET" className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600">Ditujukan kepada</label>
                    <input
                      name="to"
                      placeholder="Contoh: PT Adikarya"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <Button type="submit" className="w-full h-11 gap-2 bg-[#004250] hover:bg-[#00313b]">
                    Generate Penawaran
                    <ArrowRight className="size-4" />
                  </Button>
                </form>

                <Separator />
                <div className="text-xs text-muted-foreground">
                  Alternatif cepat:{" "}
                  <span className="font-mono">/penawaran?to=PT%20Adikarya</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

