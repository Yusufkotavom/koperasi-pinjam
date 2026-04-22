"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { pengajuanSchema, approvalSchema, pencairanSchema } from "@/lib/validations/pengajuan"
import { addMonths, addWeeks } from "date-fns"
import { ApprovalStatus, Prisma, RoleType } from "@prisma/client"
import { requireRoles } from "@/lib/roles"
import { writeApprovalLog, writeAuditLog } from "@/lib/audit"
import { ensureKasKategori } from "./kas"
import { serializeData } from "@/lib/utils"
import { ensureAccountingAccounts, getCashBalanceByJenis, postPencairanJournal } from "@/lib/accounting"
import { requireCompanyId } from "@/lib/tenant"

// ========================
// PENGAJUAN
// ========================

export async function getPengajuanList(params: {
  page?: number
  status?: string
  search?: string
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  const page = params.page ?? 1
  const limit = 20

  const where = {
    AND: [
      { companyId },
      params.status ? { status: params.status as "DRAFT" | "DIAJUKAN" | "DISURVEY" | "DISETUJUI" | "DITOLAK" | "DICAIRKAN" | "SELESAI" } : {},
      params.search ? {
        nasabah: { namaLengkap: { contains: params.search, mode: "insensitive" as const } }
      } : {},
    ],
  }

  const [data, total] = await Promise.all([
    prisma.pengajuan.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { tanggalPengajuan: "desc" },
      include: {
        nasabah: { select: { namaLengkap: true, nomorAnggota: true } },
        kelompok: { select: { nama: true } },
      },
    }),
    prisma.pengajuan.count({ where }),
  ])

  return serializeData({ data, total, page, totalPages: Math.ceil(total / limit) })
}

export async function getPengajuanById(id: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)
  const result = await prisma.pengajuan.findFirst({
    where: { id, companyId },
    include: {
      nasabah: true,
      kelompok: true,
      surveyor: { select: { name: true } },
      approver: { select: { name: true } },
      pinjaman: { include: { jadwalAngsuran: { take: 5, orderBy: { angsuranKe: "asc" } } } },
    },
  })

  return serializeData(result)
}

export async function getNasabahPengajuanOptions() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  return prisma.nasabah.findMany({
    where: { companyId, status: "AKTIF" },
    select: {
      id: true,
      nomorAnggota: true,
      namaLengkap: true,
      kelompokId: true,
      kelompok: { select: { nama: true } },
      kolektor: { select: { name: true } },
    },
    orderBy: { namaLengkap: "asc" },
  })
}

export async function createPengajuan(input: unknown) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const userId = session.user?.id
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  const parsed = pengajuanSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { bungaPerBulan, plafonDiajukan, dokumenPendukungUrls, ...rest } = parsed.data

  const nasabah = await prisma.nasabah.findUnique({
    where: { id: parsed.data.nasabahId },
    select: { id: true, kelompokId: true },
  })
  if (!nasabah) {
    return { error: { nasabahId: ["Nasabah tidak ditemukan."] } }
  }

  const pengajuan = await prisma.pengajuan.create({
    data: {
      companyId,
      ...rest,
      kelompokId: rest.kelompokId || nasabah.kelompokId || null,
      plafonDiajukan: new Prisma.Decimal(plafonDiajukan),
      bungaPerBulan: new Prisma.Decimal(bungaPerBulan / 100),
      dokumenPendukungUrls: dokumenPendukungUrls ?? [],
      status: "DIAJUKAN",
    },
  })

  revalidatePath("/pengajuan")
  await writeAuditLog({
    actorId: userId,
    entityType: "PENGAJUAN",
    entityId: pengajuan.id,
    action: "CREATE",
    afterData: { status: pengajuan.status, nasabahId: pengajuan.nasabahId },
  })
  return { success: true, data: pengajuan }
}

export async function approvePengajuan(input: unknown) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  let userId: string
  try {
    const required = requireRoles(session, [RoleType.MANAGER, RoleType.PIMPINAN, RoleType.ADMIN])
    userId = required.userId
  } catch {
    return { error: "Tidak memiliki hak akses untuk menyetujui pengajuan." }
  }

  const parsed = approvalSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { pengajuanId, aksi, plafonDisetujui, catatanApproval } = parsed.data

  let updated;
  try {
    updated = await prisma.pengajuan.update({
      where: { id: pengajuanId },
      data: {
        status: aksi === "SETUJU" ? "DISETUJUI" : "DITOLAK",
        approverId: userId,
        tanggalApproval: new Date(),
        plafonDisetujui: plafonDisetujui ? new Prisma.Decimal(plafonDisetujui) : undefined,
        catatanApproval: catatanApproval,
      },
    })
  } catch (err) {
    console.error("[approvePengajuan][error]", err)
    return { error: "Terjadi kesalahan database. Silakan coba login ulang (mungkin sesi kadaluarsa setelah reset database)." }
  }

  revalidatePath("/pengajuan")
  revalidatePath(`/pengajuan/${pengajuanId}`)
  await writeApprovalLog({
    entityType: "PENGAJUAN",
    entityId: pengajuanId,
    status: aksi === "SETUJU" ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
    catatan: catatanApproval,
    requestedById: userId,
    approvedById: userId,
  })
  await writeAuditLog({
    actorId: userId,
    entityType: "PENGAJUAN",
    entityId: pengajuanId,
    action: aksi === "SETUJU" ? "APPROVE" : "REJECT",
    afterData: { status: updated.status, plafonDisetujui: updated.plafonDisetujui?.toString() },
  })
  return { success: true }
}

// ========================
// PENCAIRAN
// ========================

export async function cairkanPinjaman(input: unknown) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(
    session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null,
  )
  let userId: string
  try {
    const required = requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])
    userId = required.userId
  } catch {
    return { error: "Tidak memiliki hak akses untuk mencairkan pinjaman." }
  }

  const parsed = pencairanSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { pengajuanId, potonganAdmin, potonganProvisi, tanggalCair, kasJenis } = parsed.data

  const pengajuan = await prisma.pengajuan.findFirst({
    where: { id: pengajuanId, companyId, status: "DISETUJUI" },
  })
  if (!pengajuan) return { error: "Pengajuan tidak ditemukan atau belum disetujui." }

  const plafon = Number(pengajuan.plafonDisetujui ?? pengajuan.plafonDiajukan)
  const bunga = Number(pengajuan.bungaPerBulan)
  const tenor = pengajuan.tenor
  const tenorType = pengajuan.tenorType

  const angsuranPokok = plafon / tenor
  const angsuranBunga = plafon * bunga
  const totalAngsuran = angsuranPokok + angsuranBunga
  const nilaiCair = plafon - potonganAdmin - potonganProvisi

  const tglCair = new Date(tanggalCair)
  const tglCairEndOfDay = new Date(tglCair)
  tglCairEndOfDay.setHours(23, 59, 59, 999)
  const tglJatuhTempo = tenorType === "MINGGUAN" ? addWeeks(tglCair, tenor) : addMonths(tglCair, tenor)
  const nomorKontrak = `KNT-${Date.now().toString(36).toUpperCase()}`

  await ensureAccountingAccounts(companyId)
  const saldoKas = await getCashBalanceByJenis(companyId, kasJenis, tglCairEndOfDay)
  if (saldoKas < nilaiCair) {
    const pendingMasuk = await prisma.kasTransaksi.aggregate({
      where: {
        companyId,
        jenis: "MASUK",
        kasJenis,
        isApproved: false,
      },
      _count: { id: true },
      _sum: { jumlah: true },
    })
    const pendingCount = pendingMasuk._count.id
    const pendingAmount = Number(pendingMasuk._sum.jumlah ?? 0)

    return {
      error: `Saldo ${kasJenis === "BANK" ? "Kas Bank" : "Kas Tunai"} tidak cukup. Tersedia Rp ${saldoKas.toLocaleString("id-ID")}, perlu Rp ${nilaiCair.toLocaleString("id-ID")}.${pendingCount > 0 ? ` Ada ${pendingCount} transaksi kas masuk pending (Rp ${pendingAmount.toLocaleString("id-ID")}) yang belum dihitung ke saldo.` : ""} Setor modal/simpanan dan pastikan approval kas selesai sebelum pencairan.`,
    }
  }

  // Pastikan kategori kas tersedia sebelum transaksi
  const ensured = await ensureKasKategori({ jenis: "KELUAR", kategori: "PENCAIRAN" })
  if ("error" in ensured) return { error: ensured.error }

  // Buat pinjaman + jadwal angsuran dalam 1 transaksi
  const pinjaman = await prisma.$transaction(async (tx) => {
    const pin = await tx.pinjaman.create({
      data: {
        companyId,
        nomorKontrak,
        pengajuanId,
        pokokPinjaman: new Prisma.Decimal(plafon),
        tenorType,
        tenor,
        bungaPerBulan: new Prisma.Decimal(bunga),
        angsuranPokok: new Prisma.Decimal(angsuranPokok),
        angsuranBunga: new Prisma.Decimal(angsuranBunga),
        totalAngsuran: new Prisma.Decimal(totalAngsuran),
        potonganAdmin: new Prisma.Decimal(potonganAdmin),
        potonganProvisi: new Prisma.Decimal(potonganProvisi),
        nilaiCair: new Prisma.Decimal(nilaiCair),
        tanggalCair: tglCair,
        tanggalJatuhTempo: tglJatuhTempo,
        sisaPinjaman: new Prisma.Decimal(plafon),
        status: "AKTIF",
      },
    })

    // Generate jadwal angsuran
    const jadwals = Array.from({ length: tenor }, (_, i) => {
      const tanggalJatuhTempo = tenorType === "MINGGUAN" ? addWeeks(tglCair, i + 1) : addMonths(tglCair, i + 1)
      return {
        companyId,
        pinjamanId: pin.id,
        angsuranKe: i + 1,
        tanggalJatuhTempo,
        pokok: new Prisma.Decimal(angsuranPokok),
        bunga: new Prisma.Decimal(angsuranBunga),
        total: new Prisma.Decimal(totalAngsuran),
      }
    })

    await tx.jadwalAngsuran.createMany({ data: jadwals })

    // Update status pengajuan
    await tx.pengajuan.update({
      where: { id: pengajuanId },
      data: { status: "DICAIRKAN" },
    })

    // Catat di kas keluar
    await tx.kasTransaksi.create({
      data: {
        companyId,
        jenis: "KELUAR",
        kategoriId: ensured.kategoriId,
        kategoriKey: ensured.key,
        deskripsi: `Pencairan pinjaman ${nomorKontrak}`,
        jumlah: new Prisma.Decimal(nilaiCair),
        kasJenis,
        inputOlehId: userId,
        tanggal: tglCair,
        referensiId: pin.id,
      },
    })

    await postPencairanJournal(tx, {
      companyId,
      pinjamanId: pin.id,
      tanggalCair: tglCair,
      kasJenis,
      pokokPinjaman: plafon,
      nilaiCair,
      potonganAdmin,
      potonganProvisi,
      description: `Pencairan pinjaman ${nomorKontrak}`,
      postedById: userId,
    }, { ensureAccounts: false })

    return pin
  })

  revalidatePath("/pengajuan")
  revalidatePath("/pencairan")
  revalidatePath("/kas")
  revalidatePath("/laporan/buku-besar")
  revalidatePath("/laporan/neraca")
  revalidatePath("/laporan/laba-rugi")
  await writeAuditLog({
    actorId: userId,
    entityType: "PINJAMAN",
    entityId: pinjaman.id,
    action: "DISBURSE",
    metadata: { pengajuanId, nomorKontrak: pinjaman.nomorKontrak, nilaiCair },
  })
  return { success: true, data: pinjaman }
}

export async function getPengajuanSiapCair() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)
  const result = await prisma.pengajuan.findMany({
    where: { companyId, status: "DISETUJUI" },
    include: {
      nasabah: { select: { namaLengkap: true, nomorAnggota: true } },
      kelompok: { select: { nama: true } },
    },
    orderBy: { tanggalApproval: "desc" },
  })

  return serializeData(result)
}
