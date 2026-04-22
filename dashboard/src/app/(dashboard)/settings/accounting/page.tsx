import { auth } from "@/lib/auth"
import { getAccountingMode } from "@/actions/settings"
import { AccountingModeCard } from "../accounting-mode-card"

export default async function SettingsAccountingPage() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRoles: string[] = (session?.user as any)?.roles ?? []
  const accountingMode = await getAccountingMode()
  const canEdit = userRoles.some((role) => ["SUPER_ADMIN", "OWNER", "ADMIN"].includes(role))

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Akuntansi</h1>
        <p className="text-muted-foreground text-sm">
          Atur mode pencatatan akuntansi aplikasi.
        </p>
      </div>
      <AccountingModeCard initialMode={accountingMode} canEdit={canEdit} />
    </div>
  )
}

