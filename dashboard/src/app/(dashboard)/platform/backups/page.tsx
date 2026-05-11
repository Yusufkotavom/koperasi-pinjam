import { RoleType } from "@prisma/client"
import { auth } from "@/lib/auth"
import { requireRoles } from "@/lib/roles"
import {
  createNeonSnapshotAction,
  getNeonBackupEnvStatus,
  getPlatformBackupAudit,
  listNeonSnapshots,
  restoreNeonSnapshotToNewBranchAction,
} from "@/actions/platform-backups"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type SessionLike = { user?: { id?: string; roles?: string[] } } | null

export default async function PlatformBackupsPage() {
  const session = await auth()
  requireRoles(session as unknown as SessionLike, [RoleType.SUPER_ADMIN])

  const [envStatus, snapshots, logs] = await Promise.all([
    getNeonBackupEnvStatus(),
    listNeonSnapshots().catch(() => []),
    getPlatformBackupAudit(15),
  ])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Backups</h1>
        <p className="text-muted-foreground text-sm">
          Trigger snapshot Neon dan restore aman ke branch baru.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Environment Status</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <div>NEON_API_KEY: {envStatus.hasApiKey ? "OK" : "MISSING"}</div>
          <div>NEON_PROJECT_ID: {envStatus.hasProjectId ? "OK" : "MISSING"}</div>
          <div>NEON_BRANCH_ID: {envStatus.hasBranchId ? "OK" : "MISSING"}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form action={createNeonSnapshotAction} className="flex gap-2">
            <Input name="name" placeholder="snapshot name (opsional)" />
            <Button type="submit">Create Snapshot</Button>
          </form>
          <p className="text-xs text-muted-foreground">
            Jika nama kosong, sistem membuat nama otomatis berbasis timestamp UTC.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Neon Snapshots</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Snapshot ID</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Tidak ada data snapshot atau Neon API tidak merespons.
                  </TableCell>
                </TableRow>
              ) : (
                snapshots.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.name ?? "-"}</TableCell>
                    <TableCell className="font-mono text-xs">{s.id}</TableCell>
                    <TableCell>{new Date(s.created_at).toLocaleString("id-ID")}</TableCell>
                    <TableCell>{s.expires_at ? new Date(s.expires_at).toLocaleString("id-ID") : "-"}</TableCell>
                    <TableCell>
                      <form action={restoreNeonSnapshotToNewBranchAction}>
                        <input type="hidden" name="snapshotId" value={s.id} />
                        <Button type="submit" variant="outline" size="sm">
                          Restore to New Branch
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Backup Audit Trail</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Aktor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Event</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Belum ada log backup.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((row) => {
                  const meta = (row.metadata ?? {}) as { event?: string }
                  return (
                    <TableRow key={row.id}>
                      <TableCell>{new Date(row.createdAt).toLocaleString("id-ID")}</TableCell>
                      <TableCell>{row.actor?.email ?? row.actor?.name ?? "-"}</TableCell>
                      <TableCell>{row.action}</TableCell>
                      <TableCell>{meta.event ?? "-"}</TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
