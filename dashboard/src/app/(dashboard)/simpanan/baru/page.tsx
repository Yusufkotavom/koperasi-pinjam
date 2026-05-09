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
import { createSimpanan } from "@/actions/simpanan"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function SimpananBaruPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const input = {
      namaPenyimpan: formData.get("namaPenyimpan") as string,
      nik: formData.get("nik") as string,
      noHp: formData.get("noHp") as string,
      alamat: formData.get("alamat") as string,
      saldoAwal: Number(formData.get("saldoAwal")),
      persenBagiHasil: Number(formData.get("persenBagiHasil")),
      periodeBagiHasil: formData.get("periodeBagiHasil") as "BULANAN" | "TRIWULAN" | "TAHUNAN",
    }

    const result = await createSimpanan(input)

    if ("error" in result) {
      toast.error(typeof result.error === "string" ? result.error : "Gagal membuat simpanan")
      setLoading(false)
      return
    }

    toast.success("Simpanan berhasil dibuat")
    router.push("/simpanan")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/simpanan">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Simpanan Baru</h1>
          <p className="text-muted-foreground">Tambah simpanan modal baru</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Penyimpan</CardTitle>
          <CardDescription>Isi data penyimpan dan nominal simpanan</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="namaPenyimpan">
                  Nama Penyimpan <span className="text-red-500">*</span>
                </Label>
                <Input id="namaPenyimpan" name="namaPenyimpan" required placeholder="Nama lengkap" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nik">NIK (Opsional)</Label>
                <Input id="nik" name="nik" placeholder="Nomor Induk Kependudukan" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="noHp">
                  No. HP <span className="text-red-500">*</span>
                </Label>
                <Input id="noHp" name="noHp" required placeholder="08xxxxxxxxxx" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="saldoAwal">
                  Saldo Awal <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="saldoAwal"
                  name="saldoAwal"
                  type="number"
                  required
                  min="100000"
                  step="1000"
                  placeholder="Minimal Rp 100.000"
                />
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
                  placeholder="Misal: 2.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="periodeBagiHasil">
                  Periode Bagi Hasil <span className="text-red-500">*</span>
                </Label>
                <Select name="periodeBagiHasil" defaultValue="BULANAN" required>
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
              <Textarea id="alamat" name="alamat" placeholder="Alamat lengkap" rows={3} />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/simpanan">Batal</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
