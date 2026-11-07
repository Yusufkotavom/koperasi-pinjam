import { auth } from "@/lib/auth"
import { csvResponse, formatDateId, formatDateTimeId, formatPhoneNumber, type CsvOptions } from "@/lib/export-utils"
import { prisma } from "@/lib/prisma"
import { requireCompanyId } from "@/lib/tenant"
import { differenceInDays, endOfDay, startOfDay } from "date-fns"

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return new Response("Unauthorized", { status: 401 })
  const { companyId } = requireCompanyId(
    session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null,
  )

  const { searchParams } = new URL(request.url)
  const tanggalDariParam = searchParams.get("tanggalDari")?.trim()
  const tanggalSampaiParam = searchParams.get("tanggalSampai")?.trim()
  const tenorTypeParam = searchParams.get("tenorType")?.trim()
  const kolektorId = searchParams.get("kolektorId")?.trim() || undefined
  const kelompokId = searchParams.get("kelompokId")?.trim() || undefined
  const wilayah = searchParams.get("wilayah")?.trim() || undefined

  const today = new Date()
  const tanggalDari = tanggalDariParam ? startOfDay(new Date(tanggalDariParam)) : undefined
  const tanggalSampai = tanggalSampaiParam ? endOfDay(new Date(tanggalSampaiParam)) : undefined
  const tenorType = tenorTypeParam === "MINGGUAN" || tenorTypeParam === "BULANAN" ? tenorTypeParam : undefined

  let tanggalFilter: { gte?: Date; lte?: Date; lt?: Date }
  if (tanggalDari || tanggalSampai) {
    tanggalFilter = {
      ...(tanggalDari ? { gte: tanggalDari } : {}),
      ...(tanggalSampai ? { lte: tanggalSampai } : {}),
    }
  } else {
    tanggalFilter = { lt: today }
  }

  const [company, kolektorUser, kelompokData, jadwals] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, select: { name: true } }),
    kolektorId ? prisma.user.findUnique({ where: { id: kolektorId }, select: { name: true } }) : null,
    kelompokId ? prisma.kelompok.findUnique({ where: { id: kelompokId }, select: { nama: true } }) : null,
    prisma.jadwalAngsuran.findMany({
      where: {
        companyId,
        sudahDibayar: false,
        tanggalJatuhTempo: tanggalFilter,
        pinjaman: {
          ...(tenorType ? { tenorType } : {}),
          pengajuan: {
            ...(kelompokId ? { kelompokId } : {}),
            ...(wilayah
              ? {
                  kelompok: {
                    wilayah,
                  },
                }
              : {}),
            ...(kolektorId
              ? {
                  nasabah: {
                    kolektorId,
                  },
                }
              : {}),
          },
        },
      },
      include: {
        pinjaman: {
          include: {
            pengajuan: {
              include: {
                nasabah: {
                  select: {
                    namaLengkap: true,
                    nomorAnggota: true,
                    noHp: true,
                    kolektor: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
                kelompok: {
                  select: {
                    id: true,
                    nama: true,
                    wilayah: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { tanggalJatuhTempo: "asc" },
    }),
  ])

  function agingLabel(hari: number) {
    if (hari <= 7) return "1-7 hari"
    if (hari <= 30) return "8-30 hari"
    if (hari <= 60) return "31-60 hari"
    return ">60 hari (NPL)"
  }

  const rows = jadwals.map((j, idx) => {
    const hariTelat = Math.max(0, differenceInDays(today, j.tanggalJatuhTempo))
    const p = j.pinjaman
    const nasabah = p.pengajuan.nasabah
    const kelompok = p.pengajuan.kelompok

    return {
      "No.": idx + 1,
      "No. Kontrak": p.nomorKontrak,
      "No. Anggota": nasabah.nomorAnggota,
      "Nama Nasabah": nasabah.namaLengkap,
      "No. HP": formatPhoneNumber(nasabah.noHp),
      "Kelompok": kelompok?.nama ?? "-",
      "Wilayah": kelompok?.wilayah ?? "-",
      "Kolektor": nasabah.kolektor?.name ?? "-",
      "Skema Tenor": p.tenorType === "MINGGUAN" ? "Mingguan" : "Bulanan",
      "Angsuran Ke": j.angsuranKe,
      "Tgl Jatuh Tempo": formatDateId(j.tanggalJatuhTempo),
      "Hari Terlambat": hariTelat,
      "Status Aging": agingLabel(hariTelat),
      "Pokok (Rp)": Number(j.pokok),
      "Bunga (Rp)": Number(j.bunga),
      "Total Tagihan (Rp)": Number(j.total),
    }
  })

  const totalPokok = rows.reduce((acc, r) => acc + Number(r["Pokok (Rp)"]), 0)
  const totalBunga = rows.reduce((acc, r) => acc + Number(r["Bunga (Rp)"]), 0)
  const totalTagihan = rows.reduce((acc, r) => acc + Number(r["Total Tagihan (Rp)"]), 0)

  const totalRow = {
    "No.": "TOTAL",
    "No. Kontrak": `${rows.length} Data Tunggakan`,
    "No. Anggota": "",
    "Nama Nasabah": "",
    "No. HP": "",
    "Kelompok": "",
    "Wilayah": "",
    "Kolektor": "",
    "Skema Tenor": "",
    "Angsuran Ke": "",
    "Tgl Jatuh Tempo": "",
    "Hari Terlambat": "",
    "Status Aging": "",
    "Pokok (Rp)": totalPokok,
    "Bunga (Rp)": totalBunga,
    "Total Tagihan (Rp)": totalTagihan,
  }

  const filterInfo: string[] = []
  if (tanggalDariParam || tanggalSampaiParam) {
    filterInfo.push(`Periode: ${tanggalDariParam || "-"} s/d ${tanggalSampaiParam || "-"}`)
  } else {
    filterInfo.push("Periode: Jatuh Tempo s/d Hari Ini")
  }
  filterInfo.push(`Skema: ${tenorType || "Semua"}`)
  if (kolektorUser) filterInfo.push(`Kolektor: ${kolektorUser.name}`)
  if (kelompokData) filterInfo.push(`Kelompok: ${kelompokData.nama}`)
  if (wilayah) filterInfo.push(`Wilayah: ${wilayah}`)

  const options: CsvOptions = {
    header: {
      companyName: company?.name || "KOPERASI SIMPAN PINJAM",
      title: "LAPORAN DATA TUNGGAKAN PINJAMAN (AGING REPORT)",
      generatedAt: formatDateTimeId(new Date()),
      filterInfo,
    },
    totalRow,
  }

  const dateStr = new Date().toISOString().slice(0, 10)
  return csvResponse(rows, `monitoring-tunggakan-${dateStr}.csv`, options)
}
