import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getBagiHasilList } from "@/actions/simpanan"
import { BayarBagiHasilButton } from "./bayar-button"
import { ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

export default async function BagiHasilPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const status = params.status || ""

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
            <h1 className="text-3xl font-bold tracking-tight">Bagi Hasil Simpanan</h1>
            <p className="text-muted-foreground">Kelola pembayaran bagi hasil simpanan</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Bagi Hasil</CardTitle>
          <CardDescription>Bagi hasil yang perlu dibayar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <Select name="status" defaultValue={status}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Status</SelectItem>
                <SelectItem value="BELUM_BAYAR">Belum Bayar</SelectItem>
                <SelectItem value="SUDAH_BAYAR">Sudah Bayar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Suspense fallback={<div>Loading...</div>}>
            <BagiHasilTable page={page} status={status} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

async function BagiHasilTable({ page, status }: { page: number; status: string }) {
  const result = await getBagiHasilList({ page, status })

  if (!result.data.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {status ? "Tidak ada bagi hasil yang sesuai filter." : "Belum ada bagi hasil terdaftar."}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Periode</TableHead>
              <TableHead>Simpanan</TableHead>
              <TableHead>Penyimpan</TableHead>
              <TableHead className="text-right">Jumlah Bagi Hasil</TableHead>
              <TableHead>Tanggal Bayar</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((item: any) => {
              const jumlah = Number(item.jumlahBagiHasil)
              const sudahBayar = item.statusBayar === "SUDAH_BAYAR"

              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.periode}</TableCell>
                  <TableCell>{item.simpanan.nomorRekening}</TableCell>
                  <TableCell>{item.simpanan.namaPenyimpan}</TableCell>
                  <TableCell className="text-right font-mono">Rp {jumlah.toLocaleString("id-ID")}</TableCell>
                  <TableCell>
                    {item.tanggalBayar
                      ? format(new Date(item.tanggalBayar), "dd MMM yyyy", { locale: localeId })
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={sudahBayar ? "default" : "secondary"}>
                      {sudahBayar ? "Sudah Bayar" : "Belum Bayar"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {!sudahBayar && <BayarBagiHasilButton bagiHasilId={item.id} jumlah={jumlah} />}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {result.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Halaman {result.page} dari {result.totalPages} ({result.total} total)
          </p>
          <div className="flex gap-2">
            {result.page > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link href={`?page=${result.page - 1}${status ? `&status=${status}` : ""}`}>Sebelumnya</Link>
              </Button>
            )}
            {result.page < result.totalPages && (
              <Button asChild variant="outline" size="sm">
                <Link href={`?page=${result.page + 1}${status ? `&status=${status}` : ""}`}>Selanjutnya</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
