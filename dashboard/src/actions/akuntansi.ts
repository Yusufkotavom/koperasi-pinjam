"use server"

import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireRoles } from "@/lib/roles"
import { Prisma, RoleType, RekonsiliasiStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { writeAuditLog } from "@/lib/audit"
import { ensureAccountingAccounts } from "@/lib/accounting"
import { resolveReportPeriod, type ReportPeriodInput } from "@/lib/report-period"
import { serializeData } from "@/lib/utils"
import { requireCompanyId } from "@/lib/tenant"

async function ensureDefaultAccounts(companyId: string) {
  await ensureAccountingAccounts(companyId)
}

type SessionLike = { user?: { id?: string; roles?: string[] } } | null

function requireFinanceRoles(session: SessionLike) {
  return requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN, RoleType.AKUNTANSI])
}

export async function getAccountList() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  requireFinanceRoles(session as unknown as SessionLike)
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  await ensureDefaultAccounts(companyId)

  const result = await prisma.account.findMany({
    where: { companyId, isActive: true },
    orderBy: [{ type: "asc" }, { code: "asc" }],
  })

  return serializeData(result)
}

const accountCreateSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(60)
    .transform((v) => v.trim().toUpperCase().replace(/\s+/g, "_")),
  name: z.string().min(3).max(120).transform((v) => v.trim()),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
})

export async function createAccount(input: unknown) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { userId } = requireRoles(session as unknown as SessionLike, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN, RoleType.AKUNTANSI])
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  const parsed = accountCreateSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const existing = await prisma.account.findUnique({ where: { companyId_code: { companyId, code: parsed.data.code } } })
  if (existing) return { error: `Kode akun "${existing.code}" sudah ada.` }

  const row = await prisma.account.create({
    data: {
      companyId,
      code: parsed.data.code,
      name: parsed.data.name,
      type: parsed.data.type,
      isActive: true,
    },
  })

  revalidatePath("/akuntansi/akun")
  await writeAuditLog({
    actorId: userId,
    entityType: "ACCOUNT",
    entityId: row.id,
    action: "CREATE",
    afterData: { code: row.code, name: row.name, type: row.type },
  })

  return { success: true, data: row }
}

export async function getKasKategoriMappingList() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  requireFinanceRoles(session as unknown as SessionLike)
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  await ensureDefaultAccounts(companyId)

  const [accounts, kategori] = await Promise.all([
    prisma.account.findMany({ where: { companyId, isActive: true }, orderBy: [{ type: "asc" }, { code: "asc" }] }),
    prisma.kasKategori.findMany({
      where: { companyId, isActive: true },
      include: { account: true },
      orderBy: [{ jenis: "asc" }, { nama: "asc" }],
    }),
  ])

  return { accounts, kategori }
}

const mappingSchema = z.object({
  kategoriId: z.string().min(3),
  accountId: z.string().min(3).nullable(),
})

export async function updateKasKategoriMapping(input: unknown) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { userId } = requireRoles(session as unknown as SessionLike, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN, RoleType.AKUNTANSI])
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  const parsed = mappingSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const existing = await prisma.kasKategori.findFirst({ where: { id: parsed.data.kategoriId, companyId } })
  if (!existing) return { error: "Kategori kas tidak ditemukan." }

  if (parsed.data.accountId) {
    const acc = await prisma.account.findFirst({ where: { id: parsed.data.accountId, companyId } })
    if (!acc) return { error: "Akun tidak ditemukan." }
  }

  const updated = await prisma.kasKategori.update({
    where: { id: parsed.data.kategoriId },
    data: {
      accountId: parsed.data.accountId,
    },
    include: { account: true },
  })

  revalidatePath("/akuntansi/mapping-kategori")
  revalidatePath("/laporan/laba-rugi")
  await writeAuditLog({
    actorId: userId,
    entityType: "KAS_KATEGORI",
    entityId: updated.id,
    action: "UPDATE",
    afterData: { key: updated.key, accountId: updated.accountId },
  })

  return { success: true, data: updated }
}

async function getCashSaldoBookByJenis(companyId: string, kasJenis: "TUNAI" | "BANK", endExclusive: Date) {
  const result = await prisma.kasTransaksi.groupBy({
    by: ["jenis"],
    where: { companyId, tanggal: { lt: endExclusive }, kasJenis, isApproved: true },
    _sum: { jumlah: true },
  })

  const masuk = result.find((r) => r.jenis === "MASUK")?._sum.jumlah || 0
  const keluar = result.find((r) => r.jenis === "KELUAR")?._sum.jumlah || 0

  return Number(masuk) - Number(keluar)
}

const rekonsiliasiCreateSchema = z.object({
  accountId: z.string().min(3),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  saldoStatement: z.coerce.number(),
  catatan: z.string().optional(),
  buktiUrl: z.string().min(3).optional(),
})

export async function getRekonsiliasiKasList(params?: { year?: string }) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  requireFinanceRoles(session as unknown as SessionLike)
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  const year = params?.year ? Number(params.year) : undefined

  const rows = await prisma.rekonsiliasiKas.findMany({
    where: year ? { companyId, periodYear: year } : { companyId },
    include: { account: true, createdBy: { select: { id: true, name: true } } },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }, { createdAt: "desc" }],
  })

  const cashAccounts = await prisma.account.findMany({
    where: { companyId, code: { in: ["CASH_TUNAI", "CASH_BANK"] }, isActive: true },
    orderBy: { code: "asc" },
  })

  return serializeData({ rows, cashAccounts })
}

export async function createRekonsiliasiKas(input: unknown) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { userId } = requireFinanceRoles(session as unknown as SessionLike)
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  const parsed = rekonsiliasiCreateSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const account = await prisma.account.findFirst({ where: { id: parsed.data.accountId, companyId } })
  if (!account) return { error: "Akun tidak ditemukan." }
  if (account.code !== "CASH_TUNAI" && account.code !== "CASH_BANK") {
    return { error: "Rekonsiliasi saat ini hanya untuk akun kas tunai dan kas bank." }
  }

  const endExclusive = new Date(parsed.data.year, parsed.data.month, 1)
  const kasJenis = account.code === "CASH_BANK" ? "BANK" : "TUNAI"
  const saldoBook = await getCashSaldoBookByJenis(companyId, kasJenis, endExclusive)
  const selisih = parsed.data.saldoStatement - saldoBook

  const row = await prisma.rekonsiliasiKas.upsert({
    where: {
      accountId_periodMonth_periodYear: {
        accountId: account.id,
        periodMonth: parsed.data.month,
        periodYear: parsed.data.year,
      },
    },
    create: {
      companyId,
      accountId: account.id,
      periodMonth: parsed.data.month,
      periodYear: parsed.data.year,
      saldoStatement: new Prisma.Decimal(parsed.data.saldoStatement),
      saldoBook: new Prisma.Decimal(saldoBook),
      selisih: new Prisma.Decimal(selisih),
      catatan: parsed.data.catatan?.trim() || null,
      buktiUrl: parsed.data.buktiUrl?.trim() || null,
      status: RekonsiliasiStatus.DRAFT,
      createdById: userId,
    },
    update: {
      saldoStatement: new Prisma.Decimal(parsed.data.saldoStatement),
      saldoBook: new Prisma.Decimal(saldoBook),
      selisih: new Prisma.Decimal(selisih),
      catatan: parsed.data.catatan?.trim() || null,
      buktiUrl: parsed.data.buktiUrl?.trim() || null,
      updatedAt: new Date(),
    },
    include: { account: true },
  })

  revalidatePath("/laporan/rekonsiliasi")
  await writeAuditLog({
    actorId: userId,
    entityType: "REKONSILIASI_KAS",
    entityId: row.id,
    action: "CREATE",
    afterData: {
      accountCode: row.account.code,
      periodMonth: row.periodMonth,
      periodYear: row.periodYear,
      saldoStatement: row.saldoStatement.toString(),
      saldoBook: row.saldoBook.toString(),
      selisih: row.selisih.toString(),
    },
  })

  return serializeData({ success: true, data: row })
}

export async function setRekonsiliasiStatus(input: { id: string; status: "DRAFT" | "SELESAI" }) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { userId } = requireFinanceRoles(session as unknown as SessionLike)

  const row = await prisma.rekonsiliasiKas.findUnique({ where: { id: input.id }, include: { account: true } })
  if (!row) return { error: "Data rekonsiliasi tidak ditemukan." }

  const updated = await prisma.rekonsiliasiKas.update({
    where: { id: row.id },
    data: { status: input.status },
  })

  revalidatePath("/laporan/rekonsiliasi")
  await writeAuditLog({
    actorId: userId,
    entityType: "REKONSILIASI_KAS",
    entityId: row.id,
    action: "UPDATE",
    afterData: { status: updated.status, accountCode: row.account.code },
  })
  return { success: true }
}

function signedBalance(type: string, debit: number, credit: number) {
  return type === "ASSET" || type === "EXPENSE" ? debit - credit : credit - debit
}

function accountGroupLabel(type: string) {
  if (type === "ASSET") return "aset"
  if (type === "LIABILITY") return "kewajiban"
  if (type === "EQUITY") return "ekuitas"
  if (type === "REVENUE") return "pendapatan"
  return "beban"
}

export async function getLedgerKasReport(params?: { kasJenis?: string; accountId?: string; accountCode?: string } & ReportPeriodInput) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  requireFinanceRoles(session as unknown as SessionLike)

  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)
  await ensureDefaultAccounts(companyId)

  const fallbackAccountCode = params?.kasJenis === "BANK" ? "CASH_BANK" : "CASH_TUNAI"
  const requestedAccountCode = params?.accountCode?.trim() || fallbackAccountCode
  const period = resolveReportPeriod(params)

  const accounts = await prisma.account.findMany({
    where: { companyId, isActive: true },
    orderBy: [{ type: "asc" }, { code: "asc" }],
  })
  const selectedAccount =
    (params?.accountId ? accounts.find((account) => account.id === params.accountId) : null) ??
    accounts.find((account) => account.code === requestedAccountCode) ??
    accounts.find((account) => account.code === "CASH_TUNAI") ??
    accounts[0]

  if (!selectedAccount) {
    return serializeData({
      account: null,
      accounts,
      kasJenis: params?.kasJenis === "BANK" ? "BANK" : "TUNAI",
      period,
      month: period.month,
      year: period.year,
      openingBalance: 0,
      data: [],
      closingBalance: 0,
    })
  }

  const [openingLines, rows] = await Promise.all([
    prisma.journalLine.findMany({
      where: {
        accountId: selectedAccount.id,
        journalEntry: { companyId, status: "POSTED", entryDate: { lt: period.startDate } },
      },
      select: { debit: true, credit: true },
    }),
    prisma.journalLine.findMany({
      where: {
        accountId: selectedAccount.id,
        journalEntry: { companyId, status: "POSTED", entryDate: { gte: period.startDate, lt: period.endDate } },
      },
      orderBy: [{ journalEntry: { entryDate: "asc" } }, { createdAt: "asc" }],
      include: {
        journalEntry: { select: { id: true, entryDate: true, description: true, sourceType: true, sourceId: true, postedBy: { select: { name: true } } } },
      },
    }),
  ])

  let saldo = openingLines.reduce(
    (sum, line) => sum + signedBalance(selectedAccount.type, Number(line.debit), Number(line.credit)),
    0,
  )
  const openingBalance = saldo
  const data = rows.map((r) => {
    const debit = Number(r.debit)
    const kredit = Number(r.credit)
    saldo += signedBalance(selectedAccount.type, debit, kredit)
    return {
      id: r.id,
      tanggal: r.journalEntry.entryDate,
      kategori: r.journalEntry.sourceType,
      deskripsi: r.memo || r.journalEntry.description,
      buktiUrl: null,
      debit,
      kredit,
      saldo,
      inputOleh: r.journalEntry.postedBy?.name ?? "-",
      journalEntryId: r.journalEntry.id,
      sourceId: r.journalEntry.sourceId,
    }
  })

  return serializeData({
    account: selectedAccount,
    accounts,
    kasJenis: selectedAccount.code === "CASH_BANK" ? "BANK" : "TUNAI",
    period,
    month: period.month,
    year: period.year,
    openingBalance,
    data,
    closingBalance: saldo,
  })
}

export async function getNeracaSederhana(params?: ReportPeriodInput) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  requireFinanceRoles(session as unknown as SessionLike)

  const period = resolveReportPeriod(params)

  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)
  await ensureDefaultAccounts(companyId)

  const rows = await prisma.journalLine.findMany({
    where: {
      journalEntry: { companyId, status: "POSTED", entryDate: { lt: period.endDate } },
    },
    include: { account: true },
  })

  const map = new Map<string, { code: string; label: string; type: string; nilai: number }>()
  for (const row of rows) {
    const current = map.get(row.account.code) ?? {
      code: row.account.code,
      label: row.account.name,
      type: row.account.type,
      nilai: 0,
    }
    current.nilai += signedBalance(row.account.type, Number(row.debit), Number(row.credit))
    map.set(row.account.code, current)
  }

  const byType = Array.from(map.values()).filter((row) => Math.abs(row.nilai) > 0.009)
  const sortByCode = <T extends { code: string }>(items: T[]) => items.sort((a, b) => a.code.localeCompare(b.code))
  const aset = sortByCode(byType.filter((row) => row.type === "ASSET")).map(({ code, label, nilai }) => ({ code, label, nilai }))
  const kewajiban = sortByCode(byType.filter((row) => row.type === "LIABILITY")).map(({ code, label, nilai }) => ({ code, label, nilai }))
  const modal = sortByCode(byType.filter((row) => row.type === "EQUITY")).map(({ code, label, nilai }) => ({ code, label, nilai }))
  const pendapatan = byType.filter((row) => row.type === "REVENUE").reduce((sum, row) => sum + row.nilai, 0)
  const beban = byType.filter((row) => row.type === "EXPENSE").reduce((sum, row) => sum + row.nilai, 0)
  const shuBerjalan = pendapatan - beban
  const ekuitas = [...modal, { code: "SHU_BERJALAN", label: "SHU Berjalan", nilai: shuBerjalan }].filter((row) => Math.abs(row.nilai) > 0.009)

  const totalKas = byType
    .filter((row) => row.type === "ASSET" && row.label.toLowerCase().includes("kas"))
    .reduce((sum, row) => sum + row.nilai, 0)
  const totalAset = aset.reduce((sum, row) => sum + row.nilai, 0)
  const totalKewajiban = kewajiban.reduce((sum, row) => sum + row.nilai, 0)
  const totalEkuitas = ekuitas.reduce((sum, row) => sum + row.nilai, 0)
  const totalKewajibanEkuitas = totalKewajiban + totalEkuitas
  const selisih = totalAset - totalKewajibanEkuitas

  return serializeData({
    month: period.month,
    year: period.year,
    period,
    aset,
    kewajiban,
    ekuitas,
    kelompok: byType.map((row) => ({ ...row, group: accountGroupLabel(row.type) })),
    totals: {
      totalKas,
      totalAset,
      totalKewajiban,
      totalEkuitas,
      totalKewajibanEkuitas,
      selisih,
      isBalanced: Math.abs(selisih) < 0.01,
    },
  })
}
