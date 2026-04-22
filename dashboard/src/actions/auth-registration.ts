"use server"

import bcrypt from "bcryptjs"
import { RoleType } from "@prisma/client"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
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
  errors?: Partial<Record<"name" | "email" | "password" | "confirmPassword", string[]>>
}

export async function registerUser(
  _state: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
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

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashedPassword,
      isActive: true,
      roles: {
        create: [{ role: RoleType.ADMIN }, { role: RoleType.PIMPINAN }],
      },
    },
  })

  return {
    success: true,
    email: parsed.data.email,
    message: "Akun berhasil dibuat.",
  }
}
