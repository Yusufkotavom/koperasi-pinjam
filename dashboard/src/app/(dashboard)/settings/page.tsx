import Link from "next/link"
import {
  BarChart3,
  Building2,
  ChevronRight,
  Database,
  Landmark,
  Settings,
  SlidersHorizontal,
  Users,
  Coins,
} from "lucide-react"
import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingsProfileCard } from "./settings-profile-card"

const settingSections = [
  {
    title: "Profil",
    description: "Identitas akun, role aktif, dan company yang sedang digunakan.",
    href: "/settings/profile",
    icon: Settings,
  },
  {
    title: "Company",
    description: "Nama koperasi, logo, alamat, kontak, dan zona waktu.",
    href: "/settings/company",
    icon: Building2,
  },
  {
    title: "Pengaturan Denda",
    description: "Konfigurasi persentase atau nominal denda keterlambatan per hari.",
    href: "/settings/denda",
    icon: Coins,
  },
  {
    title: "Bonus Kolektor",
    description: "Atur bonus default kolektor saat pinjaman nasabah lunas.",
    href: "/settings/bonus-kolektor",
    icon: Coins,
  },
  {
    title: "User Company",
    description: "Buat user internal untuk admin, teller, kolektor, manager, dan akuntansi.",
    href: "/settings/users",
    icon: Users,
    roles: ["SUPER_ADMIN", "OWNER", "ADMIN"],
    requiresCompany: true,
  },
  {
    title: "Akuntansi",
    description: "Mode akuntansi simple/proper dan konfigurasi pencatatan.",
    href: "/settings/accounting",
    icon: Landmark,
    roles: ["SUPER_ADMIN", "OWNER", "ADMIN"],
  },
  {
    title: "Ranking Risiko",
    description: "Ambang hari tunggakan untuk indikator kolektibilitas.",
    href: "/settings/ranking",
    icon: BarChart3,
  },
  {
    title: "Database",
    description: "Cleanup, import demo data, dan backfill jurnal akuntansi.",
    href: "/settings/maintenance",
    icon: Database,
    roles: ["SUPER_ADMIN", "OWNER", "ADMIN"],
  },
]

export default async function SettingsPage() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRoles: string[] = (session?.user as any)?.roles ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const companyName = (session?.user as any)?.companyName as string | null | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const companyId = (session?.user as any)?.companyId as string | null | undefined

  const visibleSections = settingSections.filter((section) => {
    if (section.requiresCompany && !companyId) return false
    if (!section.roles) return true
    return section.roles.some((role) => userRoles.includes(role))
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground text-sm">
          Pilih area pengaturan yang ingin dikelola.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <SettingsProfileCard
          name={session?.user?.name}
          email={session?.user?.email}
          companyName={companyName}
          roles={userRoles}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="size-4" /> Menu Pengaturan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {visibleSections.map((section) => {
                const Icon = section.icon
                return (
                  <Link
                    key={section.href}
                    href={section.href}
                    className="group flex min-h-28 items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/60"
                  >
                    <div className="rounded-md bg-primary/10 p-2 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{section.title}</p>
                        <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
