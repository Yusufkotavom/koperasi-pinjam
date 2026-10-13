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
  /**
   * Bobot skor pinjaman TERAKHIR dalam agregasi skor berbobot (desimal, 0–1). Default 0.60.
   * Pinjaman terakhir menyumbang 60% skor; sisanya (40%) dibagi rata ke pinjaman sebelumnya.
   */
  latestLoanWeight: number
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
  latestLoanWeight: 0.6,
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

/**
 * Input cicilan yang bisa diambil dari query prisma (tanpa prisma dependency).
 * Dipakai untuk menghitung skor running di berbagai laporan/UI.
 */
export type CycleInstallmentInput = {
  sudahDibayar: boolean
  tanggalJatuhTempo: Date
  tanggalBayar: Date | null
  cycleScore: number | null
  dpd: number
}

/**
 * Ubah daftar cicilan menjadi cycle scores (0..-50 per siklus).
 * - Dibayar & punya cycleScore → pakai yang dipersist.
 * - Dibayar tanpa cycleScore → hitung dari tanggalBayar vs jatuh tempo.
 * - Belum dibayar → DPD = now - jatuh tempo (opsi A).
 */
export function cycleScoresFromInstallments(
  installments: CycleInstallmentInput[],
  now: Date,
  cfg: Partial<CreditScoringConfig> = {},
): number[] {
  const config = { ...DEFAULT_CREDIT_SCORING_CONFIG, ...cfg }
  return installments.map((j) => {
    if (j.sudahDibayar && j.cycleScore != null) return j.cycleScore
    let dpd: number
    if (j.sudahDibayar && j.tanggalBayar) {
      dpd = computeDpd(j.tanggalJatuhTempo, j.tanggalBayar)
    } else if (j.sudahDibayar) {
      dpd = j.dpd
    } else {
      dpd = computeDpd(j.tanggalJatuhTempo, now)
    }
    return cycleScoreFromDpd(dpd, config)
  })
}

/**
 * Hitung skor + kategori dari daftar cicilan (running / final).
 */
export function scoreFromInstallments(
  installments: CycleInstallmentInput[],
  now: Date,
  cfg: Partial<CreditScoringConfig> = {},
): { finalScore: number; grade: CreditGrade; cycleScores: number[] } {
  const cycleScores = cycleScoresFromInstallments(installments, now, cfg)
  const finalScore = computeFinalScore(cycleScores)
  const grade = gradeFromScore(finalScore, cfg)
  return { finalScore, grade, cycleScores }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Format persentase (0.3 → "+30%", -0.2 → "-20%", 0 → "0%"). */
export function formatLimitMultiplier(multiplier: number): string {
  const pct = Math.round(multiplier * 100)
  return pct > 0 ? `+${pct}%` : `${pct}%`
}

/** Label performa per siklus berdasarkan nilai cycle score. */
export function cycleScoreLabel(score: number): string {
  if (score >= 100) return "Tepat Waktu"
  if (score >= 70) return "Telat Ringan"
  if (score >= 40) return "Telat 1 Siklus"
  if (score >= 0) return "Gagal Bayar Siklus"
  return "Default / Macet"
}

/** Deskripsi kategori skor akhir untuk keterangan UI. */
export const GRADE_DESCRIPTION: Record<CreditGrade, { label: string; detail: string }> = {
  A: { label: "Sangat Baik", detail: "Riwayat pembayaran sangat lancar. Plafon berikutnya +30%." },
  B: { label: "Baik", detail: "Pembayaran baik dengan keterlambatan minor. Plafon berikutnya +15%." },
  C: { label: "Cukup", detail: "Ada keterlambatan berulang. Plafon berikutnya tetap (0%)." },
  D: { label: "Kurang Baik", detail: "Keterlambatan signifikan. Plafon berikutnya -20%." },
  E: { label: "Buruk", detail: "Riwayat macet / penalti berat. Pengajuan baru ditolak secara informasi." },
}

/** Deskripsi matriks DPD (untuk keterangan tabel skor). */
export const DPD_MATRIX_DESCRIPTION = [
  { range: "DPD ≤ 0", score: "100", label: "Tepat waktu / lebih awal" },
  { range: "DPD 1–3", score: "70", label: "Toleransi ringan" },
  { range: "DPD 4–7", score: "40", label: "Melewati 1 siklus" },
  { range: "DPD 8–14", score: "0", label: "Gagal bayar siklus berjalan" },
  { range: "DPD ≥ 15", score: "-50", label: "Penalti berat / potensi macet" },
]

// ---------------------------------------------------------------------------
// Skor berbobot per pinjaman (recency-weighted)
// ---------------------------------------------------------------------------

/** Detail satu siklus pembayaran pada sebuah pinjaman. */
export type LoanCycleDetail = {
  angsuranKe: number
  tanggalJatuhTempo: Date
  tanggalBayar: Date | null
  sudahDibayar: boolean
  dpd: number
  cycleScore: number
}

/** Input satu pinjaman (dengan seluruh siklus pembayarannya). */
export type LoanCycleInfo = {
  pinjamanId: string
  nomorKontrak: string
  status: string
  tanggalCair: Date
  pokok: number
  cycles: LoanCycleDetail[]
}

/** Hasil skor per pinjaman. */
export type LoanScoreRow = {
  pinjamanId: string
  nomorKontrak: string
  status: string
  tanggalCair: Date
  pokok: number
  score: number
  grade: CreditGrade
  paidCycles: number
  totalCycles: number
  /** Bobot pinjaman ini dalam skor agregat (desimal). */
  weight: number
  lateCycles: LoanCycleDetail[]
}

/**
 * Menghitung skor agregat berbobot dari beberapa pinjaman.
 *
 * Skema bobot ("recency-weighted"):
 * - Pinjaman TERAKHIR (tanggal cair paling baru) mendapat bobot `latestLoanWeight` (default 0,6).
 * - Pinjaman sebelumnya berbagi sisanya `(1 - latestLoanWeight)` secara merata (default 0,4).
 * - Bila hanya ada satu pinjaman yang punya siklus, bobotnya 1.
 *
 * Contoh default (0,6): pinjaman #1 skor 70 & pinjaman #2 skor 100 →
 * `0,4×70 + 0,6×100 = 88`. Untuk 3 pinjaman: #3 = 60%, #1 & #2 = 20% masing-masing.
 *
 * Pinjaman tanpa siklus terbayar (belum ada riwayat) diabaikan dari agregasi.
 */
export function computeWeightedScore(
  loans: LoanCycleInfo[],
  cfg: Partial<CreditScoringConfig> = {},
): { loans: LoanScoreRow[]; finalScore: number; grade: CreditGrade; multiplier: number; eligibleCount: number } {
  const config = { ...DEFAULT_CREDIT_SCORING_CONFIG, ...cfg }
  const latestWeight = Math.max(0, Math.min(1, config.latestLoanWeight))

  // Urutkan pinjaman dari paling lama → paling baru; hanya yang punya siklus.
  const sorted = [...loans].sort((a, b) => a.tanggalCair.getTime() - b.tanggalCair.getTime())
  const eligible = sorted.filter((l) => l.cycles.length > 0)

  const n = eligible.length
  const olderWeight = n > 1 ? (1 - latestWeight) / (n - 1) : 0

  const rows: LoanScoreRow[] = sorted.map((l) => {
    const cycleScores = l.cycles.map((c) => c.cycleScore)
    const score = cycleScores.length > 0 ? computeFinalScore(cycleScores) : 0
    const grade = gradeFromScore(score, config)
    const eligibleIndex = eligible.findIndex((e) => e.pinjamanId === l.pinjamanId)
    let weight = 0
    if (eligibleIndex >= 0) {
      weight = eligibleIndex === n - 1 ? (n === 1 ? 1 : latestWeight) : olderWeight
    }
    return {
      pinjamanId: l.pinjamanId,
      nomorKontrak: l.nomorKontrak,
      status: l.status,
      tanggalCair: l.tanggalCair,
      pokok: l.pokok,
      score,
      grade,
      paidCycles: l.cycles.length,
      totalCycles: l.cycles.length,
      weight,
      lateCycles: l.cycles.filter((c) => c.dpd > 0),
    }
  })

  const finalScoreRaw = rows.reduce((acc, r) => acc + r.score * r.weight, 0)
  const finalScore = clamp(finalScoreRaw, 0, 100)
  const grade = gradeFromScore(finalScore, config)
  const multiplier = limitMultiplierForGrade(grade, config)

  return { loans: rows, finalScore, grade, multiplier, eligibleCount: n }
}

/** Ringkasan sederhana: hanya skor akhir + kategori (untuk list/tabel). */
export function scoreLoans(
  loans: LoanCycleInfo[],
  cfg: Partial<CreditScoringConfig> = {},
): { finalScore: number; grade: CreditGrade } {
  const res = computeWeightedScore(loans, cfg)
  return { finalScore: res.finalScore, grade: res.grade }
}

// ---------------------------------------------------------------------------
// Keterangan naratif: Kelebihan (Pros) & Kekurangan (Cons)
// ---------------------------------------------------------------------------

export type CreditInsight = { pros: string[]; cons: string[] }

/**
 * Membangun daftar kelebihan & kekurangan dari hasil skor berbobot.
 * Dipakai untuk panel "Keterangan Skor" di halaman nasabah.
 */
export function buildCreditInsights(
  result: ReturnType<typeof computeWeightedScore>,
  cfg: Partial<CreditScoringConfig> = {},
): CreditInsight {
  const config = { ...DEFAULT_CREDIT_SCORING_CONFIG, ...cfg }
  const { loans, finalScore, grade, eligibleCount } = result
  const pros: string[] = []
  const cons: string[] = []

  const totalLate = loans.reduce((acc, l) => acc + l.lateCycles.length, 0)
  const totalCycles = loans.reduce((acc, l) => acc + l.paidCycles, 0)
  const worst = loans
    .flatMap((l) => l.lateCycles.map((c) => ({ ...c, kontrak: l.nomorKontrak })))
    .sort((a, b) => b.dpd - a.dpd)[0]
  const defaultCount = loans
    .flatMap((l) => l.lateCycles)
    .filter((c) => c.cycleScore <= config.defaultScore).length

  // ---- Ruang lingkup data ----
  if (eligibleCount === 0) {
    cons.push("Belum ada riwayat pembayaran yang bisa dinilai (tidak ada siklus terbayar).")
    return { pros, cons }
  }
  if (eligibleCount === 1) {
    pros.push("Baru 1 pinjaman dengan riwayat — skor masih awal, akan lebih stabil setelah beberapa siklus pinjaman.")
  }

  // ---- Skor & kategori keseluruhan ----
  if (grade === "A") pros.push(`Skor kredit ${finalScore} (kategori A) — performa pembayaran sangat baik.`)
  else if (grade === "B") pros.push(`Skor kredit ${finalScore} (kategori B) — performa pembayaran baik.`)
  else if (grade === "C") pros.push(`Skor kredit ${finalScore} (kategori C) — performa cukup, ada ruang perbaikan.`)
  else if (grade === "D") cons.push(`Skor kredit ${finalScore} (kategori D) — performa kurang baik.`)
  else cons.push(`Skor kredit ${finalScore} (kategori E) — riwayat buruk/macet; pengajuan baru berisiko.`)

  // ---- Ketepatan waktu keseluruhan ----
  if (totalLate === 0) {
    pros.push(`Seluruh ${totalCycles} cicilan dibayar tepat waktu (tanpa keterlambatan).`)
  } else {
    cons.push(`Terdapat keterlambatan di ${totalLate} dari ${totalCycles} cicilan.`)
  }

  // ---- Tren (pinjaman terakhir vs sebelumnya) ----
  const eligibleSorted = loans.filter((l) => l.weight > 0).sort((a, b) => a.tanggalCair.getTime() - b.tanggalCair.getTime())
  if (eligibleSorted.length >= 2) {
    const last = eligibleSorted[eligibleSorted.length - 1]
    const older = eligibleSorted.slice(0, -1)
    const olderAvg = older.reduce((acc, l) => acc + l.score, 0) / older.length
    if (last.score > olderAvg + 2) {
      pros.push(`Tren membaik: skor pinjaman terakhir (${round1(last.score)}) lebih tinggi dari rata-rata sebelumnya (${round1(olderAvg)}).`)
    } else if (last.score < olderAvg - 2) {
      cons.push(`Tren menurun: skor pinjaman terakhir (${round1(last.score)}) lebih rendah dari rata-rata sebelumnya (${round1(olderAvg)}).`)
    } else {
      pros.push(`Performa stabil antara pinjaman terakhir dan sebelumnya.`)
    }
  }

  // ---- Detail per pinjaman ----
  for (const l of loans) {
    if (l.paidCycles === 0) continue
    if (l.lateCycles.length === 0) {
      pros.push(`Pinjaman ${l.nomorKontrak}: ${l.paidCycles} cicilan, semua tepat waktu (skor ${round1(l.score)}).`)
    } else {
      const list = l.lateCycles
        .map((c) => `ke-${c.angsuranKe} +${c.dpd}h`)
        .join(", ")
      cons.push(`Pinjaman ${l.nomorKontrak}: terlambat di cicilan ${list} (skor ${round1(l.score)}).`)
    }
  }

  // ---- Keterlambatan terparah ----
  if (worst && worst.dpd > 0) {
    cons.push(`Keterlambatan terparah: ${worst.dpd} hari pada ${worst.kontrak} cicilan ke-${worst.angsuranKe}.`)
  }
  if (defaultCount > 0) {
    cons.push(`${defaultCount} cicilan masuk kategori penalti berat (DPD ≥ ${config.late3MaxDpd + 1}).`)
  }

  // ---- Rekomendasi plafon ----
  const pct = Math.round(limitMultiplierForGrade(grade, config) * 100)
  if (pct > 0) pros.push(`Rekomendasi plafon berikutnya: +${pct}% dari plafon terakhir.`)
  else if (pct < 0) cons.push(`Rekomendasi plafon berikutnya: ${pct}% dari plafon terakhir.`)
  else pros.push(`Rekomendasi plafon berikutnya: tetap (0%).`)

  return { pros, cons }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}
