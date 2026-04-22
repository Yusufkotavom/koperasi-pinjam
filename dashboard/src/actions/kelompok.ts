"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { kelompokSchema } from "@/lib/validations/kelompok"
import { requireRoles } from "@/lib/roles"
import { RoleType } from "@prisma/client"

export async function getKelompokList(params?: { search?: string }) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  return prisma.kelompok.findMany({
    where: params?.search
      ? {
          OR: [
            { kode: { contains: params.search, mode: "insensitive" } },
            { nama: { contains: params.search, mode: "insensitive" } },
            { wilayah: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { nama: "asc" },
  })
}

export async function getKelompokById(id: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  return prisma.kelompok.findUnique({
    where: { id },
    include: {
      nasabah: {
        select: {
          id: true,
          namaLengkap: true,
        },
        orderBy: { namaLengkap: "asc" },
      },
    },
  })
}

export async function getNasabahOptionsForKelompok() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  return prisma.nasabah.findMany({
    where: { status: "AKTIF" },
    select: {
      id: true,
      namaLengkap: true,
      kelompokId: true,
    },
    orderBy: { namaLengkap: "asc" },
  })
}

async function resolveKetuaNama(ketuaNasabahId?: string, ketuaManual?: string) {
  if (!ketuaNasabahId) return ketuaManual || null
  const ketuaNasabah = await prisma.nasabah.findUnique({
    where: { id: ketuaNasabahId },
    select: { namaLengkap: true },
  })
  return ketuaNasabah?.namaLengkap ?? ketuaManual ?? null
}

export async function createKelompok(input: unknown) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const parsed = kelompokSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const existing = await prisma.kelompok.findUnique({
    where: { kode: parsed.data.kode },
    select: { id: true },
  })
  if (existing) return { error: { kode: ["Kode kelompok sudah digunakan."] } }

  const anggotaSet = new Set(parsed.data.anggotaIds ?? [])
  if (parsed.data.ketuaNasabahId) anggotaSet.add(parsed.data.ketuaNasabahId)
  const anggotaIds = Array.from(anggotaSet)

  const ketuaNama = await resolveKetuaNama(parsed.data.ketuaNasabahId, parsed.data.ketua)

  const kelompok = await prisma.$transaction(async (tx) => {
    const created = await tx.kelompok.create({
      data: {
        kode: parsed.data.kode,
        nama: parsed.data.nama,
        ketua: ketuaNama,
        wilayah: parsed.data.wilayah,
        jadwalPertemuan: parsed.data.jadwalPertemuan,
      },
    })

    if (anggotaIds.length > 0) {
      await tx.nasabah.updateMany({
        where: { id: { in: anggotaIds } },
        data: { kelompokId: created.id },
      })
    }

    return created
  })

  revalidatePath("/kelompok")
  revalidatePath("/nasabah")
  return { success: true, data: kelompok }
}

export async function updateKelompok(id: string, input: unknown) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const parsed = kelompokSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const existing = await prisma.kelompok.findFirst({
    where: { kode: parsed.data.kode, id: { not: id } },
    select: { id: true },
  })
  if (existing) return { error: { kode: ["Kode kelompok sudah digunakan."] } }

  const anggotaSet = new Set(parsed.data.anggotaIds ?? [])
  if (parsed.data.ketuaNasabahId) anggotaSet.add(parsed.data.ketuaNasabahId)
  const anggotaIds = Array.from(anggotaSet)

  const ketuaNama = await resolveKetuaNama(parsed.data.ketuaNasabahId, parsed.data.ketua)

  await prisma.$transaction(async (tx) => {
    await tx.kelompok.update({
      where: { id },
      data: {
        kode: parsed.data.kode,
        nama: parsed.data.nama,
        ketua: ketuaNama,
        wilayah: parsed.data.wilayah,
        jadwalPertemuan: parsed.data.jadwalPertemuan,
      },
    })

    await tx.nasabah.updateMany({
      where: { kelompokId: id, ...(anggotaIds.length > 0 ? { id: { notIn: anggotaIds } } : {}) },
      data: { kelompokId: null },
    })

    if (anggotaIds.length > 0) {
      await tx.nasabah.updateMany({
        where: { id: { in: anggotaIds } },
        data: { kelompokId: id },
      })
    }
  })

  revalidatePath("/kelompok")
  revalidatePath(`/kelompok/${id}/edit`)
  revalidatePath("/nasabah")
  return { success: true }
}

export async function deleteKelompok(id: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  try {
    requireRoles(session, [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN])
  } catch {
    return { success: false, error: "Tidak memiliki hak akses untuk menghapus kelompok." }
  }

  const kelompok = await prisma.kelompok.findUnique({
    where: { id },
    select: {
      id: true,
      _count: {
        select: {
          nasabah: true,
          pengajuan: true,
        },
      },
    },
  })

  if (!kelompok) {
    return { success: false, error: "Kelompok tidak ditemukan." }
  }

  if (kelompok._count.pengajuan > 0) {
    return {
      success: false,
      error: "Kelompok sudah dipakai di histori pengajuan. Edit atau kosongkan anggota, jangan hapus histori kelompok.",
    }
  }

  await prisma.$transaction(async (tx) => {
    if (kelompok._count.nasabah > 0) {
      await tx.nasabah.updateMany({
        where: { kelompokId: id },
        data: { kelompokId: null },
      })
    }
    await tx.kelompok.delete({ where: { id } })
  })

  revalidatePath("/kelompok")
  revalidatePath("/nasabah")
  revalidatePath("/dashboard")
  return { success: true }
}
