import { describe, it, expect } from "vitest"
import { buildRencanaAngsuran } from "@/lib/angsuran"

describe("buildRencanaAngsuran — pembulatan ribuan (skenario 2)", () => {
  it("1.000.000 / 12 / 1,5%: pokok bulat ke atas, cicilan terakhir menampung sisa", () => {
    const r = buildRencanaAngsuran(1_000_000, 12, 0.015)

    // Bunga flat 1,5% × 1jt = 15.000 (bulat) tiap bulan.
    expect(r.angsuranBunga).toBe(15_000)
    // Pokok dibulatkan KE ATAS → 84.000, bukan 83.333.
    expect(r.pokok[0]).toBe(84_000)
    expect(r.pokok[10]).toBe(84_000)
    // Cicilan ke-12 menampung sisa (lebih kecil).
    expect(r.angsuranPokokTerakhir).toBe(76_000)
    expect(r.totalTerakhir).toBe(91_000) // 76.000 + 15.000
    expect(r.totalAngsuran).toBe(99_000) // 84.000 + 15.000

    // INVARIAN: Σ pokok = plafon TEPAT (tidak ada miss).
    expect(r.pokok.reduce((a, b) => a + b, 0)).toBe(1_000_000)
    // Σ bunga = bunga flat × tenor.
    expect(r.totalBunga).toBe(15_000 * 12)
    // Grand total = plafon + Σ bunga.
    expect(r.totalBayar).toBe(1_000_000 + 180_000)
  })

  it("semua nominal per cicilan selalu bilangan bulat ribuan", () => {
    const kasus = [
      { plafon: 1_000_000, tenor: 12, bunga: 0.015 },
      { plafon: 1_455_000, tenor: 11, bunga: 0.015 },
      { plafon: 2_500_000, tenor: 10, bunga: 0.02 },
      { plafon: 5_000_000, tenor: 24, bunga: 0.0125 },
      { plafon: 750_000, tenor: 6, bunga: 0.02 },
    ]
    for (const k of kasus) {
      const r = buildRencanaAngsuran(k.plafon, k.tenor, k.bunga)
      const sumPokok = r.pokok.reduce((a, b) => a + b, 0)
      // Σ pokok tepat sama dengan plafon → pinjaman pasti tertutup (tidak nyangkut 0,04).
      expect(sumPokok).toBe(k.plafon)
      // Grand total konsisten.
      expect(r.totalBayar).toBe(k.plafon + r.totalBunga)
      // Setiap cicilan bulat ribuan & positif.
      for (let i = 0; i < k.tenor; i++) {
        expect(r.pokok[i] % 1000).toBe(0)
        expect(r.bunga[i] % 1000).toBe(0)
        expect(r.total[i] % 1000).toBe(0)
        expect(r.pokok[i]).toBeGreaterThan(0)
      }
    }
  })

  it("kasus jahat: plafon tepat kelipatan (1.200.000 / 12) → cicilan terakhir sama", () => {
    const r = buildRencanaAngsuran(1_200_000, 12, 0.01)
    expect(r.pokok[0]).toBe(100_000)
    expect(r.angsuranPokokTerakhir).toBe(100_000)
    expect(r.pokok.reduce((a, b) => a + b, 0)).toBe(1_200_000)
  })

  it("tenor 1 → seluruh pokok di cicilan tunggal", () => {
    const r = buildRencanaAngsuran(1_000_000, 1, 0.015)
    expect(r.pokok).toEqual([1_000_000])
    expect(r.angsuranBunga).toBe(15_000)
    expect(r.totalBayar).toBe(1_015_000)
  })

  it("bunga 0 → total = plafon tepat", () => {
    const r = buildRencanaAngsuran(1_000_000, 12, 0)
    expect(r.angsuranBunga).toBe(0)
    expect(r.totalBayar).toBe(1_000_000)
    expect(r.pokok.reduce((a, b) => a + b, 0)).toBe(1_000_000)
  })
})
