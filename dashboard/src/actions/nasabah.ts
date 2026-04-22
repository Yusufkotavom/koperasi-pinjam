"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { nasabahSchema, type NasabahInput } from "@/lib/validations/nasabah"
import { computeRanking } from "@/lib/ranking"
import { getRankingConfig } from "@/actions/settings"
import { serializeData } from "@/lib/utils"
import { Prisma, RoleType } from "@prisma/client"
import { requireRoles } from "@/lib/roles"
import { requireCompanyId } from "@/lib/tenant"

type NasabahActionError = Partial<Record<keyof NasabahInput | "nomorAnggota", string[]>>
type CreateNasabahResult =
  | { success: true; data: Awaited<ReturnType<typeof prisma.nasabah.create>> }
  | { error: NasabahActionError }
type UpdateNasabahResult = { success: true } | { error: NasabahActionError }

function parseJadwalTags(catatan?: string | null) {
  return catatan?.match(/\[JADWAL:([^\]]+)\]/g) ?? []
}

// Helper: generate nomor anggota otomatis
async function generateNomorAnggota(companyId: string): Promise<string> {
  const count = await prisma.nasabah.count({ where: { companyId } })
  const seq = String(count + 1).padStart(4, "0")
  const year = new Date().getFullYear().toString().slice(2)
  return `N-${year}-${seq}`
}

function getUniqueConstraintFields(error: unknown): string[] {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const target = error.meta?.target
    if (Array.isArray(target)) return target.filter((field): field is string => typeof field === "string")
  }

  return []
}

export async function getNasabahList(params: {
  page?: number
  limit?: number
  search?: string
  status?: string
  kelompokId?: string
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  const now = new Date()
  const rankingConfig = await getRankingConfig()

  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const skip = (page - 1) * limit

  const where = {
    AND: [
      { companyId },
      params.search
        ? {
            OR: [
              { namaLengkap: { contains: params.search, mode: "insensitive" as const } },
              { nik: { contains: params.search } },
              { nomorAnggota: { contains: params.search } },
            ],
          }
        : {},
      params.status ? { status: params.status as "AKTIF" | "NON_AKTIF" | "KELUAR" } : {},
      params.kelompokId ? { kelompokId: params.kelompokId } : {},
    ],
  }

  const [data, total] = await Promise.all([
    prisma.nasabah.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        kelompok: { select: { nama: true } },
        kolektor: { select: { name: true } },
        pengajuan: {
          select: {
            pinjaman: {
              select: {
                id: true,
                status: true,
                nomorKontrak: true,
                sisaPinjaman: true,
                jadwalAngsuran: {
                  select: {
                    id: true,
                    total: true,
                    sudahDibayar: true,
                    tanggalJatuhTempo: true,
                    tanggalBayar: true,
                  },
                },
                pembayaran: {
                  where: { isBatalkan: false },
                  select: {
                    tanggalBayar: true,
                    totalBayar: true,
                    catatan: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.nasabah.count({ where }),
  ])

  const withIndicators = data.map((nasabah) => {
    let totalTagihanArrears = 0
    let totalDibayarArrears = 0
    let telat = 0
    let belumJatuhTempo = 0
    let belumBayar = 0
    let outstanding = 0
    let lastPaymentAt: Date | null = null
    let nextDueAt: Date | null = null
    let overdueCount = 0
    let overdueOldestDueAt: Date | null = null
    let overdueOldestDaysLate = 0
    let overdueMaxDaysLate = 0
    let aktifPinjaman = 0

    const pinjamanList = nasabah.pengajuan
      .map((p) => p.pinjaman)
      .filter((p): p is NonNullable<typeof p> => Boolean(p))

    for (const pinjaman of pinjamanList) {
      outstanding += Number(pinjaman.sisaPinjaman)
      if (pinjaman.status !== "LUNAS") aktifPinjaman += 1

      const pembayaranTagMap = new Map<string, number>()
      for (const p of pinjaman.pembayaran) {
        if (p.tanggalBayar) {
          if (!lastPaymentAt || p.tanggalBayar > lastPaymentAt) lastPaymentAt = p.tanggalBayar
        }
        const tags = parseJadwalTags(p.catatan)
        if (tags.length === 0) continue
        for (const rawTag of tags) {
          const jadwalId = rawTag.replace("[JADWAL:", "").replace("]", "")
          const prev = pembayaranTagMap.get(jadwalId) ?? 0
          pembayaranTagMap.set(jadwalId, prev + Number(p.totalBayar))
        }
      }

      for (const jadwal of pinjaman.jadwalAngsuran) {
        const nominalTagihan = Number(jadwal.total)
        const bayarParsial = pembayaranTagMap.get(jadwal.id) ?? 0
        const bayarEfektif = jadwal.sudahDibayar ? nominalTagihan : Math.min(nominalTagihan, bayarParsial)

        // Hanya hitung tagihan yang SUDAH JATUH TEMPO (atau sudah dibayar) ke tunggakan
        if (jadwal.sudahDibayar || jadwal.tanggalJatuhTempo <= now || bayarEfektif > 0) {
          totalTagihanArrears += nominalTagihan
          totalDibayarArrears += bayarEfektif
        }

        if (jadwal.sudahDibayar || bayarEfektif >= nominalTagihan) {
          if (jadwal.tanggalBayar && jadwal.tanggalBayar > jadwal.tanggalJatuhTempo) telat += 1
          continue
        }

        if (!nextDueAt || jadwal.tanggalJatuhTempo < nextDueAt) nextDueAt = jadwal.tanggalJatuhTempo

        if (jadwal.tanggalJatuhTempo > now) {
          belumJatuhTempo += 1
        } else {
          belumBayar += 1
          telat += 1
          overdueCount += 1
          if (!overdueOldestDueAt || jadwal.tanggalJatuhTempo < overdueOldestDueAt) {
            overdueOldestDueAt = jadwal.tanggalJatuhTempo
          }
          const daysLate = Math.max(
            0,
            Math.floor((now.getTime() - jadwal.tanggalJatuhTempo.getTime()) / (1000 * 60 * 60 * 24)),
          )
          if (daysLate > overdueMaxDaysLate) overdueMaxDaysLate = daysLate
        }
      }
    }

    if (overdueOldestDueAt) {
      overdueOldestDaysLate = Math.max(
        0,
        Math.floor((now.getTime() - overdueOldestDueAt.getTime()) / (1000 * 60 * 60 * 24)),
      )
    }

    const tunggakanNominal = Math.max(0, totalTagihanArrears - totalDibayarArrears)
    const ranking = computeRanking({ telat, tunggakanNominal }, rankingConfig)

    return {
      ...nasabah,
      indikator: {
        ranking,
        telat,
        belumBayar,
        belumJatuhTempo,
        kurangAngsuran: tunggakanNominal, // Mapping for UI compatibility if needed, but semantic is tunggakan
        tunggakanNominal,
        outstanding,
        lastPaymentAt,
        nextDueAt,
        overdueCount,
        overdueOldestDueAt,
        overdueOldestDaysLate,
        overdueMaxDaysLate,
        aktifPinjaman,
      },
    }
  })

  return serializeData({ data: withIndicators, total, page, totalPages: Math.ceil(total / limit) })
}

export async function getNasabahById(id: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)
  const result = await prisma.nasabah.findFirst({
    where: { id, companyId },
    include: {
      kelompok: true,
      kolektor: { select: { id: true, name: true, email: true } },
      pengajuan: {
        orderBy: { tanggalPengajuan: "desc" },
        include: {
          pinjaman: {
            include: {
              jadwalAngsuran: {
                orderBy: { tanggalJatuhTempo: "asc" },
              },
              pembayaran: {
                where: { isBatalkan: false },
                orderBy: { tanggalBayar: "desc" },
                include: { inputOleh: { select: { name: true } } },
              },
            },
          },
        },
      },
      penjamin: true,
    },
  })

  return serializeData(result)
}

export async function createNasabah(input: NasabahInput): Promise<CreateNasabahResult> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  const parsed = nasabahSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { tanggalLahir, kelompokId, kolektorId, dokumenUrls, ...rest } = parsed.data
  const existingNik = await prisma.nasabah.findFirst({
    where: { companyId, nik: parsed.data.nik },
    select: { namaLengkap: true },
  })

  if (existingNik) {
    return {
      error: {
        nik: [`NIK sudah terdaftar atas nama ${existingNik.namaLengkap}.`],
      },
    }
  }

  const nomorAnggota = await generateNomorAnggota(companyId)

  if (kelompokId) {
    const kelompok = await prisma.kelompok.findFirst({ where: { id: kelompokId, companyId }, select: { id: true } })
    if (!kelompok) {
      return { error: { kelompokId: ["Kelompok tidak valid untuk company ini."] } }
    }
  }

  try {
    const nasabah = await prisma.nasabah.create({
      data: {
        companyId,
        ...rest,
        nomorAnggota,
        tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : undefined,
        kelompokId: kelompokId || null,
        kolektorId: kolektorId || null,
        dokumenUrls: dokumenUrls ?? [],
        tanggalGabung: new Date(),
      },
    })

    revalidatePath("/nasabah")
    return { success: true, data: nasabah }
  } catch (error) {
    const fields = getUniqueConstraintFields(error)
    if (fields.includes("nik")) {
      return { error: { nik: ["NIK sudah terdaftar."] } }
    }
    if (fields.includes("nomorAnggota")) {
      return { error: { nomorAnggota: ["Nomor anggota bentrok. Silakan coba simpan lagi."] } }
    }

    throw error
  }
}

export async function updateNasabah(id: string, input: Partial<NasabahInput>): Promise<UpdateNasabahResult> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  const current = await prisma.nasabah.findFirst({ where: { id, companyId }, select: { id: true } })
  if (!current) return { error: { nik: ["Nasabah tidak ditemukan."] } }

  const { tanggalLahir, dokumenUrls, ...rest } = input
  const normalized = { ...rest } as Record<string, unknown>
  if ("kelompokId" in normalized && !normalized.kelompokId) normalized.kelompokId = null
  if ("kolektorId" in normalized && !normalized.kolektorId) normalized.kolektorId = null

  if (typeof normalized.nik === "string") {
    const existingNik = await prisma.nasabah.findFirst({
      where: {
        companyId,
        nik: normalized.nik,
        NOT: { id },
      },
      select: { namaLengkap: true },
    })

    if (existingNik) {
      return {
        error: {
          nik: [`NIK sudah terdaftar atas nama ${existingNik.namaLengkap}.`],
        },
      }
    }
  }

  if (typeof normalized.kelompokId === "string" && normalized.kelompokId) {
    const kelompok = await prisma.kelompok.findFirst({ where: { id: normalized.kelompokId, companyId }, select: { id: true } })
    if (!kelompok) return { error: { kelompokId: ["Kelompok tidak valid untuk company ini."] } }
  }

  try {
    await prisma.nasabah.update({
      where: { id },
      data: {
        ...normalized,
        tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : undefined,
        ...(dokumenUrls ? { dokumenUrls } : {}),
      },
    })
  } catch (error) {
    const fields = getUniqueConstraintFields(error)
    if (fields.includes("nik")) {
      return { error: { nik: ["NIK sudah terdaftar."] } }
    }

    throw error
  }

  revalidatePath("/nasabah")
  revalidatePath(`/nasabah/${id}`)
  return { success: true }
}

export async function ubahStatusNasabah(id: string, status: "AKTIF" | "NON_AKTIF" | "KELUAR") {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  const existing = await prisma.nasabah.findFirst({ where: { id, companyId }, select: { id: true } })
  if (!existing) return { success: false, error: "Nasabah tidak ditemukan." }
  await prisma.nasabah.update({ where: { id }, data: { status } })
  revalidatePath("/nasabah")
  return { success: true }
}

export async function deleteNasabah(id: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  try {
    requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])
  } catch {
    return { success: false, error: "Tidak memiliki hak akses untuk menghapus nasabah." }
  }

  const nasabah = await prisma.nasabah.findUnique({
    where: { id },
    select: {
      id: true,
      namaLengkap: true,
      _count: {
        select: {
          pengajuan: true,
          simpanan: true,
        },
      },
    },
  })

  if (!nasabah) {
    return { success: false, error: "Nasabah tidak ditemukan." }
  }
  // Guard: prevent cross-company delete even if id leaks
  const nasabahCompany = await prisma.nasabah.findFirst({ where: { id, companyId }, select: { id: true } })
  if (!nasabahCompany) return { success: false, error: "Forbidden" }

  if (nasabah._count.pengajuan > 0 || nasabah._count.simpanan > 0) {
    return {
      success: false,
      error: "Nasabah sudah memiliki histori pengajuan/simpanan. Gunakan status Non Aktif agar histori tetap aman.",
    }
  }

  await prisma.nasabah.delete({ where: { id } })

  revalidatePath("/nasabah")
  revalidatePath("/dashboard")
  revalidatePath("/kelompok")
  return { success: true }
}

export async function getKelompokList() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)
  return prisma.kelompok.findMany({ where: { companyId }, orderBy: { nama: "asc" } })
}

export async function getKolektorList() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)
  return prisma.user.findMany({
    where: { companyId, roles: { some: { role: "KOLEKTOR" } }, isActive: true },
    select: { id: true, name: true },
  })
}
