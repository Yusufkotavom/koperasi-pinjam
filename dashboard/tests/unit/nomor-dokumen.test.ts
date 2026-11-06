import { describe, it, expect } from "vitest"
import { formatNomorUrut } from "@/lib/nomor-dokumen"
import { format } from "date-fns"

describe("Penomoran Otomatis Sobat Dana", () => {
  it("formats 6-digit sequence correctly with zero-padding", () => {
    expect(formatNomorUrut(1)).toBe("000001")
    expect(formatNomorUrut(98)).toBe("000098")
    expect(formatNomorUrut(125)).toBe("000125")
    expect(formatNomorUrut(1250)).toBe("001250")
    expect(formatNomorUrut(999999)).toBe("999999")
  })

  it("automatically expands to 7 digits when exceeding 999999 without truncation", () => {
    expect(formatNomorUrut(1000000)).toBe("1000000")
    expect(formatNomorUrut(1234567)).toBe("1234567")
  })

  it("generates expected YYMM prefix for transactions", () => {
    const nov2026 = new Date(2026, 10, 6) // Month is 0-indexed: 10 = Nov
    const des2026 = new Date(2026, 11, 15) // 11 = Dec
    const jan2027 = new Date(2027, 0, 1) // 0 = Jan

    expect(`AJU-${format(nov2026, "yyMM")}-${formatNomorUrut(125)}`).toBe("AJU-2611-000125")
    expect(`KTR-${format(nov2026, "yyMM")}-${formatNomorUrut(98)}`).toBe("KTR-2611-000098")
    expect(`BYR-${format(nov2026, "yyMM")}-${formatNomorUrut(1250)}`).toBe("BYR-2611-001250")

    // Contoh pergantian bulan sesuai deskripsi user
    expect(`BYR-${format(nov2026, "yyMM")}-${formatNomorUrut(1250)}`).toBe("BYR-2611-001250")
    expect(`BYR-${format(des2026, "yyMM")}-${formatNomorUrut(1251)}`).toBe("BYR-2612-001251")
    expect(`BYR-${format(jan2027, "yyMM")}-${formatNomorUrut(1252)}`).toBe("BYR-2701-001252")
  })
})
