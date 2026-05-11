"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireCompanyId } from "@/lib/tenant"
import { requireRoles } from "@/lib/roles"
import { RoleType, Prisma } from "@prisma/client"
import { serializeData } from "@/lib/utils"
import { simpananSchema, transaksiSimpananSchema, type SimpananInput, type TransaksiSimpananInput } from "@/lib/validations/simpanan"

// ========================
// CRUD SIMPANAN
// ========================

export async function getSimpananList(params: {
  page?: number
  search?: string
  status?: string
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as any)

  const page = params.page ?? 1
  const limit = 20

  const where: Prisma.SimpananWhereInput = {
    AND: [
      { companyId },
      params.status ? { status: params.status as "AKTIF" | "TUTUP" } : {},
      params.search
        ? {
            OR: [
              { namaPenyimpan: { contains: params.search, mode: "insensitive" } },
              { nomorRekening: { contains: params.search, mode: "insensitive" } },
              { nik: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {},
    ],
  }

  const [data, total] = await Promise.all([
    prisma.simpanan.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            penggunaan: { where: { statusKembali: "TERPAKAI" } },
          },
        },
      },
    }),
    prisma.simpanan.count({ where }),
  ])

  return serializeData({ data, total, page, totalPages: Math.ceil(total / limit) })
}

export async function getSimpananById(id: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as any)

  const result = await prisma.simpanan.findFirst({
    where: { id, companyId },
    include: {
      createdBy: { select: { name: true } },
      penggunaan: {
        where: { statusKembali: "TERPAKAI" },
        include: {
          pinjaman: {
            select: {
              nomorKontrak: true,
              pokokPinjaman: true,
              sisaPinjaman: true,
              status: true,
            },
          },
        },
        orderBy: { tanggalPakai: "desc" },
      },
      transaksi: {
        take: 10,
        orderBy: { tanggal: "desc" },
        include: {
          inputOleh: { select: { name: true } },
        },
      },
      _count: {
        select: {
          penggunaan: true,
          transaksi: true,
          bagiHasil: true,
        },
      },
    },
  })

  return serializeData(result)
}

export async function createSimpanan(input: SimpananInput) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as any)

  let userId: string
  try {
    const required = requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])
    userId = required.userId
  } catch {
    return { error: "Tidak memiliki hak akses untuk membuat simpanan." }
  }

  const parsed = simpananSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { namaPenyimpan, nik, noHp, alamat, saldoAwal, persenBagiHasil, periodeBagiHasil } = parsed.data

  // Cek NIK duplikat jika diisi
  if (nik) {
    const existing = await prisma.simpanan.findUnique({
      where: { companyId_nik: { companyId, nik } },
    })
    if (existing) {
      return { error: "NIK sudah terdaftar di simpanan lain." }
    }
  }

  // Generate nomor rekening: SMP-YYYYMMDD-XXX
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "")
  const count = await prisma.simpanan.count({
    where: {
      companyId,
      nomorRekening: { startsWith: `SMP-${dateStr}` },
    },
  })
  const nomorRekening = `SMP-${dateStr}-${String(count + 1).padStart(3, "0")}`

  const simpanan = await prisma.simpanan.create({
    data: {
      companyId,
      nomorRekening,
      namaPenyimpan,
      nik,
      noHp,
      alamat,
      saldoAwal: new Prisma.Decimal(saldoAwal),
      saldoTersedia: new Prisma.Decimal(saldoAwal),
      saldoTerpakai: new Prisma.Decimal(0),
      persenBagiHasil: new Prisma.Decimal(persenBagiHasil),
      periodeBagiHasil,
      status: "AKTIF",
      createdById: userId,
    },
  })

  revalidatePath("/simpanan")
  return { success: true, data: serializeData(simpanan) }
}

export async function updateSimpanan(id: string, input: Partial<SimpananInput>) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as any)

  try {
    requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])
  } catch {
    return { error: "Tidak memiliki hak akses untuk mengubah simpanan." }
  }

  const simpanan = await prisma.simpanan.findFirst({
    where: { id, companyId },
  })
  if (!simpanan) return { error: "Simpanan tidak ditemukan." }

  const updateData: Prisma.SimpananUpdateInput = {}

  if (input.namaPenyimpan) updateData.namaPenyimpan = input.namaPenyimpan
  if (input.noHp) updateData.noHp = input.noHp
  if (input.alamat !== undefined) updateData.alamat = input.alamat
  if (input.persenBagiHasil !== undefined) {
    updateData.persenBagiHasil = new Prisma.Decimal(input.persenBagiHasil)
  }
  if (input.periodeBagiHasil) updateData.periodeBagiHasil = input.periodeBagiHasil

  const updated = await prisma.simpanan.update({
    where: { id },
    data: updateData,
  })

  revalidatePath("/simpanan")
  revalidatePath(`/simpanan/${id}`)
  return { success: true, data: serializeData(updated) }
}

export async function closeSimpanan(id: string, alasan?: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as any)

  try {
    requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])
  } catch {
    return { error: "Tidak memiliki hak akses untuk menutup simpanan." }
  }

  const simpanan = await prisma.simpanan.findFirst({
    where: { id, companyId },
  })
  if (!simpanan) return { error: "Simpanan tidak ditemukan." }
  if (simpanan.status === "TUTUP") return { error: "Simpanan sudah ditutup." }

  const saldoTerpakai = Number(simpanan.saldoTerpakai)
  if (saldoTerpakai > 0) {
    return {
      error: `Tidak bisa tutup simpanan. Masih ada Rp ${saldoTerpakai.toLocaleString("id-ID")} yang digunakan untuk pinjaman aktif.`,
    }
  }

  const updated = await prisma.simpanan.update({
    where: { id },
    data: {
      status: "TUTUP",
      tanggalTutup: new Date(),
      catatanPenutupan: alasan,
    },
  })

  revalidatePath("/simpanan")
  revalidatePath(`/simpanan/${id}`)
  return { success: true, data: serializeData(updated) }
}

// ========================
// TRANSAKSI SIMPANAN
// ========================

export async function createTransaksiSimpanan(input: TransaksiSimpananInput) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as any)

  let userId: string
  try {
    const required = requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])
    userId = required.userId
  } catch {
    return { error: "Tidak memiliki hak akses untuk transaksi simpanan." }
  }

  const parsed = transaksiSimpananSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { simpananId, jenis, jumlah, keterangan } = parsed.data

  const simpanan = await prisma.simpanan.findFirst({
    where: { id: simpananId, companyId, status: "AKTIF" },
  })
  if (!simpanan) return { error: "Simpanan tidak ditemukan atau sudah ditutup." }

  // Validasi tarik
  if (jenis === "TARIK") {
    const saldoTersedia = Number(simpanan.saldoTersedia)
    if (saldoTersedia < jumlah) {
      return {
        error: `Saldo tersedia tidak cukup. Tersedia: Rp ${saldoTersedia.toLocaleString("id-ID")}, diminta: Rp ${jumlah.toLocaleString("id-ID")}`,
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    // Buat transaksi
    await tx.transaksiSimpanan.create({
      data: {
        companyId,
        simpananId,
        jenis,
        jumlah: new Prisma.Decimal(jumlah),
        keterangan,
        inputOlehId: userId,
      },
    })

    // Update saldo
    if (jenis === "SETOR") {
      await tx.simpanan.update({
        where: { id: simpananId },
        data: {
          saldoTersedia: { increment: jumlah },
        },
      })
    } else {
      await tx.simpanan.update({
        where: { id: simpananId },
        data: {
          saldoTersedia: { decrement: jumlah },
        },
      })
    }
  })

  revalidatePath("/simpanan")
  revalidatePath(`/simpanan/${simpananId}`)
  return { success: true }
}

// ========================
// UTILITY
// ========================

export async function getSimpananAvailable() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as any)

  const data = await prisma.simpanan.findMany({
    where: {
      companyId,
      status: "AKTIF",
      saldoTersedia: { gt: 0 },
    },
    select: {
      id: true,
      nomorRekening: true,
      namaPenyimpan: true,
      saldoTersedia: true,
    },
    orderBy: { namaPenyimpan: "asc" },
  })

  return serializeData(data)
}

// ========================
// BAGI HASIL
// ========================

export async function hitungBagiHasil(simpananId: string, periode: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as any)

  try {
    requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])
  } catch {
    return { error: "Tidak memiliki hak akses untuk hitung bagi hasil." }
  }

  const simpanan = await prisma.simpanan.findFirst({
    where: { id: simpananId, companyId, status: "AKTIF" },
  })
  if (!simpanan) return { error: "Simpanan tidak ditemukan atau sudah ditutup." }

  // Cek apakah sudah ada bagi hasil untuk periode ini
  const existing = await prisma.bagiHasilSimpanan.findUnique({
    where: { simpananId_periode: { simpananId, periode } },
  })
  if (existing) return { error: `Bagi hasil periode ${periode} sudah dihitung.` }

  // Hitung bagi hasil berdasar saldo awal
  const saldoAwal = Number(simpanan.saldoAwal)
  const persenBagiHasil = Number(simpanan.persenBagiHasil)
  const jumlahBagiHasil = (saldoAwal * persenBagiHasil) / 100

  const bagiHasil = await prisma.bagiHasilSimpanan.create({
    data: {
      companyId,
      simpananId,
      periode,
      jumlahBagiHasil: new Prisma.Decimal(jumlahBagiHasil),
      statusBayar: "BELUM_BAYAR",
    },
  })

  revalidatePath("/simpanan")
  revalidatePath(`/simpanan/${simpananId}`)
  revalidatePath("/simpanan/bagi-hasil")
  return { success: true, data: serializeData(bagiHasil) }
}

export async function bayarBagiHasil(bagiHasilId: string, catatanBayar?: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as any)

  let userId: string
  try {
    const required = requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])
    userId = required.userId
  } catch {
    return { error: "Tidak memiliki hak akses untuk bayar bagi hasil." }
  }

  const bagiHasil = await prisma.bagiHasilSimpanan.findFirst({
    where: { id: bagiHasilId, companyId },
    include: { simpanan: true },
  })
  if (!bagiHasil) return { error: "Bagi hasil tidak ditemukan." }
  if (bagiHasil.statusBayar === "SUDAH_BAYAR") return { error: "Bagi hasil sudah dibayar." }

  const jumlahBagiHasil = Number(bagiHasil.jumlahBagiHasil)

  await prisma.$transaction(async (tx) => {
    // Update status bagi hasil
    await tx.bagiHasilSimpanan.update({
      where: { id: bagiHasilId },
      data: {
        statusBayar: "SUDAH_BAYAR",
        tanggalBayar: new Date(),
        catatanBayar,
      },
    })

    // Catat di kas keluar
    const kategori = await tx.kasKategori.findFirst({
      where: { companyId, key: "BAGI_HASIL_SIMPANAN" },
    })

    if (!kategori) {
      // Buat kategori baru jika belum ada
      await tx.kasKategori.create({
        data: {
          companyId,
          key: "BAGI_HASIL_SIMPANAN",
          nama: "Bagi Hasil Simpanan",
          jenis: "KELUAR",
          accountId: null,
        },
      })
    }

    const kategoriId = kategori?.id || (await tx.kasKategori.findFirst({
      where: { companyId, key: "BAGI_HASIL_SIMPANAN" },
      select: { id: true },
    }))!.id

    await tx.kasTransaksi.create({
      data: {
        companyId,
        jenis: "KELUAR",
        kategoriId,
        kategoriKey: "BAGI_HASIL_SIMPANAN",
        deskripsi: `Bagi hasil simpanan ${bagiHasil.simpanan.nomorRekening} periode ${bagiHasil.periode}`,
        jumlah: new Prisma.Decimal(jumlahBagiHasil),
        kasJenis: "TUNAI",
        inputOlehId: userId,
        tanggal: new Date(),
        referensiId: bagiHasilId,
      },
    })
  })

  revalidatePath("/simpanan")
  revalidatePath(`/simpanan/${bagiHasil.simpananId}`)
  revalidatePath("/simpanan/bagi-hasil")
  return { success: true }
}

export async function getBagiHasilList(params: {
  page?: number
  status?: string
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as any)

  const page = params.page ?? 1
  const limit = 20
  const status = params.status === "BELUM_BAYAR" || params.status === "SUDAH_BAYAR" ? params.status : undefined

  const where: Prisma.BagiHasilSimpananWhereInput = {
    AND: [
      { companyId },
      status ? { statusBayar: status } : {},
    ],
  }

  const [data, total] = await Promise.all([
    prisma.bagiHasilSimpanan.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { periode: "desc" },
      include: {
        simpanan: {
          select: {
            nomorRekening: true,
            namaPenyimpan: true,
          },
        },
      },
    }),
    prisma.bagiHasilSimpanan.count({ where }),
  ])

  return serializeData({ data, total, page, totalPages: Math.ceil(total / limit) })
}
