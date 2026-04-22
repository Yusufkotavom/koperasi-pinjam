import { auth } from "@/lib/auth"
import { SettingsProfileCard } from "../settings-profile-card"

export default async function SettingsProfilePage() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRoles: string[] = (session?.user as any)?.roles ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const companyName = (session?.user as any)?.companyName as string | null | undefined

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil</h1>
        <p className="text-muted-foreground text-sm">Identitas akun dan hak akses aktif.</p>
      </div>
      <div className="max-w-3xl">
        <SettingsProfileCard
          name={session?.user?.name}
          email={session?.user?.email}
          companyName={companyName}
          roles={userRoles}
        />
      </div>
    </div>
  )
}

