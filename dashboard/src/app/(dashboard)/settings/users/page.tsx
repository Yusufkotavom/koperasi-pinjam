import { auth } from "@/lib/auth"
import { getCompanyUsers } from "@/actions/company-users"
import { UserManagementCard } from "../user-management-card"

export default async function SettingsUsersPage() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const companyId = (session?.user as any)?.companyId as string | null | undefined
  const users = companyId ? await getCompanyUsers() : []

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Company</h1>
        <p className="text-muted-foreground text-sm">
          Tambah dan pantau user internal untuk company aktif.
        </p>
      </div>
      {companyId ? (
        <UserManagementCard users={users} />
      ) : (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          Akun ini belum terhubung ke company.
        </div>
      )}
    </div>
  )
}

