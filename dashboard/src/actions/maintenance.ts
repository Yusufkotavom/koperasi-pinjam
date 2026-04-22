"use server"

import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { Prisma, RoleType } from "@prisma/client"
import { auth } from "@/lib/auth"
import { writeAuditLog } from "@/lib/audit"
import {
  DEFAULT_ACCOUNTING_ACCOUNTS,
  ensureAccountingAccounts,
  postJournalEntry,
  postKasTransactionJournal,
  postPembayaranJournal,
  postPencairanJournal,
} from "@/lib/accounting"
import { prisma } from "@/lib/prisma"
import { requireRoles } from "@/lib/roles"

type CleanupScope = "APPROVAL_AUDIT" | "NOTIFIKASI" | "TRANSAKSI" | "MASTER" | "AKUNTANSI" | "USERS"

const ALL_SCOPES: CleanupScope[] = [
  "APPROVAL_AUDIT",
  "NOTIFIKASI",
  "TRANSAKSI",
  "MASTER",
  "AKUNTANSI",
  "USERS",
]

const DEFAULT_ACCOUNTS = DEFAULT_ACCOUNTING_ACCOUNTS

const DEFAULT_CATEGORIES = [
  { jenis: "MASUK" as const, nama: "ANGSURAN", key: "ANGSURAN", accountCode: "PENDAPATAN_BUNGA" },
  { jenis: "MASUK" as const, nama: "PELUNASAN", key: "PELUNASAN", accountCode: "PIUTANG_PINJAMAN" },
  { jenis: "MASUK" as const, nama: "SIMPANAN", key: "SIMPANAN", accountCode: "SIMPANAN_ANGGOTA" },
  { jenis: "MASUK" as const, nama: "MODAL", key: "MODAL", accountCode: "MODAL_ANGGOTA" },
  { jenis: "MASUK" as const, nama: "ADMIN", key: "ADMIN", accountCode: "PENDAPATAN_ADMIN" },
  { jenis: "MASUK" as const, nama: "DENDA", key: "DENDA", accountCode: "PENDAPATAN_DENDA" },
  { jenis: "KELUAR" as const, nama: "PENCAIRAN", key: "PENCAIRAN", accountCode: "PIUTANG_PINJAMAN" },
  { jenis: "KELUAR" as const, nama: "GAJI", key: "GAJI", accountCode: "BEBAN_GAJI" },
  { jenis: "KELUAR" as const, nama: "OPERASIONAL", key: "OPERASIONAL", accountCode: "BEBAN_OPERASIONAL" },
]

const DEMO_NASABAH_COUNT = 36
const DEMO_LOAN_COUNT = 24

const DEMO_NAMES = [
  "Siti Aminah",
  "Budi Santoso",
  "Rini Lestari",
  "Agus Prasetyo",
  "Dewi Kartika",
  "Wahyu Hidayat",
  "Sri Mulyani",
  "Joko Purnomo",
  "Nur Aisyah",
  "Eko Saputra",
  "Fitri Handayani",
  "Ahmad Fauzi",
  "Lina Marlina",
  "Rudi Hartono",
  "Maya Sari",
  "Dian Permata",
  "Yusuf Maulana",
  "Teguh Riyanto",
  "Ratna Wulandari",
  "Hendra Wijaya",
  "Novi Anggraini",
  "Arif Setiawan",
  "Tari Kusuma",
  "Imam Subekti",
  "Vina Oktaviani",
  "Fajar Nugroho",
  "Nia Ramadhani",
  "Dedi Kurniawan",
  "Murni Astuti",
  "Bayu Pratama",
  "Elsa Maharani",
  "Gilang Ramadhan",
  "Putri Amelia",
  "Yoga Firmansyah",
  "Nanik Sulastri",
  "Farhan Akbar",
]

type SessionLike = { user?: { id?: string; roles?: string[] } } | null
type MaintenanceActionResult = { success: true; message: string } | { success: false; error: string }

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return "Terjadi kesalahan server."
}

function checkedScopes(formData: FormData) {
  if (formData.get("cleanAll") === "on") return ALL_SCOPES
  const scopes = formData
    .getAll("scope")
    .filter((value): value is CleanupScope => ALL_SCOPES.includes(value as CleanupScope))

  if (scopes.includes("USERS")) return ALL_SCOPES
  if (scopes.includes("MASTER") && !scopes.includes("TRANSAKSI")) scopes.push("TRANSAKSI")
  return scopes
}

async function requireAdmin() {
  const session = await auth()
  const { userId } = requireRoles(session as unknown as SessionLike, [RoleType.SUPER_ADMIN, RoleType.OWNER, RoleType.ADMIN])
  return userId
}

async function cleanupScopes(scopes: CleanupScope[]) {
  const selected = new Set(scopes)

  if (selected.has("APPROVAL_AUDIT")) {
    await prisma.auditLog.deleteMany()
    await prisma.approvalLog.deleteMany()
  }
  if (selected.has("NOTIFIKASI")) {
    await prisma.notifikasi.deleteMany()
  }
  if (selected.has("TRANSAKSI")) {
    await prisma.journalEntry.deleteMany()
    await prisma.rekonsiliasiKas.deleteMany()
    await prisma.kolektorTarget.deleteMany()
    await prisma.kasTransaksi.deleteMany()
    await prisma.pembayaran.deleteMany()
    await prisma.jadwalAngsuran.deleteMany()
    await prisma.pinjaman.deleteMany()
    await prisma.pengajuan.deleteMany()
    await prisma.simpanan.deleteMany()
  }
  if (selected.has("MASTER")) {
    await prisma.penjamin.deleteMany()
    await prisma.nasabah.deleteMany()
    await prisma.kelompok.deleteMany()
  }
  if (selected.has("AKUNTANSI")) {
    await prisma.journalEntry.deleteMany()
    await prisma.rekonsiliasiKas.deleteMany()
    if (selected.has("TRANSAKSI")) {
      await prisma.kasKategori.deleteMany()
    } else {
      await prisma.kasKategori.updateMany({ data: { accountId: null } })
    }
    await prisma.account.deleteMany()
    await prisma.appSetting.deleteMany()
  }
  if (selected.has("USERS")) {
    await prisma.userRole.deleteMany()
    await prisma.company.deleteMany()
    await prisma.user.deleteMany()
  }
}

function revalidateOperationalPaths() {
  for (const path of [
    "/",
    "/dashboard",
    "/settings",
    "/nasabah",
    "/kelompok",
    "/pengajuan",
    "/pencairan",
    "/pembayaran",
    "/kas",
    "/kolektor",
    "/monitoring/tunggakan",
    "/monitoring/kolektor",
    "/laporan/arus-kas",
    "/laporan/buku-besar",
    "/laporan/history-pembayaran",
    "/laporan/laba-rugi",
    "/laporan/neraca",
    "/laporan/per-kelompok",
    "/laporan/rekonsiliasi",
    "/laporan/transaksi-per-user",
  ]) {
    revalidatePath(path)
  }
}

async function upsertDemoUser(params: {
  email: string
  name: string
  password: string
  roles: RoleType[]
  companyId?: string
}) {
  const hashedPassword = await bcrypt.hash(params.password, 12)
  const user = await prisma.user.upsert({
    where: { email: params.email },
    update: {
      name: params.name,
      password: hashedPassword,
      companyId: params.companyId,
      isActive: true,
    },
    create: {
      email: params.email,
      name: params.name,
      password: hashedPassword,
      companyId: params.companyId,
      isActive: true,
    },
  })

  await prisma.userRole.deleteMany({ where: { userId: user.id } })
  await prisma.userRole.createMany({
    data: params.roles.map((role) => ({ userId: user.id, role })),
    skipDuplicates: true,
  })

  return user
}

async function ensureDemoCompany(ownerId: string) {
  const company = await prisma.company.upsert({
    where: { slug: "koperasi-demo-sejahtera" },
    update: {
      name: "Koperasi Demo Sejahtera",
      email: "admin@koperasi.id",
      ownerId,
      isActive: true,
    },
    create: {
      name: "Koperasi Demo Sejahtera",
      slug: "koperasi-demo-sejahtera",
      email: "admin@koperasi.id",
      ownerId,
      isActive: true,
    },
  })

  await prisma.user.update({
    where: { id: ownerId },
    data: { companyId: company.id },
  })

  return company
}

async function ensureDemoFoundation() {
  await ensureAccountingAccounts()
  const accounts = new Map<string, string>()

  for (const account of DEFAULT_ACCOUNTS) {
    const row = await prisma.account.upsert({
      where: { code: account.code },
      update: { name: account.name, type: account.type, isActive: true },
      create: account,
    })
    accounts.set(row.code, row.id)
  }

  for (const category of DEFAULT_CATEGORIES) {
    await prisma.kasKategori.upsert({
      where: { key: category.key },
      update: {
        nama: category.nama,
        jenis: category.jenis,
        accountId: accounts.get(category.accountCode) ?? null,
        isActive: true,
      },
      create: {
        nama: category.nama,
        key: category.key,
        jenis: category.jenis,
        accountId: accounts.get(category.accountCode) ?? null,
        isActive: true,
      },
    })
  }

  await prisma.appSetting.upsert({
    where: { key: "company_info" },
    update: {
      value: {
        name: "Koperasi Demo Sejahtera",
        tagline: "Data demo lengkap untuk pelatihan",
        address: "Jl. Merdeka No. 10, Wonosobo",
        phone: "0812-0000-2026",
        timeZone: "Asia/Jakarta",
      },
    },
    create: {
      key: "company_info",
      value: {
        name: "Koperasi Demo Sejahtera",
        tagline: "Data demo lengkap untuk pelatihan",
        address: "Jl. Merdeka No. 10, Wonosobo",
        phone: "0812-0000-2026",
        timeZone: "Asia/Jakarta",
      },
    },
  })
}

function addMonths(date: Date, amount: number) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + amount)
  return next
}

async function createDemoLoan(params: {
  nasabahId: string
  kelompokId?: string
  inputOlehId: string
  index: number
  pokok: number
  tenor: number
  paidInstallments: number
  tenorType: "MINGGUAN" | "BULANAN"
}) {
  const nomorPengajuan = `DEMO-PG-${String(params.index).padStart(3, "0")}`
  const nomorKontrak = `DEMO-KONTRAK-${String(params.index).padStart(3, "0")}`
  const existing = await prisma.pinjaman.findUnique({ where: { nomorKontrak } })
  if (existing) return

  const bungaPerBulan = 0.02
  const angsuranPokok = Math.round(params.pokok / params.tenor)
  const angsuranBunga = Math.round(params.pokok * bungaPerBulan)
  const totalAngsuran = angsuranPokok + angsuranBunga
  const tanggalCair = addMonths(new Date(), -Math.max(1, Math.floor(params.tenor / 2)))

  await prisma.$transaction(async (tx) => {
    const pengajuan = await tx.pengajuan.create({
      data: {
        nomorPengajuan,
        nasabahId: params.nasabahId,
        kelompokId: params.kelompokId,
        jenisPinjaman: params.index % 2 === 0 ? "USAHA" : "MIKRO",
        tenorType: params.tenorType,
        plafonDiajukan: new Prisma.Decimal(params.pokok),
        plafonDisetujui: new Prisma.Decimal(params.pokok),
        tenor: params.tenor,
        bungaPerBulan: new Prisma.Decimal(bungaPerBulan),
        tujuanPinjaman: "Modal usaha demo",
        catatanPengajuan: "Data demo lengkap",
        dokumenPendukungUrls: [],
        catatanApproval: "Disetujui untuk kebutuhan demo",
        status: "DICAIRKAN",
        tanggalApproval: tanggalCair,
        approverId: params.inputOlehId,
      },
    })

    const pinjaman = await tx.pinjaman.create({
      data: {
        nomorKontrak,
        pengajuanId: pengajuan.id,
        pokokPinjaman: new Prisma.Decimal(params.pokok),
        tenorType: params.tenorType,
        tenor: params.tenor,
        bungaPerBulan: new Prisma.Decimal(bungaPerBulan),
        angsuranPokok: new Prisma.Decimal(angsuranPokok),
        angsuranBunga: new Prisma.Decimal(angsuranBunga),
        totalAngsuran: new Prisma.Decimal(totalAngsuran),
        potonganAdmin: new Prisma.Decimal(50_000),
        potonganProvisi: new Prisma.Decimal(25_000),
        nilaiCair: new Prisma.Decimal(params.pokok - 75_000),
        tanggalCair,
        tanggalJatuhTempo: params.tenorType === "MINGGUAN" ? new Date(tanggalCair.getTime() + 7 * 24 * 60 * 60 * 1000) : addMonths(tanggalCair, 1),
        sisaPinjaman: new Prisma.Decimal(Math.max(0, params.pokok - params.paidInstallments * angsuranPokok)),
        status: params.paidInstallments >= params.tenor ? "LUNAS" : params.paidInstallments >= 2 ? "AKTIF" : "MENUNGGAK",
      },
    })

    for (let installment = 1; installment <= params.tenor; installment += 1) {
      const dueDate =
        params.tenorType === "MINGGUAN"
          ? new Date(tanggalCair.getTime() + installment * 7 * 24 * 60 * 60 * 1000)
          : addMonths(tanggalCair, installment)
      const isPaid = installment <= params.paidInstallments
      const jadwal = await tx.jadwalAngsuran.create({
        data: {
          pinjamanId: pinjaman.id,
          angsuranKe: installment,
          tanggalJatuhTempo: dueDate,
          pokok: new Prisma.Decimal(angsuranPokok),
          bunga: new Prisma.Decimal(angsuranBunga),
          total: new Prisma.Decimal(totalAngsuran),
          sudahDibayar: isPaid,
          tanggalBayar: isPaid ? new Date(dueDate.getTime() + (installment % 3) * 24 * 60 * 60 * 1000) : null,
        },
      })

      if (isPaid) {
        const metode = installment % 2 === 0 ? "TRANSFER" : "TUNAI"
        const pembayaran = await tx.pembayaran.create({
          data: {
            pinjamanId: pinjaman.id,
            tanggalBayar: jadwal.tanggalBayar ?? dueDate,
            pokok: new Prisma.Decimal(angsuranPokok),
            bunga: new Prisma.Decimal(angsuranBunga),
            denda: new Prisma.Decimal(installment % 4 === 0 ? 5_000 : 0),
            totalBayar: new Prisma.Decimal(totalAngsuran + (installment % 4 === 0 ? 5_000 : 0)),
            metode,
            catatan: `[JADWAL:${jadwal.id}] mode=FULL Demo pembayaran angsuran ${installment}`,
            inputOlehId: params.inputOlehId,
          },
        })
        await tx.kasTransaksi.create({
          data: {
            tanggal: jadwal.tanggalBayar ?? dueDate,
            jenis: "MASUK",
            kategori: "ANGSURAN",
            deskripsi: `Demo pembayaran ${pembayaran.nomorTransaksi}`,
            jumlah: pembayaran.totalBayar,
            kasJenis: metode === "TRANSFER" ? "BANK" : "TUNAI",
            inputOlehId: params.inputOlehId,
            referensiId: pembayaran.id,
          },
        })
        await postPembayaranJournal(tx, {
          pembayaranId: pembayaran.id,
          tanggalBayar: jadwal.tanggalBayar ?? dueDate,
          kasJenis: metode === "TRANSFER" ? "BANK" : "TUNAI",
          pokok: angsuranPokok,
          bunga: angsuranBunga,
          denda: installment % 4 === 0 ? 5_000 : 0,
          totalBayar: totalAngsuran + (installment % 4 === 0 ? 5_000 : 0),
          description: `Demo pembayaran ${pembayaran.nomorTransaksi}`,
          postedById: params.inputOlehId,
        }, { ensureAccounts: false })
      }
    }

    await tx.kasTransaksi.create({
      data: {
        tanggal: tanggalCair,
        jenis: "KELUAR",
        kategori: "PENCAIRAN",
        deskripsi: `Demo pencairan ${nomorKontrak}`,
        jumlah: new Prisma.Decimal(params.pokok - 75_000),
        kasJenis: params.index % 2 === 0 ? "BANK" : "TUNAI",
        inputOlehId: params.inputOlehId,
        referensiId: pinjaman.id,
      },
    })
    await postPencairanJournal(tx, {
      pinjamanId: pinjaman.id,
      tanggalCair,
      kasJenis: params.index % 2 === 0 ? "BANK" : "TUNAI",
      pokokPinjaman: params.pokok,
      nilaiCair: params.pokok - 75_000,
      potonganAdmin: 50_000,
      potonganProvisi: 25_000,
      description: `Demo pencairan ${nomorKontrak}`,
      postedById: params.inputOlehId,
    }, { ensureAccounts: false })
  }, { timeout: 30_000 })
}

async function createDemoKasTransactions(inputOlehId: string) {
  const baseDate = new Date()
  const rows = [
    ["MASUK", "ADMIN", "Demo pendapatan administrasi formulir", 325_000, "TUNAI", 26],
    ["MASUK", "DENDA", "Demo denda keterlambatan kolektif", 180_000, "TUNAI", 24],
    ["MASUK", "SIMPANAN", "Demo setoran simpanan kelompok Mentari", 1_850_000, "BANK", 23],
    ["KELUAR", "OPERASIONAL", "Demo biaya listrik dan internet kantor", 475_000, "TUNAI", 22],
    ["KELUAR", "GAJI", "Demo honor kolektor", 1_250_000, "BANK", 21],
    ["KELUAR", "OPERASIONAL", "Demo pembelian ATK kantor", 285_000, "TUNAI", 19],
    ["MASUK", "ADMIN", "Demo biaya survei nasabah baru", 450_000, "TUNAI", 18],
    ["KELUAR", "OPERASIONAL", "Demo transport survei lapangan", 360_000, "TUNAI", 17],
    ["MASUK", "SIMPANAN", "Demo setoran simpanan kelompok Sejahtera", 2_150_000, "BANK", 16],
    ["KELUAR", "OPERASIONAL", "Demo konsumsi rapat anggota", 520_000, "TUNAI", 14],
    ["MASUK", "DENDA", "Demo denda angsuran mingguan", 95_000, "TUNAI", 13],
    ["KELUAR", "GAJI", "Demo insentif teller", 750_000, "BANK", 12],
    ["MASUK", "ADMIN", "Demo pendapatan provisi tambahan", 625_000, "BANK", 10],
    ["KELUAR", "OPERASIONAL", "Demo perawatan printer kuitansi", 410_000, "TUNAI", 9],
    ["MASUK", "SIMPANAN", "Demo setoran simpanan sukarela", 1_475_000, "TUNAI", 7],
    ["KELUAR", "OPERASIONAL", "Demo biaya pulsa penagihan", 225_000, "TUNAI", 6],
    ["MASUK", "ADMIN", "Demo administrasi pencairan cepat", 540_000, "BANK", 4],
    ["KELUAR", "OPERASIONAL", "Demo biaya arsip dokumen", 190_000, "TUNAI", 3],
  ] as const

  for (const [jenis, kategori, deskripsi, jumlah, kasJenis, daysAgo] of rows) {
    const existing = await prisma.kasTransaksi.findFirst({ where: { deskripsi } })
    if (existing) continue

    const tanggal = new Date(baseDate)
    tanggal.setDate(tanggal.getDate() - daysAgo)
    const kas = await prisma.kasTransaksi.create({
      data: {
        tanggal,
        jenis,
        kategori,
        deskripsi,
        jumlah: new Prisma.Decimal(jumlah),
        kasJenis,
        inputOlehId,
      },
    })
    await postKasTransactionJournal(prisma, kas.id, inputOlehId)
  }
}

async function ensureDemoOpeningCapital(inputOlehId: string) {
  const existing = await prisma.kasTransaksi.findFirst({
    where: { deskripsi: "Demo setoran modal awal koperasi" },
    select: { id: true },
  })
  if (existing) return

  const kas = await prisma.kasTransaksi.create({
    data: {
      tanggal: addMonths(new Date(), -2),
      jenis: "MASUK",
      kategori: "MODAL",
      deskripsi: "Demo setoran modal awal koperasi",
      jumlah: new Prisma.Decimal(250_000_000),
      kasJenis: "BANK",
      inputOlehId,
      isApproved: true,
    },
  })

  await postKasTransactionJournal(prisma, kas.id, inputOlehId)
}

async function backfillAccountingJournals(postedById: string) {
  await ensureAccountingAccounts()

  const before = await prisma.journalEntry.count()

  const pinjamanRows = await prisma.pinjaman.findMany()
  for (const pinjaman of pinjamanRows) {
    await postPencairanJournal(prisma, {
      pinjamanId: pinjaman.id,
      tanggalCair: pinjaman.tanggalCair,
      kasJenis: "TUNAI",
      pokokPinjaman: Number(pinjaman.pokokPinjaman),
      nilaiCair: Number(pinjaman.nilaiCair),
      potonganAdmin: Number(pinjaman.potonganAdmin),
      potonganProvisi: Number(pinjaman.potonganProvisi),
      description: `Backfill pencairan ${pinjaman.nomorKontrak}`,
      postedById,
    })
  }

  const pembayaranRows = await prisma.pembayaran.findMany({
    where: { isBatalkan: false },
    include: { pinjaman: { select: { nomorKontrak: true } } },
  })
  for (const pembayaran of pembayaranRows) {
    await postPembayaranJournal(prisma, {
      pembayaranId: pembayaran.id,
      tanggalBayar: pembayaran.tanggalBayar,
      kasJenis: pembayaran.metode === "TRANSFER" ? "BANK" : "TUNAI",
      pokok: Number(pembayaran.pokok),
      bunga: Number(pembayaran.bunga),
      denda: Number(pembayaran.denda),
      totalBayar: Number(pembayaran.totalBayar),
      description: `Backfill pembayaran ${pembayaran.nomorTransaksi} ${pembayaran.pinjaman.nomorKontrak}`,
      postedById,
    })
  }

  const kasRows = await prisma.kasTransaksi.findMany({
    where: { isApproved: true, referensiId: null },
    select: { id: true },
  })
  for (const kas of kasRows) {
    await postKasTransactionJournal(prisma, kas.id, postedById)
  }

  const simpananRows = await prisma.simpanan.findMany({ include: { nasabah: { select: { namaLengkap: true } } } })
  for (const simpanan of simpananRows) {
    await postJournalEntry(prisma, {
      sourceType: "SIMPANAN",
      sourceId: simpanan.id,
      entryDate: simpanan.tanggal,
      description: `Backfill simpanan ${simpanan.jenis} ${simpanan.nasabah.namaLengkap}`,
      postedById,
      lines: [
        { accountCode: "CASH_TUNAI", debit: Number(simpanan.jumlah) },
        { accountCode: "SIMPANAN_ANGGOTA", credit: Number(simpanan.jumlah) },
      ],
    })
  }

  const after = await prisma.journalEntry.count()
  return { before, after, created: after - before }
}

async function importDemoData() {
  await ensureDemoFoundation()

  const admin = await upsertDemoUser({
    email: "admin@koperasi.id",
    name: "Administrator",
    password: "admin123",
    roles: [RoleType.OWNER, RoleType.ADMIN],
  })
  const company = await ensureDemoCompany(admin.id)
  await upsertDemoUser({
    email: "manager@koperasi.id",
    name: "Manager Demo",
    password: "manager123",
    roles: [RoleType.MANAGER],
    companyId: company.id,
  })
  await upsertDemoUser({
    email: "teller@koperasi.id",
    name: "Teller Demo",
    password: "teller123",
    roles: [RoleType.TELLER],
    companyId: company.id,
  })
  await upsertDemoUser({
    email: "akuntansi@koperasi.id",
    name: "Akuntansi Demo",
    password: "akuntansi123",
    roles: [RoleType.AKUNTANSI],
    companyId: company.id,
  })
  await ensureDemoOpeningCapital(admin.id)

  const kelompokRows = await Promise.all(
    [
      ["KL-DEMO-01", "Kelompok Mentari", "Pak Suryo", "Wonosobo", "Senin"],
      ["KL-DEMO-02", "Mitra Sejahtera", "Bu Siti", "Kertek", "Selasa"],
      ["KL-DEMO-03", "Guyub Rukun", "Pak Slamet", "Garung", "Rabu"],
    ].map(([kode, nama, ketua, wilayah, jadwalPertemuan]) =>
      prisma.kelompok.upsert({
        where: { kode },
        update: { nama, ketua, wilayah, jadwalPertemuan },
        create: { kode, nama, ketua, wilayah, jadwalPertemuan },
      }),
    ),
  )

  const nasabahRows = []
  for (let index = 1; index <= DEMO_NASABAH_COUNT; index += 1) {
    const kelompok = kelompokRows[(index - 1) % kelompokRows.length]
    const nomorAnggota = `DM-${String(index).padStart(4, "0")}`
    const namaLengkap = DEMO_NAMES[index - 1] ?? `Nasabah Demo ${index}`
    const nasabah = await prisma.nasabah.upsert({
      where: { nomorAnggota },
      update: {
        namaLengkap,
        kelompokId: kelompok.id,
        status: "AKTIF",
      },
      create: {
        nomorAnggota,
        namaLengkap,
        nik: `330700000000${String(index).padStart(4, "0")}`,
        alamat: `Alamat demo ${index}, ${kelompok.wilayah}`,
        noHp: `08120000${String(index).padStart(4, "0")}`,
        pekerjaan: index % 2 === 0 ? "Pedagang" : "Petani",
        namaUsaha: index % 2 === 0 ? "Warung Sembako" : "Usaha Tani",
        kelompokId: kelompok.id,
        status: "AKTIF",
      },
    })
    nasabahRows.push(nasabah)

    const simpananCount = await prisma.simpanan.count({ where: { nasabahId: nasabah.id } })
    if (simpananCount === 0) {
      await prisma.simpanan.createMany({
        data: [
          { nasabahId: nasabah.id, jenis: "POKOK", jumlah: new Prisma.Decimal(100_000) },
          { nasabahId: nasabah.id, jenis: "WAJIB", jumlah: new Prisma.Decimal(50_000 + index * 5_000) },
          { nasabahId: nasabah.id, jenis: "SUKARELA", jumlah: new Prisma.Decimal(index * 25_000) },
        ],
      })
    }
  }

  for (const [index, nasabah] of nasabahRows.slice(0, DEMO_LOAN_COUNT).entries()) {
    const tenor = index % 2 === 0 ? 10 : 12
    const paidInstallments = Math.min(tenor, index % 6 === 0 ? 8 : index % 5 === 0 ? 7 : index % 4 === 0 ? 2 : 5)
    await createDemoLoan({
      nasabahId: nasabah.id,
      kelompokId: nasabah.kelompokId ?? undefined,
      inputOlehId: admin.id,
      index: index + 1,
      pokok: 2_000_000 + index * 350_000,
      tenor,
      paidInstallments,
      tenorType: index % 3 === 0 ? "MINGGUAN" : "BULANAN",
    })
  }

  await createDemoKasTransactions(admin.id)
}

export async function cleanupDatabaseAction(formData: FormData): Promise<MaintenanceActionResult> {
  try {
    const userId = await requireAdmin()
    const confirmation = String(formData.get("confirmation") ?? "").trim().toUpperCase()
    const scopes = checkedScopes(formData)

    if (confirmation !== "BERSIHKAN") {
      return { success: false, error: "Ketik BERSIHKAN untuk menjalankan cleanup database." }
    }
    if (scopes.length === 0) {
      return { success: false, error: "Pilih minimal satu scope cleanup." }
    }

    await writeAuditLog({
      actorId: userId,
      entityType: "MAINTENANCE",
      action: "DELETE",
      metadata: { scopes },
    })
    await cleanupScopes(scopes)
    revalidateOperationalPaths()
    return { success: true, message: "Cleanup database selesai." }
  } catch (error) {
    console.error("[maintenance] cleanup failed", error)
    return { success: false, error: errorMessage(error) }
  }
}

export async function importDemoDataAction(formData: FormData): Promise<MaintenanceActionResult> {
  try {
    const userId = await requireAdmin()
    const confirmation = String(formData.get("confirmation") ?? "").trim().toUpperCase()

    if (confirmation !== "DEMO") {
      return { success: false, error: "Ketik DEMO untuk import data demo." }
    }

    await importDemoData()
    await writeAuditLog({
      actorId: userId,
      entityType: "MAINTENANCE",
      action: "CREATE",
      metadata: { import: "demo-data" },
    })
    revalidateOperationalPaths()
    return { success: true, message: "Import demo data selesai." }
  } catch (error) {
    console.error("[maintenance] import demo failed", error)
    return { success: false, error: errorMessage(error) }
  }
}

export async function backfillAccountingJournalsAction(formData: FormData): Promise<MaintenanceActionResult> {
  try {
    const userId = await requireAdmin()
    const confirmation = String(formData.get("confirmation") ?? "").trim().toUpperCase()

    if (confirmation !== "JURNAL") {
      return { success: false, error: "Ketik JURNAL untuk backfill jurnal akuntansi." }
    }

    const result = await backfillAccountingJournals(userId)
    await writeAuditLog({
      actorId: userId,
      entityType: "MAINTENANCE",
      action: "CREATE",
      metadata: { backfill: "accounting-journals", ...result },
    })
    revalidateOperationalPaths()
    return { success: true, message: `Backfill jurnal selesai. ${result.created} jurnal dibuat.` }
  } catch (error) {
    console.error("[maintenance] backfill journals failed", error)
    return { success: false, error: errorMessage(error) }
  }
}
