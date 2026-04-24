"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updateKolektorBonusConfig, type KolektorBonusConfig } from "@/actions/settings"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function fmtCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

export function BonusKolektorSettingsForm({
  initial,
  canEdit,
}: {
  initial: KolektorBonusConfig
  canEdit: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [nominal, setNominal] = useState(initial.nominal)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Default Bonus Kolektor</CardTitle>
        <CardDescription>
          Nilai ini dipakai otomatis saat pencairan pinjaman jika field bonus kolektor di form pencairan dibiarkan kosong. Jika field pencairan diisi manual, nilai manual tersebut yang diprioritaskan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="max-w-sm space-y-2">
          <Label htmlFor="nominal">Nominal Default (Rp)</Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">Rp</span>
            <Input
              id="nominal"
              type="number"
              min="0"
              step="1000"
              className="pl-9"
              value={nominal === 0 ? "" : nominal}
              onChange={(event) => setNominal(event.target.value === "" ? 0 : Number(event.target.value))}
              disabled={!canEdit || isPending}
              placeholder="Contoh: 50000"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Nilai aktif saat ini: {fmtCurrency(nominal)}. Isi 0 untuk menonaktifkan bonus default global.
          </p>
        </div>

        <Button
          disabled={!canEdit || isPending}
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => {
            startTransition(async () => {
              const res = await updateKolektorBonusConfig({ nominal })
              if (res?.error) {
                toast.error(typeof res.error === "string" ? res.error : "Gagal menyimpan bonus default kolektor.")
                return
              }
              toast.success("Bonus default kolektor tersimpan.")
            })
          }}
        >
          {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
        </Button>
      </CardContent>
    </Card>
  )
}
