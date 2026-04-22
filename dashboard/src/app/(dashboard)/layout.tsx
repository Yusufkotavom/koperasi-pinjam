import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { TopBar } from "./_components/top-bar"
import { getCompanyInfo, getAccountingMode } from "@/actions/settings"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")
  const userId = session.user?.id
  if (!userId) redirect("/login")

  // Company enforcement: block access for suspended/deleted companies.
  // SUPER_ADMIN may not have a companyId and should still be able to access platform pages.
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      isActive: true,
      company: { select: { id: true, isActive: true, status: true } },
    },
  })
  if (!dbUser || !dbUser.isActive) redirect("/login")
  if (dbUser.company && (!dbUser.company.isActive || dbUser.company.status !== "ACTIVE")) {
    redirect("/login")
  }

  const [company, accountingMode] = await Promise.all([
    getCompanyInfo(),
    getAccountingMode(),
  ])
  const user = {
    name: session.user?.name ?? "User",
    email: session.user?.email ?? "-",
    avatar: undefined as string | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    roles: ((session.user as any)?.roles ?? []) as string[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    companyId: (session.user as any)?.companyId as string | null | undefined,
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar user={user} company={company} accountingMode={accountingMode} />
        <SidebarInset className="bg-background">
          <div className="flex flex-col min-h-screen relative">
            <TopBar />
            <div className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.08),transparent_26rem),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.55))] p-4 md:p-6 lg:p-8">
              <div className="mx-auto max-w-7xl">
                {children}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
