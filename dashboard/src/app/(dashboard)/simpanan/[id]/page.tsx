import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getSimpananById } from "@/actions/simpanan"
import { TutupSimpananButton } from "./tutup-button"
import { TransaksiSimpananButton } from "./transaksi-button"
import { HitungBagiHasilButton } from "./hitung-bagi-hasil-button"
import { ArrowLeft, Edit } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

export default async function SimpananDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const simpanan = await getSimpananById(id)

  if (!simpanan) {
    notFound()
  }

  const saldoAwal = Number(simpanan.saldoAwal)
  const saldoTersedia = Number(simpanan.saldoTersedia)
  const saldoTerpakai = Number(simpanan.saldoTerpakai)
  const persenBagiHasil = Number(simpanan.persenBagiHasil)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/simpanan">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{simpanan.namaPenyimpan}</h1>
            <p className="text-muted-foreground">{simpanan.nomorRekening}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {simpanan.status === "AKTIF" && (
            <>
              <TransaksiSimpananButton simpananId={id} saldoTersedia={saldoTersedia} jenis="SETOR" />
              <TransaksiSimpananButton simpananId={id} saldoTersedia={saldoTersedia} jenis="TARIK" />
              <HitungBagiHasilButton
                simpananId={id}
                persenBagiHasil={persenBagiHasil}
                saldoAwal={saldoAwal}
              />
              <Button asChild variant="outline">
                <Link href={`/simpanan/${id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <TutupSimpananButton simpananId={id} saldoTerpakai={saldoTerpakai} />
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Saldo Tersedia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Rp {saldoTersedia.toLocaleString("id-ID")}</div>
            <p className="text-sm text-muted-foreground mt-1">Bisa digunakan untuk pencairan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saldo Terpakai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">Rp {saldoTerpakai.toLocaleString("id-ID")}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {simpanan._count.penggunaan > 0
                ? `Digunakan ${simpanan._count.penggunaan} pinjaman`
                : "Tidak ada yang terpakai"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bagi Hasil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {persenBagiHasil}% / {simpanan.periodeBagiHasil}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Saldo awal: Rp {saldoAwal.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Penyimpan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nama</p>
              <p className="font-medium">{simpanan.namaPenyimpan}</p>
            </div>
            {simpanan.nik && (
              <div>
                <p className="text-sm text-muted-foreground">NIK</p>
                <p className="font-medium">{simpanan.nik}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">No. HP</p>
              <p className="font-medium">{simpanan.noHp}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={simpanan.status === "AKTIF" ? "default" : "secondary"}>{simpanan.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tanggal Buka</p>
              <p className="font-medium">
                {format(new Date(simpanan.tanggalBuka), "dd MMMM yyyy", { locale: localeId })}
              </p>
            </div>
            {simpanan.tanggalTutup && (
              <div>
                <p className="text-sm text-muted-foreground">Tanggal Tutup</p>
                <p className="font-medium">
                  {format(new Date(simpanan.tanggalTutup), "dd MMMM yyyy", { locale: localeId })}
                </p>
              </div>
            )}
          </div>
          {simpanan.alamat && (
            <div>
              <p className="text-sm text-muted-foreground">Alamat</p>
              <p className="font-medium">{simpanan.alamat}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {simpanan.penggunaan && simpanan.penggunaan.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Penggunaan untuk Pinjaman</CardTitle>
            <CardDescription>Simpanan yang sedang digunakan untuk pencairan pinjaman</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Kontrak</TableHead>
                    <TableHead className="text-right">Jumlah Digunakan</TableHead>
                    <TableHead className="text-right">Sisa Pinjaman</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal Pakai</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {simpanan.penggunaan.map((p: any) => {
                    const jumlahDigunakan = Number(p.jumlahDigunakan)
                    const sisaPinjaman = Number(p.pinjaman.sisaPinjaman)

                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.pinjaman.nomorKontrak}</TableCell>
                        <TableCell className="text-right font-mono">
                          Rp {jumlahDigunakan.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          Rp {sisaPinjaman.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.pinjaman.status === "AKTIF" ? "default" : "secondary"}>
                            {p.pinjaman.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(p.tanggalPakai), "dd MMM yyyy", { locale: localeId })}
                        </TableCell>
                        <TableCell>
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/pinjaman/${p.pinjamanId}`}>Detail</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {simpanan.transaksi && simpanan.transaksi.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Transaksi</CardTitle>
            <CardDescription>10 transaksi terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead>Input Oleh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {simpanan.transaksi.map((t: any) => {
                    const jumlah = Number(t.jumlah)

                    return (
                      <TableRow key={t.id}>
                        <TableCell>{format(new Date(t.tanggal), "dd MMM yyyy HH:mm", { locale: localeId })}</TableCell>
                        <TableCell>
                          <Badge variant={t.jenis === "SETOR" ? "default" : "destructive"}>{t.jenis}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">Rp {jumlah.toLocaleString("id-ID")}</TableCell>
                        <TableCell className="text-muted-foreground">{t.keterangan || "-"}</TableCell>
                        <TableCell>{t.inputOleh?.name || "-"}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
