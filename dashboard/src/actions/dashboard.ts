"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { differenceInDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns"
import { getCompanyInfo } from "@/actions/settings"
import { normalizeTimeZone } from "@/lib/datetime"
import { serializeData } from "@/lib/utils"
import { requireCompanyId } from "@/lib/tenant"

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

export async function getDashboardStats() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(
    session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null,
  )

  const company = await getCompanyInfo()
  const timeZone = normalizeTimeZone(company.timeZone)
  const today = new Date()

  const startToday = startOfDay(today)
  const endToday = new Date(startToday.getTime() + 86400000)

  const [totalNasabah, pinjamanAktif, totalOutstanding, jadwalTelat, penagihanHariIni] = await Promise.all([
    prisma.nasabah.count({ where: { companyId, status: "AKTIF" } }),
    prisma.pinjaman.count({ where: { companyId, status: "AKTIF" } }),
    prisma.pinjaman.aggregate({
      where: { companyId, status: { in: ["AKTIF", "MENUNGGAK"] } },
      _sum: { sisaPinjaman: true },
    }),
    prisma.jadwalAngsuran.findMany({
      where: { companyId, sudahDibayar: false, tanggalJatuhTempo: { lt: today } },
      select: {
        total: true,
        pinjaman: {
          select: {
            pengajuan: {
              select: {
                kelompok: { select: { nama: true, wilayah: true } },
              },
            },
          },
        },
      },
      take: 1000,
    }),
    prisma.jadwalAngsuran.count({
      where: { companyId, sudahDibayar: false, tanggalJatuhTempo: { gte: startToday, lt: endToday } },
    }),
  ])

  const totalTunggakan = jadwalTelat.reduce((sum, j) => sum + Number(j.total ?? 0), 0)

  // Arus kas 6 bulan terakhir (Parallel)
  const bulanQueries = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const endD = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
    bulanQueries.push(
      prisma.kasTransaksi.groupBy({
        by: ["jenis"],
        where: { companyId, tanggal: { gte: d, lte: endD }, isApproved: true },
        _sum: { jumlah: true },
      }).then(res => ({ date: d, data: res }))
    )
  }

  const bulanResults = await Promise.all(bulanQueries)
  const arusKas6Bulan = bulanResults.map(res => {
    const masuk = res.data.find((b) => b.jenis === "MASUK")?._sum?.jumlah
    const keluar = res.data.find((b) => b.jenis === "KELUAR")?._sum?.jumlah
    return {
      bulan: new Intl.DateTimeFormat("id-ID", { timeZone, month: "short", year: "2-digit" }).format(res.date),
      masuk: Number(masuk ?? 0),
      keluar: Number(keluar ?? 0),
    }
  })

  const tunggakanPerKelompok: Record<string, { nama: string; wilayah: string; total: number; count: number }> = {}
  for (const j of jadwalTelat) {
    const k = j.pinjaman?.pengajuan?.kelompok
    if (!k) continue
    if (!tunggakanPerKelompok[k.nama]) {
      tunggakanPerKelompok[k.nama] = { nama: k.nama, wilayah: k.wilayah ?? "", total: 0, count: 0 }
    }
    tunggakanPerKelompok[k.nama].total += Number(j.total ?? 0)
    tunggakanPerKelompok[k.nama].count += 1
  }
  const topTunggakan = Object.values(tunggakanPerKelompok)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  return serializeData({
    totalNasabah,
    pinjamanAktif,
    totalOutstanding: Number(totalOutstanding?._sum?.sisaPinjaman ?? 0),
    totalTunggakan,
    penagihanHariIni,
    arusKas6Bulan,
    topTunggakan,
  })
}

type DashboardRunningPrincipalBucket = {
  tenorType: "MINGGUAN" | "BULANAN"
  label: string
  activeLoanCount: number
  activeBorrowerCount: number
  runningPrincipal: number
  avgPrincipalPerBorrower: number
  avgOutstandingPerLoan: number
  due7DaysCount: number
  overdueCount: number
  riskSharePct: number
}

type DashboardRunningPrincipalStats = {
  totalRunningPrincipal: number
  totalBorrowers: number
  totalActiveLoans: number
  buckets: DashboardRunningPrincipalBucket[]
}

export async function getDashboardRunningPrincipalStats(): Promise<DashboardRunningPrincipalStats> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(
    session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null,
  )

  const today = new Date()
  const end7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [activeLoans, dueSoonRows, overdueRows] = await Promise.all([
    prisma.pinjaman.findMany({
      where: {
        companyId,
        status: { in: ["AKTIF", "MENUNGGAK"] },
      },
      select: {
        id: true,
        tenorType: true,
        sisaPinjaman: true,
        pengajuan: {
          select: {
            nasabahId: true,
          },
        },
      },
    }),
    prisma.jadwalAngsuran.findMany({
      where: {
        companyId,
        sudahDibayar: false,
        tanggalJatuhTempo: {
          gte: today,
          lte: end7Days,
        },
        pinjaman: {
          status: { in: ["AKTIF", "MENUNGGAK"] },
        },
      },
      select: {
        pinjamanId: true,
        pinjaman: {
          select: {
            tenorType: true,
          },
        },
      },
    }),
    prisma.jadwalAngsuran.findMany({
      where: {
        companyId,
        sudahDibayar: false,
        tanggalJatuhTempo: {
          lt: today,
        },
        pinjaman: {
          status: { in: ["AKTIF", "MENUNGGAK"] },
        },
      },
      select: {
        pinjamanId: true,
        pinjaman: {
          select: {
            tenorType: true,
          },
        },
      },
    }),
  ])

  const mapByType: Record<"MINGGUAN" | "BULANAN", {
    activeLoanCount: number
    runningPrincipal: number
    borrowerIds: Set<string>
    dueLoanIds: Set<string>
    overdueLoanIds: Set<string>
  }> = {
    MINGGUAN: { activeLoanCount: 0, runningPrincipal: 0, borrowerIds: new Set(), dueLoanIds: new Set(), overdueLoanIds: new Set() },
    BULANAN: { activeLoanCount: 0, runningPrincipal: 0, borrowerIds: new Set(), dueLoanIds: new Set(), overdueLoanIds: new Set() },
  }

  for (const loan of activeLoans) {
    const type = loan.tenorType === "MINGGUAN" ? "MINGGUAN" : "BULANAN"
    mapByType[type].activeLoanCount += 1
    mapByType[type].runningPrincipal += Number(loan.sisaPinjaman ?? 0)
    if (loan.pengajuan?.nasabahId) {
      mapByType[type].borrowerIds.add(loan.pengajuan.nasabahId)
    }
  }

  for (const row of dueSoonRows) {
    const type = row.pinjaman.tenorType === "MINGGUAN" ? "MINGGUAN" : "BULANAN"
    mapByType[type].dueLoanIds.add(row.pinjamanId)
  }

  for (const row of overdueRows) {
    const type = row.pinjaman.tenorType === "MINGGUAN" ? "MINGGUAN" : "BULANAN"
    mapByType[type].overdueLoanIds.add(row.pinjamanId)
  }

  const totalRunningPrincipal = mapByType.MINGGUAN.runningPrincipal + mapByType.BULANAN.runningPrincipal
  const totalBorrowers = new Set([...mapByType.MINGGUAN.borrowerIds, ...mapByType.BULANAN.borrowerIds]).size
  const totalActiveLoans = mapByType.MINGGUAN.activeLoanCount + mapByType.BULANAN.activeLoanCount

  const buckets: DashboardRunningPrincipalBucket[] = [
    {
      tenorType: "MINGGUAN",
      label: "Sistem Mingguan",
      activeLoanCount: mapByType.MINGGUAN.activeLoanCount,
      activeBorrowerCount: mapByType.MINGGUAN.borrowerIds.size,
      runningPrincipal: mapByType.MINGGUAN.runningPrincipal,
      avgPrincipalPerBorrower:
        mapByType.MINGGUAN.borrowerIds.size > 0
          ? mapByType.MINGGUAN.runningPrincipal / mapByType.MINGGUAN.borrowerIds.size
          : 0,
      avgOutstandingPerLoan:
        mapByType.MINGGUAN.activeLoanCount > 0
          ? mapByType.MINGGUAN.runningPrincipal / mapByType.MINGGUAN.activeLoanCount
          : 0,
      due7DaysCount: mapByType.MINGGUAN.dueLoanIds.size,
      overdueCount: mapByType.MINGGUAN.overdueLoanIds.size,
      riskSharePct: totalRunningPrincipal > 0 ? (mapByType.MINGGUAN.runningPrincipal / totalRunningPrincipal) * 100 : 0,
    },
    {
      tenorType: "BULANAN",
      label: "Sistem Bulanan",
      activeLoanCount: mapByType.BULANAN.activeLoanCount,
      activeBorrowerCount: mapByType.BULANAN.borrowerIds.size,
      runningPrincipal: mapByType.BULANAN.runningPrincipal,
      avgPrincipalPerBorrower:
        mapByType.BULANAN.borrowerIds.size > 0
          ? mapByType.BULANAN.runningPrincipal / mapByType.BULANAN.borrowerIds.size
          : 0,
      avgOutstandingPerLoan:
        mapByType.BULANAN.activeLoanCount > 0
          ? mapByType.BULANAN.runningPrincipal / mapByType.BULANAN.activeLoanCount
          : 0,
      due7DaysCount: mapByType.BULANAN.dueLoanIds.size,
      overdueCount: mapByType.BULANAN.overdueLoanIds.size,
      riskSharePct: totalRunningPrincipal > 0 ? (mapByType.BULANAN.runningPrincipal / totalRunningPrincipal) * 100 : 0,
    },
  ]

  return serializeData({
    totalRunningPrincipal,
    totalBorrowers,
    totalActiveLoans,
    buckets,
  })
}

type RunningPrincipalMonitoringFilter = {
  tenorType?: "MINGGUAN" | "BULANAN" | "ALL"
  status?: "AKTIF" | "MENUNGGAK" | "ALL"
  search?: string
}

export async function getRunningPrincipalMonitoring(params?: RunningPrincipalMonitoringFilter) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(
    session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null,
  )

  const today = new Date()
  const end7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  const tenorType = params?.tenorType && params.tenorType !== "ALL" ? params.tenorType : undefined
  const status = params?.status && params.status !== "ALL" ? params.status : undefined
  const search = params?.search?.trim()

  const loans = await prisma.pinjaman.findMany({
    where: {
      companyId,
      status: status ?? { in: ["AKTIF", "MENUNGGAK"] },
      ...(tenorType ? { tenorType } : {}),
      ...(search
        ? {
            OR: [
              { nomorKontrak: { contains: search, mode: "insensitive" } },
              { pengajuan: { nasabah: { namaLengkap: { contains: search, mode: "insensitive" } } } },
              { pengajuan: { nasabah: { nomorAnggota: { contains: search, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      nomorKontrak: true,
      status: true,
      tenorType: true,
      pokokPinjaman: true,
      sisaPinjaman: true,
      tanggalCair: true,
      tanggalJatuhTempo: true,
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
              wilayah: true,
            },
          },
        },
      },
    },
    orderBy: [{ tenorType: "asc" }, { sisaPinjaman: "desc" }],
  })

  const loanIds = loans.map((loan) => loan.id)
  const [dueSoonRows, overdueRows] = await Promise.all([
    loanIds.length === 0
      ? Promise.resolve([])
      : prisma.jadwalAngsuran.findMany({
          where: {
            companyId,
            pinjamanId: { in: loanIds },
            sudahDibayar: false,
            tanggalJatuhTempo: { gte: today, lte: end7Days },
          },
          select: { pinjamanId: true },
        }),
    loanIds.length === 0
      ? Promise.resolve([])
      : prisma.jadwalAngsuran.findMany({
          where: {
            companyId,
            pinjamanId: { in: loanIds },
            sudahDibayar: false,
            tanggalJatuhTempo: { lt: today },
          },
          select: { pinjamanId: true },
        }),
  ])

  const dueSoonByLoanId = new Set(dueSoonRows.map((row) => row.pinjamanId))
  const overdueByLoanId = new Set(overdueRows.map((row) => row.pinjamanId))

  const rows = loans.map((loan) => {
    const principal = Number(loan.pokokPinjaman ?? 0)
    const outstanding = Number(loan.sisaPinjaman ?? 0)
    const progressPct = principal > 0 ? ((principal - outstanding) / principal) * 100 : 0
    return {
      id: loan.id,
      nomorKontrak: loan.nomorKontrak,
      status: loan.status,
      tenorType: loan.tenorType,
      pokokPinjaman: principal,
      sisaPinjaman: outstanding,
      progressPct: Math.max(0, Math.min(100, progressPct)),
      tanggalCair: loan.tanggalCair,
      tanggalJatuhTempo: loan.tanggalJatuhTempo,
      due7Days: dueSoonByLoanId.has(loan.id),
      overdue: overdueByLoanId.has(loan.id),
      nasabah: {
        namaLengkap: loan.pengajuan.nasabah.namaLengkap,
        nomorAnggota: loan.pengajuan.nasabah.nomorAnggota,
        noHp: loan.pengajuan.nasabah.noHp,
      },
      kelompok: {
        nama: loan.pengajuan.kelompok?.nama ?? "—",
        wilayah: loan.pengajuan.kelompok?.wilayah ?? "—",
      },
    }
  })

  const borrowerSet = new Set(rows.map((row) => row.nasabah.nomorAnggota))
  const summary = {
    totalPrincipal: rows.reduce((sum, row) => sum + row.pokokPinjaman, 0),
    totalOutstanding: rows.reduce((sum, row) => sum + row.sisaPinjaman, 0),
    totalLoans: rows.length,
    totalBorrowers: borrowerSet.size,
    due7DaysCount: rows.filter((row) => row.due7Days).length,
    overdueCount: rows.filter((row) => row.overdue).length,
    mingguanOutstanding: rows
      .filter((row) => row.tenorType === "MINGGUAN")
      .reduce((sum, row) => sum + row.sisaPinjaman, 0),
    bulananOutstanding: rows
      .filter((row) => row.tenorType === "BULANAN")
      .reduce((sum, row) => sum + row.sisaPinjaman, 0),
  }

  return serializeData({
    summary,
    rows,
  })
}

type CollectionSummary = {
  tanggalDari: string
  tanggalSampai: string
  targetDerived: number
  realisasiBayar: number
  gap: number
  totalKasus: number
  totalKurangBayar: number
  nasabahBermasalah: number
}

type CollectionRiskNasabah = {
  nasabahId: string
  namaLengkap: string
  nomorAnggota: string
  jumlahAngsuranBermasalah: number
  totalKurangBayar: number
  maxHariTelat: number
}

type CollectionQuickView = {
  weeklyGlobal: CollectionSummary
  monthlyGlobal: CollectionSummary
  weeklyRisks: CollectionRiskNasabah[]
  monthlyRisks: CollectionRiskNasabah[]
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10)
}

function parseJadwalTag(catatan?: string | null) {
  if (!catatan) return null
  const match = catatan.match(/\[JADWAL:([^\]]+)\]/)
  return match?.[1] ?? null
}

async function buildCollectionPeriod(
  companyId: string,
  startDate: Date,
  endDate: Date,
): Promise<{ summary: CollectionSummary; risks: CollectionRiskNasabah[] }> {
  const today = new Date()
  const jadwal = await prisma.jadwalAngsuran.findMany({
    where: {
      companyId,
      tanggalJatuhTempo: { gte: startDate, lte: endDate },
    },
    select: {
      id: true,
      pinjamanId: true,
      tanggalJatuhTempo: true,
      total: true,
      pinjaman: {
        select: {
          pengajuan: {
            select: {
              nasabah: {
                select: {
                  id: true,
                  namaLengkap: true,
                  nomorAnggota: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (jadwal.length === 0) {
    return {
      summary: {
        tanggalDari: formatDateOnly(startDate),
        tanggalSampai: formatDateOnly(endDate),
        targetDerived: 0,
        realisasiBayar: 0,
        gap: 0,
        totalKasus: 0,
        totalKurangBayar: 0,
        nasabahBermasalah: 0,
      },
      risks: [],
    }
  }

  const pinjamanIds = Array.from(new Set(jadwal.map((item) => item.pinjamanId)))
  const pembayaran = await prisma.pembayaran.findMany({
    where: {
      companyId,
      pinjamanId: { in: pinjamanIds },
      isBatalkan: false,
      catatan: { contains: "[JADWAL:" },
    },
    select: {
      pinjamanId: true,
      catatan: true,
      totalBayar: true,
      tanggalBayar: true,
    },
  })

  const paidByJadwal: Record<string, number> = {}
  for (const row of pembayaran) {
    const jadwalId = parseJadwalTag(row.catatan)
    if (!jadwalId) continue
    paidByJadwal[jadwalId] = (paidByJadwal[jadwalId] ?? 0) + Number(row.totalBayar)
  }

  const riskByNasabah: Record<string, CollectionRiskNasabah> = {}
  let targetDerived = 0
  let realisasiBayar = 0
  let totalKasus = 0
  let totalKurangBayar = 0

  for (const row of jadwal) {
    const totalTagihan = Number(row.total)
    const paid = paidByJadwal[row.id] ?? 0
    const unpaid = Math.max(0, totalTagihan - paid)

    targetDerived += totalTagihan
    realisasiBayar += Math.min(totalTagihan, paid)

    if (unpaid <= 0) continue
    totalKasus += 1
    totalKurangBayar += unpaid

    const nasabah = row.pinjaman.pengajuan.nasabah
    const hariTelat = Math.max(0, differenceInDays(today, row.tanggalJatuhTempo))
    const existing = riskByNasabah[nasabah.id]
    if (!existing) {
      riskByNasabah[nasabah.id] = {
        nasabahId: nasabah.id,
        namaLengkap: nasabah.namaLengkap,
        nomorAnggota: nasabah.nomorAnggota,
        jumlahAngsuranBermasalah: 1,
        totalKurangBayar: unpaid,
        maxHariTelat: hariTelat,
      }
    } else {
      existing.jumlahAngsuranBermasalah += 1
      existing.totalKurangBayar += unpaid
      existing.maxHariTelat = Math.max(existing.maxHariTelat, hariTelat)
    }
  }

  const risks = Object.values(riskByNasabah)
    .sort((a, b) => {
      if (b.totalKurangBayar !== a.totalKurangBayar) return b.totalKurangBayar - a.totalKurangBayar
      return b.maxHariTelat - a.maxHariTelat
    })
    .slice(0, 10)

  return {
    summary: {
      tanggalDari: formatDateOnly(startDate),
      tanggalSampai: formatDateOnly(endDate),
      targetDerived,
      realisasiBayar,
      gap: Math.max(0, targetDerived - realisasiBayar),
      totalKasus,
      totalKurangBayar,
      nasabahBermasalah: Object.keys(riskByNasabah).length,
    },
    risks,
  }
}

export async function getDashboardCollectionQuickView(): Promise<CollectionQuickView> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(
    session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null,
  )

  const today = new Date()
  const weeklyStart = startOfWeek(today, { weekStartsOn: 1 })
  const weeklyEnd = endOfWeek(today, { weekStartsOn: 1 })
  const monthlyStart = startOfMonth(today)
  const monthlyEnd = endOfMonth(today)

  const [weekly, monthly] = await Promise.all([
    buildCollectionPeriod(companyId, weeklyStart, weeklyEnd),
    buildCollectionPeriod(companyId, monthlyStart, monthlyEnd),
  ])

  return serializeData({
    weeklyGlobal: weekly.summary,
    monthlyGlobal: monthly.summary,
    weeklyRisks: weekly.risks,
    monthlyRisks: monthly.risks,
  })
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
  const { companyId } = requireCompanyId(
    session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null,
  )

  const [kolektor, kelompok, wilayahRows] = await Promise.all([
    prisma.user.findMany({
      where: {
        companyId,
        isActive: true,
        roles: { some: { role: "KOLEKTOR" } },
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.kelompok.findMany({
      where: { companyId },
      select: { id: true, nama: true },
      orderBy: { nama: "asc" },
    }),
    prisma.kelompok.findMany({
      where: { companyId, wilayah: { not: null } },
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
  const { companyId } = requireCompanyId(
    session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null,
  )

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
      companyId,
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
    where: { companyId, status: { in: ["AKTIF", "MENUNGGAK", "MACET"] } },
    _sum: { sisaPinjaman: true },
  })

  const nplOutstanding = data
    .filter((row) => row.hariTelat > 60)
    .reduce((sum, row) => sum + Number(row.total), 0)
  const outstanding = Number(outstandingTotal._sum.sisaPinjaman ?? 0)
  const nplRatio = outstanding > 0 ? (nplOutstanding / outstanding) * 100 : 0

  return serializeData({
    data,
    summary: {
      totalKasus: data.length,
      totalTunggakan: data.reduce((sum, row) => sum + Number(row.total), 0),
      nplOutstanding,
      outstanding,
      nplRatio,
      buckets,
    },
  })
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
  const { companyId } = requireCompanyId(
    session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null,
  )

  const today = new Date()

  const kelompok = await prisma.kelompok.findMany({
    where: {
      companyId,
      ...(search
        ? {
            OR: [
              { nama: { contains: search, mode: "insensitive" } },
              { kode: { contains: search, mode: "insensitive" } },
              { wilayah: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
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

  return serializeData({
    data,
    summary: { totalKelompok, totalAnggota, totalPinjamanAktif, avgAnggotaPerKelompok },
  })
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
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  const [kolektor, wilayahRows] = await Promise.all([
    prisma.user.findMany({
      where: {
        companyId,
        isActive: true,
        roles: { some: { role: "KOLEKTOR" } },
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.kelompok.findMany({
      where: { companyId, wilayah: { not: null } },
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

export async function getKolektorOverview(params?: KolektorFilter): Promise<KolektorOverview[]> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  const now = new Date()
  const year = Number(params?.year ?? now.getFullYear())
  const month = Number(params?.month ?? now.getMonth() + 1)
  const startMonth = new Date(year, month - 1, 1)
  const endMonth = new Date(year, month, 1)

  const kolektorList = await prisma.user.findMany({
    where: {
      companyId,
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
          companyId,
          jenis: "MASUK",
          kategoriKey: { in: ["ANGSURAN", "PELUNASAN"] },
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

  return serializeData(kolektorList.map((k) => {
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
  }))
}
