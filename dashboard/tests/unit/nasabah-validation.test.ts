import { describe, expect, it } from "vitest"
import { nasabahSchema } from "@/lib/validations/nasabah"

describe("nasabahSchema validation", () => {
  const baseValidData = {
    namaLengkap: "Budi Santoso",
    alamat: "Jl. Merdeka No. 10 RT 01 RW 02",
  }

  it("should pass when NIK and noHp are omitted or empty", () => {
    const result1 = nasabahSchema.safeParse({
      ...baseValidData,
    })
    expect(result1.success).toBe(true)

    const result2 = nasabahSchema.safeParse({
      ...baseValidData,
      nik: "",
      noHp: "",
    })
    expect(result2.success).toBe(true)

    const result3 = nasabahSchema.safeParse({
      ...baseValidData,
      nik: "   ",
      noHp: "   ",
    })
    expect(result3.success).toBe(true)
  })

  it("should pass when valid 16-digit NIK and valid phone number are provided", () => {
    const result = nasabahSchema.safeParse({
      ...baseValidData,
      nik: "3201234567890001",
      noHp: "081234567890",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.nik).toBe("3201234567890001")
      expect(result.data.noHp).toBe("081234567890")
    }
  })

  it("should fail when NIK is not 16 digits or contains non-digits", () => {
    const resultShort = nasabahSchema.safeParse({
      ...baseValidData,
      nik: "12345",
    })
    expect(resultShort.success).toBe(false)

    const resultLetters = nasabahSchema.safeParse({
      ...baseValidData,
      nik: "320123456789000A",
    })
    expect(resultLetters.success).toBe(false)
  })

  it("should fail when phone number is invalid format", () => {
    const result = nasabahSchema.safeParse({
      ...baseValidData,
      noHp: "02199999",
    })
    expect(result.success).toBe(false)
  })
})
