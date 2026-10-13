import { describe, it, expect } from "vitest"
import {
  cycleScoreFromDpd,
  computeFinalScore,
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
  })
})
