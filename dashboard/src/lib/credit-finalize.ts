import type { Prisma, PrismaClient } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import {
  buildCreditInsights,
  computeDpd,
  computeFinalScore,
  computeWeightedScore,
  cycleScoreFromDpd,
  evaluateCredit,
  type CreditInsight,
  type CreditScoringConfig,
  type LoanCycleInfo,
  type LoanCycleDetail,
  type LoanScoreRow,
} from "@/lib/credit-score"

export type FinalizeCreditResult = {
  finalScore: number
  grade: string
  cycleScores: number[]
  multiplier: number
}

type DbClient = PrismaClient | Prisma.TransactionClient

/**
 * Menghitung skor akhir pinjaman dari seluruh jadwal angsuran.
 * Untuk cicilan yang belum dibayar, DPD dihitung dari `now - tanggalJatuhTempo`
 * (opsi A: treat overdue unpaid sebagai terlambat berdasarkan hari berjalan).
 *
 * @param pinjamanId id pinjaman
 * @param now titik waktu evaluasi (default sekarang)
 * @param config konfigurasi credit scoring
 * @param db client prisma (default global; gunakan tx saat di dalam transaction)
 */
export async function computeLoanCredit(
  pinjamanId: string,
  now: Date,
  config: CreditScoringConfig,
  db: DbClient = prisma,
): Promise<FinalizeCreditResult> {
  const jadwal = await db.jadwalAngsuran.findMany({
    where: { pinjamanId },
    orderBy: { angsuranKe: "asc" },
    select: {
      id: true,
      tanggalJatuhTempo: true,
      tanggalBayar: true,
      sudahDibayar: true,
      dpd: true,
      cycleScore: true,
    },
  })

  const cycleScores = jadwal.map((j) => {
    // Prioritas: cycleScore yang sudah dipersist (hasil pembayaran).
    if (j.sudahDibayar && j.cycleScore != null) return j.cycleScore

    // Hitung DPD.
    let dpd: number
    if (j.sudahDibayar && j.tanggalBayar) {
      dpd = computeDpd(j.tanggalJatuhTempo, j.tanggalBayar)
    } else if (j.sudahDibayar) {
      // Dibayar tapi tanggalBayar hilang → anggap dpd dari field tersimpan.
      dpd = j.dpd
    } else {
      // Belum dibayar → DPD dari now.
      dpd = computeDpd(j.tanggalJatuhTempo, now)
    }

    return cycleScoreFromDpd(dpd, config)
  })

  const finalScore = computeFinalScore(cycleScores)
  const { grade, multiplier } = evaluateCredit(cycleScores, config)

  return { finalScore, grade, cycleScores, multiplier }
}

/**
 * Persist skor akhir + kategori ke pinjaman (hanya update kolom info).
 * Tidak menyentuh transaksi/jurnal/status.
 */
export async function persistLoanCredit(
  pinjamanId: string,
  result: FinalizeCreditResult,
  db: DbClient = prisma,
) {
  await db.pinjaman.update({
    where: { id: pinjamanId },
    data: {
      finalScore: result.finalScore,
      categoryGrade: result.grade,
    },
  })
}

export type LoanBreakdown = {
  nomorKontrak: string
  status: string
  tanggalCair: Date
  pokok: number
  score: number
  grade: string
  weight: number
  paidCycles: number
  lateCycles: Array<{ angsuranKe: number; dpd: number; cycleScore: number }>
}

export type SuggestedLimitResult = {
  baseLimit: number | null
  suggestedLimit: number | null
  finalScore: number | null
  grade: string | null
  /** Plafon pinjaman (pokok) dari pinjaman lunas terakhir — sumber perhitungan. */
  lastLoanPokok: number | null
  /** Rincian skor per pinjaman (berbobot). */
  breakdown: LoanBreakdown[]
  insights: CreditInsight
}

/**
 * Hitung skor berbobot + plafon saran untuk pengajuan berikutnya.
 *
 * Skor agregat memakai bobot per pinjaman (recency-weighted): pinjaman terakhir
 * menyumbang `latestLoanWeight` (default 60%), sisanya dibagi rata ke pinjaman
 * sebelumnya (default 40%). Contoh: pinjaman #1 skor 70 & #2 skor 100 → 88.
 *
 * Plafon saran = plafon pinjaman lunas terakhir × (1 + multiplier kategori).
 * Murni informasi — tidak ada guard.
 */
export async function computeSuggestedLimit(
  nasabahId: string,
  config: CreditScoringConfig,
  now: Date = new Date(),
): Promise<SuggestedLimitResult | null> {
  const nasabah = await prisma.nasabah.findUnique({
    where: { id: nasabahId },
    select: { companyId: true },
  })
  if (!nasabah) return null

  // Ambil seluruh pinjaman nasabah + siklusnya untuk skor berbobot.
  const pinjamanList = await prisma.pinjaman.findMany({
    where: {
      companyId: nasabah.companyId,
      pengajuan: { nasabahId },
    },
    orderBy: { tanggalCair: "asc" },
    select: {
      id: true,
      nomorKontrak: true,
      status: true,
      tanggalCair: true,
      pokokPinjaman: true,
      finalScore: true,
      categoryGrade: true,
      jadwalAngsuran: {
        orderBy: { angsuranKe: "asc" },
        select: {
          angsuranKe: true,
          tanggalJatuhTempo: true,
          tanggalBayar: true,
          sudahDibayar: true,
          dpd: true,
          cycleScore: true,
        },
      },
    },
  })

  const loanInfos: LoanCycleInfo[] = pinjamanList.map((p) => {
    const cycles: LoanCycleDetail[] = []
    for (const j of p.jadwalAngsuran) {
      // Skor agregat memakai siklus yang SUDAH dibayar (riwayat terealisasi).
      if (!j.sudahDibayar) continue
      let dpd: number
      if (j.tanggalBayar) dpd = computeDpd(j.tanggalJatuhTempo, j.tanggalBayar)
      else dpd = j.dpd
      const cycleScore = j.cycleScore ?? cycleScoreFromDpd(dpd, config)
      cycles.push({
        angsuranKe: j.angsuranKe,
        tanggalJatuhTempo: j.tanggalJatuhTempo,
        tanggalBayar: j.tanggalBayar,
        sudahDibayar: j.sudahDibayar,
        dpd,
        cycleScore,
      })
    }
    return {
      pinjamanId: p.id,
      nomorKontrak: p.nomorKontrak,
      status: p.status,
      tanggalCair: p.tanggalCair,
      pokok: Number(p.pokokPinjaman),
      cycles,
    }
  })

  const weighted = computeWeightedScore(loanInfos, config)
  const insights = buildCreditInsights(weighted, config)

  const breakdown: LoanBreakdown[] = weighted.loans.map((l: LoanScoreRow) => ({
    nomorKontrak: l.nomorKontrak,
    status: l.status,
    tanggalCair: l.tanggalCair,
    pokok: l.pokok,
    score: l.score,
    grade: l.grade,
    weight: l.weight,
    paidCycles: l.paidCycles,
    lateCycles: l.lateCycles.map((c) => ({ angsuranKe: c.angsuranKe, dpd: c.dpd, cycleScore: c.cycleScore })),
  }))

  // Plafon dasar = pinjaman lunas terakhir (pokok). Fallback ke pinjaman terakhir apa pun.
  const lunasList = pinjamanList.filter((p) => p.status === "LUNAS")
  const baseLoan = (lunasList.length > 0 ? lunasList[lunasList.length - 1] : pinjamanList[pinjamanList.length - 1]) ?? null

  const baseLimit = baseLoan ? Number(baseLoan.pokokPinjaman) : null
  const finalScore = weighted.eligibleCount > 0 ? weighted.finalScore : (baseLoan?.finalScore != null ? Number(baseLoan.finalScore) : null)
  const grade = weighted.eligibleCount > 0 ? weighted.grade : (baseLoan?.categoryGrade ?? null)
  const multiplier = weighted.multiplier

  const suggestedLimit =
    baseLimit == null ? null : multiplier <= -1 ? 0 : Math.round(baseLimit * (1 + multiplier))

  return {
    baseLimit,
    suggestedLimit,
    finalScore,
    grade,
    lastLoanPokok: baseLoan ? Number(baseLoan.pokokPinjaman) : null,
    breakdown,
    insights,
  }
}
