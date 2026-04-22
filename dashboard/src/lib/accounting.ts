import { AccountType, JournalSourceType, Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

type DbClient = Prisma.TransactionClient | typeof prisma

export const DEFAULT_ACCOUNTING_ACCOUNTS: Array<{ code: string; name: string; type: AccountType }> = [
  { code: "CASH_TUNAI", name: "Kas Tunai", type: "ASSET" },
  { code: "CASH_BANK", name: "Kas Bank", type: "ASSET" },
  { code: "PIUTANG_PINJAMAN", name: "Piutang Pinjaman", type: "ASSET" },
  { code: "SIMPANAN_ANGGOTA", name: "Simpanan Anggota", type: "LIABILITY" },
  { code: "UTANG_USAHA", name: "Utang Usaha", type: "LIABILITY" },
  { code: "MODAL_ANGGOTA", name: "Modal Anggota", type: "EQUITY" },
  { code: "SHU_DITAHAN", name: "SHU Ditahan", type: "EQUITY" },
  { code: "PENDAPATAN_BUNGA", name: "Pendapatan Bunga Pinjaman", type: "REVENUE" },
  { code: "PENERIMAAN_ANGSURAN", name: "Penerimaan Angsuran", type: "REVENUE" },
  { code: "PENDAPATAN_DENDA", name: "Pendapatan Denda", type: "REVENUE" },
  { code: "PENDAPATAN_ADMIN", name: "Pendapatan Administrasi/Provisi", type: "REVENUE" },
  { code: "PENDAPATAN_LAINNYA", name: "Pendapatan Lainnya", type: "REVENUE" },
  { code: "BEBAN_OPERASIONAL", name: "Beban Operasional", type: "EXPENSE" },
  { code: "BEBAN_GAJI", name: "Beban Gaji", type: "EXPENSE" },
  { code: "BEBAN_LAINNYA", name: "Beban Lainnya", type: "EXPENSE" },
  { code: "PENYESUAIAN", name: "Penyesuaian", type: "EXPENSE" },
]

type JournalLineInput = {
  accountCode: string
  debit?: number
  credit?: number
  memo?: string
}

type JournalInput = {
  companyId: string
  sourceType: JournalSourceType
  sourceId: string
  entryDate: Date
  description: string
  postedById?: string | null
  lines: JournalLineInput[]
}

type JournalOptions = {
  ensureAccounts?: boolean
}

function amount(value: unknown) {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0
}

function cashAccountCode(kasJenis?: string | null) {
  return kasJenis === "BANK" ? "CASH_BANK" : "CASH_TUNAI"
}

function fallbackAccountForKas(jenis: "MASUK" | "KELUAR", kategori: string) {
  const key = kategori.toUpperCase()
  if (jenis === "MASUK") {
    if (key.includes("MODAL")) return "MODAL_ANGGOTA"
    if (key.includes("DENDA")) return "PENDAPATAN_DENDA"
    if (key.includes("ADMIN") || key.includes("PROVISI")) return "PENDAPATAN_ADMIN"
    if (key.includes("SIMPANAN")) return "SIMPANAN_ANGGOTA"
    return "PENDAPATAN_LAINNYA"
  }
  if (key.includes("GAJI")) return "BEBAN_GAJI"
  if (key.includes("OPERASIONAL")) return "BEBAN_OPERASIONAL"
  return "BEBAN_LAINNYA"
}

export async function ensureAccountingAccounts(companyId: string, db: DbClient = prisma) {
  for (const account of DEFAULT_ACCOUNTING_ACCOUNTS) {
    await db.account.upsert({
      where: { companyId_code: { companyId, code: account.code } },
      update: { name: account.name, type: account.type, isActive: true },
      create: {
        ...account,
        companyId,
        isActive: true,
      },
    })
  }
}

export async function getCashBalanceByJenis(companyId: string, kasJenis: "TUNAI" | "BANK", asOf?: Date, db: DbClient = prisma) {
  const accountCode = cashAccountCode(kasJenis)
  const account = await db.account.findUnique({
    where: { companyId_code: { companyId, code: accountCode } },
    select: { id: true, type: true },
  })

  if (!account) return 0

  const lines = await db.journalLine.findMany({
    where: {
      accountId: account.id,
      journalEntry: {
        status: "POSTED",
        ...(asOf ? { entryDate: { lte: asOf } } : {}),
      },
    },
    select: { debit: true, credit: true },
  })

  return lines.reduce((sum, line) => sum + amount(line.debit) - amount(line.credit), 0)
}

export async function postJournalEntry(db: DbClient, input: JournalInput, options: JournalOptions = {}) {
  if (options.ensureAccounts !== false) {
    await ensureAccountingAccounts(input.companyId, db)
  }

  const existing = await db.journalEntry.findUnique({
    where: {
      sourceType_sourceId: {
        sourceType: input.sourceType,
        sourceId: input.sourceId,
      },
    },
    select: { id: true },
  })
  if (existing) return existing

  const normalized = input.lines
    .map((line) => ({
      ...line,
      debit: amount(line.debit),
      credit: amount(line.credit),
    }))
    .filter((line) => line.debit > 0 || line.credit > 0)

  const totalDebit = amount(normalized.reduce((sum, line) => sum + line.debit, 0))
  const totalCredit = amount(normalized.reduce((sum, line) => sum + line.credit, 0))
  if (normalized.length < 2 || Math.abs(totalDebit - totalCredit) > 0.009) {
    throw new Error(`Jurnal tidak balance: debit ${totalDebit}, kredit ${totalCredit}.`)
  }

  const accounts = await db.account.findMany({
    where: { companyId: input.companyId, code: { in: normalized.map((line) => line.accountCode) } },
    select: { id: true, code: true },
  })
  const accountMap = new Map(accounts.map((account) => [account.code, account.id]))
  const missing = normalized.find((line) => !accountMap.has(line.accountCode))
  if (missing) throw new Error(`Akun ${missing.accountCode} tidak ditemukan.`)

  return db.journalEntry.create({
    data: {
      companyId: input.companyId,
      entryDate: input.entryDate,
      description: input.description,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      status: "POSTED",
      postedById: input.postedById ?? null,
      lines: {
        create: normalized.map((line) => ({
          accountId: accountMap.get(line.accountCode)!,
          debit: new Prisma.Decimal(line.debit),
          credit: new Prisma.Decimal(line.credit),
          memo: line.memo ?? null,
        })),
      },
    },
    select: { id: true },
  })
}

export async function postPembayaranJournal(
  db: DbClient,
  input: {
    companyId: string
    pembayaranId: string
    tanggalBayar: Date
    kasJenis: "TUNAI" | "BANK"
    pokok: number
    bunga: number
    denda: number
    totalBayar: number
    description: string
    postedById?: string | null
  },
  options?: JournalOptions,
) {
  return postJournalEntry(db, {
    companyId: input.companyId,
    sourceType: "PEMBAYARAN",
    sourceId: input.pembayaranId,
    entryDate: input.tanggalBayar,
    description: input.description,
    postedById: input.postedById,
    lines: [
      { accountCode: cashAccountCode(input.kasJenis), debit: input.totalBayar, memo: "Kas diterima" },
      { accountCode: "PIUTANG_PINJAMAN", credit: input.pokok, memo: "Pelunasan pokok" },
      { accountCode: "PENDAPATAN_BUNGA", credit: input.bunga, memo: "Bunga pinjaman" },
      { accountCode: "PENDAPATAN_DENDA", credit: input.denda, memo: "Denda keterlambatan" },
    ],
  }, options)
}

export async function postPencairanJournal(
  db: DbClient,
  input: {
    companyId: string
    pinjamanId: string
    tanggalCair: Date
    kasJenis?: "TUNAI" | "BANK"
    pokokPinjaman: number
    nilaiCair: number
    potonganAdmin: number
    potonganProvisi: number
    description: string
    postedById?: string | null
  },
  options?: JournalOptions,
) {
  return postJournalEntry(db, {
    companyId: input.companyId,
    sourceType: "PENCAIRAN",
    sourceId: input.pinjamanId,
    entryDate: input.tanggalCair,
    description: input.description,
    postedById: input.postedById,
    lines: [
      { accountCode: "PIUTANG_PINJAMAN", debit: input.pokokPinjaman, memo: "Pengakuan piutang" },
      { accountCode: cashAccountCode(input.kasJenis), credit: input.nilaiCair, memo: "Kas dicairkan" },
      { accountCode: "PENDAPATAN_ADMIN", credit: input.potonganAdmin + input.potonganProvisi, memo: "Biaya admin/provisi" },
    ],
  }, options)
}

export async function postKasTransactionJournal(
  db: DbClient,
  kasId: string,
  postedById?: string | null,
  options?: JournalOptions,
) {
  const kas = await db.kasTransaksi.findUnique({
    where: { id: kasId },
    include: { kat: { include: { account: true } } },
  })
  if (!kas || !kas.isApproved) return null
  if (kas.referensiId || ["ANGSURAN", "PELUNASAN", "PENCAIRAN", "PEMBATALAN_ANGSURAN"].includes(kas.kategoriKey)) return null

  const mappedAccount = kas.kat.account?.code ?? fallbackAccountForKas(kas.jenis, kas.kategoriKey)
  const jumlah = amount(kas.jumlah)
  const kasAccount = cashAccountCode(kas.kasJenis)

  return postJournalEntry(db, {
    companyId: kas.companyId,
    sourceType: "KAS",
    sourceId: kas.id,
    entryDate: kas.tanggal,
    description: kas.deskripsi,
    postedById: postedById ?? kas.inputOlehId,
    lines:
      kas.jenis === "MASUK"
        ? [
            { accountCode: kasAccount, debit: jumlah },
            { accountCode: mappedAccount, credit: jumlah },
          ]
        : [
            { accountCode: mappedAccount, debit: jumlah },
            { accountCode: kasAccount, credit: jumlah },
          ],
  }, options)
}
