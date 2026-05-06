import Link from "next/link"
import { Building2, Shield, Users } from "lucide-react"
import { RoleType } from "@prisma/client"
import { auth } from "@/lib/auth"
import { requireRoles } from "@/lib/roles"
import { getPlatformContextHistory } from "@/actions/platform-admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type SessionLike = { user?: { id?: string; roles?: string[] } } | null

export default async function PlatformPage() {
  const session = await auth()
  requireRoles(session as unknown as SessionLike, [RoleType.SUPER_ADMIN])
  const contextLogs = await getPlatformContextHistory(10)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Admin</h1>
        <p className="text-muted-foreground text-sm">
          Aksi super admin bersifat sensitif dan tercatat di audit log.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/platform/companies" className="group">
          <Card className="transition-colors group-hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-4" /> Companies
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Suspend/aktifkan company, lihat owner, dan soft delete.
            </CardContent>
          </Card>
        </Link>

        <Link href="/platform/users" className="group">
          <Card className="transition-colors group-hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-4" /> Users
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Reset password, aktif/nonaktif user, dan inspeksi role.
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="size-4" /> Guardrail
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Selalu isi reason, gunakan suspend sebelum delete, dan verifikasi target sebelum eksekusi.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Riwayat Context Access</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Aktor</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Company</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contextLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Belum ada data.
                  </TableCell>
                </TableRow>
              ) : (
                contextLogs.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(row.createdAt).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell>{row.actorEmail ?? row.actorName ?? "-"}</TableCell>
                    <TableCell>{row.event}</TableCell>
                    <TableCell>{row.companyName ?? row.companySlug ?? "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
