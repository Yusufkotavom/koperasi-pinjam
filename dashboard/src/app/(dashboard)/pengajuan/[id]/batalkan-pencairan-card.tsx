"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { batalkanPencairanPinjaman } from "@/actions/pengajuan"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function BatalkanPencairanCard({
  pengajuanId,
  hasPembayaran,
}: {
  pengajuanId: string
  hasPembayaran: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [alasan, setAlasan] = useState("")
  const router = useRouter()

  const disabled = isPending || hasPembayaran || alasan.trim().length < 10

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (disabled) return
    if (!window.confirm("Batalkan pencairan ini? Aksi ini akan membuat jurnal reversal dan tidak bisa di-undo.")) return

    const toastId = toast.loading("Membatalkan pencairan...")
    startTransition(async () => {
      const result = await batalkanPencairanPinjaman({ pengajuanId, alasan })
      if (result.error) {
        toast.error(typeof result.error === "string" ? result.error : "Gagal membatalkan pencairan.", { id: toastId })
        return
      }

      toast.success("Pencairan berhasil dibatalkan dengan jurnal reversal.", { id: toastId })
      setAlasan("")
      router.refresh()
    })
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
          <AlertTriangle className="size-4" />
          Batalkan Pencairan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasPembayaran ? (
          <p className="text-xs text-amber-800">
            Tidak bisa dibatalkan karena pinjaman ini sudah memiliki pembayaran angsuran.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="alasanPembatalan" className="text-xs">
                Alasan Pembatalan (min. 10 karakter)
              </Label>
              <Textarea
                id="alasanPembatalan"
                value={alasan}
                onChange={(event) => setAlasan(event.target.value)}
                rows={3}
                placeholder="Contoh: Salah tanggal/value pencairan, akan diproses ulang."
              />
            </div>
            <Button type="submit" variant="destructive" className="w-full" disabled={disabled}>
              {isPending ? "Memproses..." : "Batalkan Pencairan"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
