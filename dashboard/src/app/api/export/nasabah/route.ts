import { auth } from "@/lib/auth"
import { csvResponse } from "@/lib/export-utils"
import { prisma } from "@/lib/prisma"
import { requireCompanyId } from "@/lib/tenant"

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return new Response("Unauthorized", { status: 401 })
  const { companyId } = requireCompanyId(
    session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null,
  )

  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search")?.trim() ?? ""
  const status = searchParams.get("status")?.trim() ?? ""
  const kelompokId = searchParams.get("kelompokId")?.trim() ?? ""

  const where = {
    AND: [
      { companyId },
      search
        ? {
            OR: [
              { namaLengkap: { contains: search, mode: "insensitive" as const } },
              { nik: { contains: search } },
              { nomorAnggota: { contains: search } },
            ],
          }
        : {},
      status ? { status: status as "AKTIF" | "NON_AKTIF" | "KELUAR" } : {},
      kelompokId ? { kelompokId } : {},
    ],
  }

  const data = await prisma.nasabah.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      kelompok: { select: { nama: true } },
      kolektor: { select: { name: true } },
    },
  })

  const rows = data.map((row) => ({
    nomor_anggota: row.nomorAnggota,
    nama_lengkap: row.namaLengkap,
    nik: row.nik,
    no_hp: row.noHp,
    alamat: row.alamat,
    kelompok: row.kelompok?.nama ?? "",
    kolektor: row.kolektor?.name ?? "",
    status: row.status,
    tanggal_gabung: row.tanggalGabung.toISOString().slice(0, 10),
  }))

  return csvResponse(rows, `master-nasabah-${new Date().toISOString().slice(0, 10)}.csv`)
}

