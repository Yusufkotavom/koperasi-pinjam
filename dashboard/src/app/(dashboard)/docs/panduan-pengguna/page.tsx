import { readFile } from "node:fs/promises"
import path from "node:path"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Markdown } from "@/components/markdown"

export const metadata = {
  title: "Panduan Pengguna",
}

export default async function PanduanPenggunaPage() {
  // Keep 1 source-of-truth: the markdown doc in repo root of `dashboard/`.
  // `process.cwd()` in Next.js runs from the project root (dashboard/).
  // If the file is missing, we show a fallback message.
  const docPath = path.join(process.cwd(), "PANDUAN-PENGGUNA.md")
  let content = ""
  try {
    content = await readFile(docPath, "utf8")
  } catch {
    content = "Dokumen `PANDUAN-PENGGUNA.md` tidak ditemukan."
  }

  return (
    <div className="p-6 space-y-6">
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Panduan Pengguna</CardTitle>
              <CardDescription>
                Alur lengkap pemakaian aplikasi: mulai dari master data sampai transaksi, monitoring, dan laporan.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              Internal
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Dokumen Lengkap</CardTitle>
          <CardDescription>Ditampilkan dari file `PANDUAN-PENGGUNA.md` di root folder `dashboard/`.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 p-4">
            <Markdown content={content} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
