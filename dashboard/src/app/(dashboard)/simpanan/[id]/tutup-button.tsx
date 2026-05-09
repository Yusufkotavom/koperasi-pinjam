"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { closeSimpanan } from "@/actions/simpanan"
import { XCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Props {
  simpananId: string
  saldoTerpakai: number
}

export function TutupSimpananButton({ simpananId, saldoTerpakai }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [alasan, setAlasan] = useState("")
  const [open, setOpen] = useState(false)

  const disabled = saldoTerpakai > 0

  async function handleTutup() {
    setLoading(true)

    const result = await closeSimpanan(simpananId, alasan)

    if ("error" in result) {
      toast.error(typeof result.error === "string" ? result.error : "Gagal tutup simpanan")
      setLoading(false)
      return
    }

    toast.success("Simpanan berhasil ditutup")
    setOpen(false)
    router.refresh()
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={disabled}>
          <XCircle className="mr-2 h-4 w-4" />
          Tutup Simpanan
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tutup Simpanan?</AlertDialogTitle>
          <AlertDialogDescription>
            Simpanan akan ditutup dan tidak bisa digunakan lagi untuk pencairan pinjaman.
            {disabled && (
              <span className="block mt-2 text-red-600 font-medium">
                Tidak bisa tutup simpanan. Masih ada Rp {saldoTerpakai.toLocaleString("id-ID")} yang digunakan untuk
                pinjaman aktif.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="alasan">Alasan Penutupan (Opsional)</Label>
          <Textarea
            id="alasan"
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            placeholder="Misal: Penyimpan menarik dana"
            rows={3}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={handleTutup} disabled={loading || disabled} className="bg-red-600 hover:bg-red-700">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tutup Simpanan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
