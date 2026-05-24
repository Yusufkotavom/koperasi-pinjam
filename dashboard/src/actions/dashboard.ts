"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { differenceInDays } from "date-fns"

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

type DashboardFilter = {
  tanggalDari?: string
  tanggalSampai?: string
  kolektorId?: string
  kelompokId?: string
  wilayah?: string
}

export async function getDashboardFilterOptions() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const [kolektor, kelompok, wilayahRows] = await Promise.all([
    prisma.user.findMany({
      where: {
        isActive: true,
        roles: { some: { role: "KOLEKTOR" } },
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.kelompok.findMany({
      select: { id: true, nama: true },
      orderBy: { nama: "asc" },
    }),
    prisma.kelompok.findMany({
      where: { wilayah: { not: null } },
      select: { wilayah: true },
      distinct: ["wilayah"],
      orderBy: { wilayah: "asc" },
    }),
  ])

  return {
    kolektor,
    kelompok,
    wilayah: wilayahRows.map((w) => w.wilayah).filter((w): w is string => Boolean(w)),
  }
}

export async function getDashboardStats(params?: DashboardFilter) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const today = new Date()
  const tanggalDari = params?.tanggalDari ? startOfDay(new Date(params.tanggalDari)) : undefined
  const tanggalSampai = params?.tanggalSampai ? endOfDay(new Date(params.tanggalSampai)) : undefined

  const nasabahFilter = {
    ...(params?.kolektorId ? { kolektorId: params.kolektorId } : {}),
    ...(params?.kelompokId ? { kelompokId: params.kelompokId } : {}),
    ...(params?.wilayah ? { kelompok: { wilayah: params.wilayah } } : {}),
  }

  const pengajuanFilter = {
    ...(params?.kolektorId ? { nasabah: { kolektorId: params.kolektorId } } : {}),
    ...(params?.kelompokId ? { kelompokId: params.kelompokId } : {}),
    ...(params?.wilayah ? { kelompok: { wilayah: params.wilayah } } : {}),
  }

  const tunggakanDateFilter =
    tanggalDari || tanggalSampai
      ? {
          ...(tanggalDari ? { gte: tanggalDari } : {}),
          ...(tanggalSampai ? { lte: tanggalSampai } : {}),
        }
      : { lt: today }

  const [totalNasabah, pinjamanAktif, totalOutstanding, jadwalTelat] = await Promise.all([
    prisma.nasabah.count({ where: { status: "AKTIF", ...nasabahFilter } }),
    prisma.pinjaman.count({ where: { status: "AKTIF", pengajuan: pengajuanFilter } }),
    prisma.pinjaman.aggregate({
      where: { status: { in: ["AKTIF", "MENUNGGAK"] }, pengajuan: pengajuanFilter },
      _sum: { sisaPinjaman: true },
    }),
    prisma.jadwalAngsuran.findMany({
      where: {
        sudahDibayar: false,
        tanggalJatuhTempo: tunggakanDateFilter,
        pinjaman: { pengajuan: pengajuanFilter },
      },
      include: {
        pinjaman: {
          include: {
            pengajuan: {
              include: {
                kelompok: { select: { nama: true, wilayah: true } },
                nasabah: { select: { namaLengkap: true } },
              },
            },
          },
        },
      },
    }),
  ])

  const totalTunggakan = jadwalTelat.reduce((sum, j) => sum + Number(j.total), 0)

  const startToday = tanggalDari ?? startOfDay(today)
  const endToday = tanggalSampai ?? new Date(startToday.getTime() + 86400000)
  const penagihanHariIni = await prisma.jadwalAngsuran.count({
    where: {
      sudahDibayar: false,
      tanggalJatuhTempo: { gte: startToday, lte: endToday },
      pinjaman: { pengajuan: pengajuanFilter },
    },
  })

  const periodStart = tanggalDari ?? new Date(today.getFullYear(), today.getMonth() - 5, 1)
  const periodEnd = tanggalSampai ?? endOfDay(today)

  const arusKas6Bulan = []
  const cursor = new Date(periodStart.getFullYear(), periodStart.getMonth(), 1)
  while (cursor <= periodEnd) {
    const d = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const endD = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)

    const bulanData = await prisma.kasTransaksi.groupBy({
      by: ["jenis"],
      where: {
        tanggal: { gte: d, lte: endD },
      },
      _sum: { jumlah: true },
    })

    const masuk = bulanData.find((b) => b.jenis === "MASUK")?._sum.jumlah
    const keluar = bulanData.find((b) => b.jenis === "KELUAR")?._sum.jumlah

    arusKas6Bulan.push({
      bulan: d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
      masuk: Number(masuk ?? 0),
      keluar: Number(keluar ?? 0),
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  const tunggakanPerKelompok: Record<string, { nama: string; wilayah: string; total: number; count: number }> = {}
  for (const j of jadwalTelat) {
    const k = j.pinjaman.pengajuan.kelompok
    if (!k) continue
    if (!tunggakanPerKelompok[k.nama]) {
      tunggakanPerKelompok[k.nama] = { nama: k.nama, wilayah: k.wilayah ?? "", total: 0, count: 0 }
    }
    tunggakanPerKelompok[k.nama].total += Number(j.total)
    tunggakanPerKelompok[k.nama].count += 1
  }
  const topTunggakan = Object.values(tunggakanPerKelompok)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  return {
    filterInfo: {
      tanggalDari: tanggalDari?.toISOString() ?? null,
      tanggalSampai: tanggalSampai?.toISOString() ?? null,
      kolektorId: params?.kolektorId ?? null,
      kelompokId: params?.kelompokId ?? null,
      wilayah: params?.wilayah ?? null,
    },
    totalNasabah,
    pinjamanAktif,
    totalOutstanding: Number(totalOutstanding._sum.sisaPinjaman ?? 0),
    totalTunggakan,
    penagihanHariIni,
    arusKas6Bulan,
    topTunggakan,
  }
}

type TunggakanFilter = {
  tanggalDari?: string
  tanggalSampai?: string
  kolektorId?: string
  kelompokId?: string
  wilayah?: string
}

export async function getTunggakanFilterOptions() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const [kolektor, kelompok, wilayahRows] = await Promise.all([
    prisma.user.findMany({
      where: {
        isActive: true,
        roles: { some: { role: "KOLEKTOR" } },
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.kelompok.findMany({
      select: { id: true, nama: true },
      orderBy: { nama: "asc" },
    }),
    prisma.kelompok.findMany({
      where: { wilayah: { not: null } },
      select: { wilayah: true },
      distinct: ["wilayah"],
      orderBy: { wilayah: "asc" },
    }),
  ])

  return {
    kolektor,
    kelompok,
    wilayah: wilayahRows.map((w) => w.wilayah).filter((w): w is string => Boolean(w)),
  }
}

export async function getTunggakanList(params?: TunggakanFilter) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const today = new Date()
  const tanggalDari = params?.tanggalDari ? startOfDay(new Date(params.tanggalDari)) : undefined
  const tanggalSampai = params?.tanggalSampai ? endOfDay(new Date(params.tanggalSampai)) : undefined

  const tanggalFilter =
    tanggalDari || tanggalSampai
      ? {
          ...(tanggalDari ? { gte: tanggalDari } : {}),
          ...(tanggalSampai ? { lte: tanggalSampai } : {}),
        }
      : { lt: today }

  const jadwals = await prisma.jadwalAngsuran.findMany({
    where: {
      sudahDibayar: false,
      tanggalJatuhTempo: tanggalFilter,
      pinjaman: {
        pengajuan: {
          ...(params?.kelompokId ? { kelompokId: params.kelompokId } : {}),
          ...(params?.wilayah
            ? {
                kelompok: {
                  wilayah: params.wilayah,
                },
              }
            : {}),
          ...(params?.kolektorId
            ? {
                nasabah: {
                  kolektorId: params.kolektorId,
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
              nasabah: { select: { namaLengkap: true, nomorAnggota: true, noHp: true, kolektorId: true } },
              kelompok: { select: { id: true, nama: true, wilayah: true } },
            },
          },
        },
      },
    },
    orderBy: { tanggalJatuhTempo: "asc" },
  })

  const data = jadwals.map((j) => ({
    ...j,
    hariTelat: Math.max(0, differenceInDays(today, j.tanggalJatuhTempo)),
  }))

  const buckets = {
    "1-7": { count: 0, total: 0 },
    "8-30": { count: 0, total: 0 },
    "31-60": { count: 0, total: 0 },
    ">60": { count: 0, total: 0 },
  }

  for (const row of data) {
    const total = Number(row.total)
    if (row.hariTelat <= 7) {
      buckets["1-7"].count += 1
      buckets["1-7"].total += total
    } else if (row.hariTelat <= 30) {
      buckets["8-30"].count += 1
      buckets["8-30"].total += total
    } else if (row.hariTelat <= 60) {
      buckets["31-60"].count += 1
      buckets["31-60"].total += total
    } else {
      buckets[">60"].count += 1
      buckets[">60"].total += total
    }
  }

  const outstandingTotal = await prisma.pinjaman.aggregate({
    where: { status: { in: ["AKTIF", "MENUNGGAK", "MACET"] } },
    _sum: { sisaPinjaman: true },
  })

  const nplOutstanding = data
    .filter((row) => row.hariTelat > 60)
    .reduce((sum, row) => sum + Number(row.total), 0)
  const outstanding = Number(outstandingTotal._sum.sisaPinjaman ?? 0)
  const nplRatio = outstanding > 0 ? (nplOutstanding / outstanding) * 100 : 0

  return {
    data,
    summary: {
      totalKasus: data.length,
      totalTunggakan: data.reduce((sum, row) => sum + Number(row.total), 0),
      nplOutstanding,
      outstanding,
      nplRatio,
      buckets,
    },
  }
}

type KelompokOverview = {
  id: string
  kode: string
  nama: string
  wilayah: string
  kolektor: string
  anggota: number
  pinjamanAktif: number
  outstanding: number
  tunggakan: number
}

export async function getKelompokOverview(search?: string): Promise<{
  data: KelompokOverview[]
  summary: {
    totalKelompok: number
    totalAnggota: number
    totalPinjamanAktif: number
    avgAnggotaPerKelompok: number
  }
}> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const today = new Date()

  const kelompok = await prisma.kelompok.findMany({
    where: search
      ? {
          OR: [
            { nama: { contains: search, mode: "insensitive" } },
            { kode: { contains: search, mode: "insensitive" } },
            { wilayah: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      nasabah: {
        select: {
          id: true,
          kolektor: { select: { name: true } },
        },
      },
      pengajuan: {
        select: {
          pinjaman: {
            select: {
              id: true,
              status: true,
              sisaPinjaman: true,
              jadwalAngsuran: {
                where: {
                  sudahDibayar: false,
                  tanggalJatuhTempo: { lt: today },
                },
                select: { total: true },
              },
            },
          },
        },
      },
    },
    orderBy: { nama: "asc" },
  })

  const data = kelompok.map((k) => {
    const kolektorCounter: Record<string, number> = {}
    for (const n of k.nasabah) {
      const nama = n.kolektor?.name
      if (!nama) continue
      kolektorCounter[nama] = (kolektorCounter[nama] ?? 0) + 1
    }
    const kolektor =
      Object.entries(kolektorCounter).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Belum ditetapkan"

    const pinjaman = k.pengajuan.map((p) => p.pinjaman).filter((p): p is NonNullable<typeof p> => Boolean(p))

    const pinjamanAktif = pinjaman.filter((p) => p.status === "AKTIF" || p.status === "MENUNGGAK").length
    const outstanding = pinjaman.reduce((sum, p) => sum + Number(p.sisaPinjaman), 0)
    const tunggakan = pinjaman.reduce(
      (sum, p) => sum + p.jadwalAngsuran.reduce((inner, j) => inner + Number(j.total), 0),
      0
    )

    return {
      id: k.id,
      kode: k.kode,
      nama: k.nama,
      wilayah: k.wilayah ?? "-",
      kolektor,
      anggota: k.nasabah.length,
      pinjamanAktif,
      outstanding,
      tunggakan,
    }
  })

  const totalKelompok = data.length
  const totalAnggota = data.reduce((sum, item) => sum + item.anggota, 0)
  const totalPinjamanAktif = data.reduce((sum, item) => sum + item.pinjamanAktif, 0)
  const avgAnggotaPerKelompok = totalKelompok > 0 ? Math.round(totalAnggota / totalKelompok) : 0

  return {
    data,
    summary: { totalKelompok, totalAnggota, totalPinjamanAktif, avgAnggotaPerKelompok },
  }
}

type KolektorOverview = {
  id: string
  nama: string
  nasabah: number
  kelompok: number
  target: number
  realisasi: number
  tunggakan: number
  setoran: number
  pencapaian: number
}

type KolektorFilter = {
  month?: string
  year?: string
  kolektorId?: string
  wilayah?: string
}

export async function getKolektorFilterOptions() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const [kolektor, wilayahRows] = await Promise.all([
    prisma.user.findMany({
      where: {
        isActive: true,
        roles: { some: { role: "KOLEKTOR" } },
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.kelompok.findMany({
      where: { wilayah: { not: null } },
      select: { wilayah: true },
      distinct: ["wilayah"],
      orderBy: { wilayah: "asc" },
    }),
  ])

  return {
    kolektor,
    wilayah: wilayahRows.map((w) => w.wilayah).filter((w): w is string => Boolean(w)),
  }
}

type PinjamanDetailFilter = {
  periode?: 'minggu' | 'bulan'
  tanggalDari?: string
  tanggalSampai?: string
  kolektorId?: string
  kelompokId?: string
  wilayah?: string
}

export async function getPinjamanDetail(params?: PinjamanDetailFilter) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const today = new Date()
  const tanggalDari = params?.tanggalDari ? startOfDay(new Date(params.tanggalDari)) : undefined
  const tanggalSampai = params?.tanggalSampai ? endOfDay(new Date(params.tanggalSampai)) : undefined

  // Filter untuk pinjaman
  const pinjamanFilter = {
    pengajuan: {
      ...(params?.kolektorId ? { nasabah: { kolektorId: params.kolektorId } } : {}),
      ...(params?.kelompokId ? { kelompokId: params.kelompokId } : {}),
      ...(params?.wilayah ? { kelompok: { wilayah: params.wilayah } } : {}),
    }
  }

  // Ambil semua pinjaman aktif
  const pinjamanAktif = await prisma.pinjaman.findMany({
    where: {
      status: { in: ["AKTIF", "MENUNGGAK"] },
      ...pinjamanFilter,
    },
    include: {
      pengajuan: {
        include: {
          nasabah: { select: { namaLengkap: true, nomorAnggota: true } },
          kelompok: { select: { nama: true, wilayah: true } },
        },
      },
      jadwalAngsuran: {
        where: {
          sudahDibayar: false,
          ...(tanggalDari || tanggalSampai ? {
            tanggalJatuhTempo: {
              ...(tanggalDari ? { gte: tanggalDari } : {}),
              ...(tanggalSampai ? { lte: tanggalSampai } : {}),
            }
          } : {}),
        },
        orderBy: { tanggalJatuhTempo: 'asc' },
      },
      pembayaran: {
        where: {
          isBatalkan: false,
          ...(tanggalDari || tanggalSampai ? {
            tanggalBayar: {
              ...(tanggalDari ? { gte: tanggalDari } : {}),
              ...(tanggalSampai ? { lte: tanggalSampai } : {}),
            }
          } : {}),
        },
        orderBy: { tanggalBayar: 'desc' },
      },
    },
  })

  // Hitung statistik per periode
  const periodStats = []
  if (params?.periode === 'minggu') {
    // Statistik mingguan untuk 8 minggu terakhir
    for (let i = 7; i >= 0; i--) {
      const startWeek = new Date(today)
      startWeek.setDate(today.getDate() - (i * 7))
      startWeek.setHours(0, 0, 0, 0)

      const endWeek = new Date(startWeek)
      endWeek.setDate(startWeek.getDate() + 6)
      endWeek.setHours(23, 59, 59, 999)

      const weeklyData = await calculatePeriodStats(startWeek, endWeek, pinjamanFilter)
      periodStats.push({
        periode: `${startWeek.getDate()}/${startWeek.getMonth() + 1}`,
        ...weeklyData,
      })
    }
  } else {
    // Statistik bulanan untuk 6 bulan terakhir
    for (let i = 5; i >= 0; i--) {
      const startMonth = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const endMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 0, 23, 59, 59)

      const monthlyData = await calculatePeriodStats(startMonth, endMonth, pinjamanFilter)
      periodStats.push({
        periode: startMonth.toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
        ...monthlyData,
      })
    }
  }

  // Ringkasan keseluruhan
  const totalPiutang = pinjamanAktif.reduce((sum, p) => sum + Number(p.sisaPinjaman), 0)
  const totalTunggakan = pinjamanAktif.reduce((sum, p) =>
    sum + p.jadwalAngsuran.reduce((inner, j) => inner + Number(j.total), 0), 0
  )
  const totalBayarPeriode = pinjamanAktif.reduce((sum, p) =>
    sum + p.pembayaran.reduce((inner, b) => inner + Number(b.totalBayar), 0), 0
  )

  return {
    summary: {
      totalPinjaman: pinjamanAktif.length,
      totalPiutang,
      totalTunggakan,
      totalBayarPeriode,
      rasioTunggakan: totalPiutang > 0 ? (totalTunggakan / totalPiutang) * 100 : 0,
    },
    periodStats,
    detailPinjaman: pinjamanAktif.map(p => ({
      id: p.id,
      nomorKontrak: p.nomorKontrak,
      nasabah: p.pengajuan.nasabah.namaLengkap,
      nomorAnggota: p.pengajuan.nasabah.nomorAnggota,
      kelompok: p.pengajuan.kelompok?.nama || '-',
      wilayah: p.pengajuan.kelompok?.wilayah || '-',
      pokokPinjaman: Number(p.pokokPinjaman),
      sisaPinjaman: Number(p.sisaPinjaman),
      status: p.status,
      tunggakan: p.jadwalAngsuran.reduce((sum, j) => sum + Number(j.total), 0),
      pembayaranTerakhir: p.pembayaran[0] ? {
        tanggal: p.pembayaran[0].tanggalBayar,
        jumlah: Number(p.pembayaran[0].totalBayar),
      } : null,
    })),
  }
}

async function calculatePeriodStats(startDate: Date, endDate: Date, pinjamanFilter: any) {
  const [pembayaran, jadwalJatuhTempo, pencairan] = await Promise.all([
    // Pembayaran dalam periode
    prisma.pembayaran.aggregate({
      where: {
        isBatalkan: false,
        tanggalBayar: { gte: startDate, lte: endDate },
        pinjaman: pinjamanFilter,
      },
      _sum: { totalBayar: true },
      _count: true,
    }),
    // Jadwal jatuh tempo dalam periode
    prisma.jadwalAngsuran.aggregate({
      where: {
        tanggalJatuhTempo: { gte: startDate, lte: endDate },
        pinjaman: pinjamanFilter,
      },
      _sum: { total: true },
      _count: true,
    }),
    // Pencairan dalam periode
    prisma.pinjaman.aggregate({
      where: {
        tanggalCair: { gte: startDate, lte: endDate },
        ...pinjamanFilter,
      },
      _sum: { nilaiCair: true },
      _count: true,
    }),
  ])

  return {
    pembayaran: Number(pembayaran._sum.totalBayar || 0),
    countPembayaran: pembayaran._count,
    jatuhTempo: Number(jadwalJatuhTempo._sum.total || 0),
    countJatuhTempo: jadwalJatuhTempo._count,
    pencairan: Number(pencairan._sum.nilaiCair || 0),
    countPencairan: pencairan._count,
  }
}

export async function getKolektorOverview(params?: KolektorFilter): Promise<KolektorOverview[]> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const now = new Date()
  const year = Number(params?.year ?? now.getFullYear())
  const month = Number(params?.month ?? now.getMonth() + 1)
  const startMonth = new Date(year, month - 1, 1)
  const endMonth = new Date(year, month, 1)

  const kolektorList = await prisma.user.findMany({
    where: {
      isActive: true,
      roles: { some: { role: "KOLEKTOR" } },
      ...(params?.kolektorId ? { id: params.kolektorId } : {}),
      ...(params?.wilayah
        ? {
            nasabahSebagaiKolektor: {
              some: {
                kelompok: { wilayah: params.wilayah },
              },
            },
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      kolektorTargets: {
        where: {
          periodMonth: month,
          periodYear: year,
        },
        select: {
          targetTagihan: true,
          realisasiTagihan: true,
        },
      },
      kasDiinput: {
        where: {
          jenis: "MASUK",
          kategori: { in: ["ANGSURAN", "PELUNASAN"] },
          tanggal: { gte: startMonth, lt: endMonth },
        },
        select: { jumlah: true },
      },
      nasabahSebagaiKolektor: {
        select: {
          kelompokId: true,
          pengajuan: {
            select: {
              pinjaman: {
                select: {
                  pembayaran: {
                    where: {
                      isBatalkan: false,
                      tanggalBayar: {
                        gte: startMonth,
                        lt: endMonth,
                      },
                    },
                    select: { totalBayar: true },
                  },
                  jadwalAngsuran: {
                    where: {
                      sudahDibayar: false,
                      tanggalJatuhTempo: { lt: now },
                    },
                    select: { total: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  })

  return kolektorList.map((k) => {
    const kelompokSet = new Set(k.nasabahSebagaiKolektor.map((n) => n.kelompokId).filter(Boolean))
    let realisasi = 0
    let tunggakan = 0
    let targetDerived = 0

    for (const nasabah of k.nasabahSebagaiKolektor) {
      for (const pengajuan of nasabah.pengajuan) {
        const pinjaman = pengajuan.pinjaman
        if (!pinjaman) continue
        for (const bayar of pinjaman.pembayaran) {
          realisasi += Number(bayar.totalBayar)
        }
        for (const jadwal of pinjaman.jadwalAngsuran) {
          tunggakan += Number(jadwal.total)
          targetDerived += Number(jadwal.total)
        }
      }
    }

    const targetSet = k.kolektorTargets[0]
    const target = targetSet ? Number(targetSet.targetTagihan) : targetDerived
    const setoran = k.kasDiinput.reduce((sum, item) => sum + Number(item.jumlah), 0)
    const pencapaian = target > 0 ? Math.round((realisasi / target) * 100) : 0

    return {
      id: k.id,
      nama: k.name,
      nasabah: k.nasabahSebagaiKolektor.length,
      kelompok: kelompokSet.size,
      target,
      realisasi,
      tunggakan,
      setoran,
      pencapaian,
    }
  })
}
