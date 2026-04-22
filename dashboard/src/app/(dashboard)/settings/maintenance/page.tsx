import { auth } from "@/lib/auth"
import { DbMaintenanceCard } from "../db-maintenance-card"

export default async function SettingsMaintenancePage() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRoles: string[] = (session?.user as any)?.roles ?? []
  const canEdit = userRoles.some((role) => ["SUPER_ADMIN", "OWNER", "ADMIN"].includes(role))

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Database</h1>
        <p className="text-muted-foreground text-sm">
          Cleanup, import demo data, dan backfill jurnal akuntansi.
        </p>
      </div>
      <DbMaintenanceCard canEdit={canEdit} />
    </div>
  )
}

