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

  const [company, loans] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, select: { name: true } }),
    prisma.pinjaman.findMany({
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
    }),
  ])

  const rows = loans.map((l, idx) => {
    const nasabah = l.pengajuan.nasabah
    const kelompok = l.pengajuan.kelompok

    return {
      "No.": idx + 1,
      "No. Kontrak": l.nomorKontrak,
      "No. Anggota": nasabah.nomorAnggota,
      "Nama Nasabah": nasabah.namaLengkap,
      "No. HP": formatPhoneNumber(nasabah.noHp),
      "Kelompok": kelompok?.nama ?? "-",
      "Wilayah": kelompok?.wilayah ?? "-",
      "Kolektor": nasabah.kolektor?.name ?? "-",
      "Status": l.status,
      "Skema Tenor": l.tenorType === "MINGGUAN" ? "Mingguan" : "Bulanan",
      "Tenor": `${l.tenor} ${l.tenorType === "MINGGUAN" ? "Minggu" : "Bulan"}`,
      "Pokok Pinjaman (Rp)": Number(l.pokokPinjaman),
      "Bunga per Bulan (%)": Number(l.bungaPerBulan),
      "Angsuran Pokok (Rp)": Number(l.angsuranPokok),
      "Angsuran Bunga (Rp)": Number(l.angsuranBunga),
      "Total Angsuran (Rp)": Number(l.totalAngsuran),
      "Nilai Cair (Rp)": Number(l.nilaiCair),
      "Sisa Pokok (Rp)": Number(l.sisaPinjaman),
      "Tgl Cair": formatDateId(l.tanggalCair),
      "Tgl Jatuh Tempo": formatDateId(l.tanggalJatuhTempo),
    }
  })

  const totalPokok = rows.reduce((acc, r) => acc + Number(r["Pokok Pinjaman (Rp)"]), 0)
  const totalAngsuran = rows.reduce((acc, r) => acc + Number(r["Total Angsuran (Rp)"]), 0)
  const totalNilaiCair = rows.reduce((acc, r) => acc + Number(r["Nilai Cair (Rp)"]), 0)
  const totalSisaPokok = rows.reduce((acc, r) => acc + Number(r["Sisa Pokok (Rp)"]), 0)

  const totalRow = {
    "No.": "TOTAL",
    "No. Kontrak": `${rows.length} Pinjaman`,
    "No. Anggota": "",
    "Nama Nasabah": "",
    "No. HP": "",
    "Kelompok": "",
    "Wilayah": "",
    "Kolektor": "",
    "Status": "",
    "Skema Tenor": "",
    "Tenor": "",
    "Pokok Pinjaman (Rp)": totalPokok,
    "Bunga per Bulan (%)": "",
    "Angsuran Pokok (Rp)": "",
    "Angsuran Bunga (Rp)": "",
    "Total Angsuran (Rp)": totalAngsuran,
    "Nilai Cair (Rp)": totalNilaiCair,
    "Sisa Pokok (Rp)": totalSisaPokok,
    "Tgl Cair": "",
    "Tgl Jatuh Tempo": "",
  }

  const filterInfo: string[] = []
  if (status) filterInfo.push(`Status: ${status}`)
  if (search) filterInfo.push(`Pencarian: "${search}"`)
  if (filterInfo.length === 0) filterInfo.push("Semua Data Pinjaman")

  const options: CsvOptions = {
    header: {
      companyName: company?.name || "KOPERASI SIMPAN PINJAM",
      title: "LAPORAN DAFTAR PINJAMAN ANGGOTA",
      generatedAt: formatDateTimeId(new Date()),
      filterInfo,
    },
    totalRow,
  }

  const dateStr = new Date().toISOString().slice(0, 10)
  return csvResponse(rows, `daftar-pinjaman-${dateStr}.csv`, options)
}
