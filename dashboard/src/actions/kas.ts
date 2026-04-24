"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { ApprovalEntityType, ApprovalStatus, Prisma, RoleType } from "@prisma/client"
import { hasAnyRole, requireRoles } from "@/lib/roles"
import { writeAuditLog } from "@/lib/audit"
import { ensureAccountingAccounts, getCashBalanceByJenis, postKasTransactionJournal } from "@/lib/accounting"
import { resolveReportPeriod, type ReportPeriodInput } from "@/lib/report-period"
import { serializeData } from "@/lib/utils"
import { requireCompanyId } from "@/lib/tenant"

function normalizeKasCategoryKey(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "_")
}

const kasKategoriSchema = z.object({
  jenis: z.enum(["MASUK", "KELUAR"]),
  nama: z.string().min(2, "Nama kategori minimal 2 karakter"),
})

const kasSchema = z.object({
  jenis: z.enum(["MASUK", "KELUAR"]),
  kategori: z.string().min(1),
  deskripsi: z.string().min(3),
  jumlah: z.coerce.number().min(1),
  kasJenis: z.enum(["TUNAI", "BANK"]).default("TUNAI"),
  buktiUrl: z.string().min(3).optional(),
  tanggal: z.string().optional(),
})

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

export async function ensureKasKategori(params: { jenis: "MASUK" | "KELUAR"; kategori: string }) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" as const }
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  const key = normalizeKasCategoryKey(params.kategori)
  if (!key) return { error: "Kategori tidak boleh kosong." as const }

  const existing = await prisma.kasKategori.findUnique({ where: { companyId_key: { companyId, key } } })
  if (existing && existing.jenis !== params.jenis) {
    return { error: `Kategori "${existing.nama}" sudah terpakai untuk jenis ${existing.jenis}. Kategori masuk dan keluar tidak boleh sama.` as const }
  }

  if (!existing) {
    const created = await prisma.kasKategori.create({
      data: {
        companyId,
        nama: params.kategori.trim(),
        key,
        jenis: params.jenis,
        isActive: true,
      },
    })
    return { key, kategoriId: created.id }
  }

  return { key, kategoriId: existing.id }
}

export async function getKasKategoriList() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  const defaults: Array<{ jenis: "MASUK" | "KELUAR"; nama: string }> = [
    { jenis: "MASUK", nama: "ANGSURAN" },
    { jenis: "MASUK", nama: "PELUNASAN" },
    { jenis: "MASUK", nama: "SIMPANAN" },
    { jenis: "MASUK", nama: "MODAL" },
    { jenis: "MASUK", nama: "ADMIN" },
    { jenis: "MASUK", nama: "DENDA" },
    { jenis: "MASUK", nama: "LAINNYA" },
    { jenis: "MASUK", nama: "LAINNYA_MASUK" },
    { jenis: "KELUAR", nama: "PENCAIRAN" },
    { jenis: "KELUAR", nama: "PEMBATALAN_ANGSURAN" },
    { jenis: "KELUAR", nama: "GAJI" },
    { jenis: "KELUAR", nama: "OPERASIONAL" },
    { jenis: "KELUAR", nama: "LAINNYA_KELUAR" },
  ]

  // Sequential seeding with upsert to avoid race conditions and duplicates
  for (const d of defaults) {
    const key = normalizeKasCategoryKey(d.nama)
    try {
      await prisma.kasKategori.upsert({
        where: { companyId_key: { companyId, key } },
        update: {},
        create: {
          companyId,
          nama: d.nama,
          key,
          jenis: d.jenis,
          isActive: true,
        },
      })
    } catch (err) {
      console.error(`Error seeding category ${d.nama}:`, err)
    }
  }

  const rows = await prisma.kasKategori.findMany({
    where: { companyId, isActive: true },
    select: { id: true, nama: true, key: true, jenis: true },
    orderBy: [{ jenis: "asc" }, { nama: "asc" }],
  })

  return rows
}

export async function createKasKategori(input: unknown) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)
  let userId: string
  try {
    const required = requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])
    userId = required.userId
  } catch {
    return { error: "Tidak memiliki hak akses untuk menambah kategori kas." }
  }

  const parsed = kasKategoriSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const key = normalizeKasCategoryKey(parsed.data.nama)
  const existing = await prisma.kasKategori.findUnique({ where: { companyId_key: { companyId, key } } })
  if (existing) {
    return { error: `Kategori "${existing.nama}" sudah ada (jenis ${existing.jenis}). Kategori masuk dan keluar tidak boleh sama.` }
  }

  const row = await prisma.kasKategori.create({
    data: {
      companyId,
      nama: parsed.data.nama.trim(),
      key,
      jenis: parsed.data.jenis,
      isActive: true,
    },
    select: { id: true, nama: true, key: true, jenis: true },
  })

  revalidatePath("/kas")
  await writeAuditLog({
    actorId: userId,
    entityType: "KAS_KATEGORI",
    entityId: row.id,
    action: "CREATE",
    afterData: { key: row.key, nama: row.nama, jenis: row.jenis },
  })
  return { success: true, data: row }
}

export async function updateKasKategori(id: string, input: unknown) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)
  let userId: string
  try {
    const required = requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])
    userId = required.userId
  } catch {
    return { error: "Tidak memiliki hak akses untuk mengubah kategori kas." }
  }

  const parsed = kasKategoriSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const existing = await prisma.kasKategori.findUnique({ where: { id } })
  if (!existing) return { error: "Kategori tidak ditemukan." }
  if (existing.companyId !== companyId) return { error: "Forbidden" }

  const newKey = normalizeKasCategoryKey(parsed.data.nama)
  
  if (newKey !== existing.key) {
    const collision = await prisma.kasKategori.findFirst({
      where: { companyId, key: newKey, id: { not: id } }
    })
    if (collision) {
      return { error: `Kategori dengan nama "${parsed.data.nama}" sudah ada.` }
    }
  }

  const row = await prisma.$transaction(async (tx) => {
    // Keep denormalized display key in sync for existing transactions.
    if (newKey !== existing.key) {
      await tx.kasTransaksi.updateMany({
        where: { companyId, kategoriId: existing.id },
        data: { kategoriKey: newKey },
      })
    }

    return await tx.kasKategori.update({
      where: { id },
      data: {
        nama: parsed.data.nama.trim(),
        key: newKey,
        jenis: parsed.data.jenis,
      },
    })
  })

  revalidatePath("/kas")
  await writeAuditLog({
    actorId: userId,
    entityType: "KAS_KATEGORI",
    entityId: row.id,
    action: "UPDATE",
    beforeData: { key: existing.key, nama: existing.nama, jenis: existing.jenis },
    afterData: { key: row.key, nama: row.nama, jenis: row.jenis },
  })
  return { success: true, data: row }
}

export async function deleteKasKategori(id: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)
  let userId: string
  try {
    const required = requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])
    userId = required.userId
  } catch {
    return { error: "Tidak memiliki hak akses untuk menghapus kategori kas." }
  }

  const existing = await prisma.kasKategori.findUnique({
    where: { id },
  })
  if (!existing) return { error: "Kategori tidak ditemukan." }
  if (existing.companyId !== companyId) return { error: "Forbidden" }

  const transaksiCount = await prisma.kasTransaksi.count({
    where: { companyId, kategoriId: existing.id },
  })

  if (transaksiCount > 0) {
    // Soft delete if there are transactions
    await prisma.kasKategori.update({
      where: { id },
      data: { isActive: false },
    })
  } else {
    // Hard delete if no transactions
    await prisma.kasKategori.delete({ where: { id } })
  }

  revalidatePath("/kas")
  await writeAuditLog({
    actorId: userId,
    entityType: "KAS_KATEGORI",
    entityId: id,
    action: "DELETE",
    beforeData: { key: existing.key, nama: existing.nama, jenis: existing.jenis },
  })
  return { success: true }
}

export async function getKasHarian(tanggal?: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  const tgl = tanggal ? new Date(tanggal) : new Date()
  const startOfDay = new Date(tgl.getFullYear(), tgl.getMonth(), tgl.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 86400000)

  const [transaksi, saldoAwal] = await Promise.all([
    prisma.kasTransaksi.findMany({
      where: { companyId, tanggal: { gte: startOfDay, lt: endOfDay } },
      orderBy: { tanggal: "desc" },
      include: { inputOleh: { select: { name: true } } },
      take: 500,
    }),
    prisma.kasTransaksi.aggregate({
      where: { companyId, tanggal: { lt: startOfDay } },
      _sum: {
        jumlah: true,
      },
    }),
  ])

  const totalMasuk = transaksi.filter((t) => t.jenis === "MASUK").reduce((a, b) => a + Number(b.jumlah ?? 0), 0)
  const totalKeluar = transaksi.filter((t) => t.jenis === "KELUAR").reduce((a, b) => a + Number(b.jumlah ?? 0), 0)
  const pendingApprovalCount = transaksi.filter((t) => t.isApproved === false).length

  return serializeData({
    transaksi,
    totalMasuk,
    totalKeluar,
    pendingApprovalCount,
    saldoAwal: Number(saldoAwal?._sum?.jumlah ?? 0),
  })
}

type ArusKasGroupBy = "WEEK" | "MONTH"

function startOfISOWeek(date: Date) {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7 // monday=0
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - day)
  return d
}

function formatMonthKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

function formatWeekKey(date: Date) {
  const start = startOfISOWeek(date)
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000)
  const fmt = (d: Date) =>
    d.toLocaleDateString("id-ID", { day: "numeric", month: "short" })
  return `${fmt(start)}–${fmt(end)}`
}

export async function getArusKasReport(params?: {
  from?: string
  to?: string
  groupBy?: ArusKasGroupBy
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  const groupBy: ArusKasGroupBy = params?.groupBy ?? "MONTH"

  const today = new Date()
  const to = params?.to ? new Date(params.to) : today
  const from = params?.from
    ? new Date(params.from)
    : new Date(new Date(to).setMonth(to.getMonth() - 6))

  // Normalize bounds
  const fromDate = new Date(from)
  fromDate.setHours(0, 0, 0, 0)
  const toDate = new Date(to)
  toDate.setHours(23, 59, 59, 999)

  const rows = await prisma.kasTransaksi.findMany({
    where: {
      companyId,
      isApproved: true,
      tanggal: { gte: fromDate, lte: toDate },
    },
    select: {
      tanggal: true,
      jenis: true,
      jumlah: true,
    },
    orderBy: { tanggal: "asc" },
    take: 50_000,
  })

  const map = new Map<
    string,
    { key: string; masuk: number; keluar: number; surplus: number }
  >()

  for (const r of rows) {
    const key = groupBy === "WEEK" ? formatWeekKey(r.tanggal) : formatMonthKey(r.tanggal)
    const prev = map.get(key) ?? { key, masuk: 0, keluar: 0, surplus: 0 }
    const amount = Number(r.jumlah ?? 0)
    if (r.jenis === "MASUK") prev.masuk += amount
    else prev.keluar += amount
    prev.surplus = prev.masuk - prev.keluar
    map.set(key, prev)
  }

  const data = Array.from(map.values())
  const totalMasuk = data.reduce((a, b) => a + b.masuk, 0)
  const totalKeluar = data.reduce((a, b) => a + b.keluar, 0)
  const totalSurplus = totalMasuk - totalKeluar

  return {
    from: fromDate,
    to: toDate,
    groupBy,
    data,
    totals: { masuk: totalMasuk, keluar: totalKeluar, surplus: totalSurplus },
  }
}

export async function inputKas(input: unknown) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)
  let userId: string
  let isPrivileged = false
  try {
    const required = requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN, RoleType.TELLER])
    userId = required.userId
    isPrivileged = hasAnyRole(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])
  } catch {
    return { error: "Tidak memiliki hak akses untuk input transaksi kas." }
  }

  const parsed = kasSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { tanggal, jumlah, buktiUrl, kategori, ...rest } = parsed.data

  const ensured = await ensureKasKategori({ jenis: rest.jenis, kategori })
  if ("error" in ensured) return { error: ensured.error }

  const tanggalTransaksi = tanggal ? parseDateOnly(tanggal) : new Date()
  if (!tanggalTransaksi) return { error: "Tanggal transaksi tidak valid." }
  if (rest.jenis === "KELUAR") {
    await ensureAccountingAccounts(companyId)
    const saldoKas = await getCashBalanceByJenis(companyId, rest.kasJenis, tanggalTransaksi)
    if (saldoKas < jumlah) {
      return {
        error: `Saldo ${rest.kasJenis === "BANK" ? "Kas Bank" : "Kas Tunai"} tidak cukup. Tersedia Rp ${saldoKas.toLocaleString("id-ID")}, perlu Rp ${jumlah.toLocaleString("id-ID")}.`,
      }
    }
  }
  await ensureAccountingAccounts(companyId)

  let kas: { id: string; isApproved: boolean; jenis: "MASUK" | "KELUAR"; kategoriKey: string; jumlah: Prisma.Decimal }
  try {
    kas = await prisma.$transaction(async (tx) => {
      const row = await tx.kasTransaksi.create({
        data: {
          ...rest,
          companyId,
          kategoriId: ensured.kategoriId,
          kategoriKey: ensured.key,
          jumlah: new Prisma.Decimal(jumlah),
          tanggal: tanggalTransaksi,
          inputOlehId: userId,
          buktiUrl: buktiUrl?.trim() || null,
          isApproved: isPrivileged ? true : false,
        },
      })

      if (!isPrivileged) {
        await tx.approvalLog.create({
          data: {
            entityType: ApprovalEntityType.KAS,
            entityId: row.id,
            status: ApprovalStatus.PENDING,
            requestedById: userId,
            catatan: "Menunggu persetujuan transaksi kas.",
          },
        })
      } else {
        // Accounts are already ensured before entering transaction.
        await postKasTransactionJournal(tx, row.id, userId, { ensureAccounts: false })
      }

      return row
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { error: "Gagal menyimpan kas. Silakan ulangi beberapa saat lagi." }
    }
    throw error
  }

  revalidatePath("/kas")
  revalidatePath("/laporan/laba-rugi")
  revalidatePath("/laporan/neraca")
  revalidatePath("/laporan/buku-besar")
  await writeAuditLog({
    actorId: userId,
    entityType: "KAS_TRANSAKSI",
    entityId: kas.id,
    action: "CASH",
    afterData: { jenis: kas.jenis, kategoriKey: kas.kategoriKey, jumlah: kas.jumlah.toString() },
  })
  return { success: true, data: { id: kas.id, isApproved: kas.isApproved } }
}

export async function updateKas(id: string, input: unknown) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)
  let userId: string
  try {
    const required = requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])
    userId = required.userId
  } catch {
    return { error: "Tidak memiliki hak akses." }
  }

  const parsed = kasSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { tanggal, jumlah, buktiUrl, kategori, ...rest } = parsed.data

  const ensured = await ensureKasKategori({ jenis: rest.jenis, kategori })
  if ("error" in ensured) return { error: ensured.error }

  const existing = await prisma.kasTransaksi.findUnique({ where: { id } })
  if (!existing) return { error: "Data tidak ditemukan." }
  if (existing.companyId !== companyId) return { error: "Forbidden" }

  if (existing.isApproved === false) {
    return { error: "Transaksi kas ini masih menunggu persetujuan. Selesaikan approval sebelum edit." }
  }

  const tanggalTransaksi = tanggal ? parseDateOnly(tanggal) : new Date()
  if (!tanggalTransaksi) return { error: "Tanggal transaksi tidak valid." }
  if (rest.jenis === "KELUAR") {
    await ensureAccountingAccounts(companyId)
    const saldoKas = await getCashBalanceByJenis(companyId, rest.kasJenis, tanggalTransaksi)
    const existingEffect =
      existing.isApproved && existing.jenis === "KELUAR" && existing.kasJenis === rest.kasJenis
        ? Number(existing.jumlah)
        : 0
    if (saldoKas + existingEffect < jumlah) {
      return {
        error: `Saldo ${rest.kasJenis === "BANK" ? "Kas Bank" : "Kas Tunai"} tidak cukup untuk perubahan transaksi ini.`,
      }
    }
  }

  const kas = await prisma.$transaction(async (tx) => {
    const row = await tx.kasTransaksi.update({
      where: { id },
      data: {
        ...rest,
        kategoriId: ensured.kategoriId,
        kategoriKey: ensured.key,
        jumlah: new Prisma.Decimal(jumlah),
        tanggal: tanggalTransaksi,
        ...(buktiUrl !== undefined ? { buktiUrl: buktiUrl?.trim() || null } : {}),
      },
    })

    await tx.journalEntry.deleteMany({
      where: {
        sourceType: "KAS",
        sourceId: id,
      },
    })
    await postKasTransactionJournal(tx, row.id, userId, { ensureAccounts: false })

    return row
  })

  revalidatePath("/kas")
  revalidatePath("/laporan/laba-rugi")
  revalidatePath("/laporan/neraca")
  revalidatePath("/laporan/buku-besar")
  await writeAuditLog({
    actorId: userId,
    entityType: "KAS_TRANSAKSI",
    entityId: kas.id,
    action: "UPDATE",
    afterData: { jenis: kas.jenis, kategoriKey: kas.kategoriKey, jumlah: kas.jumlah.toString() },
  })
  return { success: true }
}

export async function deleteKas(id: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)
  let userId: string
  try {
    const required = requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])
    userId = required.userId
  } catch {
    return { error: "Tidak memiliki hak akses." }
  }

  const existing = await prisma.kasTransaksi.findUnique({ where: { id } })
  if (!existing) return { error: "Data tidak ditemukan." }
  if (existing.companyId !== companyId) return { error: "Forbidden" }

  if (existing.isApproved === false) {
    return { error: "Transaksi kas ini masih menunggu persetujuan. Selesaikan approval sebelum hapus." }
  }

  await prisma.$transaction(async (tx) => {
    await tx.journalEntry.deleteMany({
      where: {
        sourceType: "KAS",
        sourceId: id,
      },
    })
    await tx.kasTransaksi.delete({ where: { id } })
  })

  revalidatePath("/kas")
  revalidatePath("/laporan/laba-rugi")
  revalidatePath("/laporan/neraca")
  revalidatePath("/laporan/buku-besar")
  await writeAuditLog({
    actorId: userId,
    entityType: "KAS_TRANSAKSI",
    entityId: id,
    action: "DELETE",
    afterData: { jenis: existing.jenis, jumlah: existing.jumlah.toString() },
  })
  return { success: true }
}

export async function getKasPendingApprovals(params?: { limit?: number }) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  try {
    requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])
  } catch {
    return { error: "Tidak memiliki hak akses untuk melihat approval kas." as const }
  }

  const limit = Math.min(Math.max(params?.limit ?? 50, 1), 200)

  const rows = await prisma.kasTransaksi.findMany({
    where: { companyId, isApproved: false },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { inputOleh: { select: { id: true, name: true } } },
  })

  return serializeData({ success: true as const, data: rows })
}

export async function approveKasTransaksi(input: { id: string; action: "APPROVE" | "REJECT"; catatan?: string }) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  let userId: string
  try {
    const required = requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])
    userId = required.userId
  } catch {
    return { error: "Tidak memiliki hak akses untuk memproses approval kas." }
  }

  const row = await prisma.kasTransaksi.findUnique({ where: { id: input.id } })
  if (!row) return { error: "Transaksi kas tidak ditemukan." }
  if (row.companyId !== companyId) return { error: "Forbidden" }
  if (row.isApproved && input.action === "APPROVE") return { error: "Transaksi kas sudah disetujui." }

  const pending = await prisma.approvalLog.findFirst({
    where: {
      entityType: ApprovalEntityType.KAS,
      entityId: input.id,
      status: ApprovalStatus.PENDING,
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, catatan: true },
  })

  const status = input.action === "APPROVE" ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED
  const catatan = input.catatan?.trim()

  if (input.action === "APPROVE" && row.jenis === "KELUAR") {
    await ensureAccountingAccounts(companyId)
    const saldoKas = await getCashBalanceByJenis(companyId, row.kasJenis === "BANK" ? "BANK" : "TUNAI", row.tanggal)
    const jumlah = Number(row.jumlah)
    if (saldoKas < jumlah) {
      return {
        error: `Saldo ${row.kasJenis === "BANK" ? "Kas Bank" : "Kas Tunai"} tidak cukup untuk approve transaksi ini.`,
      }
    }
  }

  await ensureAccountingAccounts(companyId)
  await prisma.$transaction(async (tx) => {
    if (input.action === "APPROVE") {
      await tx.kasTransaksi.update({
        where: { id: input.id },
        data: { isApproved: true },
      })
      await postKasTransactionJournal(tx, input.id, userId, { ensureAccounts: false })
    }

    if (pending) {
      await tx.approvalLog.update({
        where: { id: pending.id },
        data: {
          status,
          approvedById: userId,
          catatan: catatan
            ? `${pending.catatan ?? ""}\n${input.action === "APPROVE" ? "Approve" : "Reject"}: ${catatan}`.trim()
            : pending.catatan,
        },
      })
    } else {
      await tx.approvalLog.create({
        data: {
          entityType: ApprovalEntityType.KAS,
          entityId: input.id,
          status,
          requestedById: userId,
          approvedById: userId,
          catatan: catatan ?? (input.action === "APPROVE" ? "Disetujui." : "Ditolak."),
        },
      })
    }
  })

  revalidatePath("/kas")
  revalidatePath("/laporan/laba-rugi")
  revalidatePath("/laporan/neraca")
  revalidatePath("/laporan/buku-besar")

  await writeAuditLog({
    actorId: userId,
    entityType: "KAS_TRANSAKSI",
    entityId: input.id,
    action: input.action === "APPROVE" ? "APPROVE" : "REJECT",
    metadata: { catatan: catatan ?? null },
  })

  return { success: true }
}

export async function getKasBulanan(bulan: number, tahun: number) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  const startDate = new Date(tahun, bulan - 1, 1)
  const endDate = new Date(tahun, bulan, 0, 23, 59, 59)

  const data = await prisma.kasTransaksi.groupBy({
    by: ["jenis"],
    where: { companyId, tanggal: { gte: startDate, lte: endDate } },
    _sum: { jumlah: true },
    _count: { id: true },
  })

  return data.map(d => ({
    ...d,
    _sum: {
      jumlah: Number(d._sum?.jumlah ?? 0)
    }
  }))
}

export async function getLabaRugiSummary(params?: ReportPeriodInput) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  const period = resolveReportPeriod(params)

  const rows = await prisma.journalLine.findMany({
    where: {
      account: { type: { in: ["REVENUE", "EXPENSE"] } },
      journalEntry: { companyId, status: "POSTED", entryDate: { gte: period.startDate, lt: period.endDate } },
    },
    include: { account: true },
  })

  const grouped = new Map<string, { label: string; type: "REVENUE" | "EXPENSE"; jumlah: number }>()
  for (const row of rows) {
    const key = row.account.code
    const current = grouped.get(key) ?? {
      label: row.account.name,
      type: row.account.type as "REVENUE" | "EXPENSE",
      jumlah: 0,
    }
    current.jumlah +=
      row.account.type === "REVENUE"
        ? Number(row.credit) - Number(row.debit)
        : Number(row.debit) - Number(row.credit)
    grouped.set(key, current)
  }

  const pendapatan = Array.from(grouped.values())
    .filter((r) => r.type === "REVENUE" && Math.abs(r.jumlah) > 0.009)
    .map(({ label, jumlah }) => ({ label, jumlah }))

  const beban = Array.from(grouped.values())
    .filter((r) => r.type === "EXPENSE" && Math.abs(r.jumlah) > 0.009)
    .map(({ label, jumlah }) => ({ label, jumlah }))

  const totalPendapatan = pendapatan.reduce((sum, p) => sum + p.jumlah, 0)
  const totalBeban = beban.reduce((sum, b) => sum + b.jumlah, 0)
  const laba = totalPendapatan - totalBeban

  return {
    month: period.month,
    year: period.year,
    period,
    pendapatan,
    beban,
    totalPendapatan,
    totalBeban,
    laba,
    source: "JOURNAL",
  }
}

type TransaksiPerUserFilter = {
  month?: string
  year?: string
  userId?: string
}

export async function getTransaksiPerUserReport(params?: TransaksiPerUserFilter) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  const now = new Date()
  const month = Number(params?.month ?? now.getMonth() + 1)
  const year = Number(params?.year ?? now.getFullYear())

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 1)

  const users = await prisma.user.findMany({
    where: {
      companyId,
      isActive: true,
      ...(params?.userId ? { id: params.userId } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      roles: { select: { role: true } },
    },
    orderBy: { name: "asc" },
  })

  const [kasRows, bayarRows] = await Promise.all([
    prisma.kasTransaksi.groupBy({
      by: ["inputOlehId", "jenis"],
      where: {
        companyId,
        tanggal: { gte: startDate, lt: endDate },
      },
      _sum: { jumlah: true },
      _count: { id: true },
    }),
    prisma.pembayaran.groupBy({
      by: ["inputOlehId"],
      where: {
        companyId,
        isBatalkan: false,
        tanggalBayar: { gte: startDate, lt: endDate },
      },
      _sum: { totalBayar: true },
      _count: { id: true },
    }),
  ])

  const kasMap = new Map<string, { masuk: number; keluar: number; totalKas: number }>()
  for (const row of kasRows) {
    const item = kasMap.get(row.inputOlehId) ?? { masuk: 0, keluar: 0, totalKas: 0 }
    if (row.jenis === "MASUK") item.masuk += Number(row._sum.jumlah ?? 0)
    if (row.jenis === "KELUAR") item.keluar += Number(row._sum.jumlah ?? 0)
    item.totalKas += row._count.id
    kasMap.set(row.inputOlehId, item)
  }

  const bayarMap = new Map<string, { totalPembayaran: number; jumlahPembayaran: number }>()
  for (const row of bayarRows) {
    bayarMap.set(row.inputOlehId, {
      totalPembayaran: Number(row._sum.totalBayar ?? 0),
      jumlahPembayaran: row._count.id,
    })
  }

  const data = users.map((u) => {
    const kas = kasMap.get(u.id) ?? { masuk: 0, keluar: 0, totalKas: 0 }
    const bayar = bayarMap.get(u.id) ?? { totalPembayaran: 0, jumlahPembayaran: 0 }

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      roles: u.roles.map((r) => r.role),
      kasMasuk: kas.masuk,
      kasKeluar: kas.keluar,
      totalKasTransaksi: kas.totalKas,
      totalPembayaran: bayar.totalPembayaran,
      jumlahPembayaran: bayar.jumlahPembayaran,
      totalNominalAktivitas: kas.masuk + kas.keluar + bayar.totalPembayaran,
    }
  })

  const summary = data.reduce(
    (acc, row) => {
      acc.kasMasuk += row.kasMasuk
      acc.kasKeluar += row.kasKeluar
      acc.totalPembayaran += row.totalPembayaran
      acc.totalKasTransaksi += row.totalKasTransaksi
      acc.jumlahPembayaran += row.jumlahPembayaran
      return acc
    },
    {
      kasMasuk: 0,
      kasKeluar: 0,
      totalPembayaran: 0,
      totalKasTransaksi: 0,
      jumlahPembayaran: 0,
    }
  )

  return {
    month,
    year,
    data,
    summary,
    filterOptions: users.map((u) => ({ id: u.id, name: u.name })),
  }
}
