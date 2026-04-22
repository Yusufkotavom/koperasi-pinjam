import { RoleType } from "@prisma/client"
import { requireRoles } from "@/lib/roles"

type SessionLike = {
  user?: {
    id?: string
    roles?: string[]
    companyId?: string | null
  }
} | null

export function requireCompanyId(session: SessionLike) {
  const userId = session?.user?.id
  if (!userId) throw new Error("Unauthorized")

  const companyId = session.user?.companyId
  if (!companyId) {
    // SUPER_ADMIN is allowed to exist without a company context.
    const roles = session.user?.roles ?? []
    if (roles.includes(RoleType.SUPER_ADMIN)) {
      throw new Error("Company context required")
    }
    throw new Error("Akun belum terhubung ke company.")
  }

  return { userId, companyId }
}

export function requireCompanyRoles(session: SessionLike, allowedRoles: RoleType[]) {
  const { userId } = requireRoles(session, allowedRoles)
  const companyId = session?.user?.companyId
  if (!companyId) throw new Error("Akun belum terhubung ke company.")
  return { userId, companyId }
}

