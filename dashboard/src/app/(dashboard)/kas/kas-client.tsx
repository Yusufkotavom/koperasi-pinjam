"use client"

import { useState, useTransition } from "react"
import { createKasKategori, inputKas } from "@/actions/kas"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { NumericFormat } from "react-number-format"
import { Plus, TrendingUp, TrendingDown, Tags } from "lucide-react"
import { toast } from "sonner"

type KasData = {
  transaksi: {
    id: string
    tanggal: Date
    jenis: "MASUK" | "KELUAR"
    kategori: string
    deskripsi: string
    jumlah: number
    kasJenis: string
    inputOleh: { name: string }
  }[]
  totalMasuk: number
  totalKeluar: number
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

import { KasRowActions } from "./kas-row-actions"

export function KasClientPage({ initialData, initialKategori }: { initialData: KasData; initialKategori: KasKategori[] }) {
  const [isPending, startTransition] = useTransition()
  const [tab, setTab] = useState<"histori" | "input" | "kategori">("histori")
  const [jenis, setJenis] = useState<"MASUK" | "KELUAR">("MASUK")
  const [kategori, setKategori] = useState<string>("")
  const [jumlah, setJumlah] = useState<number>(0)
  const [deskripsi, setDeskripsi] = useState("")
  const [kasJenis, setKasJenis] = useState<"TUNAI" | "BANK">("TUNAI")
  const [kategoriRows, setKategoriRows] = useState<KasKategori[]>(initialKategori)
  const [kategoriJenis, setKategoriJenis] = useState<"MASUK" | "KELUAR">("MASUK")
  const [kategoriNama, setKategoriNama] = useState("")

  const saldoAkhir = initialData.saldoAwal + initialData.totalMasuk - initialData.totalKeluar

  const kategoriOptions = kategoriRows.filter((k) => k.jenis === jenis)

  const setSafeTab = (v: string) => {
    if (v === "histori" || v === "input" || v === "kategori") setTab(v)
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
      })

      if (!result.success) {
        const err = "error" in result ? result.error : null
        toast.error(typeof err === "string" ? err : "Gagal menyimpan transaksi kas.")
        return
      }

      toast.success("Transaksi kas berhasil disimpan.")
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
