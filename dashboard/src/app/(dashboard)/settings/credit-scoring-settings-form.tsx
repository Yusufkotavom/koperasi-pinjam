"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updateCreditScoringConfig } from "@/actions/settings"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CreditScoringConfig } from "@/lib/credit-score"

function pctToDec(v: number) {
  return v / 100
}
function decToPct(v: number) {
  return Math.round(v * 100)
}

export function CreditScoringSettingsForm({ initial }: { initial: CreditScoringConfig }) {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<CreditScoringConfig>(initial)

  const num = (key: keyof CreditScoringConfig, raw: string) =>
    setForm((s) => ({ ...s, [key]: raw === "" ? 0 : Number(raw) }))

  const pct = (key: keyof CreditScoringConfig, raw: string) =>
    setForm((s) => ({ ...s, [key]: pctToDec(raw === "" ? 0 : Number(raw)) }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Credit Scoring & Plafon Dinamis</CardTitle>
        <CardDescription className="text-sm">
          Skor performa rata-rata (0–100) per siklus pembayaran, kategori nasabah A–E, dan
          persentase penyesuaian plafon pinjaman berikutnya. Semua nilai ini bersifat informasi
          dan tidak memengaruhi transaksi/jurnal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Matriks skor siklus */}
        <div>
          <h3 className="text-sm font-semibold mb-1">Matriks Skor Siklus (berdasarkan DPD)</h3>
          <p className="text-xs text-muted-foreground mb-3">
            DPD = selisih hari pembayaran terhadap jatuh tempo. Nilai performa tiap siklus.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="onTimeScore">Skor Tepat Waktu (DPD ≤ 0)</Label>
              <Input id="onTimeScore" type="number" min={-100} max={100} value={form.onTimeScore} onChange={(e) => num("onTimeScore", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="late1MaxDpd">Batas DPD LATE_1 (1–N hari)</Label>
              <Input id="late1MaxDpd" type="number" min={0} max={365} value={form.late1MaxDpd} onChange={(e) => num("late1MaxDpd", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="late1Score">Skor LATE_1 (DPD ≤ {form.late1MaxDpd})</Label>
              <Input id="late1Score" type="number" min={-100} max={100} value={form.late1Score} onChange={(e) => num("late1Score", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="late2MaxDpd">Batas DPD LATE_2 (≤ N hari)</Label>
              <Input id="late2MaxDpd" type="number" min={0} max={365} value={form.late2MaxDpd} onChange={(e) => num("late2MaxDpd", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="late2Score">Skor LATE_2 (DPD ≤ {form.late2MaxDpd})</Label>
              <Input id="late2Score" type="number" min={-100} max={100} value={form.late2Score} onChange={(e) => num("late2Score", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="late3MaxDpd">Batas DPD LATE_3 (≤ N hari)</Label>
              <Input id="late3MaxDpd" type="number" min={0} max={365} value={form.late3MaxDpd} onChange={(e) => num("late3MaxDpd", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="late3Score">Skor LATE_3 (DPD ≤ {form.late3MaxDpd})</Label>
              <Input id="late3Score" type="number" min={-100} max={100} value={form.late3Score} onChange={(e) => num("late3Score", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultScore">Skor DEFAULT (DPD &gt; {form.late3MaxDpd})</Label>
              <Input id="defaultScore" type="number" min={-100} max={100} value={form.defaultScore} onChange={(e) => num("defaultScore", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Threshold kategori */}
        <div>
          <h3 className="text-sm font-semibold mb-1">Ambang Kategori (skor akhir)</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Kategori ditentukan dari skor akhir (rata-rata seluruh siklus, clamp 0–100).
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gradeAFloor">Batas bawah A</Label>
              <Input id="gradeAFloor" type="number" min={0} max={100} value={form.gradeAFloor} onChange={(e) => num("gradeAFloor", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gradeBFloor">Batas bawah B</Label>
              <Input id="gradeBFloor" type="number" min={0} max={100} value={form.gradeBFloor} onChange={(e) => num("gradeBFloor", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gradeCFloor">Batas bawah C</Label>
              <Input id="gradeCFloor" type="number" min={0} max={100} value={form.gradeCFloor} onChange={(e) => num("gradeCFloor", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gradeDFloor">Batas bawah D</Label>
              <Input id="gradeDFloor" type="number" min={0} max={100} value={form.gradeDFloor} onChange={(e) => num("gradeDFloor", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Persentase penyesuaian plafon */}
        <div>
          <h3 className="text-sm font-semibold mb-1">Penyesuaian Plafon per Kategori (%)</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Plafon baru = plafon pinjaman terakhir × (1 + persen). Kategori E default -100% (ditolak).
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="limitA">Kategori A (%)</Label>
              <Input id="limitA" type="number" min={-100} max={1000} value={decToPct(form.limitA)} onChange={(e) => pct("limitA", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="limitB">Kategori B (%)</Label>
              <Input id="limitB" type="number" min={-100} max={1000} value={decToPct(form.limitB)} onChange={(e) => pct("limitB", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="limitC">Kategori C (%)</Label>
              <Input id="limitC" type="number" min={-100} max={1000} value={decToPct(form.limitC)} onChange={(e) => pct("limitC", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="limitD">Kategori D (%)</Label>
              <Input id="limitD" type="number" min={-100} max={1000} value={decToPct(form.limitD)} onChange={(e) => pct("limitD", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="limitE">Kategori E (%)</Label>
              <Input id="limitE" type="number" min={-100} max={1000} value={decToPct(form.limitE)} onChange={(e) => pct("limitE", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Bobot skor per pinjaman */}
        <div>
          <h3 className="text-sm font-semibold mb-1">Bobot Skor per Pinjaman</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Skor agregat nasabah = gabungan skor tiap pinjaman. Pinjaman <strong>terakhir</strong> diberi bobot
            dominan; sisanya dibagi rata ke pinjaman sebelumnya. Contoh (60%): pinjaman #1 skor 70 &amp; #2 skor 100 →
            (40%×70)+(60%×100) = 88. Untuk 3 pinjaman: terakhir 60%, dua lainnya 20% masing-masing.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latestLoanWeight">Bobot Pinjaman Terakhir (%)</Label>
              <Input
                id="latestLoanWeight"
                type="number"
                min={0}
                max={100}
                value={decToPct(form.latestLoanWeight)}
                onChange={(e) => pct("latestLoanWeight", e.target.value)}
              />
            </div>
            <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
              Bobot pinjaman sebelumnya = (100% − bobot di samping) ÷ jumlah pinjaman sebelumnya.
            </div>
          </div>
        </div>

        <Button
          disabled={isPending}
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => {
            startTransition(async () => {
              const res = await updateCreditScoringConfig(form)
              if (res?.error) {
                toast.error(typeof res.error === "string" ? res.error : "Gagal menyimpan pengaturan.")
                return
              }
              toast.success("Pengaturan credit scoring tersimpan.")
            })
          }}
        >
          {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
        </Button>
      </CardContent>
    </Card>
  )
}
