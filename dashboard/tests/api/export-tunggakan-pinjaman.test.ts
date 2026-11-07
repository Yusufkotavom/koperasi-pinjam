import { beforeEach, describe, expect, it, vi } from "vitest"
import { readCsv } from "./helpers"

const authMock = vi.fn(async () => ({ user: { id: "u1", companyId: "c1", roles: ["ADMIN"] } }))
const requireCompanyIdMock = vi.fn(() => ({ companyId: "c1" }))

const findManyJadwal = vi.fn(async () => [
  {
    id: "j1",
    angsuranKe: 3,
    tanggalJatuhTempo: new Date("2026-05-01"),
    pokok: 250000,
    bunga: 25000,
    total: 275000,
    pinjaman: {
      nomorKontrak: "KTR-2605-000001",
      tenorType: "MINGGUAN",
      pengajuan: {
        nasabah: {
          namaLengkap: "Budi Santoso",
          nomorAnggota: "AG-0001",
          noHp: "08123456789",
          kolektor: { name: "Kolektor A" },
        },
        kelompok: { id: "k1", nama: "Kelompok Mawar", wilayah: "Pasar Rebo" },
      },
    },
  },
])

const findManyPinjaman = vi.fn(async () => [
  {
    id: "p1",
    nomorKontrak: "KTR-2605-000001",
    status: "AKTIF",
    tenorType: "MINGGUAN",
    tenor: 10,
    pokokPinjaman: 2500000,
    bungaPerBulan: 0.1,
    angsuranPokok: 250000,
    angsuranBunga: 25000,
    totalAngsuran: 275000,
    nilaiCair: 2350000,
    sisaPinjaman: 1750000,
    tanggalCair: new Date("2026-05-01"),
    tanggalJatuhTempo: new Date("2026-07-01"),
    pengajuan: {
      nasabah: {
        namaLengkap: "Budi Santoso",
        nomorAnggota: "AG-0001",
        noHp: "08123456789",
        kolektor: { name: "Kolektor A" },
      },
      kelompok: { nama: "Kelompok Mawar", wilayah: "Pasar Rebo" },
    },
  },
])

const findManyPembayaran = vi.fn(async () => [
  {
    id: "byr1",
    nomorTransaksi: "BYR-2605-000001",
    tanggalBayar: new Date("2026-05-08"),
    pokok: 250000,
    bunga: 25000,
    denda: 0,
    totalBayar: 275000,
    metode: "TUNAI",
    catatan: "Angsuran ke-1",
    inputOleh: { name: "Kasir 1" },
    pinjaman: {
      nomorKontrak: "KTR-2605-000001",
      tenorType: "MINGGUAN",
      pengajuan: {
        nasabah: {
          namaLengkap: "Budi Santoso",
          nomorAnggota: "AG-0001",
          noHp: "08123456789",
        },
        kelompok: { nama: "Kelompok Mawar" },
      },
    },
  },
])

const findUniqueCompany = vi.fn(async () => ({ name: "KSP Mitradana Mandiri" }))
const findUniqueUser = vi.fn(async () => ({ name: "Kolektor A" }))
const findUniqueKelompok = vi.fn(async () => ({ nama: "Kelompok Mawar" }))

vi.mock("@/lib/auth", () => ({ auth: authMock }))
vi.mock("@/lib/tenant", () => ({ requireCompanyId: requireCompanyIdMock }))
vi.mock("@/lib/prisma", () => ({
  prisma: {
    company: { findUnique: findUniqueCompany },
    user: { findUnique: findUniqueUser },
    kelompok: { findUnique: findUniqueKelompok },
    jadwalAngsuran: { findMany: findManyJadwal },
    pinjaman: { findMany: findManyPinjaman },
    pembayaran: { findMany: findManyPembayaran },
  },
}))

describe("Export Tunggakan, Pinjaman, dan Pembayaran API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("exports tunggakan CSV with structured report header, clean columns and total row", async () => {
    const { GET } = await import("@/app/api/export/tunggakan/route")
    const res = await GET(new Request("http://localhost/api/export/tunggakan"))
    expect(res.status).toBe(200)
    const csv = await readCsv(res)
    // Check header metadata
    expect(csv).toContain("KSP MITRADANA MANDIRI")
    expect(csv).toContain("LAPORAN DATA TUNGGAKAN PINJAMAN (AGING REPORT)")
    expect(csv).toContain("Waktu Unduh:")
    // Check clean column headers
    expect(csv).toContain("No.,No. Kontrak,No. Anggota,Nama Nasabah,No. HP,Kelompok,Wilayah,Kolektor,Skema Tenor,Angsuran Ke,Tgl Jatuh Tempo,Hari Terlambat,Status Aging,Pokok (Rp),Bunga (Rp),Total Tagihan (Rp)")
    // Check data row with formatted phone number
    expect(csv).toContain("KTR-2605-000001,AG-0001,Budi Santoso,0812-3456-789,Kelompok Mawar,Pasar Rebo,Kolektor A,Mingguan,3")
    // Check total summary row
    expect(csv).toContain("TOTAL")
    expect(csv).toContain("1 Data Tunggakan")
  })

  it("exports pinjaman CSV with structured report header, clean columns and total row", async () => {
    const { GET } = await import("@/app/api/export/pinjaman/route")
    const res = await GET(new Request("http://localhost/api/export/pinjaman"))
    expect(res.status).toBe(200)
    const csv = await readCsv(res)
    expect(csv).toContain("LAPORAN DAFTAR PINJAMAN ANGGOTA")
    expect(csv).toContain("No.,No. Kontrak,No. Anggota,Nama Nasabah,No. HP,Kelompok,Wilayah,Kolektor,Status,Skema Tenor,Tenor,Pokok Pinjaman (Rp)")
    expect(csv).toContain("KTR-2605-000001,AG-0001,Budi Santoso,0812-3456-789,Kelompok Mawar,Pasar Rebo,Kolektor A,AKTIF,Mingguan,10 Minggu,2500000")
    expect(csv).toContain("TOTAL")
  })

  it("exports pembayaran CSV with structured report header, clean columns and total row", async () => {
    const { GET } = await import("@/app/api/export/pembayaran/route")
    const res = await GET(new Request("http://localhost/api/export/pembayaran"))
    expect(res.status).toBe(200)
    const csv = await readCsv(res)
    expect(csv).toContain("LAPORAN RIWAYAT PEMBAYARAN ANGSURAN")
    expect(csv).toContain("No.,No. Transaksi,No. Kontrak,No. Anggota,Nama Nasabah,No. HP,Kelompok,Skema Tenor,Tgl Bayar,Pokok (Rp),Bunga (Rp),Denda (Rp),Total Bayar (Rp),Metode,Petugas Kasir,Catatan")
    expect(csv).toContain("BYR-2605-000001,KTR-2605-000001,AG-0001,Budi Santoso,0812-3456-789,Kelompok Mawar,Mingguan")
    expect(csv).toContain("TOTAL")
  })
})
