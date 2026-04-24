"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updateDendaConfig, type DendaConfig } from "@/actions/settings"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function DendaSettingsForm({ initial }: { initial: DendaConfig }) {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<DendaConfig>(initial)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Konfigurasi Denda</CardTitle>
        <CardDescription>
          Pilih metode perhitungan denda: berdasarkan persentase (dari sisa pokok pinjaman) atau nominal tetap per hari keterlambatan. Jika diisi 0, maka denda dinonaktifkan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3 max-w-sm">
          <Label>Jenis Denda</Label>
          <Select
            value={form.type}
            onValueChange={(v) => setForm((s) => ({ ...s, type: v as "PERCENTAGE" | "NOMINAL" }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih jenis denda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERCENTAGE">Persentase per hari (dari sisa pokok)</SelectItem>
              <SelectItem value="NOMINAL">Nominal Rupiah per hari</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 max-w-sm">
          <Label htmlFor="amount">
            Besaran Denda ({form.type === "PERCENTAGE" ? "% per hari" : "Rp per hari"})
          </Label>
          <div className="relative">
            {form.type === "NOMINAL" && (
              <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">Rp</span>
            )}
            <Input
              id="amount"
              type="number"
              step={form.type === "PERCENTAGE" ? "0.01" : "1000"}
              min="0"
              className={form.type === "NOMINAL" ? "pl-9" : ""}
              value={form.amount === 0 ? "" : form.amount}
              onChange={(e) => {
                const val = e.target.value === "" ? 0 : Number(e.target.value)
                setForm((s) => ({ ...s, amount: val }))
              }}
              placeholder={form.type === "PERCENTAGE" ? "Contoh: 0.1" : "Contoh: 10000"}
            />
            {form.type === "PERCENTAGE" && (
              <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {form.type === "PERCENTAGE" 
              ? "Isi 0.1 untuk 0.1% per hari. Isi 0 untuk menonaktifkan denda." 
              : "Isi nominal rupiah, misal 5000. Isi 0 untuk menonaktifkan denda."}
          </p>
        </div>

        <Button
          disabled={isPending}
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => {
            startTransition(async () => {
              const res = await updateDendaConfig(form)
              if (res?.error) {
                toast.error(typeof res.error === "string" ? res.error : "Gagal menyimpan pengaturan denda.")
                return
              }
              toast.success("Pengaturan denda tersimpan.")
            })
          }}
        >
          {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
        </Button>
      </CardContent>
    </Card>
  )
}
