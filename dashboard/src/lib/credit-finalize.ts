import type { Prisma, PrismaClient } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import {
  computeDpd,
  computeFinalScore,
  cycleScoreFromDpd,
  evaluateCredit,
  type CreditScoringConfig,
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

/**
 * Hitung plafon saran untuk pengajuan berikutnya berdasarkan skor pinjaman.
 * Plafon dasar = pokok pinjaman terakhir (lunas), dikalikan (1 + multiplier).
 * Ini murni informasi — tidak ada guard.
 */
export async function computeSuggestedLimit(
  nasabahId: string,
  config: CreditScoringConfig,
): Promise<{
  baseLimit: number | null
  suggestedLimit: number | null
  finalScore: number | null
  grade: string | null
} | null> {
  const nasabah = await prisma.nasabah.findUnique({
    where: { id: nasabahId },
    select: { companyId: true },
  })
  if (!nasabah) return null

  // Pinjaman lunas terakhir milik nasabah (untuk menentukan "plafon terakhir").
  const lunasLoan = await prisma.pinjaman.findFirst({
    where: {
      companyId: nasabah.companyId,
      pengajuan: { nasabahId },
      status: "LUNAS",
      finalScore: { not: null },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      pokokPinjaman: true,
      finalScore: true,
      categoryGrade: true,
    },
  })

  if (!lunasLoan) return null

  const baseLimit = Number(lunasLoan.pokokPinjaman)
  const finalScore = Number(lunasLoan.finalScore)
  const grade = lunasLoan.categoryGrade ?? "C"
  const multiplier =
    grade === "A"
      ? config.limitA
      : grade === "B"
        ? config.limitB
        : grade === "C"
          ? config.limitC
          : grade === "D"
            ? config.limitD
            : config.limitE

  const suggestedLimit =
    multiplier <= -1 ? 0 : Math.round(baseLimit * (1 + multiplier))

  return { baseLimit, suggestedLimit, finalScore, grade }
}
