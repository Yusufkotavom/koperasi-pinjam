import { notFound } from "next/navigation"
import Link from "next/link"
import { RoleType } from "@prisma/client"
import { auth } from "@/lib/auth"
import { requireRoles } from "@/lib/roles"
import { getCompanyById } from "@/actions/platform-admin"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CompanyAdminPanel } from "../company-admin-panel"

type SessionLike = { user?: { id?: string; roles?: string[] } } | null

export default async function PlatformCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  requireRoles(session as unknown as SessionLike, [RoleType.SUPER_ADMIN])
  const { id } = await params

  const company = await getCompanyById(id)
  if (!company) notFound()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
        <p className="text-muted-foreground text-sm">
          Slug: <span className="font-medium text-foreground">{company.slug}</span>
        </p>
        <div className="mt-3">
          <Button size="sm" asChild>
            <Link href={`/platform/companies/${company.id}/workspace`}>Buka Workspace Company</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Ringkasan <Badge variant={company.status === "ACTIVE" ? "default" : "secondary"}>{company.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Owner</span>
            <span className="font-medium">{company.owner?.email ?? "-"}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{company.email ?? "-"}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">User Count</span>
            <span className="font-medium">{company._count.users}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Updated</span>
            <span className="font-medium">{company.updatedAt.toLocaleString("id-ID")}</span>
          </div>
        </CardContent>
      </Card>

      <CompanyAdminPanel companyId={company.id} slug={company.slug} status={company.status} />
    </div>
  )
}
