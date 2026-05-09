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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { bayarBagiHasil } from "@/actions/simpanan"
import { CheckCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Props {
  bagiHasilId: string
  jumlah: number
}

export function BayarBagiHasilButton({ bagiHasilId, jumlah }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [catatan, setCatatan] = useState("")
  const [open, setOpen] = useState(false)

  async function handleBayar() {
    setLoading(true)

    const result = await bayarBagiHasil(bagiHasilId, catatan)

    if ("error" in result) {
      toast.error(typeof result.error === "string" ? result.error : "Gagal bayar bagi hasil")
      setLoading(false)
      return
    }

    toast.success("Bagi hasil berhasil dibayar")
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button size="sm" type="button">
          <CheckCircle className="mr-2 h-4 w-4" />
          Bayar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bayar Bagi Hasil</DialogTitle>
          <DialogDescription>Konfirmasi pembayaran bagi hasil simpanan</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Jumlah Bagi Hasil</p>
            <p className="text-2xl font-bold">Rp {jumlah.toLocaleString("id-ID")}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="catatan">Catatan Pembayaran (Opsional)</Label>
            <Textarea
              id="catatan"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Misal: Dibayar via transfer"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleBayar} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Bayar Rp {jumlah.toLocaleString("id-ID")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
