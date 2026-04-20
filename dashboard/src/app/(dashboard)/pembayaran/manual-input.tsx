"use client"

import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { searchJadwalAngsuranManual, type ActiveLoanBorrowerOption } from "@/actions/pembayaran"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { BayarButton } from "./bayar-button"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

type Row = Awaited<ReturnType<typeof searchJadwalAngsuranManual>>[number] & {
  daysLate: number
  dueLabel: string
}

export function ManualPembayaranInput({ borrowers }: { borrowers: ActiveLoanBorrowerOption[] }) {
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [selectedBorrowerId, setSelectedBorrowerId] = useState("")
  const [rows, setRows] = useState<Row[]>([])
  const [open, setOpen] = useState<Record<string, boolean>>({})

  const canSearch = useMemo(() => selectedBorrowerId.length > 0 || search.trim().length >= 3, [search, selectedBorrowerId])
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      {
        kontrak: string
        nama: string
        nomorAnggota: string
        kelompok: string
        rows: Row[]
      }
    >()
    for (const r of rows) {
      const kontrak = r.pinjaman.nomorKontrak
      const nama = r.pinjaman.pengajuan.nasabah.namaLengkap
      const nomorAnggota = r.pinjaman.pengajuan.nasabah.nomorAnggota
      const kelompok = r.pinjaman.pengajuan.kelompok?.nama ?? "Individu"
      const prev =
        map.get(kontrak) ?? { kontrak, nama, nomorAnggota, kelompok, rows: [] }
      prev.rows.push(r)
      map.set(kontrak, prev)
    }
    return Array.from(map.values())
  }, [rows])

  return (
    <Card className="border-none shadow-sm overflow-hidden">
      <CardHeader className="pb-6 border-b border-slate-50 dark:border-slate-800/50">
        <div className="flex items-center gap-2">
          <Search className="size-4 text-primary" />
          <CardTitle className="text-base font-semibold">Input Pembayaran Manual</CardTitle>
        </div>
        <CardDescription>
          Cari berdasarkan nama nasabah, no anggota, NIK, atau nomor kontrak.
        </CardDescription>
        <div className="flex flex-col gap-3 pt-2 lg:flex-row lg:items-center">
          <div className="lg:w-[340px]">
            <select
              value={selectedBorrowerId}
              onChange={(e) => {
                setSelectedBorrowerId(e.target.value)
                setRows([])
                setOpen({})
              }}
              className="h-10 w-full rounded-lg border border-slate-100 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all dark:border-slate-800 dark:bg-slate-900"
              title="Pilih nasabah yang masih memiliki pinjaman aktif"
            >
              <option value="">Semua nasabah aktif</option>
              {borrowers.map((borrower) => (
                <option key={borrower.nasabahId} value={borrower.nasabahId}>
                  {borrower.namaLengkap} · {borrower.nomorAnggota} · {borrower.activeLoanCount} pinjaman aktif
                </option>
              ))}
            </select>
          </div>
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Contoh: N-24-0001 / 327xxx / KONTRAK..."
              className="pl-9 bg-slate-50 border-slate-100 focus-visible:bg-white transition-all dark:bg-slate-900 dark:border-slate-800"
            />
          </div>
          <Button
            disabled={isPending || !canSearch}
            variant="secondary"
            className="px-6"
            onClick={() => {
              startTransition(async () => {
                try {
                  const result = await searchJadwalAngsuranManual({
                    search,
                    nasabahId: selectedBorrowerId || undefined,
                    limit: 20,
                  })
                  const nowTs = Date.now()
                  const nextRows = result.map((r) => {
                    const dueDate = new Date(r.tanggalJatuhTempo)
                    const dueTs = dueDate.getTime()
                    const daysLate = Math.max(
                      0,
                      Math.floor((nowTs - dueTs) / (1000 * 60 * 60 * 24)),
                    )
                    const dueLabel = dueDate.toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                    return { ...r, daysLate, dueLabel }
                  })
                  setRows(nextRows)
                  setOpen(
                    nextRows.reduce<Record<string, boolean>>((acc, r) => {
                      acc[r.pinjaman.nomorKontrak] = true
                      return acc
                    }, {}),
                  )
                  if (result.length === 0) toast.message("Tidak ada jadwal angsuran ditemukan.")
                } catch {
                  toast.error("Gagal mencari jadwal angsuran.")
                }
              })
            }}
          >
            {isPending ? "Mencari..." : "Cari"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            Pilih nasabah aktif atau masukkan minimal 3 karakter, lalu klik Cari.
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {grouped.map((g) => (
              <div key={g.kontrak} className="p-4">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() =>
                    setOpen((s) => ({ ...s, [g.kontrak]: !s[g.kontrak] }))
                  }
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold tracking-tight text-slate-900 dark:text-slate-200">
                          {g.nama}
                        </span>
                        <Badge className="border-0 bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300 text-[10px] font-black h-5 uppercase tracking-wider">
                          {g.kontrak}
                        </Badge>
                        <Badge className="border-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold h-5 uppercase tracking-wider">
                          {g.rows.length} angsuran
                        </Badge>
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        Anggota: <span className="font-mono">{g.nomorAnggota}</span> · Kelompok:{" "}
                        <span className="font-semibold">{g.kelompok}</span>
                      </div>
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      {open[g.kontrak] ? "Tutup" : "Buka"}
                    </div>
                  </div>
                </button>

                {open[g.kontrak] ? (
                  <div className="mt-3 divide-y divide-slate-50 rounded-lg border border-slate-100 dark:divide-slate-800 dark:border-slate-800 overflow-hidden">
                    {g.rows.map((r) => (
                      <div
                        key={r.id}
                        className="p-3 flex items-center justify-between gap-4 bg-white dark:bg-slate-950"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="border-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold h-5 uppercase tracking-wider">
                              Ke-{r.angsuranKe}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              Due <span className="font-semibold">{r.dueLabel}</span>
                            </span>
                            {r.daysLate > 0 ? (
                              <Badge className="border-0 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-[10px] font-black h-5 uppercase tracking-wider">
                                Telat {r.daysLate} hari
                              </Badge>
                            ) : null}
                          </div>
                          <div className="mt-1 text-[11px] text-slate-700 dark:text-slate-300">
                            Tagihan: <span className="font-black">{fmt(Number(r.total))}</span>
                          </div>
                        </div>
                        <div className="flex shrink-0">
                          <BayarButton jadwalId={r.id} total={Number(r.total)} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
