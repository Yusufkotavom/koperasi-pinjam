import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getPinjamanList } from "@/actions/pinjaman"
import { Search } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

export default async function PinjamanPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>
}) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const search = params.search || ""
  const status = params.status || ""

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daftar Pinjaman</h1>
          <p className="text-muted-foreground">Informasi lengkap semua pinjaman</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pinjaman Aktif & Lunas</CardTitle>
          <CardDescription>Semua pinjaman yang telah dicairkan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <form className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  name="search"
                  placeholder="Cari nomor kontrak atau nama nasabah..."
                  className="pl-8"
                  defaultValue={search}
                />
              </div>
            </form>
            <Select name="status" defaultValue={status}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Status</SelectItem>
                <SelectItem value="AKTIF">Aktif</SelectItem>
                <SelectItem value="LUNAS">Lunas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Suspense fallback={<div>Loading...</div>}>
            <PinjamanTable page={page} search={search} status={status} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

async function PinjamanTable({ page, search, status }: { page: number; search: string; status: string }) {
  const result = await getPinjamanList({ page, search, status })

  if (!result.data.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {search || status ? "Tidak ada pinjaman yang sesuai filter." : "Belum ada pinjaman dicairkan."}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Kontrak</TableHead>
              <TableHead>Nasabah</TableHead>
              <TableHead>Kelompok</TableHead>
              <TableHead className="text-right">Pokok Pinjaman</TableHead>
              <TableHead className="text-right">Sisa Pinjaman</TableHead>
              <TableHead>Sumber Dana</TableHead>
              <TableHead>Tanggal Cair</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((item: any) => {
              const pokokPinjaman = Number(item.pokokPinjaman)
              const sisaPinjaman = Number(item.sisaPinjaman)
              const progress = ((pokokPinjaman - sisaPinjaman) / pokokPinjaman) * 100

              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nomorKontrak}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.pengajuan.nasabah.namaLengkap}</div>
                      <div className="text-xs text-muted-foreground">{item.pengajuan.nasabah.nomorAnggota}</div>
                    </div>
                  </TableCell>
                  <TableCell>{item.pengajuan.kelompok?.nama || "-"}</TableCell>
                  <TableCell className="text-right font-mono">Rp {pokokPinjaman.toLocaleString("id-ID")}</TableCell>
                  <TableCell className="text-right font-mono">
                    <div>Rp {sisaPinjaman.toLocaleString("id-ID")}</div>
                    <div className="text-xs text-muted-foreground">{progress.toFixed(0)}% terbayar</div>
                  </TableCell>
                  <TableCell>
                    {item.sumberDana === "SIMPANAN" ? (
                      <div className="text-sm">
                        <Badge variant="outline">Simpanan</Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.simpanan?.namaPenyimpan}
                        </div>
                      </div>
                    ) : (
                      <Badge variant="secondary">{item.kasJenis || "Kas"}</Badge>
                    )}
                  </TableCell>
                  <TableCell>{format(new Date(item.tanggalCair), "dd MMM yyyy", { locale: localeId })}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === "AKTIF" ? "default" : "secondary"}>{item.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/pinjaman/${item.id}`}>Detail</Link>
                    </Button>
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
                <Link
                  href={`?page=${result.page - 1}${search ? `&search=${search}` : ""}${status ? `&status=${status}` : ""}`}
                >
                  Sebelumnya
                </Link>
              </Button>
            )}
            {result.page < result.totalPages && (
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`?page=${result.page + 1}${search ? `&search=${search}` : ""}${status ? `&status=${status}` : ""}`}
                >
                  Selanjutnya
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
