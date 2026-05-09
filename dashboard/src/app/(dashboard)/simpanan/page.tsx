import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getSimpananList } from "@/actions/simpanan"
import { PlusCircle, Search, Download } from "lucide-react"

export default async function SimpananPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>
}) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const search = params.search || ""
  const status = params.status === "all" ? "" : (params.status || "")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Simpanan</h1>
          <p className="text-muted-foreground">Kelola simpanan modal dari penyimpan</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/api/export/simpanan?search=${search}&status=${status}`}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Link>
          </Button>
          <Button asChild>
            <Link href="/simpanan/baru">
              <PlusCircle className="mr-2 h-4 w-4" />
              Simpanan Baru
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Simpanan</CardTitle>
          <CardDescription>Simpanan yang terdaftar di sistem</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <form className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  name="search"
                  placeholder="Cari nama, nomor rekening, atau NIK..."
                  className="pl-8"
                  defaultValue={search}
                />
              </div>
            </form>
            <Select name="status" defaultValue={status || "all"}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="AKTIF">Aktif</SelectItem>
                <SelectItem value="TUTUP">Tutup</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Suspense fallback={<div>Loading...</div>}>
            <SimpananTable page={page} search={search} status={status} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

async function SimpananTable({ page, search, status }: { page: number; search: string; status: string }) {
  const result = await getSimpananList({ page, search, status })

  if (!result.data.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {search || status ? "Tidak ada simpanan yang sesuai filter." : "Belum ada simpanan terdaftar."}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Rekening</TableHead>
              <TableHead>Nama Penyimpan</TableHead>
              <TableHead>No. HP</TableHead>
              <TableHead className="text-right">Saldo Tersedia</TableHead>
              <TableHead className="text-right">Saldo Terpakai</TableHead>
              <TableHead className="text-right">Bagi Hasil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((item: any) => {
              const saldoTersedia = Number(item.saldoTersedia)
              const saldoTerpakai = Number(item.saldoTerpakai)
              const persenBagiHasil = Number(item.persenBagiHasil)

              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nomorRekening}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.namaPenyimpan}</div>
                      {item.nik && <div className="text-xs text-muted-foreground">NIK: {item.nik}</div>}
                    </div>
                  </TableCell>
                  <TableCell>{item.noHp}</TableCell>
                  <TableCell className="text-right font-mono">
                    Rp {saldoTersedia.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {saldoTerpakai > 0 ? (
                      <span className="text-orange-600">Rp {saldoTerpakai.toLocaleString("id-ID")}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {persenBagiHasil}% / {item.periodeBagiHasil}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.status === "AKTIF" ? "default" : "secondary"}>{item.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/simpanan/${item.id}`}>Detail</Link>
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
                <Link href={`?page=${result.page - 1}${search ? `&search=${search}` : ""}${status ? `&status=${status}` : ""}`}>
                  Sebelumnya
                </Link>
              </Button>
            )}
            {result.page < result.totalPages && (
              <Button asChild variant="outline" size="sm">
                <Link href={`?page=${result.page + 1}${search ? `&search=${search}` : ""}${status ? `&status=${status}` : ""}`}>
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
