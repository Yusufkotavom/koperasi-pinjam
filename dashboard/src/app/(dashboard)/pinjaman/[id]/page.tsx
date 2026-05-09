import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { getPinjamanById } from "@/actions/pinjaman"
import { ArrowLeft, User, Wallet, Calendar, TrendingUp } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

export default async function PinjamanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const pinjaman = await getPinjamanById(id)

  if (!pinjaman) {
    notFound()
  }

  const nasabah = pinjaman.pengajuan.nasabah
  const pengajuan = pinjaman.pengajuan
  const pokokPinjaman = Number(pinjaman.pokokPinjaman)
  const sisaPinjaman = Number(pinjaman.sisaPinjaman)
  const nilaiCair = Number(pinjaman.nilaiCair)
  const totalAngsuran = Number(pinjaman.totalAngsuran)
  const angsuranPokok = Number(pinjaman.angsuranPokok)
  const angsuranBunga = Number(pinjaman.angsuranBunga)
  const bunga = Number(pinjaman.bungaPerBulan)
  const progress = ((pokokPinjaman - sisaPinjaman) / pokokPinjaman) * 100

  const totalDibayar = pokokPinjaman - sisaPinjaman
  const angsuranTerbayar = pinjaman._count.jadwalAngsuran
  const totalAngsuranCount = pinjaman.jadwalAngsuran.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/pinjaman">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{pinjaman.nomorKontrak}</h1>
            <p className="text-muted-foreground">{nasabah.namaLengkap}</p>
          </div>
        </div>
        <Badge variant={pinjaman.status === "AKTIF" ? "default" : "secondary"} className="text-lg px-4 py-2">
          {pinjaman.status}
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pokok Pinjaman</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {pokokPinjaman.toLocaleString("id-ID")}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sisa Pinjaman</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">Rp {sisaPinjaman.toLocaleString("id-ID")}</div>
            <p className="text-xs text-muted-foreground mt-1">{progress.toFixed(1)}% terbayar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Angsuran/Bulan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {totalAngsuran.toLocaleString("id-ID")}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {angsuranTerbayar}/{totalAngsuranCount} terbayar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nilai Cair</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {nilaiCair.toLocaleString("id-ID")}</div>
          </CardContent>
        </Card>
      </div>

      {/* Info Nasabah */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informasi Nasabah
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Nama Lengkap</p>
            <p className="font-medium">{nasabah.namaLengkap}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Nomor Anggota</p>
            <p className="font-medium">{nasabah.nomorAnggota}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">No. HP</p>
            <p className="font-medium">{nasabah.noHp}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Kelompok</p>
            <p className="font-medium">{nasabah.kelompok?.nama || "-"}</p>
          </div>
          {nasabah.kolektor && (
            <div>
              <p className="text-sm text-muted-foreground">Kolektor</p>
              <p className="font-medium">{nasabah.kolektor.name}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Pinjaman */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Detail Pinjaman
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Tanggal Cair</p>
            <p className="font-medium">{format(new Date(pinjaman.tanggalCair), "dd MMMM yyyy", { locale: localeId })}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tanggal Jatuh Tempo</p>
            <p className="font-medium">
              {format(new Date(pinjaman.tanggalJatuhTempo), "dd MMMM yyyy", { locale: localeId })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tenor</p>
            <p className="font-medium">
              {pinjaman.tenor} {pinjaman.tenorType === "MINGGUAN" ? "Minggu" : "Bulan"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Bunga per Bulan</p>
            <p className="font-medium">{(bunga * 100).toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Angsuran Pokok</p>
            <p className="font-medium">Rp {angsuranPokok.toLocaleString("id-ID")}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Angsuran Bunga</p>
            <p className="font-medium">Rp {angsuranBunga.toLocaleString("id-ID")}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Potongan Admin</p>
            <p className="font-medium">Rp {Number(pinjaman.potonganAdmin).toLocaleString("id-ID")}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Potongan Provisi</p>
            <p className="font-medium">Rp {Number(pinjaman.potonganProvisi).toLocaleString("id-ID")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Sumber Dana */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Sumber Dana Pencairan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pinjaman.sumberDana === "SIMPANAN" && pinjaman.simpanan ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <p className="font-medium text-blue-900">Modal Simpanan</p>
                  <p className="text-sm text-blue-700">{pinjaman.simpanan.namaPenyimpan}</p>
                  <p className="text-xs text-blue-600 mt-1">Rekening: {pinjaman.simpanan.nomorRekening}</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/simpanan/${pinjaman.simpanan.id}`}>Lihat Simpanan</Link>
                </Button>
              </div>
              {pinjaman.penggunaanSimpanan && pinjaman.penggunaanSimpanan.length > 0 && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Jumlah Digunakan</p>
                  <p className="font-medium text-lg">
                    Rp {Number(pinjaman.penggunaanSimpanan[0].jumlahDigunakan).toLocaleString("id-ID")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dipakai sejak {format(new Date(pinjaman.penggunaanSimpanan[0].tanggalPakai), "dd MMM yyyy", { locale: localeId })}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">Kas {pinjaman.kasJenis === "BANK" ? "Bank" : "Tunai"}</p>
              <p className="text-sm text-muted-foreground">Modal koperasi sendiri</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Jadwal Angsuran */}
      <Card>
        <CardHeader>
          <CardTitle>Jadwal Angsuran</CardTitle>
          <CardDescription>
            {angsuranTerbayar} dari {totalAngsuranCount} angsuran telah dibayar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Angsuran Ke</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead className="text-right">Pokok</TableHead>
                  <TableHead className="text-right">Bunga</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pinjaman.jadwalAngsuran.map((jadwal: any) => (
                  <TableRow key={jadwal.id}>
                    <TableCell className="font-medium">{jadwal.angsuranKe}</TableCell>
                    <TableCell>{format(new Date(jadwal.tanggalJatuhTempo), "dd MMM yyyy", { locale: localeId })}</TableCell>
                    <TableCell className="text-right font-mono">Rp {Number(jadwal.pokok).toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right font-mono">Rp {Number(jadwal.bunga).toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right font-mono">Rp {Number(jadwal.total).toLocaleString("id-ID")}</TableCell>
                    <TableCell>
                      <Badge variant={jadwal.sudahDibayar ? "default" : "secondary"}>
                        {jadwal.sudahDibayar ? "Lunas" : "Belum"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Riwayat Pembayaran */}
      {pinjaman.pembayaran && pinjaman.pembayaran.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Pembayaran</CardTitle>
            <CardDescription>{pinjaman.pembayaran.length} transaksi pembayaran</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Pokok</TableHead>
                    <TableHead className="text-right">Bunga</TableHead>
                    <TableHead className="text-right">Denda</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead>Input Oleh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pinjaman.pembayaran.map((bayar: any) => (
                    <TableRow key={bayar.id}>
                      <TableCell>{format(new Date(bayar.tanggalBayar), "dd MMM yyyy HH:mm", { locale: localeId })}</TableCell>
                      <TableCell className="text-right font-mono">Rp {Number(bayar.pokok).toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right font-mono">Rp {Number(bayar.bunga).toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right font-mono">Rp {Number(bayar.denda).toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        Rp {Number(bayar.totalBayar).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{bayar.metode}</Badge>
                      </TableCell>
                      <TableCell>{bayar.inputOleh?.name || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
