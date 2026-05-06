import { beforeEach, describe, expect, it, vi } from "vitest"
import { readCsv } from "./helpers"

const authMock = vi.fn(async () => ({ user: { id: "u1", companyId: "c1", roles: ["ADMIN"] } }))
const requireCompanyIdMock = vi.fn(() => ({ companyId: "c1" }))

const findManyPinjaman = vi.fn(async () => [
  {
    id: "p1",
    nomorKontrak: "K-001",
    status: "AKTIF",
    tenorType: "MINGGUAN",
    pokokPinjaman: 1_000_000,
    sisaPinjaman: 700_000,
    tanggalCair: new Date("2026-05-01"),
    tanggalJatuhTempo: new Date("2026-06-01"),
    pengajuan: {
      nasabah: { namaLengkap: "Andi", nomorAnggota: "AG001", noHp: "0812" },
      kelompok: { nama: "Kel A", wilayah: "Wonosobo" },
    },
  },
])
const findManyJadwal = vi.fn(async () => [{ pinjamanId: "p1" }])

vi.mock("@/lib/auth", () => ({ auth: authMock }))
vi.mock("@/lib/tenant", () => ({ requireCompanyId: requireCompanyIdMock }))
vi.mock("@/lib/prisma", () => ({
  prisma: {
    pinjaman: { findMany: findManyPinjaman },
    jadwalAngsuran: { findMany: findManyJadwal },
  },
}))

describe("export pokok berjalan API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("exports detail mode CSV", async () => {
    const { GET } = await import("@/app/api/export/pokok-berjalan/route")
    const res = await GET(new Request("http://localhost/api/export/pokok-berjalan?mode=detail"))
    const csv = await readCsv(res)
    expect(res.status).toBe(200)
    expect(csv).toContain("nomor_kontrak,status,sistem,nasabah")
    expect(csv).toContain("K-001,AKTIF,MINGGUAN,Andi")
  })

  it("exports summary mode CSV", async () => {
    const { GET } = await import("@/app/api/export/pokok-berjalan/route")
    const res = await GET(new Request("http://localhost/api/export/pokok-berjalan?mode=summary"))
    const csv = await readCsv(res)
    expect(res.status).toBe(200)
    expect(csv).toContain("total_kontrak")
    expect(csv).toContain(",1,1,1000000,700000,700000,0,1")
  })
})

