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
  const dari = searchParams.get("dari")?.trim()
  const sampai = searchParams.get("sampai")?.trim()

  const where: Prisma.PembayaranWhereInput = {
    companyId,
    isBatalkan: false,
    ...(dari || sampai
      ? {
          tanggalBayar: {
            ...(dari ? { gte: new Date(dari) } : {}),
            ...(sampai ? { lte: new Date(`${sampai}T23:59:59.999Z`) } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { nomorTransaksi: { contains: search, mode: "insensitive" } },
            { pinjaman: { nomorKontrak: { contains: search, mode: "insensitive" } } },
            { pinjaman: { pengajuan: { nasabah: { namaLengkap: { contains: search, mode: "insensitive" } } } } },
          ],
        }
      : {}),
  }

  const payments = await prisma.pembayaran.findMany({
    where,
    orderBy: { tanggalBayar: "desc" },
    include: {
      inputOleh: { select: { name: true } },
      pinjaman: {
        select: {
          nomorKontrak: true,
          tenorType: true,
          pengajuan: {
            select: {
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
        },
      },
    },
  })

  const rows = payments.map((p, idx) => {
    const nasabah = p.pinjaman.pengajuan.nasabah
    const kelompok = p.pinjaman.pengajuan.kelompok

    return {
      no: idx + 1,
      nomor_transaksi: p.nomorTransaksi,
      nomor_kontrak: p.pinjaman.nomorKontrak,
      nomor_anggota: nasabah.nomorAnggota,
      nama_nasabah: nasabah.namaLengkap,
      no_hp: nasabah.noHp ?? "",
      kelompok: kelompok?.nama ?? "",
      skema_tenor: p.pinjaman.tenorType,
      tanggal_bayar: p.tanggalBayar.toISOString().slice(0, 10),
      pokok: Number(p.pokok),
      bunga: Number(p.bunga),
      denda: Number(p.denda),
      total_bayar: Number(p.totalBayar),
      metode: p.metode,
      kasir_input: p.inputOleh.name,
      catatan: p.catatan ?? "",
    }
  })

  const dateStr = new Date().toISOString().slice(0, 10)
  return csvResponse(rows, `riwayat-pembayaran-${dateStr}.csv`)
}
