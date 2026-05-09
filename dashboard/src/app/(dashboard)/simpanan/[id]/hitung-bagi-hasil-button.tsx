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
import { hitungBagiHasil } from "@/actions/simpanan"
import { Calculator, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Props {
  simpananId: string
  persenBagiHasil: number
  saldoAwal: number
}

export function HitungBagiHasilButton({ simpananId, persenBagiHasil, saldoAwal }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [periode, setPeriode] = useState("")
  const [open, setOpen] = useState(false)

  // Generate default periode (bulan ini)
  const defaultPeriode = new Date().toISOString().slice(0, 7) // YYYY-MM

  const estimasiBagiHasil = (saldoAwal * persenBagiHasil) / 100

  async function handleHitung() {
    setLoading(true)

    const periodeValue = periode || defaultPeriode

    const result = await hitungBagiHasil(simpananId, periodeValue)

    if ("error" in result) {
      toast.error(typeof result.error === "string" ? result.error : "Gagal hitung bagi hasil")
      setLoading(false)
      return
    }

    toast.success(`Bagi hasil periode ${periodeValue} berhasil dihitung`)
    setOpen(false)
    setPeriode("")
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" type="button">
          <Calculator className="mr-2 h-4 w-4" />
          Hitung Bagi Hasil
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hitung Bagi Hasil</DialogTitle>
          <DialogDescription>Hitung bagi hasil untuk periode tertentu</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Saldo Awal</span>
              <span className="font-medium">Rp {saldoAwal.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Persen Bagi Hasil</span>
              <span className="font-medium">{persenBagiHasil}%</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-medium">Estimasi Bagi Hasil</span>
              <span className="text-lg font-bold">Rp {estimasiBagiHasil.toLocaleString("id-ID")}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="periode">
              Periode (YYYY-MM) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="periode"
              type="month"
              value={periode || defaultPeriode}
              onChange={(e) => setPeriode(e.target.value)}
              placeholder="2026-05"
            />
            <p className="text-xs text-muted-foreground">
              Default: bulan ini ({defaultPeriode})
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleHitung} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Hitung
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
