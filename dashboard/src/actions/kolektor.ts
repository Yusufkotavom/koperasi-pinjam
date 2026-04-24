"use server"

import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { AuditAction, RoleType } from "@prisma/client"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { writeAuditLog } from "@/lib/audit"
import { prisma } from "@/lib/prisma"
import { requireRoles } from "@/lib/roles"
import { requireCompanyId } from "@/lib/tenant"

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function defaultPasswordFromPhone(noHp?: string | null) {
  const digits = (noHp ?? "").replace(/\D/g, "")
  if (digits.length >= 6) return `Kolektor${digits.slice(-6)}`
  return "Kolektor123"
}

type SessionLike = {
  user?: {
    id?: string
    companyId?: string | null
    roles?: string[]
  }
} | null

function revalidateKolektorSurfaces() {
  revalidatePath("/kolektor")
  revalidatePath("/nasabah")
  revalidatePath("/monitoring/kolektor")
  revalidatePath("/monitoring/tunggakan")
}

async function getAuthorizedKolektorContext() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as SessionLike)
  const { userId } = requireRoles(session as unknown as SessionLike, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])

  return {
    session: session as unknown as SessionLike,
    companyId,
    actorId: userId,
  }
}

const updateKolektorSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  isActive: z.boolean(),
  isAdmin: z.boolean(),
})

const removeKolektorSchema = z.object({
  id: z.string().min(1),
})

export async function getDaftarKolektor() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  const users = await prisma.user.findMany({
    where: {
      companyId,
      roles: { some: { role: "KOLEKTOR" } },
    },
    include: {
      roles: { select: { role: true } },
      _count: {
        select: {
          nasabahSebagaiKolektor: true,
        },
      },
    },
    orderBy: { name: "asc" },
  })

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    isActive: u.isActive,
    roles: u.roles.map((r) => r.role),
    totalNasabah: u._count.nasabahSebagaiKolektor,
  }))
}

export async function getSumberKolektorOptions() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  const [nasabah, kelompok] = await Promise.all([
    prisma.nasabah.findMany({
      where: { companyId, status: "AKTIF" },
      select: { id: true, namaLengkap: true, noHp: true },
      orderBy: { namaLengkap: "asc" },
    }),
    prisma.kelompok.findMany({
      where: { companyId },
      select: { id: true, kode: true, nama: true, ketua: true },
      orderBy: { nama: "asc" },
    }),
  ])

  return { nasabah, kelompok }
}

async function createOrUpdateKolektorUser(params: {
  companyId: string
  name: string
  email: string
  password: string
  isAdmin?: boolean
}) {
  const email = normalizeEmail(params.email)
  const existing = await prisma.user.findUnique({
    where: { email },
    include: { roles: true },
  })

  if (!existing) {
    const hash = await bcrypt.hash(params.password, 10)
    return prisma.user.create({
      data: {
        name: params.name,
        email,
        password: hash,
        isActive: true,
        companyId: params.companyId,
        roles: {
          create: [
            { role: RoleType.KOLEKTOR },
            ...(params.isAdmin ? [{ role: RoleType.ADMIN }] : []),
          ],
        },
      },
    })
  }

  if (existing.companyId !== params.companyId) {
    throw new Error("Email sudah digunakan di company lain.")
  }

  const existingRoles = new Set(existing.roles.map((r) => r.role))
  const createRoles: { role: RoleType }[] = []
  if (!existingRoles.has(RoleType.KOLEKTOR)) createRoles.push({ role: RoleType.KOLEKTOR })
  if (params.isAdmin && !existingRoles.has(RoleType.ADMIN)) createRoles.push({ role: RoleType.ADMIN })

  if (createRoles.length > 0) {
    await prisma.userRole.createMany({
      data: createRoles.map((r) => ({ userId: existing.id, role: r.role })),
      skipDuplicates: true,
    })
  }

  return prisma.user.update({
    where: { id: existing.id },
    data: { name: params.name || existing.name },
  })
}

export async function createKolektorManual(input: {
  name: string
  email: string
  password: string
  isAdmin?: boolean
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)
  requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])

  if (!input.name?.trim() || !input.email?.trim() || !input.password?.trim()) {
    return { error: "Nama, email, dan password wajib diisi." }
  }

  await createOrUpdateKolektorUser({
    companyId,
    name: input.name.trim(),
    email: input.email,
    password: input.password,
    isAdmin: input.isAdmin,
  })

  revalidateKolektorSurfaces()
  return { success: true }
}

export async function createKolektorFromNasabah(input: {
  nasabahId: string
  email?: string
  password?: string
  isAdmin?: boolean
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)
  requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])

  const nasabah = await prisma.nasabah.findFirst({
    where: { id: input.nasabahId, companyId },
    select: { id: true, namaLengkap: true, noHp: true },
  })

  if (!nasabah) return { error: "Nasabah tidak ditemukan." }

  const safeName = nasabah.namaLengkap.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "")
  const generatedEmail = input.email?.trim() || `${safeName || "kolektor"}.${nasabah.id.slice(-4)}@koperasi.local`

  const user = await createOrUpdateKolektorUser({
    companyId,
    name: nasabah.namaLengkap,
    email: generatedEmail,
    password: input.password?.trim() || defaultPasswordFromPhone(nasabah.noHp),
    isAdmin: input.isAdmin,
  })

  await prisma.nasabah.update({
    where: { id: nasabah.id },
    data: { kolektorId: user.id },
  })

  revalidateKolektorSurfaces()
  return { success: true, defaultEmail: generatedEmail }
}

export async function createKolektorFromKetuaKelompok(input: {
  kelompokId: string
  email?: string
  password?: string
  isAdmin?: boolean
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)
  requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])

  const kelompok = await prisma.kelompok.findFirst({
    where: { id: input.kelompokId, companyId },
    include: {
      nasabah: {
        select: { id: true, namaLengkap: true, noHp: true },
      },
    },
  })

  if (!kelompok) return { error: "Kelompok tidak ditemukan." }

  const ketuaNasabah = kelompok.nasabah.find((n) => n.namaLengkap === kelompok.ketua) ?? kelompok.nasabah[0]
  if (!ketuaNasabah) return { error: "Kelompok belum memiliki anggota untuk dijadikan kolektor." }

  const safeName = ketuaNasabah.namaLengkap.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "")
  const generatedEmail = input.email?.trim() || `${safeName || "ketua"}.${kelompok.kode.toLowerCase()}@koperasi.local`

  const user = await createOrUpdateKolektorUser({
    companyId,
    name: ketuaNasabah.namaLengkap,
    email: generatedEmail,
    password: input.password?.trim() || defaultPasswordFromPhone(ketuaNasabah.noHp),
    isAdmin: input.isAdmin,
  })

  await prisma.nasabah.updateMany({
    where: { companyId, kelompokId: kelompok.id },
    data: { kolektorId: user.id },
  })

  revalidateKolektorSurfaces()
  return { success: true, defaultEmail: generatedEmail }
}

export async function updateKolektor(input: {
  id: string
  name: string
  email: string
  isActive: boolean
  isAdmin: boolean
}) {
  const parsed = updateKolektorSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input kolektor tidak valid." }
  }

  const { companyId, actorId } = await getAuthorizedKolektorContext()

  const existing = await prisma.user.findFirst({
    where: {
      id: parsed.data.id,
      companyId,
      roles: { some: { role: RoleType.KOLEKTOR } },
    },
    include: {
      roles: { select: { role: true } },
    },
  })

  if (!existing) return { error: "Kolektor tidak ditemukan." }

  const emailOwner = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, companyId: true },
  })

  if (emailOwner && emailOwner.id !== existing.id) {
    return { error: "Email sudah digunakan user lain." }
  }

  const hasAdminRole = existing.roles.some((role) => role.role === RoleType.ADMIN)
  const beforeData = {
    id: existing.id,
    name: existing.name,
    email: existing.email,
    isActive: existing.isActive,
    roles: existing.roles.map((role) => role.role),
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: existing.id },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        isActive: parsed.data.isActive,
      },
    })

    if (parsed.data.isAdmin && !hasAdminRole) {
      await tx.userRole.create({
        data: { userId: existing.id, role: RoleType.ADMIN },
      })
    }

    if (!parsed.data.isAdmin && hasAdminRole) {
      await tx.userRole.deleteMany({
        where: { userId: existing.id, role: RoleType.ADMIN },
      })
    }
  })

  const afterRoles: RoleType[] = existing.roles
    .map((role) => role.role)
    .filter((role) => role !== RoleType.ADMIN)

  if (parsed.data.isAdmin) afterRoles.push(RoleType.ADMIN)

  await writeAuditLog({
    actorId,
    entityType: "KOLEKTOR",
    entityId: existing.id,
    action: AuditAction.UPDATE,
    beforeData,
    afterData: {
      id: existing.id,
      name: parsed.data.name,
      email: parsed.data.email,
      isActive: parsed.data.isActive,
      roles: Array.from(new Set(afterRoles)).sort(),
    },
  })

  revalidateKolektorSurfaces()
  return { success: true }
}

export async function removeKolektor(input: { id: string }) {
  const parsed = removeKolektorSchema.safeParse(input)
  if (!parsed.success) return { error: "Kolektor tidak valid." }

  const { companyId, actorId } = await getAuthorizedKolektorContext()

  const existing = await prisma.user.findFirst({
    where: {
      id: parsed.data.id,
      companyId,
      roles: { some: { role: RoleType.KOLEKTOR } },
    },
    include: {
      roles: { select: { role: true } },
      _count: {
        select: {
          nasabahSebagaiKolektor: true,
          kolektorTargets: true,
        },
      },
    },
  })

  if (!existing) return { error: "Kolektor tidak ditemukan." }

  const remainingRoles = existing.roles.map((role) => role.role).filter((role) => role !== RoleType.KOLEKTOR)

  await prisma.$transaction(async (tx) => {
    await tx.nasabah.updateMany({
      where: { companyId, kolektorId: existing.id },
      data: { kolektorId: null },
    })

    await tx.kolektorTarget.deleteMany({
      where: { companyId, kolektorId: existing.id },
    })

    await tx.userRole.deleteMany({
      where: { userId: existing.id, role: RoleType.KOLEKTOR },
    })

    if (remainingRoles.length === 0) {
      await tx.user.update({
        where: { id: existing.id },
        data: { isActive: false },
      })
    }
  })

  await writeAuditLog({
    actorId,
    entityType: "KOLEKTOR",
    entityId: existing.id,
    action: AuditAction.DELETE,
    beforeData: {
      id: existing.id,
      name: existing.name,
      email: existing.email,
      isActive: existing.isActive,
      roles: existing.roles.map((role) => role.role),
      totalNasabah: existing._count.nasabahSebagaiKolektor,
      totalTarget: existing._count.kolektorTargets,
    },
    afterData: {
      id: existing.id,
      name: existing.name,
      email: existing.email,
      isActive: remainingRoles.length === 0 ? false : existing.isActive,
      roles: remainingRoles.sort(),
      totalNasabah: 0,
      totalTarget: 0,
    },
  })

  revalidateKolektorSurfaces()
  return { success: true }
}

export async function getUserRoleTable() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)
  requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])

  const users = await prisma.user.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      roles: { select: { role: true } },
    },
    orderBy: { name: "asc" },
  })

  return users.map((u) => ({
    ...u,
    roles: u.roles.map((r) => r.role),
  }))
}
