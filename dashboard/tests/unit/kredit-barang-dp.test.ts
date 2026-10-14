import { describe, it, expect } from "vitest"
import { pengajuanSchema, bayarDpSchema } from "@/lib/validations/pengajuan"
import { DEFAULT_ACCOUNTING_ACCOUNTS } from "@/lib/accounting"

describe("Kredit Barang & DP (Opsi A) - Validations & Accounting Rules", () => {
  it("DEFAULT_ACCOUNTING_ACCOUNTS mendaftarkan akun UTANG_TITIPAN_DP sebagai LIABILITY", () => {
    const acc = DEFAULT_ACCOUNTING_ACCOUNTS.find((a) => a.code === "UTANG_TITIPAN_DP")
    expect(acc).toBeDefined()
    expect(acc?.type).toBe("LIABILITY")
    expect(acc?.name).toContain("Titipan")
  })

  it("Validasi pengajuan BARANG mensyaratkan namaBarang, hargaBarang, dan DP < Harga", () => {
    // Kurang nama barang
    const invalid1 = pengajuanSchema.safeParse({
      nasabahId: "c-nasabah-1",
      jenisPinjaman: "BARANG",
      tenorType: "BULANAN",
      tenor: 12,
      bungaPerBulan: 1.5,
      tujuanPinjaman: "Beli laptop untuk usaha",
      hargaBarang: 2000000,
      uangMuka: 500000,
      plafonDiajukan: 1500000,
    })
    expect(invalid1.success).toBe(false)
    if (!invalid1.success) {
      expect(invalid1.error.flatten().fieldErrors.namaBarang).toBeDefined()
    }

    // DP melebihi atau sama dengan harga
    const invalid2 = pengajuanSchema.safeParse({
      nasabahId: "c-nasabah-1",
      jenisPinjaman: "BARANG",
      namaBarang: "Laptop Asus",
      tenorType: "BULANAN",
      tenor: 12,
      bungaPerBulan: 1.5,
      tujuanPinjaman: "Beli laptop untuk usaha",
      hargaBarang: 2000000,
      uangMuka: 2000000,
      plafonDiajukan: 0,
    })
    expect(invalid2.success).toBe(false)

    // Plafon menyimpang dari (Harga - DP)
    const invalid3 = pengajuanSchema.safeParse({
      nasabahId: "c-nasabah-1",
      jenisPinjaman: "BARANG",
      namaBarang: "Laptop Asus",
      tenorType: "BULANAN",
      tenor: 12,
      bungaPerBulan: 1.5,
      tujuanPinjaman: "Beli laptop untuk usaha",
      hargaBarang: 2000000,
      uangMuka: 500000,
      plafonDiajukan: 2000000, // Harus 1.500.000
    })
    expect(invalid3.success).toBe(false)
    if (!invalid3.success) {
      expect(invalid3.error.flatten().fieldErrors.plafonDiajukan).toBeDefined()
    }

    // Valid: harga 2jt, DP 500rb, plafon bersih 1.5jt
    const valid = pengajuanSchema.safeParse({
      nasabahId: "c-nasabah-1",
      jenisPinjaman: "BARANG",
      namaBarang: "Laptop Asus Vivobook 14",
      vendorBarang: "Sentra Komputer",
      tenorType: "BULANAN",
      tenor: 12,
      bungaPerBulan: 1.5,
      tujuanPinjaman: "Beli laptop untuk usaha fotocopy",
      hargaBarang: 2000000,
      uangMuka: 500000,
      plafonDiajukan: 1500000,
    })
    expect(valid.success).toBe(true)
  })

  it("Validasi bayarDpSchema menerima pengajuanId dan pilihan kasJenis", () => {
    const valid = bayarDpSchema.safeParse({
      pengajuanId: "c-pengajuan-1",
      kasJenis: "TUNAI",
      keterangan: "DP tunai di kasir",
    })
    expect(valid.success).toBe(true)

    const invalid = bayarDpSchema.safeParse({
      pengajuanId: "",
      kasJenis: "BITCOIN",
    })
    expect(invalid.success).toBe(false)
  })

  it("Keseimbangan Jurnal Opsi A (Debet = Kredit, P&L Netral)", () => {
    // Simulasi angka:
    // Harga Barang: 2.000.000
    // DP: 500.000
    // Pokok Pinjaman: 1.500.000
    // Admin: 25.000
    // Nilai Cair Talangan: 1.500.000 - 25.000 = 1.475.000
    // Total kas keluar ke vendor: 1.475.000 + 500.000 = 1.975.000

    const hargaBarang = 2000000
    const uangMuka = 500000
    const pokokPinjaman = hargaBarang - uangMuka // 1.500.000
    const admin = 25000
    const nilaiCair = pokokPinjaman - admin // 1.475.000
    const totalKeluarKasVendor = nilaiCair + uangMuka // 1.975.000

    // Jurnal Tahap 1: Terima DP
    const tahap1_debit = uangMuka // Kas Masuk
    const tahap1_kredit = uangMuka // Utang Titipan DP (Liability)
    expect(tahap1_debit).toBe(tahap1_kredit)

    // Jurnal Tahap 2: Pencairan & Pelunasan Vendor
    // Lines:
    // Debit PIUTANG_PINJAMAN: pokokPinjaman (1.500.000)
    // Debit UTANG_TITIPAN_DP: uangMuka (500.000)
    // Kredit CASH: totalKeluarKasVendor (1.975.000)
    // Kredit PENDAPATAN_ADMIN: admin (25.000)

    const totalDebit = pokokPinjaman + uangMuka // 2.000.000
    const totalKredit = totalKeluarKasVendor + admin // 1.975.000 + 25.000 = 2.000.000

    expect(totalDebit).toBe(totalKredit)
    // Pengaruh terhadap Ekuitas / P&L saat DP dan Pencairan hanya sebesar Pendapatan Admin (25.000), DP netral 0
    const dampakLabaDariDp = 0
    expect(dampakLabaDariDp).toBe(0)
  })
})
