import Link from "next/link"
import { notFound } from "next/navigation"
import { RoleType } from "@prisma/client"
import { auth } from "@/lib/auth"
import { requireRoles } from "@/lib/roles"
import { getCompanyWorkspace } from "@/actions/platform-admin"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { OpenCompanyButton } from "./open-company-button"

type SessionLike = { user?: { id?: string; roles?: string[] } } | null

function fmtDate(value: string) {
  return new Date(value).toLocaleString("id-ID")
}

export default async function PlatformCompanyWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  requireRoles(session as unknown as SessionLike, [RoleType.SUPER_ADMIN])
  const { id } = await params

  const data = await getCompanyWorkspace(id)
  if (!data) notFound()

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{data.company.name}</h1>
          <p className="text-muted-foreground text-sm">
            Workspace Super Admin • {data.company.slug}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/platform/companies/${data.company.id}`}>Kembali ke Detail</Link>
          </Button>
          <Button asChild>
            <Link href="/platform/companies">Daftar Company</Link>
          </Button>
          <OpenCompanyButton companyId={data.company.id} companyName={data.company.name} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Users</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{data.metrics.users}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Nasabah Aktif</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{data.metrics.nasabahAktif}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Pengajuan Aktif</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{data.metrics.pengajuanAktif}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Pinjaman Aktif</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{data.metrics.pinjamanAktif}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Kas Pending</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{data.metrics.kasPending}</CardContent></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Info Company</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={data.company.status === "ACTIVE" ? "default" : "secondary"}>{data.company.status}</Badge>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Owner</span>
              <span className="font-medium">{data.company.owner?.email ?? "-"}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Owner Name</span>
              <span className="font-medium">{data.company.owner?.name ?? "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">User Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dibuat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">Belum ada user.</TableCell>
                  </TableRow>
                ) : (
                  data.recentUsers.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.roles.join(", ")}</TableCell>
                      <TableCell>
                        <Badge variant={row.isActive ? "default" : "secondary"}>{row.isActive ? "Aktif" : "Nonaktif"}</Badge>
                      </TableCell>
                      <TableCell>{fmtDate(row.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nasabah Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>No Anggota</TableHead>
                  <TableHead>Dibuat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentNasabah.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">Belum ada nasabah.</TableCell>
                  </TableRow>
                ) : (
                  data.recentNasabah.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.namaLengkap}</TableCell>
                      <TableCell>{row.nomorAnggota}</TableCell>
                      <TableCell>{fmtDate(row.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pengajuan Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No Pengajuan</TableHead>
                  <TableHead>Nasabah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dibuat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentPengajuan.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">Belum ada pengajuan.</TableCell>
                  </TableRow>
                ) : (
                  data.recentPengajuan.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.nomorPengajuan}</TableCell>
                      <TableCell>{row.nasabahName ?? "-"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{row.status}</Badge>
                      </TableCell>
                      <TableCell>{fmtDate(row.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
