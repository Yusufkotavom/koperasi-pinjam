import { describe, expect, it } from "vitest"
import { terbilang } from "@/lib/terbilang"

describe("terbilang utility", () => {
  it("converts basic numbers", () => {
    expect(terbilang(0)).toBe("Nol Rupiah")
    expect(terbilang(1)).toBe("Satu Rupiah")
    expect(terbilang(10)).toBe("Sepuluh Rupiah")
    expect(terbilang(11)).toBe("Sebelas Rupiah")
    expect(terbilang(15)).toBe("Lima Belas Rupiah")
    expect(terbilang(20)).toBe("Dua Puluh Rupiah")
    expect(terbilang(99)).toBe("Sembilan Puluh Sembilan Rupiah")
    expect(terbilang(100)).toBe("Seratus Rupiah")
    expect(terbilang(105)).toBe("Seratus Lima Rupiah")
    expect(terbilang(1000)).toBe("Seribu Rupiah")
    expect(terbilang(1500)).toBe("Seribu Lima Ratus Rupiah")
  })

  it("converts millions and billions", () => {
    expect(terbilang(1000000)).toBe("Satu Juta Rupiah")
    expect(terbilang(1250000)).toBe("Satu Juta Dua Ratus Lima Puluh Ribu Rupiah")
    expect(terbilang(50000000)).toBe("Lima Puluh Juta Rupiah")
    expect(terbilang(1000000000)).toBe("Satu Miliar Rupiah")
  })
})
