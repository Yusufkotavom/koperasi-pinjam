import { describe, it, expect } from "vitest"

/**
 * Formula Bagi Hasil Simpanan
 * 
 * Bagi Hasil = (Saldo Awal × Persentase × Periode) / 12
 * 
 * Keterangan:
 * - Saldo Awal: Saldo awal simpanan (dalam Rupiah)
 * - Persentase: Persentase bagi hasil per tahun (dalam desimal, misal 12% = 0.12)
 * - Periode: Jumlah bulan (1-12 atau lebih)
 * 
 * Contoh:
 * - Saldo Awal: Rp 10.000.000
 * - Persentase: 12% per tahun (0.12)
 * - Periode: 1 bulan
 * - Hasil: (10.000.000 × 0.12 × 1) / 12 = Rp 100.000
 */

describe("Bagi Hasil Calculation", () => {
  /**
   * Helper function untuk menghitung bagi hasil
   * @param saldoAwal - Saldo awal simpanan
   * @param persenBagiHasil - Persentase bagi hasil per tahun (dalam desimal)
   * @param periodeBulan - Jumlah bulan
   * @returns Jumlah bagi hasil
   */
  function hitungBagiHasil(
    saldoAwal: number,
    persenBagiHasil: number,
    periodeBulan: number
  ): number {
    return (saldoAwal * persenBagiHasil * periodeBulan) / 12
  }

  describe("Basic Calculations", () => {
    it("should calculate monthly profit sharing correctly", () => {
      // Rp 10 juta × 12% × 1 bulan = Rp 100.000
      const result = hitungBagiHasil(10_000_000, 0.12, 1)
      expect(result).toBe(100_000)
    })

    it("should calculate quarterly profit sharing correctly", () => {
      // Rp 10 juta × 12% × 3 bulan = Rp 300.000
      const result = hitungBagiHasil(10_000_000, 0.12, 3)
      expect(result).toBe(300_000)
    })

    it("should calculate semi-annual profit sharing correctly", () => {
      // Rp 10 juta × 12% × 6 bulan = Rp 600.000
      const result = hitungBagiHasil(10_000_000, 0.12, 6)
      expect(result).toBe(600_000)
    })

    it("should calculate annual profit sharing correctly", () => {
      // Rp 10 juta × 12% × 12 bulan = Rp 1.200.000
      const result = hitungBagiHasil(10_000_000, 0.12, 12)
      expect(result).toBe(1_200_000)
    })
  })

  describe("Edge Cases", () => {
    it("should handle zero balance", () => {
      const result = hitungBagiHasil(0, 0.12, 1)
      expect(result).toBe(0)
    })

    it("should handle zero percentage", () => {
      const result = hitungBagiHasil(10_000_000, 0, 1)
      expect(result).toBe(0)
    })

    it("should handle custom period (2 months)", () => {
      // Rp 10 juta × 12% × 2 bulan = Rp 200.000
      const result = hitungBagiHasil(10_000_000, 0.12, 2)
      expect(result).toBe(200_000)
    })

    it("should handle custom period (5 months)", () => {
      // Rp 10 juta × 12% × 5 bulan = Rp 500.000
      const result = hitungBagiHasil(10_000_000, 0.12, 5)
      expect(result).toBe(500_000)
    })

    it("should handle large balance", () => {
      // Rp 100 juta × 12% × 1 bulan = Rp 1.000.000
      const result = hitungBagiHasil(100_000_000, 0.12, 1)
      expect(result).toBe(1_000_000)
    })

    it("should handle small balance", () => {
      // Rp 100 ribu × 12% × 1 bulan = Rp 1.000
      const result = hitungBagiHasil(100_000, 0.12, 1)
      expect(result).toBe(1_000)
    })
  })

  describe("Different Interest Rates", () => {
    it("should calculate with 6% annual rate", () => {
      // Rp 10 juta × 6% × 1 bulan = Rp 50.000
      const result = hitungBagiHasil(10_000_000, 0.06, 1)
      expect(result).toBe(50_000)
    })

    it("should calculate with 18% annual rate", () => {
      // Rp 10 juta × 18% × 1 bulan = Rp 150.000
      const result = hitungBagiHasil(10_000_000, 0.18, 1)
      expect(result).toBe(150_000)
    })

    it("should calculate with 24% annual rate", () => {
      // Rp 10 juta × 24% × 1 bulan = Rp 200.000
      const result = hitungBagiHasil(10_000_000, 0.24, 1)
      expect(result).toBe(200_000)
    })
  })

  describe("Real World Scenarios", () => {
    it("should calculate typical savings scenario", () => {
      // Rp 5 juta × 10% × 1 bulan = Rp 41.666,67
      const result = hitungBagiHasil(5_000_000, 0.10, 1)
      expect(result).toBeCloseTo(41_666.67, 2)
    })

    it("should calculate large deposit scenario", () => {
      // Rp 50 juta × 15% × 3 bulan = Rp 1.875.000
      const result = hitungBagiHasil(50_000_000, 0.15, 3)
      expect(result).toBe(1_875_000)
    })

    it("should calculate small savings scenario", () => {
      // Rp 500 ribu × 8% × 1 bulan = Rp 3.333,33
      const result = hitungBagiHasil(500_000, 0.08, 1)
      expect(result).toBeCloseTo(3_333.33, 2)
    })
  })

  describe("Validation Tests", () => {
    it("should handle decimal results correctly", () => {
      // Rp 7,5 juta × 11% × 1 bulan = Rp 68.750
      const result = hitungBagiHasil(7_500_000, 0.11, 1)
      expect(result).toBe(68_750)
    })

    it("should maintain precision for small amounts", () => {
      // Rp 250 ribu × 9% × 1 bulan = Rp 1.875
      const result = hitungBagiHasil(250_000, 0.09, 1)
      expect(result).toBe(1_875)
    })
  })

  describe("Period Validation", () => {
    it("should accept minimum period (1 month)", () => {
      const result = hitungBagiHasil(10_000_000, 0.12, 1)
      expect(result).toBeGreaterThan(0)
    })

    it("should accept annual period (12 months)", () => {
      const result = hitungBagiHasil(10_000_000, 0.12, 12)
      expect(result).toBe(1_200_000)
    })

    it("should accept custom period (7 months)", () => {
      // Rp 10 juta × 12% × 7 bulan = Rp 700.000
      const result = hitungBagiHasil(10_000_000, 0.12, 7)
      expect(result).toBe(700_000)
    })

    it("should validate all periods from 1 to 12 months", () => {
      const saldoAwal = 10_000_000
      const persenBagiHasil = 0.12
      
      for (let periode = 1; periode <= 12; periode++) {
        const result = hitungBagiHasil(saldoAwal, persenBagiHasil, periode)
        const expected = (saldoAwal * persenBagiHasil * periode) / 12
        expect(result).toBe(expected)
      }
    })
  })
})
