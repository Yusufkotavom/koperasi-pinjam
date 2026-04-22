"use client"

import { backfillAccountingJournalsAction, cleanupDatabaseAction, importDemoDataAction } from "@/actions/maintenance"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useTransition } from "react"
import { toast } from "sonner"

type MaintenanceAction = (formData: FormData) => Promise<{ success: true; message: string } | { success: false; error: string }>

export function DbMaintenanceCard({ canEdit }: { canEdit: boolean }) {
  const [isPending, startTransition] = useTransition()

  if (!canEdit) return null

  function submitMaintenance(
    event: React.FormEvent<HTMLFormElement>,
    action: MaintenanceAction,
    pendingMessage: string,
  ) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      const toastId = toast.loading(pendingMessage)
      const result = await action(formData)

      if (!result.success) {
        toast.error(result.error, { id: toastId })
        return
      }

      toast.success(result.message, { id: toastId })
      form.reset()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Database</CardTitle>
        <CardDescription>
          Cleanup/reset hanya berlaku untuk data company yang sedang aktif (tenant saat ini). Fitur ini hanya untuk Admin.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 xl:grid-cols-3">
        <form
          onSubmit={(event) => submitMaintenance(event, cleanupDatabaseAction, "Menjalankan cleanup database...")}
          className="flex flex-col gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4"
        >
          <div>
            <p className="font-semibold text-destructive">Cleanup DB</p>
            <p className="text-sm text-muted-foreground">Pilih scope yang akan dibersihkan untuk company aktif, atau gunakan Clean All.</p>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            {[
              ["NOTIFIKASI", "Notifikasi"],
              ["TRANSAKSI", "Transaksi pinjaman/kas"],
              ["MASTER", "Master nasabah/kelompok"],
              ["AKUNTANSI", "COA & setting akuntansi"],
            ].map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 rounded-lg border bg-background/70 px-3 py-2">
                <input type="checkbox" name="scope" value={value} className="size-4" />
                {label}
              </label>
            ))}
          </div>
          <Separator />
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="cleanAll" className="size-4" />
            Clean all data (company aktif)
          </label>
          <Input name="confirmation" placeholder="Ketik BERSIHKAN" />
          <Button type="submit" variant="destructive" disabled={isPending}>Jalankan Cleanup</Button>
        </form>

        <form
          onSubmit={(event) => submitMaintenance(event, importDemoDataAction, "Mengimport demo data...")}
          className="flex flex-col gap-4 rounded-xl border bg-muted/30 p-4"
        >
          <div>
            <p className="font-semibold">Import Demo Data</p>
            <p className="text-sm text-muted-foreground">
              Membuat kelompok, puluhan nasabah, simpanan, pinjaman, jadwal angsuran, pembayaran, kas,
              akun akuntansi, dan kategori untuk company Anda saat ini.
            </p>
          </div>
          <div className="rounded-lg border bg-background/70 p-3 text-sm text-muted-foreground">
            Volume demo: 36 nasabah, 24 pinjaman, dan 100+ transaksi pembayaran/kas agar dashboard dan laporan terlihat terisi.
          </div>
          <Input name="confirmation" placeholder="Ketik DEMO" />
          <Button type="submit" disabled={isPending}>Import Demo Data</Button>
        </form>

        <form
          onSubmit={(event) => submitMaintenance(event, backfillAccountingJournalsAction, "Menjalankan backfill jurnal...")}
          className="flex flex-col gap-4 rounded-xl border border-blue-200 bg-blue-50/40 p-4"
        >
          <div>
            <p className="font-semibold text-blue-800">Backfill Jurnal Akuntansi</p>
            <p className="text-sm text-muted-foreground">
              Membuat jurnal double-entry dari pembayaran, pencairan, simpanan, dan kas lama.
            </p>
          </div>
          <div className="rounded-lg border bg-background/70 p-3 text-sm text-muted-foreground">
            Aman dijalankan ulang karena setiap jurnal dikunci per sumber transaksi.
          </div>
          <Input name="confirmation" placeholder="Ketik JURNAL" />
          <Button type="submit" variant="outline" disabled={isPending}>Backfill Jurnal</Button>
        </form>
      </CardContent>
    </Card>
  )
}
