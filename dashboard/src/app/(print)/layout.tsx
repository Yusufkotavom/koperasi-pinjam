import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function PrintLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")
  const userId = session.user?.id
  if (!userId) redirect("/login")

  // Company enforcement: block access for suspended/deleted companies.
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

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white text-slate-900 antialiased">
      {children}
    </div>
  )
}
