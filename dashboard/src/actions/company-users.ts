"use server"

import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { RoleType } from "@prisma/client"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireRoles } from "@/lib/roles"
import { writeAuditLog } from "@/lib/audit"

type SessionLike = {
  user?: {
    id?: string
    roles?: string[]
    companyId?: string | null
  }
} | null

const manageableRoles = [
  RoleType.ADMIN,
  RoleType.TELLER,
  RoleType.KOLEKTOR,
  RoleType.SURVEYOR,
  RoleType.MANAGER,
  RoleType.PIMPINAN,
  RoleType.AKUNTANSI,
] as const

const createCompanyUserSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter").max(100),
  role: z.enum(manageableRoles, { message: "Role tidak valid" }),
})

export type CompanyUserRow = {
  id: string
  name: string
  email: string
  isActive: boolean
  roles: string[]
}

export type CreateCompanyUserState = {
  success?: boolean
  message?: string
  errors?: Partial<Record<"name" | "email" | "password" | "role", string[]>>
}

function getCompanyId(session: SessionLike) {
  const companyId = session?.user?.companyId
  if (!companyId) throw new Error("Company belum terhubung ke akun ini.")
  return companyId
}

export async function getCompanyUsers(): Promise<CompanyUserRow[]> {
  const session = await auth()
  requireRoles(session as unknown as SessionLike, [RoleType.SUPER_ADMIN, RoleType.OWNER, RoleType.ADMIN])
  const companyId = getCompanyId(session as unknown as SessionLike)

  const users = await prisma.user.findMany({
    where: { companyId },
    orderBy: [{ createdAt: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      roles: { select: { role: true }, orderBy: { role: "asc" } },
    },
  })

  return users.map((user) => ({
    ...user,
    roles: user.roles.map((item) => item.role),
  }))
}

export async function createCompanyUser(
  _state: CreateCompanyUserState,
  formData: FormData,
): Promise<CreateCompanyUserState> {
  const session = await auth()
  requireRoles(session as unknown as SessionLike, [RoleType.SUPER_ADMIN, RoleType.OWNER, RoleType.ADMIN])
  const companyId = getCompanyId(session as unknown as SessionLike)

  const parsed = createCompanyUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  })

  if (existing) {
    return {
      errors: { email: ["Email sudah terdaftar"] },
      message: "Gunakan email lain untuk user baru.",
    }
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12)

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashedPassword,
      companyId,
      isActive: true,
      roles: {
        create: [{ role: parsed.data.role }],
      },
    },
  })

  revalidatePath("/settings")
  return { success: true, message: "User company berhasil dibuat." }
}

export async function updateCompanyUser(input: {
  userId: string
  name: string
  role: RoleType
  isActive: boolean
}): Promise<{ success: boolean; error?: string; message?: string }> {
  const session = await auth()
  requireRoles(session as unknown as SessionLike, [RoleType.SUPER_ADMIN, RoleType.OWNER, RoleType.ADMIN])
  const companyId = getCompanyId(session as unknown as SessionLike)
  const actorId = session?.user?.id

  if (!input.name || input.name.trim().length < 2) {
    return { success: false, error: "Nama minimal 2 karakter." }
  }

  const target = await prisma.user.findFirst({
    where: { id: input.userId, companyId },
    select: { id: true, name: true, isActive: true, roles: { select: { role: true } } },
  })

  if (!target) {
    return { success: false, error: "User tidak ditemukan di company ini." }
  }

  // Admin tidak boleh menonaktifkan akunnya sendiri agar tidak terkunci
  if (actorId === input.userId && !input.isActive) {
    return { success: false, error: "Anda tidak dapat menonaktifkan akun Anda sendiri." }
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: input.userId },
      data: {
        name: input.name.trim(),
        isActive: input.isActive,
      },
    })

    await tx.userRole.deleteMany({
      where: { userId: input.userId },
    })

    await tx.userRole.create({
      data: {
        userId: input.userId,
        role: input.role,
      },
    })
  })

  await writeAuditLog({
    actorId,
    entityType: "USER",
    entityId: input.userId,
    action: "UPDATE",
    beforeData: { name: target.name, isActive: target.isActive, roles: target.roles.map((r) => r.role) },
    afterData: { name: input.name.trim(), isActive: input.isActive, role: input.role },
  })

  revalidatePath("/settings")
  revalidatePath("/settings/users")
  return { success: true, message: `Data user ${input.name.trim()} berhasil diperbarui.` }
}

export async function changeCompanyUserPassword(input: {
  userId: string
  newPassword: string
}): Promise<{ success: boolean; error?: string; message?: string }> {
  const session = await auth()
  requireRoles(session as unknown as SessionLike, [RoleType.SUPER_ADMIN, RoleType.OWNER, RoleType.ADMIN])
  const companyId = getCompanyId(session as unknown as SessionLike)
  const actorId = session?.user?.id

  if (!input.newPassword || input.newPassword.length < 6) {
    return { success: false, error: "Password baru minimal 6 karakter." }
  }

  const target = await prisma.user.findFirst({
    where: { id: input.userId, companyId },
    select: { id: true, name: true, email: true },
  })

  if (!target) {
    return { success: false, error: "User tidak ditemukan di company ini." }
  }

  const hashedPassword = await bcrypt.hash(input.newPassword, 12)

  await prisma.user.update({
    where: { id: input.userId },
    data: { password: hashedPassword },
  })

  await writeAuditLog({
    actorId,
    entityType: "USER",
    entityId: input.userId,
    action: "UPDATE",
    metadata: { note: "Password changed by admin", userEmail: target.email },
  })

  revalidatePath("/settings")
  revalidatePath("/settings/users")
  return { success: true, message: `Password untuk user ${target.name} berhasil diubah.` }
}


