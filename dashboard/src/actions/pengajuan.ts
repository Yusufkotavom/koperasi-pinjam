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
import { ensureAccountingAccounts, getCashBalanceByJenis, postJournalEntry, postPencairanJournal } from "@/lib/accounting"
import { requireCompanyId } from "@/lib/tenant"
import { z } from "zod"

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
      pinjaman: {
        include: {
          jadwalAngsuran: { take: 5, orderBy: { angsuranKe: "asc" } },
          _count: { select: { pembayaran: { where: { isBatalkan: false } } } },
        },
      },
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

const batalkanPencairanSchema = z.object({
  pengajuanId: z.string().min(1),
  alasan: z.string().trim().min(10, "Alasan minimal 10 karakter"),
})

export async function batalkanPencairanPinjaman(input: unknown) {
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
    return { error: "Hanya admin/manager/pimpinan yang dapat membatalkan pencairan." }
  }

  const parsed = batalkanPencairanSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { pengajuanId, alasan } = parsed.data

  const pengajuan = await prisma.pengajuan.findFirst({
    where: { id: pengajuanId, companyId },
    include: {
      pinjaman: {
        include: {
          _count: { select: { pembayaran: { where: { isBatalkan: false } } } },
        },
      },
    },
  })

  if (!pengajuan || !pengajuan.pinjaman) return { error: "Data pencairan pinjaman tidak ditemukan." }
  if (pengajuan.status !== "DICAIRKAN") {
    return { error: "Hanya pengajuan berstatus DICAIRKAN yang bisa dibatalkan." }
  }
  if (pengajuan.pinjaman._count.pembayaran > 0) {
    return { error: "Pencairan tidak dapat dibatalkan karena sudah ada pembayaran angsuran." }
  }

  const pinjaman = pengajuan.pinjaman
  const nilaiCair = Number(pinjaman.nilaiCair)
  const potonganAdmin = Number(pinjaman.potonganAdmin) + Number(pinjaman.potonganProvisi)

  const ensured = await ensureKasKategori({ jenis: "MASUK", kategori: "PEMBATALAN_PENCAIRAN" })
  if ("error" in ensured) return { error: ensured.error }

  try {
    await prisma.$transaction(async (tx) => {
      const existingReversal = await tx.journalEntry.findUnique({
        where: {
          sourceType_sourceId: {
            sourceType: "REVERSAL",
            sourceId: pinjaman.id,
          },
        },
        select: { id: true },
      })
      if (existingReversal) throw new Error("Pencairan sudah dibatalkan sebelumnya.")

      const kasPencairan = await tx.kasTransaksi.findFirst({
        where: {
          companyId,
          referensiId: pinjaman.id,
          jenis: "KELUAR",
          kategoriKey: "PENCAIRAN",
        },
        orderBy: { createdAt: "desc" },
      })
      if (!kasPencairan) throw new Error("Transaksi kas pencairan tidak ditemukan.")

      await tx.kasTransaksi.create({
        data: {
          companyId,
          jenis: "MASUK",
          kategoriId: ensured.kategoriId,
          kategoriKey: ensured.key,
          deskripsi: `Pembatalan pencairan ${pinjaman.nomorKontrak}`,
          jumlah: new Prisma.Decimal(nilaiCair),
          kasJenis: kasPencairan.kasJenis,
          inputOlehId: userId,
          tanggal: new Date(),
          referensiId: pinjaman.id,
        },
      })

      await postJournalEntry(
        tx,
        {
          companyId,
          sourceType: "REVERSAL",
          sourceId: pinjaman.id,
          entryDate: new Date(),
          description: `Pembatalan pencairan ${pinjaman.nomorKontrak}`,
          postedById: userId,
          lines: [
            {
              accountCode: kasPencairan.kasJenis === "BANK" ? "CASH_BANK" : "CASH_TUNAI",
              debit: nilaiCair,
              memo: "Kas masuk pembatalan pencairan",
            },
            { accountCode: "PENDAPATAN_ADMIN", debit: potonganAdmin, memo: "Reversal admin/provisi" },
            { accountCode: "PIUTANG_PINJAMAN", credit: Number(pinjaman.pokokPinjaman), memo: "Reversal piutang pinjaman" },
          ],
        },
        { ensureAccounts: false },
      )

      await tx.jadwalAngsuran.updateMany({
        where: { companyId, pinjamanId: pinjaman.id },
        data: {
          sudahDibayar: true,
          tanggalBayar: new Date(),
        },
      })

      await tx.pinjaman.update({
        where: { id: pinjaman.id },
        data: {
          status: "LUNAS",
          sisaPinjaman: new Prisma.Decimal(0),
        },
      })

      const note = `[PEMBATALAN PENCAIRAN] ${alasan}`
      const previous = pengajuan.catatanApproval?.trim()
      const nextNote = previous ? `${previous}\n${note}` : note

      await tx.pengajuan.update({
        where: { id: pengajuanId },
        data: {
          status: "SELESAI",
          catatanApproval: nextNote,
        },
      })
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membatalkan pencairan."
    return { error: message }
  }

  revalidatePath("/pengajuan")
  revalidatePath(`/pengajuan/${pengajuanId}`)
  revalidatePath("/pencairan")
  revalidatePath("/pembayaran")
  revalidatePath("/monitoring/tunggakan")
  revalidatePath("/kas")
  revalidatePath("/laporan/buku-besar")
  revalidatePath("/laporan/neraca")
  revalidatePath("/laporan/laba-rugi")

  await writeAuditLog({
    actorId: userId,
    entityType: "PINJAMAN",
    entityId: pinjaman.id,
    action: "UPDATE",
    metadata: {
      event: "CANCEL_DISBURSEMENT",
      pengajuanId,
      nomorKontrak: pinjaman.nomorKontrak,
      nilaiCair,
      alasan,
    },
  })

  return { success: true }
}
