"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { catatBayarDp } from "@/actions/pengajuan"
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
import { Field, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { CreditCard, Loader2 } from "lucide-react"

type Props = {
  pengajuanId: string
  nominalDp: number
  namaBarang?: string | null
  namaNasabah: string
}

function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val)
}

export function CatatDpDialog({ pengajuanId, nominalDp, namaBarang, namaNasabah }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [kasJenis, setKasJenis] = useState<"TUNAI" | "BANK">("TUNAI")
  const [keterangan, setKeterangan] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const res = await catatBayarDp({
        pengajuanId,
        kasJenis,
        keterangan: keterangan || undefined,
      })

      if (res.error) {
        if (typeof res.error === "string") {
          toast.error(res.error)
        } else {
          toast.error("Validasi gagal. Periksa data kembali.")
        }
        return
      }

      toast.success("Pembayaran DP berhasil dicatat dan masuk ke jurnal titipan!")
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium"
      >
        <CreditCard className="size-4 mr-2" />
        Catat Pembayaran DP ({formatRupiah(nominalDp)})
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Penerimaan Uang Muka (DP)</DialogTitle>
              <DialogDescription className="text-xs">
                Mencatat uang muka nasabah ke Kas Koperasi sebagai <strong>Utang Titipan (Kewajiban)</strong>.
                Tidak menambah laba kotor koperasi (P&amp;L Netral).
              </DialogDescription>
            </DialogHeader>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs space-y-1 text-amber-900">
              <div className="flex justify-between">
                <span>Nasabah:</span>
                <span className="font-semibold">{namaNasabah}</span>
              </div>
              {namaBarang && (
                <div className="flex justify-between">
                  <span>Barang:</span>
                  <span className="font-semibold">{namaBarang}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-amber-200">
                <span>Nominal DP:</span>
                <span className="text-amber-800">{formatRupiah(nominalDp)}</span>
              </div>
            </div>

            <Field>
              <FieldLabel>Metode Penerimaan Kas <span className="text-red-500">*</span></FieldLabel>
              <Select value={kasJenis} onValueChange={(v) => setKasJenis(v as "TUNAI" | "BANK")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TUNAI">Kas Tunai (Fisik di Kasir)</SelectItem>
                  <SelectItem value="BANK">Kas Bank (Transfer Rekening)</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="keterangan-dp">Catatan / Keterangan (Opsional)</FieldLabel>
              <Textarea
                id="keterangan-dp"
                placeholder="contoh: Diterima tunai di kantor via kasir..."
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                rows={2}
              />
            </Field>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                Batal
              </Button>
              <Button type="submit" disabled={isPending} className="bg-amber-600 hover:bg-amber-700 text-white">
                {isPending && <Loader2 className="size-4 animate-spin mr-2" />}
                Konfirmasi Terima DP
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
