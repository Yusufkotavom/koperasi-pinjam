"use server"

import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { AuditAction, Prisma, RoleType } from "@prisma/client"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { writeAuditLog } from "@/lib/audit"
import { ensureAccountingAccounts, getCashBalanceByJenis, postKasTransactionJournal } from "@/lib/accounting"
import { prisma } from "@/lib/prisma"
import { requireRoles } from "@/lib/roles"
import { requireCompanyId } from "@/lib/tenant"
import { ensureKasKategori } from "./kas"

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function defaultPasswordFromPhone(noHp?: string | null) {
  const digits = (noHp ?? "").replace(/\D/g, "")
  if (digits.length >= 6) return `Kolektor${digits.slice(-6)}`
  return "Kolektor123"
}

function parseDateOnly(input: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null
  if (month < 1 || month > 12 || day < 1 || day > 31) return null

  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return date
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

const updateKolektorBonusSchema = z.object({
  id: z.string().min(1),
  nominal: z.coerce.number().min(0),
  catatan: z.string().trim().max(300).optional(),
})

const payKolektorBonusSchema = z.object({
  id: z.string().min(1),
  kasJenis: z.enum(["TUNAI", "BANK"]).default("TUNAI"),
  tanggalBayar: z.string().min(1),
  catatan: z.string().trim().max(300).optional(),
})

const createKolektorBonusManualSchema = z.object({
  pinjamanId: z.string().min(1),
  kolektorId: z.string().min(1),
  nominal: z.coerce.number().min(0),
  catatan: z.string().trim().max(300).optional(),
})

const transferKolektorBonusSchema = z.object({
  id: z.string().min(1),
  kolektorId: z.string().min(1),
  catatan: z.string().trim().max(300).optional(),
})

export async function getDaftarKolektor() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  const [users, bonusRows] = await Promise.all([
    prisma.user.findMany({
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
    }),
    prisma.kolektorBonus.findMany({
      where: { companyId },
      select: {
        kolektorId: true,
        nominal: true,
        status: true,
      },
    }),
  ])

  const bonusMap = new Map<string, { readyCount: number; readyNominal: number; paidCount: number; paidNominal: number }>()
  for (const row of bonusRows) {
    const current = bonusMap.get(row.kolektorId) ?? { readyCount: 0, readyNominal: 0, paidCount: 0, paidNominal: 0 }
    const nominal = Number(row.nominal)
    if (row.status === "READY") {
      current.readyCount += 1
      current.readyNominal += nominal
    }
    if (row.status === "PAID") {
      current.paidCount += 1
      current.paidNominal += nominal
    }
    bonusMap.set(row.kolektorId, current)
  }

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    isActive: u.isActive,
    roles: u.roles.map((r) => r.role),
    totalNasabah: u._count.nasabahSebagaiKolektor,
    bonusReadyCount: bonusMap.get(u.id)?.readyCount ?? 0,
    bonusReadyNominal: bonusMap.get(u.id)?.readyNominal ?? 0,
    bonusPaidCount: bonusMap.get(u.id)?.paidCount ?? 0,
    bonusPaidNominal: bonusMap.get(u.id)?.paidNominal ?? 0,
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

export async function getKolektorBonusList() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as SessionLike)
  requireRoles(session as unknown as SessionLike, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])

  const rows = await prisma.kolektorBonus.findMany({
    where: { companyId },
    orderBy: [{ status: "asc" }, { eligibleAt: "desc" }, { createdAt: "desc" }],
    include: {
      kolektor: { select: { id: true, name: true, email: true, isActive: true } },
      paidBy: { select: { id: true, name: true } },
      pinjaman: {
        select: {
          id: true,
          nomorKontrak: true,
          status: true,
          tanggalCair: true,
          pengajuan: {
            select: {
              nasabah: {
                select: {
                  id: true,
                  namaLengkap: true,
                  nomorAnggota: true,
                },
              },
            },
          },
        },
      },
    },
  })

  return rows.map((row) => ({
    id: row.id,
    nominal: Number(row.nominal),
    status: row.status,
    eligibleAt: row.eligibleAt?.toISOString() ?? null,
    paidAt: row.paidAt?.toISOString() ?? null,
    catatan: row.catatan ?? "",
    kolektor: row.kolektor,
    paidBy: row.paidBy,
    pinjaman: {
      id: row.pinjaman.id,
      nomorKontrak: row.pinjaman.nomorKontrak,
      status: row.pinjaman.status,
      tanggalCair: row.pinjaman.tanggalCair.toISOString(),
      nasabah: row.pinjaman.pengajuan.nasabah,
    },
  }))
}

export async function getManualKolektorBonusCandidates() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as SessionLike)
  requireRoles(session as unknown as SessionLike, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])

  const rows = await prisma.pinjaman.findMany({
    where: {
      companyId,
      bonusKolektor: null,
    },
    orderBy: [{ tanggalCair: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      nomorKontrak: true,
      status: true,
      tanggalCair: true,
      pengajuan: {
        select: {
          nasabah: {
            select: {
              id: true,
              namaLengkap: true,
              nomorAnggota: true,
              kolektorId: true,
              kolektor: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
    take: 300,
  })

  return rows.map((row) => ({
    id: row.id,
    nomorKontrak: row.nomorKontrak,
    status: row.status,
    tanggalCair: row.tanggalCair.toISOString(),
    nasabah: row.pengajuan.nasabah,
  }))
}

export async function createKolektorBonusManual(input: {
  pinjamanId: string
  kolektorId: string
  nominal: number
  catatan?: string
}) {
  const parsed = createKolektorBonusManualSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data bonus manual tidak valid." }

  const { companyId, actorId } = await getAuthorizedKolektorContext()

  const [pinjaman, kolektor, existing] = await Promise.all([
    prisma.pinjaman.findFirst({
      where: { id: parsed.data.pinjamanId, companyId },
      select: {
        id: true,
        nomorKontrak: true,
        status: true,
        pengajuan: {
          select: {
            nasabah: { select: { id: true, namaLengkap: true, nomorAnggota: true } },
          },
        },
      },
    }),
    prisma.user.findFirst({
      where: {
        id: parsed.data.kolektorId,
        companyId,
        roles: { some: { role: RoleType.KOLEKTOR } },
      },
      select: { id: true, name: true },
    }),
    prisma.kolektorBonus.findFirst({
      where: { companyId, pinjamanId: parsed.data.pinjamanId },
      select: { id: true },
    }),
  ])

  if (!pinjaman) return { error: "Pinjaman tidak ditemukan." }
  if (!kolektor) return { error: "Kolektor tidak ditemukan." }
  if (existing) return { error: "Pinjaman ini sudah memiliki bonus kolektor." }

  const status = pinjaman.status === "LUNAS" ? "READY" : "PENDING"
  const eligibleAt = pinjaman.status === "LUNAS" ? new Date() : null

  const created = await prisma.kolektorBonus.create({
    data: {
      companyId,
      pinjamanId: pinjaman.id,
      kolektorId: kolektor.id,
      nominal: new Prisma.Decimal(parsed.data.nominal),
      status,
      eligibleAt,
      catatan: parsed.data.catatan?.trim() || `Bonus manual untuk pinjaman ${pinjaman.nomorKontrak}`,
    },
    select: { id: true, nominal: true, status: true },
  })

  await writeAuditLog({
    actorId,
    entityType: "KOLEKTOR_BONUS",
    entityId: created.id,
    action: AuditAction.CREATE,
    afterData: {
      pinjamanId: pinjaman.id,
      nomorKontrak: pinjaman.nomorKontrak,
      kolektorId: kolektor.id,
      kolektorName: kolektor.name,
      nominal: created.nominal.toString(),
      status: created.status,
    },
  })

  revalidateKolektorSurfaces()
  return { success: true }
}

export async function transferKolektorBonus(input: {
  id: string
  kolektorId: string
  catatan?: string
}) {
  const parsed = transferKolektorBonusSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data pindah bonus tidak valid." }

  const { companyId, actorId } = await getAuthorizedKolektorContext()

  const [bonus, targetKolektor] = await Promise.all([
    prisma.kolektorBonus.findFirst({
      where: { id: parsed.data.id, companyId },
      include: {
        kolektor: { select: { id: true, name: true } },
        pinjaman: { select: { id: true, nomorKontrak: true } },
      },
    }),
    prisma.user.findFirst({
      where: {
        id: parsed.data.kolektorId,
        companyId,
        roles: { some: { role: RoleType.KOLEKTOR } },
      },
      select: { id: true, name: true },
    }),
  ])

  if (!bonus) return { error: "Bonus kolektor tidak ditemukan." }
  if (!targetKolektor) return { error: "Kolektor tujuan tidak ditemukan." }
  if (bonus.status === "PAID") return { error: "Bonus yang sudah dibayar tidak dapat dipindahkan." }
  if (bonus.status === "CANCELED") return { error: "Bonus yang sudah dibatalkan tidak dapat dipindahkan." }
  if (bonus.kolektorId === targetKolektor.id) return { error: "Kolektor tujuan sama dengan kolektor saat ini." }

  const previousCatatan = bonus.catatan?.trim()
  const transferNote = parsed.data.catatan?.trim()
  const nextCatatan = transferNote
    ? [previousCatatan, `Transfer bonus: ${transferNote}`].filter(Boolean).join("\n")
    : bonus.catatan

  await prisma.kolektorBonus.update({
    where: { id: bonus.id },
    data: {
      kolektorId: targetKolektor.id,
      ...(nextCatatan !== undefined ? { catatan: nextCatatan || null } : {}),
    },
  })

  await writeAuditLog({
    actorId,
    entityType: "KOLEKTOR_BONUS",
    entityId: bonus.id,
    action: AuditAction.UPDATE,
    beforeData: {
      kolektorId: bonus.kolektor.id,
      kolektorName: bonus.kolektor.name,
      status: bonus.status,
    },
    afterData: {
      kolektorId: targetKolektor.id,
      kolektorName: targetKolektor.name,
      status: bonus.status,
      nomorKontrak: bonus.pinjaman.nomorKontrak,
    },
    metadata: {
      reason: transferNote ?? null,
    },
  })

  revalidateKolektorSurfaces()
  return { success: true }
}

export async function updateKolektorBonus(input: { id: string; nominal: number; catatan?: string }) {
  const parsed = updateKolektorBonusSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data bonus tidak valid." }

  const { companyId, actorId } = await getAuthorizedKolektorContext()

  const existing = await prisma.kolektorBonus.findFirst({
    where: { id: parsed.data.id, companyId },
    select: {
      id: true,
      nominal: true,
      status: true,
      catatan: true,
    },
  })

  if (!existing) return { error: "Data bonus tidak ditemukan." }
  if (existing.status === "PAID") {
    return { error: "Bonus yang sudah dibayar tidak dapat diubah." }
  }
  if (existing.status === "CANCELED") {
    return { error: "Bonus yang sudah dibatalkan tidak dapat diubah." }
  }

  const updated = await prisma.kolektorBonus.update({
    where: { id: existing.id },
    data: {
      nominal: new Prisma.Decimal(parsed.data.nominal),
      ...(parsed.data.catatan !== undefined ? { catatan: parsed.data.catatan || null } : {}),
    },
    select: {
      id: true,
      nominal: true,
      status: true,
      catatan: true,
    },
  })

  await writeAuditLog({
    actorId,
    entityType: "KOLEKTOR_BONUS",
    entityId: updated.id,
    action: AuditAction.UPDATE,
    beforeData: {
      nominal: existing.nominal.toString(),
      status: existing.status,
      catatan: existing.catatan,
    },
    afterData: {
      nominal: updated.nominal.toString(),
      status: updated.status,
      catatan: updated.catatan,
    },
  })

  revalidateKolektorSurfaces()
  revalidatePath("/laporan/laba-rugi")
  return { success: true }
}

export async function payKolektorBonus(input: {
  id: string
  kasJenis: "TUNAI" | "BANK"
  tanggalBayar: string
  catatan?: string
}) {
  const parsed = payKolektorBonusSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data pembayaran bonus tidak valid." }

  const { companyId, actorId } = await getAuthorizedKolektorContext()
  const tanggalBayar = parseDateOnly(parsed.data.tanggalBayar)
  if (!tanggalBayar) return { error: "Tanggal pembayaran bonus tidak valid." }

  const bonus = await prisma.kolektorBonus.findFirst({
    where: { id: parsed.data.id, companyId },
    include: {
      kolektor: { select: { id: true, name: true } },
      pinjaman: {
        select: {
          nomorKontrak: true,
          pengajuan: {
            select: {
              nasabah: { select: { namaLengkap: true, nomorAnggota: true } },
            },
          },
        },
      },
    },
  })

  if (!bonus) return { error: "Bonus kolektor tidak ditemukan." }
  if (bonus.status !== "READY") {
    return { error: "Bonus hanya bisa dibayar saat statusnya siap dibayar." }
  }

  await ensureAccountingAccounts(companyId)
  const saldoKas = await getCashBalanceByJenis(companyId, parsed.data.kasJenis, tanggalBayar)
  const nominal = Number(bonus.nominal)
  if (saldoKas < nominal) {
    return {
      error: `Saldo ${parsed.data.kasJenis === "BANK" ? "Kas Bank" : "Kas Tunai"} tidak cukup. Tersedia Rp ${saldoKas.toLocaleString("id-ID")}, perlu Rp ${nominal.toLocaleString("id-ID")}.`,
    }
  }

  const ensured = await ensureKasKategori({ jenis: "KELUAR", kategori: "BONUS_KOLEKTOR" })
  if ("error" in ensured) return { error: ensured.error }

  let kasId = ""
  await prisma.$transaction(async (tx) => {
    const kas = await tx.kasTransaksi.create({
      data: {
        companyId,
        jenis: "KELUAR",
        kategoriId: ensured.kategoriId,
        kategoriKey: ensured.key,
        deskripsi: `Pembayaran bonus kolektor ${bonus.kolektor.name} untuk ${bonus.pinjaman.pengajuan.nasabah.namaLengkap} (${bonus.pinjaman.nomorKontrak})`,
        jumlah: new Prisma.Decimal(nominal),
        kasJenis: parsed.data.kasJenis,
        inputOlehId: actorId,
        tanggal: tanggalBayar,
        isApproved: true,
      },
    })
    kasId = kas.id

    await postKasTransactionJournal(tx, kas.id, actorId, { ensureAccounts: false })

    await tx.kolektorBonus.update({
      where: { id: bonus.id },
      data: {
        status: "PAID",
        paidAt: tanggalBayar,
        paidById: actorId,
        catatan: parsed.data.catatan?.trim() || bonus.catatan,
      },
    })
  })

  await writeAuditLog({
    actorId,
    entityType: "KOLEKTOR_BONUS",
    entityId: bonus.id,
    action: AuditAction.PAYMENT,
    beforeData: {
      status: bonus.status,
      nominal: bonus.nominal.toString(),
      paidAt: bonus.paidAt?.toISOString() ?? null,
    },
    afterData: {
      status: "PAID",
      nominal: bonus.nominal.toString(),
      paidAt: tanggalBayar.toISOString(),
      kasId,
      kasJenis: parsed.data.kasJenis,
    },
  })

  revalidateKolektorSurfaces()
  revalidatePath("/kas")
  revalidatePath("/laporan/buku-besar")
  revalidatePath("/laporan/neraca")
  revalidatePath("/laporan/laba-rugi")
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
