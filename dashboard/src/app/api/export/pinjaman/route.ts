import { auth } from "@/lib/auth"
import { csvResponse } from "@/lib/export-utils"
import { prisma } from "@/lib/prisma"
import { requireCompanyId } from "@/lib/tenant"
import { Prisma } from "@prisma/client"

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return new Response("Unauthorized", { status: 401 })
  const { companyId } = requireCompanyId(
    session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null,
  )

  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search")?.trim() ?? ""
  const statusParam = searchParams.get("status")?.trim() ?? ""
  const status = statusParam === "ALL" ? "" : statusParam

  const where: Prisma.PinjamanWhereInput = {
    AND: [
      { companyId },
      status ? { status: status as "AKTIF" | "LUNAS" | "MENUNGGAK" | "MACET" } : {},
      search
        ? {
            OR: [
              { nomorKontrak: { contains: search, mode: "insensitive" } },
              { pengajuan: { nasabah: { namaLengkap: { contains: search, mode: "insensitive" } } } },
              { pengajuan: { nasabah: { nomorAnggota: { contains: search, mode: "insensitive" } } } },
            ],
          }
        : {},
    ],
  }

  const loans = await prisma.pinjaman.findMany({
    where,
    orderBy: { tanggalCair: "desc" },
    include: {
      pengajuan: {
        include: {
          nasabah: {
            select: {
              namaLengkap: true,
              nomorAnggota: true,
              noHp: true,
              kolektor: { select: { name: true } },
            },
          },
          kelompok: { select: { nama: true, wilayah: true } },
        },
      },
    },
  })

  const rows = loans.map((l, idx) => {
    const nasabah = l.pengajuan.nasabah
    const kelompok = l.pengajuan.kelompok

    return {
      no: idx + 1,
      nomor_kontrak: l.nomorKontrak,
      nomor_anggota: nasabah.nomorAnggota,
      nama_nasabah: nasabah.namaLengkap,
      no_hp: nasabah.noHp ?? "",
      kelompok: kelompok?.nama ?? "",
      wilayah: kelompok?.wilayah ?? "",
      kolektor: nasabah.kolektor?.name ?? "",
      status: l.status,
      skema_tenor: l.tenorType,
      tenor: l.tenor,
      pokok_pinjaman: Number(l.pokokPinjaman),
      bunga_per_bulan: Number(l.bungaPerBulan),
      angsuran_pokok: Number(l.angsuranPokok),
      angsuran_bunga: Number(l.angsuranBunga),
      total_angsuran: Number(l.totalAngsuran),
      nilai_cair: Number(l.nilaiCair),
      sisa_pinjaman: Number(l.sisaPinjaman),
      tanggal_cair: l.tanggalCair ? l.tanggalCair.toISOString().slice(0, 10) : "",
      tanggal_jatuh_tempo: l.tanggalJatuhTempo ? l.tanggalJatuhTempo.toISOString().slice(0, 10) : "",
    }
  })

  const dateStr = new Date().toISOString().slice(0, 10)
  return csvResponse(rows, `daftar-pinjaman-${dateStr}.csv`)
}
