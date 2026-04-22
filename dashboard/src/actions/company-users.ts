"use server"

import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { RoleType } from "@prisma/client"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireRoles } from "@/lib/roles"

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

