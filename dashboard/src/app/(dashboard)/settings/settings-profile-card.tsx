import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Mail, Shield, User } from "lucide-react"

const roleLabels: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN: { label: "Super Admin", color: "bg-slate-900 text-white" },
  OWNER: { label: "Owner", color: "bg-emerald-100 text-emerald-700" },
  ADMIN: { label: "Admin", color: "bg-purple-100 text-purple-700" },
  TELLER: { label: "Teller", color: "bg-blue-100 text-blue-700" },
  KOLEKTOR: { label: "Kolektor", color: "bg-green-100 text-green-700" },
  SURVEYOR: { label: "Surveyor", color: "bg-cyan-100 text-cyan-700" },
  MANAGER: { label: "Manager", color: "bg-amber-100 text-amber-700" },
  PIMPINAN: { label: "Pimpinan", color: "bg-red-100 text-red-700" },
  AKUNTANSI: { label: "Akuntansi", color: "bg-pink-100 text-pink-700" },
}

type SettingsProfileCardProps = {
  name?: string | null
  email?: string | null
  companyName?: string | null
  roles: string[]
}

export function SettingsProfileCard({ name, email, companyName, roles }: SettingsProfileCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="size-4" /> Profil Saya
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarFallback className="text-xl bg-emerald-600 text-white">
              {name?.[0] ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-lg">{name ?? "-"}</p>
            <p className="text-muted-foreground text-sm flex items-center gap-1">
              <Mail className="size-3" /> {email ?? "-"}
            </p>
          </div>
        </div>
        <Separator />
        <div>
          <p className="text-sm font-medium mb-3 flex items-center gap-2">
            <Shield className="size-4 text-muted-foreground" /> Hak Akses
          </p>
          {roles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => {
                const item = roleLabels[role] ?? { label: role, color: "bg-gray-100 text-gray-700" }
                return (
                  <Badge key={role} className={`${item.color} hover:${item.color} border-0`}>
                    {item.label}
                  </Badge>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Belum ada role yang ditetapkan.</p>
          )}
          {companyName && (
            <p className="text-xs text-muted-foreground mt-3">
              Company aktif: <span className="font-medium text-foreground">{companyName}</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

