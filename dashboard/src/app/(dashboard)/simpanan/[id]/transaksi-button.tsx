"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createTransaksiSimpanan } from "@/actions/simpanan"
import { ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Props {
  simpananId: string
  saldoTersedia: number
  jenis: "SETOR" | "TARIK"
}

export function TransaksiSimpananButton({ simpananId, saldoTersedia, jenis }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [jumlah, setJumlah] = useState("")
  const [keterangan, setKeterangan] = useState("")

  const isSetor = jenis === "SETOR"
  const Icon = isSetor ? ArrowDownCircle : ArrowUpCircle
  const title = isSetor ? "Setor Simpanan" : "Tarik Simpanan"
  const description = isSetor
    ? "Tambah saldo simpanan"
    : "Tarik dana dari simpanan (hanya saldo tersedia)"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const jumlahNum = Number(jumlah)
    if (jumlahNum <= 0) {
      toast.error("Jumlah harus lebih dari 0")
      setLoading(false)
      return
    }

    if (!isSetor && jumlahNum > saldoTersedia) {
      toast.error(`Saldo tersedia tidak cukup. Maksimal: Rp ${saldoTersedia.toLocaleString("id-ID")}`)
      setLoading(false)
      return
    }

    const result = await createTransaksiSimpanan({
      simpananId,
      jenis,
      jumlah: jumlahNum,
      keterangan,
    })

    if ("error" in result) {
      toast.error(typeof result.error === "string" ? result.error : "Gagal proses transaksi")
      setLoading(false)
      return
    }

    toast.success(`${isSetor ? "Setor" : "Tarik"} simpanan berhasil`)
    setOpen(false)
    setJumlah("")
    setKeterangan("")
    router.refresh()
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant={isSetor ? "default" : "outline"} type="button">
          <Icon className="mr-2 h-4 w-4" />
          {title}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!isSetor && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="text-muted-foreground">Saldo Tersedia</p>
                <p className="text-lg font-bold">Rp {saldoTersedia.toLocaleString("id-ID")}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="jumlah">
                Jumlah (Rp) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="jumlah"
                type="number"
                required
                min="1"
                step="1000"
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value)}
                placeholder={isSetor ? "Misal: 5000000" : `Maksimal: ${saldoTersedia}`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
              <Textarea
                id="keterangan"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder={isSetor ? "Misal: Tambahan modal" : "Misal: Penarikan dana"}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSetor ? "Setor" : "Tarik"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
