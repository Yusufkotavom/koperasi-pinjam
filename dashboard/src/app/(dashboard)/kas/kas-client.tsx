"use client"

import { useEffect, useState, useTransition } from "react"
import { approveKasTransaksi, createKasKategori, getKasPendingApprovals, inputKas } from "@/actions/kas"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { NumericFormat } from "react-number-format"
import { CheckCircle2, Plus, RefreshCw, Tags, TrendingDown, TrendingUp, Upload, XCircle } from "lucide-react"
import { toast } from "sonner"
import { KasRowActions } from "./kas-row-actions"

type KasData = {
  transaksi: {
    id: string
    tanggal: Date
    jenis: "MASUK" | "KELUAR"
    kategori: string
    deskripsi: string
    jumlah: number
    kasJenis: string
    buktiUrl?: string | null
    isApproved: boolean
    inputOleh: { name: string }
  }[]
  totalMasuk: number
  totalKeluar: number
  pendingApprovalCount: number
  saldoAwal: number
}

type KasKategori = {
  id: string
  nama: string
  key: string
  jenis: "MASUK" | "KELUAR"
}

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

export function KasClientPage({ initialData, initialKategori }: { initialData: KasData; initialKategori: KasKategori[] }) {
  const [isPending, startTransition] = useTransition()
  const [tab, setTab] = useState<"histori" | "input" | "kategori" | "approval">("histori")
  const [jenis, setJenis] = useState<"MASUK" | "KELUAR">("MASUK")
  const [kategori, setKategori] = useState<string>("")
  const [jumlah, setJumlah] = useState<number>(0)
  const [deskripsi, setDeskripsi] = useState("")
  const [kasJenis, setKasJenis] = useState<"TUNAI" | "BANK">("TUNAI")
  const [isUploadingBukti, setIsUploadingBukti] = useState(false)
  const [buktiUrl, setBuktiUrl] = useState<string>("")
  const [kategoriRows, setKategoriRows] = useState<KasKategori[]>(initialKategori)
  const [kategoriJenis, setKategoriJenis] = useState<"MASUK" | "KELUAR">("MASUK")
  const [kategoriNama, setKategoriNama] = useState("")
  const [approvalRows, setApprovalRows] = useState<KasData["transaksi"]>([])
  const [approvalError, setApprovalError] = useState<string>("")
  const [approvalLoadedOnce, setApprovalLoadedOnce] = useState(false)

  const saldoAkhir = initialData.saldoAwal + initialData.totalMasuk - initialData.totalKeluar

  const kategoriOptions = kategoriRows.filter((k) => k.jenis === jenis)

  const setSafeTab = (v: string) => {
    if (v === "histori" || v === "input" || v === "kategori" || v === "approval") setTab(v)
  }

  const loadApprovals = () => {
    startTransition(async () => {
      setApprovalError("")
      const res = await getKasPendingApprovals()
      if (!("success" in res) || !res.success) {
        const err = "error" in res ? res.error : "Gagal memuat data approval kas."
        setApprovalError(typeof err === "string" ? err : "Gagal memuat data approval kas.")
        setApprovalRows([])
        return
      }
      setApprovalRows(
        res.data.map((t) => ({
          id: t.id,
          tanggal: t.tanggal,
          jenis: t.jenis,
          kategori: t.kategori,
          deskripsi: t.deskripsi,
          jumlah: Number(t.jumlah),
          kasJenis: t.kasJenis,
          buktiUrl: t.buktiUrl,
          isApproved: t.isApproved,
          inputOleh: { name: t.inputOleh.name },
        }))
      )
      setApprovalLoadedOnce(true)
    })
  }

  useEffect(() => {
    if (tab !== "approval") return
    if (approvalLoadedOnce) return
    loadApprovals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const uploadBukti = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files.item(0)
    if (!file) return

    setIsUploadingBukti(true)
    try {
      const formData = new FormData()
      formData.append("files", file)
      const res = await fetch("/api/upload/kas", { method: "POST", body: formData })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error ?? "Upload bukti transaksi gagal.")
        return
      }
      const urls = (json?.urls as string[] | undefined) ?? []
      if (urls.length === 0) {
        toast.error("Upload bukti transaksi gagal.")
        return
      }
      setBuktiUrl(urls[0] ?? "")
      toast.success("Bukti transaksi berhasil diupload.")
    } catch {
      toast.error("Upload bukti transaksi gagal.")
    } finally {
      setIsUploadingBukti(false)
    }
  }

  const submitKas = () => {
    if (!kategori.trim()) {
      toast.error("Kategori tidak boleh kosong")
      return
    }

    startTransition(async () => {
      const result = await inputKas({
        jenis,
        kategori,
        deskripsi,
        jumlah,
        kasJenis,
        ...(buktiUrl ? { buktiUrl } : {}),
      })

      if (!result.success) {
        const err = "error" in result ? result.error : null
        toast.error(typeof err === "string" ? err : "Gagal menyimpan transaksi kas.")
        return
      }

      if (result.data?.isApproved === false) {
        toast.success("Transaksi kas tersimpan dan menunggu persetujuan.")
      } else {
        toast.success("Transaksi kas berhasil disimpan.")
      }
      window.location.reload()
    })
  }

  const submitKategori = () => {
    if (!kategoriNama.trim()) {
      toast.error("Nama kategori tidak boleh kosong")
      return
    }

    startTransition(async () => {
      const res = await createKasKategori({ jenis: kategoriJenis, nama: kategoriNama })
      if (!res.success) {
        const err = "error" in res ? res.error : null
        toast.error(typeof err === "string" ? err : "Gagal menambah kategori.")
        return
      }
      toast.success("Kategori berhasil ditambahkan.")
      setKategoriRows((prev) => [res.data, ...prev])
      setKategoriNama("")
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Arus Kas</h1>
          <p className="text-muted-foreground text-sm">Modul akuntansi sederhana: pemasukan dan pengeluaran</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: "Saldo Akhir", value: fmt(saldoAkhir), icon: TrendingUp, color: "text-emerald-600" },
          { label: "Kas Masuk Hari Ini", value: fmt(initialData.totalMasuk), icon: TrendingUp, color: "text-blue-600" },
          { label: "Kas Keluar Hari Ini", value: fmt(initialData.totalKeluar), icon: TrendingDown, color: "text-red-600" },
        ].map((s) => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted/40 ${s.color}`}>
                <s.icon className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setSafeTab}>
        <TabsList>
          <TabsTrigger value="histori">Riwayat Transaksi</TabsTrigger>
          <TabsTrigger value="input">Input Transaksi Baru</TabsTrigger>
          <TabsTrigger value="approval" className="gap-2">
            Approval
            {initialData.pendingApprovalCount > 0 ? (
              <Badge className="bg-amber-100 text-amber-700">{initialData.pendingApprovalCount}</Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="kategori">Add Category</TabsTrigger>
        </TabsList>

        <TabsContent value="histori">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bukti</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead>Input Oleh</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialData.transaksi.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(row.tanggal).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <Badge className={row.jenis === "MASUK" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                          {row.jenis === "MASUK" ? "↑ Masuk" : "↓ Keluar"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{row.kategori}</TableCell>
                      <TableCell className="text-sm">{row.deskripsi}</TableCell>
                      <TableCell>
                        {row.isApproved ? (
                          <Badge className="bg-emerald-100 text-emerald-700">Approved</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {row.buktiUrl ? (
                          <a href={row.buktiUrl} target="_blank" rel="noreferrer" className="text-blue-700 underline">
                            Lihat
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${row.jenis === "MASUK" ? "text-emerald-600" : "text-red-500"}`}>
                        {row.jenis === "MASUK" ? "+" : "-"} {fmt(Number(row.jumlah))}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.inputOleh.name}</TableCell>
                      <TableCell>
                        <KasRowActions data={row} kategoriList={kategoriRows} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approval">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Approval Transaksi Kas</CardTitle>
                  <p className="text-sm text-muted-foreground">Daftar transaksi kas yang menunggu persetujuan.</p>
                </div>
                <Button variant="outline" className="gap-2" disabled={isPending} onClick={loadApprovals}>
                  <RefreshCw className="size-4" /> Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {approvalError ? (
                <div className="p-6 text-sm text-red-600">{approvalError}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Bukti</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead>Input Oleh</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvalRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                          Tidak ada transaksi kas pending.
                        </TableCell>
                      </TableRow>
                    ) : approvalRows.map((row) => (
                      <TableRow key={row.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(row.tanggal).toLocaleDateString("id-ID")}
                        </TableCell>
                        <TableCell>
                          <Badge className={row.jenis === "MASUK" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                            {row.jenis === "MASUK" ? "↑ Masuk" : "↓ Keluar"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{row.kategori}</TableCell>
                        <TableCell className="text-sm">{row.deskripsi}</TableCell>
                        <TableCell className="text-xs">
                          {row.buktiUrl ? (
                            <a href={row.buktiUrl} target="_blank" rel="noreferrer" className="text-blue-700 underline">
                              Lihat
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${row.jenis === "MASUK" ? "text-emerald-600" : "text-red-500"}`}>
                          {row.jenis === "MASUK" ? "+" : "-"} {fmt(Number(row.jumlah))}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{row.inputOleh.name}</TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2"
                              disabled={isPending}
                              onClick={() => {
                                const catatan = window.prompt("Catatan approval (opsional):", "")
                                startTransition(async () => {
                                  const res = await approveKasTransaksi({ id: row.id, action: "APPROVE", catatan: catatan ?? undefined })
                                  if (!res.success) {
                                    const err = "error" in res ? res.error : null
                                    toast.error(typeof err === "string" ? err : "Gagal approve transaksi.")
                                    return
                                  }
                                  toast.success("Transaksi kas disetujui.")
                                  loadApprovals()
                                })
                              }}
                            >
                              <CheckCircle2 className="size-4" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 text-red-700 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-800"
                              disabled={isPending}
                              onClick={() => {
                                const catatan = window.prompt("Alasan reject (opsional):", "")
                                startTransition(async () => {
                                  const res = await approveKasTransaksi({ id: row.id, action: "REJECT", catatan: catatan ?? undefined })
                                  if (!res.success) {
                                    const err = "error" in res ? res.error : null
                                    toast.error(typeof err === "string" ? err : "Gagal reject transaksi.")
                                    return
                                  }
                                  toast.success("Transaksi kas ditolak.")
                                  loadApprovals()
                                })
                              }}
                            >
                              <XCircle className="size-4" /> Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="input">
          <Card>
            <CardHeader><CardTitle className="text-base">Input Transaksi Kas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jenis Transaksi</Label>
                  <Select onValueChange={(v) => {
                    setJenis(v as "MASUK" | "KELUAR")
                    setKategori("")
                  }} value={jenis}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MASUK">Kas Masuk</SelectItem>
                      <SelectItem value="KELUAR">Kas Keluar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Kategori Pembukuan</Label>
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <Select
                      onValueChange={(v) => {
                        if (v === "__ADD__") {
                          setTab("kategori")
                          return
                        }
                        if (!v || v === "__NONE__") {
                          setKategori("")
                          return
                        }
                        setKategori(v)
                      }}
                      value={kategori || "__NONE__"}
                    >
                      <SelectTrigger><SelectValue placeholder="Pilih kategori..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__NONE__">Pilih kategori</SelectItem>
                        {kategoriOptions.map((k) => (
                          <SelectItem key={k.id} value={k.key}>{k.nama}</SelectItem>
                        ))}
                        <SelectItem value="__ADD__">+ Add Category</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" onClick={() => setTab("kategori")} className="gap-2">
                      <Tags className="size-4" /> Kelola
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jumlah (Rp)</Label>
                  <NumericFormat
                    customInput={Input}
                    thousandSeparator="."
                    decimalSeparator=","
                    value={jumlah || ""}
                    onValueChange={(values) => {
                      setJumlah(values.floatValue || 0)
                    }}
                    placeholder="Contoh: 5.000.000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Jenis Kas</Label>
                  <Select onValueChange={(v) => setKasJenis(v as "TUNAI" | "BANK")} value={kasJenis}>
                    <SelectTrigger><SelectValue placeholder="Tunai / Bank..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TUNAI">Kas Tunai</SelectItem>
                      <SelectItem value="BANK">Kas Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Keterangan</Label>
                <Input value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} placeholder="Deskripsi singkat transaksi..." />
              </div>
              <div className="space-y-2">
                <Label>Bukti Transaksi (opsional)</Label>
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  disabled={isUploadingBukti || isPending}
                  onChange={(e) => {
                    void uploadBukti(e.target.files)
                    e.currentTarget.value = ""
                  }}
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Upload className="size-3" />
                  {isUploadingBukti ? "Sedang upload..." : "Upload bukti (jpg/png/webp/pdf, max 5MB)."}
                </p>
                {buktiUrl ? (
                  <div className="flex items-center justify-between rounded border px-2 py-1 text-xs">
                    <a href={buktiUrl} target="_blank" rel="noreferrer" className="text-blue-700 underline truncate">
                      {buktiUrl}
                    </a>
                    <button type="button" className="text-red-600" onClick={() => setBuktiUrl("")}>Hapus</button>
                  </div>
                ) : null}
              </div>
              <Button disabled={isPending} onClick={submitKas} className="bg-emerald-600 hover:bg-emerald-700 w-full gap-1">
                <Plus className="size-4" /> Simpan Transaksi
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kategori">
          <Card>
            <CardHeader><CardTitle className="text-base">Add Category</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jenis</Label>
                  <Select
                    onValueChange={(v) => {
                      if (v === "MASUK" || v === "KELUAR") setKategoriJenis(v)
                    }}
                    value={kategoriJenis}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MASUK">Kas Masuk</SelectItem>
                      <SelectItem value="KELUAR">Kas Keluar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nama Kategori</Label>
                  <Input value={kategoriNama} onChange={(e) => setKategoriNama(e.target.value)} placeholder="Contoh: OPERASIONAL" />
                </div>
              </div>
              <Button disabled={isPending} onClick={submitKategori} className="w-full gap-2">
                <Plus className="size-4" /> Tambah Kategori
              </Button>

              <div className="grid gap-3 sm:grid-cols-2">
                {(["MASUK", "KELUAR"] as const).map((j) => (
                  <div key={j} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{j === "MASUK" ? "Kas Masuk" : "Kas Keluar"}</p>
                      <Badge variant="outline">{kategoriRows.filter((k) => k.jenis === j).length}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {kategoriRows.filter((k) => k.jenis === j).slice(0, 20).map((k) => (
                        <Badge key={k.id} className="bg-muted text-foreground">{k.nama}</Badge>
                      ))}
                      {kategoriRows.filter((k) => k.jenis === j).length === 0 && (
                        <p className="text-xs text-muted-foreground">Belum ada kategori.</p>
                      )}
                    </div>
                    {kategoriRows.filter((k) => k.jenis === j).length > 20 && (
                      <p className="mt-2 text-xs text-muted-foreground">Menampilkan 20 kategori pertama.</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
