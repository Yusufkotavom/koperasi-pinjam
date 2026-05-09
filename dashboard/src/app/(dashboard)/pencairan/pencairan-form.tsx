"use client"

import { useRef, useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cairkanPinjaman } from "@/actions/pengajuan"
import { getSimpananAvailable } from "@/actions/simpanan"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { Banknote, Wallet } from "lucide-react"

interface Props {
  pengajuan: {
    id: string
    nasabah: { namaLengkap: string; nomorAnggota: string }
    plafonDiajukan: unknown
    plafonDisetujui: unknown
    tenor: number
    bungaPerBulan: unknown
  }
  defaultBonusNominal: number
}

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

function getLocalDateInputValue(date: Date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

export function PencairanForm({ pengajuan, defaultBonusNominal }: Props) {
  const [isPending, startTransition] = useTransition()
  const submitLockRef = useRef(false)
  const [potonganAdmin, setPotonganAdmin] = useState(0)
  const [potonganProvisi, setPotonganProvisi] = useState(0)
  const [bonusKolektorNominal, setBonusKolektorNominal] = useState("")
  const [tanggalCair, setTanggalCair] = useState(() =>
    getLocalDateInputValue(new Date()),
  )
  const [sumberDana, setSumberDana] = useState<"KAS" | "SIMPANAN">("KAS")
  const [kasJenis, setKasJenis] = useState<"TUNAI" | "BANK">("TUNAI")
  const [simpananId, setSimpananId] = useState("")
  const [simpananList, setSimpananList] = useState<any[]>([])
  const [loadingSimpanan, setLoadingSimpanan] = useState(false)
  const router = useRouter()

  const plafon = Number(pengajuan.plafonDisetujui ?? pengajuan.plafonDiajukan)
  const bunga = Number(pengajuan.bungaPerBulan)
  const tenor = pengajuan.tenor

  const angsuranPokok = plafon / tenor
  const angsuranBunga = plafon * bunga
  const totalAngsuran = angsuranPokok + angsuranBunga
  const nilaiCair = plafon - potonganAdmin - potonganProvisi

  // Load simpanan available saat pilih SIMPANAN
  useEffect(() => {
    if (sumberDana === "SIMPANAN" && simpananList.length === 0) {
      setLoadingSimpanan(true)
      getSimpananAvailable()
        .then((data) => {
          setSimpananList(data)
          if (data.length > 0) {
            setSimpananId(data[0].id)
          }
        })
        .catch(() => toast.error("Gagal load simpanan"))
        .finally(() => setLoadingSimpanan(false))
    }
  }, [sumberDana, simpananList.length])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isPending || submitLockRef.current) return
    submitLockRef.current = true
    const toastId = toast.loading("Memproses pencairan...")
    startTransition(async () => {
      try {
        const result = await cairkanPinjaman({
          pengajuanId: pengajuan.id,
          potonganAdmin,
          potonganProvisi,
          bonusKolektorNominal,
          tanggalCair,
          sumberDana,
          kasJenis: sumberDana === "KAS" ? kasJenis : undefined,
          simpananId: sumberDana === "SIMPANAN" ? simpananId : undefined,
        })
        if (result.error) {
          toast.error(typeof result.error === "string" ? result.error : "Gagal mencairkan pinjaman", { id: toastId })
          return
        }
        toast.success(`Pinjaman berhasil dicairkan! No. Kontrak: ${result.data?.nomorKontrak}`, { id: toastId })
        router.push(`/dokumen/pencairan/${pengajuan.id}`)
      } finally {
        submitLockRef.current = false
      }
    })
  }

  const selectedSimpanan = simpananList.find((s) => s.id === simpananId)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Banknote className="size-4 text-teal-600" /> Form Pencairan
        </CardTitle>
        <CardDescription>
          {pengajuan.nasabah.namaLengkap} · {pengajuan.nasabah.nomorAnggota}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
            <p className="font-medium text-muted-foreground text-xs">Rincian Pinjaman</p>
            {[
              { label: "Plafon Disetujui", value: fmt(plafon) },
              { label: "Tenor", value: `${tenor} bulan` },
              { label: "Bunga Flat/bln", value: `${(bunga * 100).toFixed(1)}%` },
              { label: "Angsuran Pokok/bln", value: fmt(angsuranPokok) },
              { label: "Angsuran Bunga/bln", value: fmt(angsuranBunga) },
              { label: "Total Angsuran/bln", value: fmt(totalAngsuran), bold: true },
              { label: "Total Beban Bunga", value: fmt(angsuranBunga * tenor) },
            ].map((r) => (
              <div key={r.label} className="flex justify-between">
                <span className="text-muted-foreground">{r.label}</span>
                <span className={r.bold ? "font-bold" : ""}>{r.value}</span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Potongan Admin (Rp)</Label>
              <Input
                type="number"
                placeholder="0"
                value={potonganAdmin || ""}
                onChange={(e) => setPotonganAdmin(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Potongan Provisi (Rp)</Label>
              <Input
                type="number"
                placeholder="0"
                value={potonganProvisi || ""}
                onChange={(e) => setPotonganProvisi(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Bonus Kolektor Saat Nasabah Lunas (Rp)</Label>
            <Input
              type="number"
              placeholder={defaultBonusNominal > 0 ? String(defaultBonusNominal) : "Kosong = pakai default settings"}
              value={bonusKolektorNominal}
              onChange={(e) => setBonusKolektorNominal(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Jika dikosongkan, sistem memakai default bonus dari settings: {fmt(defaultBonusNominal)}. Jika diisi manual, nilai manual per pinjaman ini yang dipakai lebih dulu.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Tanggal Pencairan (bisa tanggal lampau)</Label>
            <Input
              type="date"
              value={tanggalCair}
              onChange={(e) => setTanggalCair(e.target.value)}
              required
              suppressHydrationWarning
            />
            <p className="text-xs text-muted-foreground">
              Gunakan tanggal real pencairan. Sistem mendukung input pencairan untuk hari sebelumnya.
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Sumber Dana Pencairan</Label>
            <RadioGroup value={sumberDana} onValueChange={(v) => setSumberDana(v as "KAS" | "SIMPANAN")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="KAS" id="kas" />
                <Label htmlFor="kas" className="font-normal cursor-pointer">
                  Kas/Bank Koperasi (Modal Sendiri)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="SIMPANAN" id="simpanan" />
                <Label htmlFor="simpanan" className="font-normal cursor-pointer flex items-center gap-2">
                  <Wallet className="size-4" />
                  Modal Simpanan (dari Penyimpan)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {sumberDana === "KAS" && (
            <div className="space-y-2">
              <Label>Jenis Kas</Label>
              <Select value={kasJenis} onValueChange={(value) => setKasJenis(value as "TUNAI" | "BANK")}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TUNAI">Kas Tunai</SelectItem>
                  <SelectItem value="BANK">Kas Bank</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Pencairan ditolak jika saldo sumber dana ini tidak cukup. Setor modal/simpanan dulu bila saldo kurang.
              </p>
            </div>
          )}

          {sumberDana === "SIMPANAN" && (
            <div className="space-y-2">
              <Label>Pilih Simpanan</Label>
              {loadingSimpanan ? (
                <p className="text-sm text-muted-foreground">Loading simpanan...</p>
              ) : simpananList.length === 0 ? (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
                  Belum ada simpanan aktif dengan saldo tersedia. Buat simpanan baru di menu Simpanan.
                </div>
              ) : (
                <>
                  <Select value={simpananId} onValueChange={setSimpananId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih simpanan" />
                    </SelectTrigger>
                    <SelectContent>
                      {simpananList.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.namaPenyimpan} ({s.nomorRekening}) - Tersedia: {fmt(Number(s.saldoTersedia))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedSimpanan && (
                    <div className="rounded-lg border bg-blue-50 p-3 text-sm">
                      <p className="font-medium text-blue-900">{selectedSimpanan.namaPenyimpan}</p>
                      <p className="text-xs text-blue-700">
                        Rekening: {selectedSimpanan.nomorRekening} · Saldo Tersedia: {fmt(Number(selectedSimpanan.saldoTersedia))}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="rounded-lg bg-teal-50 border border-teal-200 p-4 text-sm">
            <div className="flex justify-between font-bold text-teal-900">
              <span>Nilai Bersih Diterima</span>
              <span className="text-xl">{fmt(nilaiCair)}</span>
            </div>
            {(potonganAdmin + potonganProvisi) > 0 && (
              <p className="text-xs text-teal-700 mt-1">Dipotong Rp {fmt(potonganAdmin + potonganProvisi)}</p>
            )}
          </div>

          <Button 
            type="submit" 
            disabled={isPending || (sumberDana === "SIMPANAN" && simpananList.length === 0)} 
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            <Banknote className="size-4" />
            {isPending ? "Memproses..." : `Cairkan ${fmt(nilaiCair)}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
