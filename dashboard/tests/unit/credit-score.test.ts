import { describe, it, expect } from "vitest"
import {
  cycleScoreFromDpd,
  computeFinalScore,
  computeWeightedScore,
  buildCreditInsights,
  gradeFromScore,
  evaluateCredit,
  applyLimitMultiplier,
  computeDpd,
  DEFAULT_CREDIT_SCORING_CONFIG,
} from "@/lib/credit-score"

describe("cycleScoreFromDpd", () => {
  it("DPD 0 → 100 (ON_TIME)", () => {
    expect(cycleScoreFromDpd(0)).toBe(100)
  })
  it("DPD 1-3 → 70 (LATE_1)", () => {
    expect(cycleScoreFromDpd(1)).toBe(70)
    expect(cycleScoreFromDpd(3)).toBe(70)
  })
  it("DPD 4-7 → 40 (LATE_2)", () => {
    expect(cycleScoreFromDpd(4)).toBe(40)
    expect(cycleScoreFromDpd(7)).toBe(40)
  })
  it("DPD 8-14 → 0 (LATE_3)", () => {
    expect(cycleScoreFromDpd(8)).toBe(0)
    expect(cycleScoreFromDpd(14)).toBe(0)
  })
  it("DPD >= 15 → -50 (DEFAULT)", () => {
    expect(cycleScoreFromDpd(15)).toBe(-50)
    expect(cycleScoreFromDpd(20)).toBe(-50)
  })
})

describe("computeFinalScore", () => {
  it("rata-rata & clamp 0-100", () => {
    expect(computeFinalScore([100, 100, 100, 100])).toBe(100)
    expect(computeFinalScore([100, 70, 100, 100])).toBe(92.5)
    expect(computeFinalScore([70, 40, 0, 100])).toBe(52.5)
    expect(computeFinalScore([-50, 100, 100, 100])).toBe(62.5)
    expect(computeFinalScore([-50, -50, 0, 100])).toBe(0)
  })
  it("kosong → 0", () => {
    expect(computeFinalScore([])).toBe(0)
  })
})

describe("gradeFromScore", () => {
  it("mapping kategori sesuai spec", () => {
    expect(gradeFromScore(100)).toBe("A")
    expect(gradeFromScore(80)).toBe("A")
    expect(gradeFromScore(79)).toBe("B")
    expect(gradeFromScore(65)).toBe("B")
    expect(gradeFromScore(64)).toBe("C")
    expect(gradeFromScore(50)).toBe("C")
    expect(gradeFromScore(49)).toBe("D")
    expect(gradeFromScore(30)).toBe("D")
    expect(gradeFromScore(29)).toBe("E")
    expect(gradeFromScore(0)).toBe("E")
  })
})

describe("evaluateCredit", () => {
  it("TC-01: tenor 4 tepat waktu → 100, A, +30%", () => {
    const r = evaluateCredit([100, 100, 100, 100])
    expect(r.finalScore).toBe(100)
    expect(r.grade).toBe("A")
    expect(r.multiplier).toBeCloseTo(0.3)
  })
  it("TC-03: [100,70,100,100] → 92.5, A", () => {
    const r = evaluateCredit([100, 70, 100, 100])
    expect(r.finalScore).toBe(92.5)
    expect(r.grade).toBe("A")
  })
  it("TC-06: [70,40,0,100] → 52.5, C", () => {
    const r = evaluateCredit([70, 40, 0, 100])
    expect(r.finalScore).toBe(52.5)
    expect(r.grade).toBe("C")
    expect(r.multiplier).toBeCloseTo(0)
  })
  it("TC-07: [-50,100,100,100] → 62.5, C", () => {
    const r = evaluateCredit([-50, 100, 100, 100])
    expect(r.finalScore).toBe(62.5)
    expect(r.grade).toBe("C")
  })
  it("TC-08: [-50,-50,0,100] → 0, E, -100%", () => {
    const r = evaluateCredit([-50, -50, 0, 100])
    expect(r.finalScore).toBe(0)
    expect(r.grade).toBe("E")
    expect(r.multiplier).toBeCloseTo(-1)
  })
})

describe("applyLimitMultiplier", () => {
  it("plafon awal 6jt → A (+30%) = 7.8jt", () => {
    expect(applyLimitMultiplier(6_000_000, 0.3)).toBe(7_800_000)
  })
  it("plafon awal 6jt → B (+15%) = 6.9jt", () => {
    expect(applyLimitMultiplier(6_000_000, 0.15)).toBe(6_900_000)
  })
  it("plafon awal 6jt → C (0%) = 6jt", () => {
    expect(applyLimitMultiplier(6_000_000, 0)).toBe(6_000_000)
  })
  it("plafon awal 6jt → D (-20%) = 4.8jt", () => {
    expect(applyLimitMultiplier(6_000_000, -0.2)).toBe(4_800_000)
  })
  it("plafon awal 6jt → E (-100%) = 0", () => {
    expect(applyLimitMultiplier(6_000_000, -1)).toBe(0)
  })
})

describe("computeDpd", () => {
  it("bayar lebih awal → 0", () => {
    const due = new Date("2026-01-10T00:00:00Z")
    const paid = new Date("2026-01-08T00:00:00Z")
    expect(computeDpd(due, paid)).toBe(0)
  })
  it("bayar telat 2 hari → 2", () => {
    const due = new Date("2026-01-10T00:00:00Z")
    const paid = new Date("2026-01-12T00:00:00Z")
    expect(computeDpd(due, paid)).toBe(2)
  })
})

describe("default config consistency", () => {
  it("matrix DPD sesuai spec", () => {
    const cfg = DEFAULT_CREDIT_SCORING_CONFIG
    expect(cfg.onTimeScore).toBe(100)
    expect(cfg.late1Score).toBe(70)
    expect(cfg.late2Score).toBe(40)
    expect(cfg.late3Score).toBe(0)
    expect(cfg.defaultScore).toBe(-50)
    expect(cfg.limitA).toBe(0.3)
    expect(cfg.limitB).toBe(0.15)
    expect(cfg.limitC).toBe(0)
    expect(cfg.limitD).toBe(-0.2)
    expect(cfg.limitE).toBe(-1)
    expect(cfg.latestLoanWeight).toBe(0.6)
  })
})

describe("computeWeightedScore", () => {
  function mkLoan(id: string, cair: string, scores: number[]) {
    return {
      pinjamanId: id,
      nomorKontrak: `K-${id}`,
      status: "LUNAS",
      tanggalCair: new Date(cair),
      pokok: 1_000_000,
      cycles: scores.map((s, i) => ({
        angsuranKe: i + 1,
        tanggalJatuhTempo: new Date(cair),
        tanggalBayar: new Date(cair),
        sudahDibayar: true,
        dpd: 0,
        cycleScore: s,
      })),
    }
  }

  it("user example: pinjaman #1 skor 70 & #2 skor 100 → 88 (bobot 40/60)", () => {
    const loans = [
      mkLoan("a", "2026-01-01", [70, 70, 70, 70]),
      mkLoan("b", "2026-06-01", [100, 100, 100, 100]),
    ]
    const r = computeWeightedScore(loans)
    expect(r.loans[0].score).toBe(70)
    expect(r.loans[1].score).toBe(100)
    // urut termuda→terbaru; index terakhir = terbaru
    expect(r.loans[0].weight).toBeCloseTo(0.4)
    expect(r.loans[1].weight).toBeCloseTo(0.6)
    expect(r.finalScore).toBe(88)
    expect(r.grade).toBe("A")
  })

  it("3 pinjaman: terakhir 60%, sebelumnya 20% masing-masing", () => {
    const loans = [
      mkLoan("a", "2026-01-01", [100, 100]), // 100
      mkLoan("b", "2026-03-01", [100, 100]), // 100
      mkLoan("c", "2026-06-01", [0, 0]), // 0
    ]
    const r = computeWeightedScore(loans)
    expect(r.loans[0].weight).toBeCloseTo(0.2)
    expect(r.loans[1].weight).toBeCloseTo(0.2)
    expect(r.loans[2].weight).toBeCloseTo(0.6)
    expect(r.finalScore).toBeCloseTo(40)
  })

  it("satu pinjaman → bobot 1", () => {
    const loans = [mkLoan("a", "2026-01-01", [80, 100])]
    const r = computeWeightedScore(loans)
    expect(r.loans[0].weight).toBe(1)
    expect(r.finalScore).toBe(90)
  })

  it("pinjaman tanpa siklus diabaikan (weight 0, tidak ubah skor)", () => {
    const loans = [
      mkLoan("a", "2026-01-01", [100, 100]),
      { ...mkLoan("b", "2026-06-01", []), status: "AKTIF" },
    ]
    const r = computeWeightedScore(loans)
    const bRow = r.loans.find((l) => l.pinjamanId === "b")!
    expect(bRow.weight).toBe(0)
    expect(r.finalScore).toBe(100)
  })

  it("bobot bisa dikonfigurasi (0.5 → 50/50)", () => {
    const loans = [mkLoan("a", "2026-01-01", [70, 70]), mkLoan("b", "2026-06-01", [100, 100])]
    const r = computeWeightedScore(loans, { latestLoanWeight: 0.5 })
    expect(r.finalScore).toBe(85)
  })
})

describe("buildCreditInsights", () => {
  function mkLoan(id: string, cair: string, scores: number[], late?: Array<{ ke: number; dpd: number }>) {
    return {
      pinjamanId: id,
      nomorKontrak: `K-${id}`,
      status: "LUNAS",
      tanggalCair: new Date(cair),
      pokok: 1_000_000,
      cycles: scores.map((s, i) => ({
        angsuranKe: i + 1,
        tanggalJatuhTempo: new Date(cair),
        tanggalBayar: new Date(cair),
        sudahDibayar: true,
        dpd: late?.find((l) => l.ke === i + 1)?.dpd ?? 0,
        cycleScore: s,
      })),
    }
  }

  it("semua tepat waktu → ada pros tanpa cons keterlambatan", () => {
    const loans = [mkLoan("a", "2026-01-01", [100, 100, 100, 100])]
    const r = computeWeightedScore(loans)
    const ins = buildCreditInsights(r)
    expect(ins.pros.some((p) => p.includes("tepat waktu"))).toBe(true)
    expect(ins.cons.some((c) => c.includes("keterlambatan"))).toBe(false)
  })

  it("ada keterlambatan → sebutkan cicilan ke-berapa", () => {
    const loans = [mkLoan("a", "2026-01-01", [100, 70, 100], [{ ke: 2, dpd: 2 }])]
    const r = computeWeightedScore(loans)
    const ins = buildCreditInsights(r)
    expect(ins.cons.some((c) => c.includes("terlambat di cicilan ke-2 +2h"))).toBe(true)
    expect(ins.cons.some((c) => c.includes("Keterlambatan terparah"))).toBe(true)
  })

  it("tren membaik terdeteksi", () => {
    const loans = [mkLoan("a", "2026-01-01", [40, 40]), mkLoan("b", "2026-06-01", [100, 100])]
    const r = computeWeightedScore(loans)
    const ins = buildCreditInsights(r)
    expect(ins.pros.some((p) => p.includes("Tren membaik"))).toBe(true)
  })
})
