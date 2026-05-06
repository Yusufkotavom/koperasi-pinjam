"use server"

import bcrypt from "bcryptjs"
import crypto from "crypto"
import { revalidatePath } from "next/cache"
import { AuditAction, CompanyStatus, RoleType } from "@prisma/client"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireRoles } from "@/lib/roles"
import { writeAuditLog } from "@/lib/audit"

type SessionLike = {
  user?: { id?: string; roles?: string[]; companyId?: string | null }
} | null

export type PlatformCompanyRow = {
  id: string
  name: string
  slug: string
  email: string | null
  status: CompanyStatus
  ownerEmail: string | null
  updatedAt: string
}

export type PlatformUserRow = {
  id: string
  name: string
  email: string
  isActive: boolean
  roles: string[]
  company: { id: string; name: string; slug: string; status: CompanyStatus } | null
  updatedAt: string
}

export type PlatformCompanyWorkspace = {
  company: {
    id: string
    name: string
    slug: string
    status: CompanyStatus
    owner: { id: string; name: string; email: string } | null
  }
  metrics: {
    users: number
    nasabahAktif: number
    pengajuanAktif: number
    pinjamanAktif: number
    kasPending: number
  }
  recentUsers: Array<{ id: string; name: string; email: string; isActive: boolean; roles: string[]; createdAt: string }>
  recentNasabah: Array<{ id: string; namaLengkap: string; nomorAnggota: string; createdAt: string }>
  recentPengajuan: Array<{ id: string; nomorPengajuan: string; status: string; createdAt: string; nasabahName: string | null }>
}

export type PlatformContextLogRow = {
  id: string
  actorName: string | null
  actorEmail: string | null
  companyId: string | null
  companyName: string | null
  companySlug: string | null
  event: "ENTER_COMPANY_CONTEXT" | "EXIT_COMPANY_CONTEXT"
  createdAt: string
}

function requireSuperAdmin(session: SessionLike) {
  return requireRoles(session, [RoleType.SUPER_ADMIN]).userId
}

function getActingCompanyId(session: SessionLike) {
  return session?.user?.companyId ?? null
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return "Terjadi kesalahan server."
}

function generateTempPassword() {
  return crypto.randomBytes(9).toString("base64url")
}

export async function prepareEnterCompanyContext(companyId: string) {
  const session = await auth()
  const actorId = requireSuperAdmin(session as unknown as SessionLike)

  if (!companyId) return { error: "Company tidak valid." as const }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true, slug: true, status: true },
  })
  if (!company) return { error: "Company tidak ditemukan." as const }
  if (company.status !== "ACTIVE") {
    return { error: `Company berstatus ${company.status}. Context operasional hanya untuk company ACTIVE.` as const }
  }

  await writeAuditLog({
    actorId,
    entityType: "PLATFORM_CONTEXT",
    entityId: company.id,
    action: AuditAction.UPDATE,
    metadata: {
      event: "ENTER_COMPANY_CONTEXT",
      companyId: company.id,
      companyName: company.name,
      companySlug: company.slug,
    },
  })

  return {
    success: true as const,
    data: { companyId: company.id, companyName: company.name, companySlug: company.slug },
  }
}

export async function logExitCompanyContext() {
  const session = await auth()
  const actorId = requireSuperAdmin(session as unknown as SessionLike)

  await writeAuditLog({
    actorId,
    entityType: "PLATFORM_CONTEXT",
    action: AuditAction.UPDATE,
    metadata: { event: "EXIT_COMPANY_CONTEXT" },
  })

  return { success: true as const }
}

export async function getPlatformContextHistory(limit = 12): Promise<PlatformContextLogRow[]> {
  const session = await auth()
  requireSuperAdmin(session as unknown as SessionLike)

  const rows = await prisma.auditLog.findMany({
    where: { entityType: "PLATFORM_CONTEXT" },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 50),
    include: { actor: { select: { name: true, email: true } } },
  })

  return rows
    .map((row) => {
      const meta = (row.metadata ?? {}) as {
        event?: string
        companyId?: string
        companyName?: string
        companySlug?: string
      }
      if (meta.event !== "ENTER_COMPANY_CONTEXT" && meta.event !== "EXIT_COMPANY_CONTEXT") return null
      return {
        id: row.id,
        actorName: row.actor?.name ?? null,
        actorEmail: row.actor?.email ?? null,
        companyId: meta.companyId ?? null,
        companyName: meta.companyName ?? null,
        companySlug: meta.companySlug ?? null,
        event: meta.event,
        createdAt: row.createdAt.toISOString(),
      }
    })
    .filter((row): row is PlatformContextLogRow => row !== null)
}

const listCompaniesSchema = z.object({
  q: z.string().trim().max(120).optional(),
})

export async function listCompanies(params?: { q?: string }): Promise<PlatformCompanyRow[]> {
  const session = await auth()
  requireSuperAdmin(session as unknown as SessionLike)
  const parsed = listCompaniesSchema.safeParse(params ?? {})
  const query = parsed.success ? parsed.data.q : undefined

  const rows = await prisma.company.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      status: true,
      updatedAt: true,
      owner: { select: { email: true } },
    },
  })

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    email: row.email,
    status: row.status,
    ownerEmail: row.owner?.email ?? null,
    updatedAt: row.updatedAt.toISOString(),
  }))
}

export async function getCompanyById(companyId: string) {
  const session = await auth()
  requireSuperAdmin(session as unknown as SessionLike)

  return prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      status: true,
      suspendedAt: true,
      suspendedUntil: true,
      suspendedReason: true,
      deletedAt: true,
      deletedReason: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: { id: true, email: true, name: true } },
      _count: { select: { users: true } },
    },
  })
}

export async function getCompanyWorkspace(companyId: string): Promise<PlatformCompanyWorkspace | null> {
  const session = await auth()
  requireSuperAdmin(session as unknown as SessionLike)

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      owner: { select: { id: true, name: true, email: true } },
    },
  })
  if (!company) return null

  const [users, nasabahAktif, pengajuanAktif, pinjamanAktif, kasPending, recentUsers, recentNasabah, recentPengajuan] = await Promise.all([
    prisma.user.count({ where: { companyId } }),
    prisma.nasabah.count({ where: { companyId, status: "AKTIF" } }),
    prisma.pengajuan.count({ where: { companyId, status: { in: ["DIAJUKAN", "DISURVEY", "DISETUJUI"] } } }),
    prisma.pinjaman.count({ where: { companyId, status: { in: ["AKTIF", "MENUNGGAK", "MACET"] } } }),
    prisma.kasTransaksi.count({ where: { companyId, isApproved: false } }),
    prisma.user.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        roles: { select: { role: true }, orderBy: { role: "asc" } },
      },
    }),
    prisma.nasabah.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, namaLengkap: true, nomorAnggota: true, createdAt: true },
    }),
    prisma.pengajuan.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        nomorPengajuan: true,
        status: true,
        createdAt: true,
        nasabah: { select: { namaLengkap: true } },
      },
    }),
  ])

  return {
    company,
    metrics: { users, nasabahAktif, pengajuanAktif, pinjamanAktif, kasPending },
    recentUsers: recentUsers.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      isActive: row.isActive,
      roles: row.roles.map((r) => r.role),
      createdAt: row.createdAt.toISOString(),
    })),
    recentNasabah: recentNasabah.map((row) => ({
      id: row.id,
      namaLengkap: row.namaLengkap,
      nomorAnggota: row.nomorAnggota,
      createdAt: row.createdAt.toISOString(),
    })),
    recentPengajuan: recentPengajuan.map((row) => ({
      id: row.id,
      nomorPengajuan: row.nomorPengajuan,
      status: row.status,
      nasabahName: row.nasabah?.namaLengkap ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
  }
}

const setCompanyStatusSchema = z.object({
  companyId: z.string().min(1),
  status: z.nativeEnum(CompanyStatus),
  reason: z.string().trim().min(6, "Reason minimal 6 karakter").max(500),
  suspendedUntil: z.string().trim().optional(),
})

export type SetCompanyStatusState =
  | { success: true; message: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export async function setCompanyStatusAction(_state: SetCompanyStatusState, formData: FormData): Promise<SetCompanyStatusState> {
  try {
    const session = await auth()
    const actorId = requireSuperAdmin(session as unknown as SessionLike)
    const actingCompanyId = getActingCompanyId(session as unknown as SessionLike)
    if (actingCompanyId) {
      return { success: false, error: "Keluar dulu dari mode company context sebelum ubah status company." }
    }

    const parsed = setCompanyStatusSchema.safeParse({
      companyId: formData.get("companyId"),
      status: formData.get("status"),
      reason: formData.get("reason"),
      suspendedUntil: formData.get("suspendedUntil"),
    })

    if (!parsed.success) {
      return { success: false, error: "Input tidak valid.", fieldErrors: parsed.error.flatten().fieldErrors }
    }

    const before = await prisma.company.findUnique({
      where: { id: parsed.data.companyId },
      select: { id: true, status: true, suspendedAt: true, suspendedUntil: true, deletedAt: true, isActive: true },
    })
    if (!before) return { success: false, error: "Company tidak ditemukan." }

    const nextStatus = parsed.data.status
    const suspendedUntil = parsed.data.suspendedUntil ? new Date(parsed.data.suspendedUntil) : null

    const after = await prisma.company.update({
      where: { id: parsed.data.companyId },
      data: {
        status: nextStatus,
        suspendedAt: nextStatus === "SUSPENDED" ? new Date() : null,
        suspendedReason: nextStatus === "SUSPENDED" ? parsed.data.reason : null,
        suspendedUntil: nextStatus === "SUSPENDED" ? suspendedUntil : null,
        deletedAt: nextStatus === "DELETED" ? new Date() : null,
        deletedReason: nextStatus === "DELETED" ? parsed.data.reason : null,
        isActive: nextStatus === "ACTIVE",
      },
      select: { id: true, status: true, suspendedAt: true, suspendedUntil: true, deletedAt: true, isActive: true },
    })

    // For immediate enforcement, disable all users when company is not ACTIVE.
    if (nextStatus !== "ACTIVE") {
      await prisma.user.updateMany({
        where: { companyId: parsed.data.companyId },
        data: { isActive: false },
      })
    }

    await writeAuditLog({
      actorId,
      entityType: "PLATFORM_COMPANY",
      entityId: parsed.data.companyId,
      action: AuditAction.UPDATE,
      beforeData: before,
      afterData: after,
      metadata: { reason: parsed.data.reason, status: nextStatus, suspendedUntil: suspendedUntil?.toISOString() ?? null },
    })

    revalidatePath("/platform/companies")
    revalidatePath(`/platform/companies/${parsed.data.companyId}`)
    return { success: true, message: `Status company diubah menjadi ${nextStatus}.` }
  } catch (error) {
    console.error("[platform] set company status failed", error)
    return { success: false, error: errorMessage(error) }
  }
}

const deleteCompanySchema = z.object({
  companyId: z.string().min(1),
  confirm: z.string().trim().min(1),
  reason: z.string().trim().min(6, "Reason minimal 6 karakter").max(500),
})

export async function softDeleteCompanyAction(_state: SetCompanyStatusState, formData: FormData): Promise<SetCompanyStatusState> {
  try {
    const session = await auth()
    const actorId = requireSuperAdmin(session as unknown as SessionLike)
    const actingCompanyId = getActingCompanyId(session as unknown as SessionLike)
    if (actingCompanyId) {
      return { success: false, error: "Keluar dulu dari mode company context sebelum soft delete company." }
    }

    const parsed = deleteCompanySchema.safeParse({
      companyId: formData.get("companyId"),
      confirm: formData.get("confirm"),
      reason: formData.get("reason"),
    })
    if (!parsed.success) {
      return { success: false, error: "Input tidak valid.", fieldErrors: parsed.error.flatten().fieldErrors }
    }

    const company = await prisma.company.findUnique({
      where: { id: parsed.data.companyId },
      select: { id: true, slug: true, status: true, deletedAt: true, isActive: true },
    })
    if (!company) return { success: false, error: "Company tidak ditemukan." }

    const expected = `HAPUS ${company.slug}`
    if (parsed.data.confirm.toUpperCase() !== expected.toUpperCase()) {
      return { success: false, error: `Konfirmasi salah. Ketik: ${expected}` }
    }

    const before = company
    const after = await prisma.company.update({
      where: { id: parsed.data.companyId },
      data: {
        status: "DELETED",
        deletedAt: new Date(),
        deletedReason: parsed.data.reason,
        isActive: false,
      },
      select: { id: true, status: true, deletedAt: true, isActive: true },
    })

    await prisma.user.updateMany({
      where: { companyId: parsed.data.companyId },
      data: { isActive: false },
    })

    await writeAuditLog({
      actorId,
      entityType: "PLATFORM_COMPANY",
      entityId: parsed.data.companyId,
      action: AuditAction.DELETE,
      beforeData: before,
      afterData: after,
      metadata: { reason: parsed.data.reason },
    })

    revalidatePath("/platform/companies")
    revalidatePath(`/platform/companies/${parsed.data.companyId}`)
    return { success: true, message: "Company berhasil di-soft delete (status DELETED)." }
  } catch (error) {
    console.error("[platform] delete company failed", error)
    return { success: false, error: errorMessage(error) }
  }
}

const listUsersSchema = z.object({
  q: z.string().trim().max(120).optional(),
})

export async function listUsers(params?: { q?: string }): Promise<PlatformUserRow[]> {
  const session = await auth()
  requireSuperAdmin(session as unknown as SessionLike)
  const parsed = listUsersSchema.safeParse(params ?? {})
  const query = parsed.success ? parsed.data.q : undefined

  const rows = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { email: { contains: query, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      updatedAt: true,
      roles: { select: { role: true }, orderBy: { role: "asc" } },
      company: { select: { id: true, name: true, slug: true, status: true } },
    },
  })

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    isActive: row.isActive,
    roles: row.roles.map((item) => item.role),
    company: row.company ? { ...row.company } : null,
    updatedAt: row.updatedAt.toISOString(),
  }))
}

const setUserActiveSchema = z.object({
  userId: z.string().min(1),
  isActive: z.enum(["true", "false"]),
  reason: z.string().trim().min(6, "Reason minimal 6 karakter").max(500),
})

export type PlatformUserActionState =
  | { success: true; message: string; tempPassword?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export async function setUserActiveAction(_state: PlatformUserActionState, formData: FormData): Promise<PlatformUserActionState> {
  try {
    const session = await auth()
    const actorId = requireSuperAdmin(session as unknown as SessionLike)
    const actingCompanyId = getActingCompanyId(session as unknown as SessionLike)
    if (actingCompanyId) {
      return { success: false, error: "Keluar dulu dari mode company context sebelum ubah status user." }
    }

    const parsed = setUserActiveSchema.safeParse({
      userId: formData.get("userId"),
      isActive: formData.get("isActive"),
      reason: formData.get("reason"),
    })
    if (!parsed.success) {
      return { success: false, error: "Input tidak valid.", fieldErrors: parsed.error.flatten().fieldErrors }
    }

    const before = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
      select: { id: true, email: true, isActive: true },
    })
    if (!before) return { success: false, error: "User tidak ditemukan." }

    const nextActive = parsed.data.isActive === "true"
    const after = await prisma.user.update({
      where: { id: parsed.data.userId },
      data: { isActive: nextActive },
      select: { id: true, email: true, isActive: true },
    })

    await writeAuditLog({
      actorId,
      entityType: "PLATFORM_USER",
      entityId: parsed.data.userId,
      action: AuditAction.UPDATE,
      beforeData: before,
      afterData: after,
      metadata: { reason: parsed.data.reason, isActive: nextActive },
    })

    revalidatePath("/platform/users")
    return { success: true, message: `User ${nextActive ? "diaktifkan" : "dinonaktifkan"}.` }
  } catch (error) {
    console.error("[platform] set user active failed", error)
    return { success: false, error: errorMessage(error) }
  }
}

const resetPasswordSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().trim().min(6, "Reason minimal 6 karakter").max(500),
})

export async function resetUserPasswordAction(_state: PlatformUserActionState, formData: FormData): Promise<PlatformUserActionState> {
  try {
    const session = await auth()
    const actorId = requireSuperAdmin(session as unknown as SessionLike)
    const actingCompanyId = getActingCompanyId(session as unknown as SessionLike)
    if (actingCompanyId) {
      return { success: false, error: "Keluar dulu dari mode company context sebelum reset password user." }
    }

    const parsed = resetPasswordSchema.safeParse({
      userId: formData.get("userId"),
      reason: formData.get("reason"),
    })
    if (!parsed.success) {
      return { success: false, error: "Input tidak valid.", fieldErrors: parsed.error.flatten().fieldErrors }
    }

    const user = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
      select: { id: true, email: true },
    })
    if (!user) return { success: false, error: "User tidak ditemukan." }

    const tempPassword = generateTempPassword()
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    await prisma.user.update({
      where: { id: parsed.data.userId },
      data: { password: hashedPassword, isActive: true },
      select: { id: true },
    })

    await writeAuditLog({
      actorId,
      entityType: "PLATFORM_USER",
      entityId: parsed.data.userId,
      action: AuditAction.UPDATE,
      metadata: { reason: parsed.data.reason, action: "RESET_PASSWORD" },
    })

    revalidatePath("/platform/users")
    return { success: true, message: "Password berhasil direset.", tempPassword }
  } catch (error) {
    console.error("[platform] reset password failed", error)
    return { success: false, error: errorMessage(error) }
  }
}
