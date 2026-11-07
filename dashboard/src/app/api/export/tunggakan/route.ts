import { auth } from "@/lib/auth"
import { csvResponse } from "@/lib/export-utils"
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

  const jadwals = await prisma.jadwalAngsuran.findMany({
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
  })

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
      no: idx + 1,
      nomor_kontrak: p.nomorKontrak,
      nomor_anggota: nasabah.nomorAnggota,
      nama_nasabah: nasabah.namaLengkap,
      no_hp: nasabah.noHp ?? "",
      kelompok: kelompok?.nama ?? "",
      wilayah: kelompok?.wilayah ?? "",
      kolektor: nasabah.kolektor?.name ?? "",
      skema_tenor: p.tenorType,
      angsuran_ke: j.angsuranKe,
      jatuh_tempo: j.tanggalJatuhTempo.toISOString().slice(0, 10),
      hari_terlambat: hariTelat,
      status_aging: agingLabel(hariTelat),
      pokok: Number(j.pokok),
      bunga: Number(j.bunga),
      total_tagihan: Number(j.total),
    }
  })

  const dateStr = new Date().toISOString().slice(0, 10)
  return csvResponse(rows, `monitoring-tunggakan-${dateStr}.csv`)
}
