import { Search, Users } from "lucide-react"
import { RoleType } from "@prisma/client"
import { auth } from "@/lib/auth"
import { requireRoles } from "@/lib/roles"
import { listUsers } from "@/actions/platform-admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { UserAdminTable } from "./user-admin-table"

type SessionLike = { user?: { id?: string; roles?: string[] } } | null

export default async function PlatformUsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>
}) {
  const session = await auth()
  requireRoles(session as unknown as SessionLike, [RoleType.SUPER_ADMIN])

  const sp = await searchParams
  const q = sp?.q?.trim() ?? ""
  const users = await listUsers({ q })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground text-sm">Reset password dan kontrol aktivasi user.</p>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-6 border-b border-slate-50 dark:border-slate-800/50">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="size-4" /> Pencarian User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="relative max-w-md group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input name="q" defaultValue={q} placeholder="Cari nama/email..." className="pl-9 transition-all" />
          </form>
        </CardContent>
      </Card>

      <UserAdminTable users={users} />
    </div>
  )
}

