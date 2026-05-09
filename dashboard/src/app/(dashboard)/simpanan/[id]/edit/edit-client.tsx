"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { updateSimpanan } from "@/actions/simpanan"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Props {
  simpanan: {
    id: string
    namaPenyimpan: string
    nik?: string | null
    noHp: string
    alamat?: string | null
    persenBagiHasil: string
    periodeBagiHasil: string
  }
}

export default function EditSimpananClient({ simpanan }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const input = {
      namaPenyimpan: formData.get("namaPenyimpan") as string,
      noHp: formData.get("noHp") as string,
      alamat: formData.get("alamat") as string,
      persenBagiHasil: Number(formData.get("persenBagiHasil")),
      periodeBagiHasil: formData.get("periodeBagiHasil") as "BULANAN" | "TRIWULAN" | "TAHUNAN",
    }

    const result = await updateSimpanan(simpanan.id, input)

    if ("error" in result) {
      toast.error(typeof result.error === "string" ? result.error : "Gagal update simpanan")
      setLoading(false)
      return
    }

    toast.success("Simpanan berhasil diupdate")
    router.push(`/simpanan/${simpanan.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/simpanan/${simpanan.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Simpanan</h1>
          <p className="text-muted-foreground">Update data simpanan</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Penyimpan</CardTitle>
          <CardDescription>NIK dan saldo awal tidak bisa diubah</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="namaPenyimpan">
                  Nama Penyimpan <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="namaPenyimpan"
                  name="namaPenyimpan"
                  required
                  defaultValue={simpanan.namaPenyimpan}
                  placeholder="Nama lengkap"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nik">NIK (Tidak bisa diubah)</Label>
                <Input id="nik" disabled value={simpanan.nik || "-"} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="noHp">
                  No. HP <span className="text-red-500">*</span>
                </Label>
                <Input id="noHp" name="noHp" required defaultValue={simpanan.noHp} placeholder="08xxxxxxxxxx" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="persenBagiHasil">
                  Persen Bagi Hasil (%) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="persenBagiHasil"
                  name="persenBagiHasil"
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  defaultValue={simpanan.persenBagiHasil}
                  placeholder="Misal: 2.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="periodeBagiHasil">
                  Periode Bagi Hasil <span className="text-red-500">*</span>
                </Label>
                <Select name="periodeBagiHasil" defaultValue={simpanan.periodeBagiHasil} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BULANAN">Bulanan</SelectItem>
                    <SelectItem value="TRIWULAN">Triwulan (3 bulan)</SelectItem>
                    <SelectItem value="TAHUNAN">Tahunan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat (Opsional)</Label>
              <Textarea
                id="alamat"
                name="alamat"
                defaultValue={simpanan.alamat || ""}
                placeholder="Alamat lengkap"
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/simpanan/${simpanan.id}`}>Batal</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
