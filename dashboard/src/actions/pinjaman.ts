"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireCompanyId } from "@/lib/tenant"
import { serializeData } from "@/lib/utils"
import { Prisma } from "@prisma/client"

export async function getPinjamanList(params: {
  page?: number
  search?: string
  status?: string
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as any)

  const page = params.page ?? 1
  const limit = 20

  const where: Prisma.PinjamanWhereInput = {
    AND: [
      { companyId },
      params.status ? { status: params.status as "AKTIF" | "LUNAS" } : {},
      params.search
        ? {
            OR: [
              { nomorKontrak: { contains: params.search, mode: "insensitive" } },
              { pengajuan: { nasabah: { namaLengkap: { contains: params.search, mode: "insensitive" } } } },
            ],
          }
        : {},
    ],
  }

  const [data, total] = await Promise.all([
    prisma.pinjaman.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { tanggalCair: "desc" },
      include: {
        pengajuan: {
          include: {
            nasabah: {
              select: {
                namaLengkap: true,
                nomorAnggota: true,
                noHp: true,
              },
            },
            kelompok: {
              select: {
                nama: true,
              },
            },
          },
        },
        simpanan: {
          select: {
            nomorRekening: true,
            namaPenyimpan: true,
          },
        },
        _count: {
          select: {
            pembayaran: { where: { isBatalkan: false } },
            jadwalAngsuran: true,
          },
        },
      },
    }),
    prisma.pinjaman.count({ where }),
  ])

  return serializeData({ data, total, page, totalPages: Math.ceil(total / limit) })
}

export async function getPinjamanById(id: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as any)

  const pinjaman = await prisma.pinjaman.findFirst({
    where: { id, companyId },
    include: {
      pengajuan: {
        include: {
          nasabah: {
            include: {
              kelompok: true,
              kolektor: {
                select: {
                  name: true,
                },
              },
            },
          },
          kelompok: true,
          surveyor: {
            select: {
              name: true,
            },
          },
          approver: {
            select: {
              name: true,
            },
          },
        },
      },
      simpanan: {
        select: {
          id: true,
          nomorRekening: true,
          namaPenyimpan: true,
          noHp: true,
          saldoTersedia: true,
          saldoTerpakai: true,
        },
      },
      penggunaanSimpanan: {
        where: {
          statusKembali: "TERPAKAI",
        },
      },
      jadwalAngsuran: {
        orderBy: { angsuranKe: "asc" },
      },
      pembayaran: {
        where: { isBatalkan: false },
        orderBy: { tanggalBayar: "desc" },
        include: {
          inputOleh: {
            select: {
              name: true,
            },
          },
        },
      },
      bonusKolektor: true,
      _count: {
        select: {
          pembayaran: { where: { isBatalkan: false } },
          jadwalAngsuran: { where: { sudahDibayar: true } },
        },
      },
    },
  })

  return serializeData(pinjaman)
}
