import { auth } from "@/lib/auth"
import { getKolektorBonusConfig } from "@/actions/settings"
import { BonusKolektorSettingsForm } from "./bonus-kolektor-settings-form"

export default async function SettingsBonusKolektorPage() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRoles: string[] = (session?.user as any)?.roles ?? []
  const config = await getKolektorBonusConfig()
  const canEdit = userRoles.some((role) => ["SUPER_ADMIN", "OWNER", "ADMIN", "PIMPINAN"].includes(role))

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bonus Kolektor</h1>
        <p className="text-muted-foreground text-sm">
          Atur bonus default yang otomatis dipakai saat pencairan pinjaman jika nominal bonus tidak diisi manual per pinjaman.
        </p>
      </div>
      <BonusKolektorSettingsForm initial={config} canEdit={canEdit} />
    </div>
  )
}
