import { auth } from "@/lib/auth"
import { csvResponse, formatDateId, formatDateTimeId, formatPhoneNumber, type CsvOptions } from "@/lib/export-utils"
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

  const [company, payments] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, select: { name: true } }),
    prisma.pembayaran.findMany({
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
    }),
  ])

  const rows = payments.map((p, idx) => {
    const nasabah = p.pinjaman.pengajuan.nasabah
    const kelompok = p.pinjaman.pengajuan.kelompok

    return {
      "No.": idx + 1,
      "No. Transaksi": p.nomorTransaksi,
      "No. Kontrak": p.pinjaman.nomorKontrak,
      "No. Anggota": nasabah.nomorAnggota,
      "Nama Nasabah": nasabah.namaLengkap,
      "No. HP": formatPhoneNumber(nasabah.noHp),
      "Kelompok": kelompok?.nama ?? "-",
      "Skema Tenor": p.pinjaman.tenorType === "MINGGUAN" ? "Mingguan" : "Bulanan",
      "Tgl Bayar": formatDateId(p.tanggalBayar),
      "Pokok (Rp)": Number(p.pokok),
      "Bunga (Rp)": Number(p.bunga),
      "Denda (Rp)": Number(p.denda),
      "Total Bayar (Rp)": Number(p.totalBayar),
      "Metode": p.metode,
      "Petugas Kasir": p.inputOleh.name,
      "Catatan": p.catatan ?? "-",
    }
  })

  const totalPokok = rows.reduce((acc, r) => acc + Number(r["Pokok (Rp)"]), 0)
  const totalBunga = rows.reduce((acc, r) => acc + Number(r["Bunga (Rp)"]), 0)
  const totalDenda = rows.reduce((acc, r) => acc + Number(r["Denda (Rp)"]), 0)
  const totalBayar = rows.reduce((acc, r) => acc + Number(r["Total Bayar (Rp)"]), 0)

  const totalRow = {
    "No.": "TOTAL",
    "No. Transaksi": `${rows.length} Transaksi`,
    "No. Kontrak": "",
    "No. Anggota": "",
    "Nama Nasabah": "",
    "No. HP": "",
    "Kelompok": "",
    "Skema Tenor": "",
    "Tgl Bayar": "",
    "Pokok (Rp)": totalPokok,
    "Bunga (Rp)": totalBunga,
    "Denda (Rp)": totalDenda,
    "Total Bayar (Rp)": totalBayar,
    "Metode": "",
    "Petugas Kasir": "",
    "Catatan": "",
  }

  const filterInfo: string[] = []
  if (dari || sampai) filterInfo.push(`Periode: ${dari || "-"} s/d ${sampai || "-"}`)
  if (search) filterInfo.push(`Pencarian: "${search}"`)
  if (filterInfo.length === 0) filterInfo.push("Semua Riwayat Pembayaran")

  const options: CsvOptions = {
    header: {
      companyName: company?.name || "KOPERASI SIMPAN PINJAM",
      title: "LAPORAN RIWAYAT PEMBAYARAN ANGSURAN",
      generatedAt: formatDateTimeId(new Date()),
      filterInfo,
    },
    totalRow,
  }

  const dateStr = new Date().toISOString().slice(0, 10)
  return csvResponse(rows, `riwayat-pembayaran-${dateStr}.csv`, options)
}
