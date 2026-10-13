export type CreditGrade = "A" | "B" | "C" | "D" | "E"

/**
 * Konfigurasi credit scoring + dynamic limit sizing.
 * Semua nilai editable via settings (CompanySetting key CREDIT_SCORING_CONFIG).
 *
 * - Scoring matrix: DPD (Days Past Due) → cycle score per siklus.
 * - Category threshold: skor akhir → kategori A–E.
 * - Limit multiplier: persentase penyesuaian plafon per kategori (desimal, 0.30 = +30%).
 */
export type CreditScoringConfig = {
  /** Batas atas DPD untuk kategori LATE_1 (toleransi ringan). Default 3. */
  late1MaxDpd: number
  /** Batas atas DPD untuk kategori LATE_2 (melewati 1 siklus). Default 7. */
  late2MaxDpd: number
  /** Batas atas DPD untuk kategori LATE_3 (gagal bayar siklus berjalan). Default 14. */
  late3MaxDpd: number
  /** Skor siklus untuk tepat waktu (DPD <= 0). Default 100. */
  onTimeScore: number
  /** Skor siklus untuk LATE_1. Default 70. */
  late1Score: number
  /** Skor siklus untuk LATE_2. Default 40. */
  late2Score: number
  /** Skor siklus untuk LATE_3. Default 0. */
  late3Score: number
  /** Skor siklus untuk DEFAULT (DPD melewati late3MaxDpd). Default -50. */
  defaultScore: number
  /** Ambang bawah skor untuk kategori A. Default 80. */
  gradeAFloor: number
  /** Ambang bawah skor untuk kategori B. Default 65. */
  gradeBFloor: number
  /** Ambang bawah skor untuk kategori C. Default 50. */
  gradeCFloor: number
  /** Ambang bawah skor untuk kategori D. Default 30. */
  gradeDFloor: number
  /** Persentase penyesuaian plafon kategori A (desimal). Default 0.30. */
  limitA: number
  /** Persentase penyesuaian plafon kategori B (desimal). Default 0.15. */
  limitB: number
  /** Persentase penyesuaian plafon kategori C (desimal). Default 0. */
  limitC: number
  /** Persentase penyesuaian plafon kategori D (desimal). Default -0.20. */
  limitD: number
  /** Persentase penyesuaian plafon kategori E (desimal). Default -1.00. */
  limitE: number
}

export const DEFAULT_CREDIT_SCORING_CONFIG: CreditScoringConfig = {
  late1MaxDpd: 3,
  late2MaxDpd: 7,
  late3MaxDpd: 14,
  onTimeScore: 100,
  late1Score: 70,
  late2Score: 40,
  late3Score: 0,
  defaultScore: -50,
  gradeAFloor: 80,
  gradeBFloor: 65,
  gradeCFloor: 50,
  gradeDFloor: 30,
  limitA: 0.3,
  limitB: 0.15,
  limitC: 0,
  limitD: -0.2,
  limitE: -1,
}

/**
 * Konversi DPD (hari keterlambatan) menjadi skor siklus (cycle score).
 * Mengikuti matriks performa siklus pembayaran.
 */
export function cycleScoreFromDpd(dpd: number, cfg: Partial<CreditScoringConfig> = {}): number {
  const config = { ...DEFAULT_CREDIT_SCORING_CONFIG, ...cfg }
  const d = Math.max(0, Math.trunc(dpd))
  if (d <= 0) return config.onTimeScore
  if (d <= config.late1MaxDpd) return config.late1Score
  if (d <= config.late2MaxDpd) return config.late2Score
  if (d <= config.late3MaxDpd) return config.late3Score
  return config.defaultScore
}

/**
 * Menghitung skor akhir pinjaman = rata-rata cycle score seluruh siklus,
 * di-clamp ke rentang 0–100.
 */
export function computeFinalScore(cycleScores: number[]): number {
  if (cycleScores.length === 0) return 0
  const sum = cycleScores.reduce((acc, s) => acc + s, 0)
  const raw = sum / cycleScores.length
  return clamp(raw, 0, 100)
}

/**
 * Menentukan kategori A–E dari skor akhir.
 */
export function gradeFromScore(score: number, cfg: Partial<CreditScoringConfig> = {}): CreditGrade {
  const config = { ...DEFAULT_CREDIT_SCORING_CONFIG, ...cfg }
  const s = clamp(score, 0, 100)
  if (s >= config.gradeAFloor) return "A"
  if (s >= config.gradeBFloor) return "B"
  if (s >= config.gradeCFloor) return "C"
  if (s >= config.gradeDFloor) return "D"
  return "E"
}

/**
 * Persentase penyesuaian plafon untuk suatu kategori (desimal).
 */
export function limitMultiplierForGrade(
  grade: CreditGrade,
  cfg: Partial<CreditScoringConfig> = {},
): number {
  const config = { ...DEFAULT_CREDIT_SCORING_CONFIG, ...cfg }
  const map: Record<CreditGrade, number> = {
    A: config.limitA,
    B: config.limitB,
    C: config.limitC,
    D: config.limitD,
    E: config.limitE,
  }
  return map[grade]
}

/**
 * Menghitung plafon baru = plafon dasar × (1 + multiplier).
 * Tanpa tier/rounding — hasil apa adanya. Jika multiplier = -1 (ditolak), hasil 0.
 */
export function applyLimitMultiplier(baseLimit: number, multiplier: number): number {
  if (multiplier <= -1) return 0
  // Bulatkan ke Rupiah utuh (uang tidak punya pecahan desimal; tetap tanpa tier).
  return Math.round(Math.max(0, baseLimit * (1 + multiplier)))
}

/**
 * Menghitung DPD (hari) antara tanggal bayar dan jatuh tempo.
 * Hasil non-negatif: 0 jika bayar tepat waktu atau lebih awal.
 */
export function computeDpd(dueDate: Date, paidDate: Date): number {
  const dueMs = dueDate.getTime()
  const paidMs = paidDate.getTime()
  return Math.max(0, Math.floor((paidMs - dueMs) / (1000 * 60 * 60 * 24)))
}

/**
 * Evaluasi lengkap: dari daftar cycle score → { finalScore, grade, multiplier }.
 */
export function evaluateCredit(
  cycleScores: number[],
  cfg: Partial<CreditScoringConfig> = {},
): { finalScore: number; grade: CreditGrade; multiplier: number } {
  const finalScore = computeFinalScore(cycleScores)
  const grade = gradeFromScore(finalScore, cfg)
  const multiplier = limitMultiplierForGrade(grade, cfg)
  return { finalScore, grade, multiplier }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Format persentase (0.3 → "+30%", -0.2 → "-20%", 0 → "0%"). */
export function formatLimitMultiplier(multiplier: number): string {
  const pct = Math.round(multiplier * 100)
  return pct > 0 ? `+${pct}%` : `${pct}%`
}
