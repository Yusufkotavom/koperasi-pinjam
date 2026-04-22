"use server"

import bcrypt from "bcryptjs"
import { RoleType } from "@prisma/client"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
    companyName: z.string().trim().min(3, "Nama koperasi minimal 3 karakter").max(120),
    email: z.string().trim().toLowerCase().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter").max(100),
    confirmPassword: z.string().min(6, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak sama",
  })

export type RegisterState = {
  success?: boolean
  email?: string
  message?: string
  errors?: Partial<Record<"name" | "companyName" | "email" | "password" | "confirmPassword", string[]>>
}

function toSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return slug || "koperasi"
}

async function uniqueCompanySlug(companyName: string) {
  const baseSlug = toSlug(companyName)
  let slug = baseSlug
  let suffix = 1

  while (await prisma.company.findUnique({ where: { slug }, select: { id: true } })) {
    suffix += 1
    slug = `${baseSlug}-${suffix}`
  }

  return slug
}

export async function registerUser(
  _state: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    companyName: formData.get("companyName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  })

  if (existingUser) {
    return {
      errors: { email: ["Email sudah terdaftar"] },
      message: "Gunakan email lain atau masuk dengan akun yang sudah ada.",
    }
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12)
  const companySlug = await uniqueCompanySlug(parsed.data.companyName)

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: hashedPassword,
        isActive: true,
        roles: {
          create: [{ role: RoleType.OWNER }, { role: RoleType.ADMIN }],
        },
      },
    })

    const company = await tx.company.create({
      data: {
        name: parsed.data.companyName,
        slug: companySlug,
        email: parsed.data.email,
        ownerId: user.id,
      },
    })

    await tx.user.update({
      where: { id: user.id },
      data: { companyId: company.id },
    })
  })

  return {
    success: true,
    email: parsed.data.email,
    message: "Akun dan company berhasil dibuat.",
  }
}
