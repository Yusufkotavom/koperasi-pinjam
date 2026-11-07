import { auth } from "@/lib/auth"
import { csvResponse, formatDateId, formatDateTimeId, formatExcelText, formatPhoneNumber, type CsvOptions } from "@/lib/export-utils"
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

  const [company, kelompokData, data] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, select: { name: true } }),
    kelompokId ? prisma.kelompok.findUnique({ where: { id: kelompokId }, select: { nama: true } }) : null,
    prisma.nasabah.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        kelompok: { select: { nama: true } },
        kolektor: { select: { name: true } },
      },
    }),
  ])

  const rows = data.map((row, idx) => ({
    "No.": idx + 1,
    "No. Anggota": row.nomorAnggota,
    "Nama Lengkap": row.namaLengkap,
    "NIK": row.nik ? formatExcelText(row.nik) : "-",
    "No. HP": formatPhoneNumber(row.noHp),
    "Alamat": row.alamat,
    "Kelompok": row.kelompok?.nama ?? "-",
    "Kolektor": row.kolektor?.name ?? "-",
    "Status": row.status,
    "Tgl Bergabung": formatDateId(row.tanggalGabung),
  }))

  const filterInfo: string[] = []
  if (status) filterInfo.push(`Status: ${status}`)
  if (kelompokData) filterInfo.push(`Kelompok: ${kelompokData.nama}`)
  if (search) filterInfo.push(`Pencarian: "${search}"`)
  if (filterInfo.length === 0) filterInfo.push("Semua Data Anggota")

  const totalRow = {
    "No.": "TOTAL",
    "No. Anggota": `${rows.length} Anggota`,
    "Nama Lengkap": "",
    "NIK": "",
    "No. HP": "",
    "Alamat": "",
    "Kelompok": "",
    "Kolektor": "",
    "Status": "",
    "Tgl Bergabung": "",
  }

  const options: CsvOptions = {
    header: {
      companyName: company?.name || "KOPERASI SIMPAN PINJAM",
      title: "LAPORAN MASTER DATA ANGGOTA / NASABAH",
      generatedAt: formatDateTimeId(new Date()),
      filterInfo,
    },
    totalRow,
  }

  return csvResponse(rows, `master-nasabah-${new Date().toISOString().slice(0, 10)}.csv`, options)
}
