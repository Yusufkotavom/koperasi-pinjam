import { beforeEach, describe, expect, it, vi } from "vitest"
import { readCsv } from "./helpers"

const authMock = vi.fn(async () => ({ user: { id: "u1", companyId: "c1", roles: ["ADMIN"] } }))

vi.mock("@/lib/auth", () => ({ auth: authMock }))

describe("report export API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("exports arus kas CSV", async () => {
    vi.doMock("@/actions/kas", () => ({
      getArusKasReport: vi.fn(async () => ({
        from: new Date("2026-05-01"),
        to: new Date("2026-05-31"),
        groupBy: "MONTH",
        data: [{ key: "Mei 2026", masuk: 1000, keluar: 500, surplus: 500 }],
        totals: { masuk: 1000, keluar: 500, surplus: 500 },
      })),
    }))
    const { GET } = await import("@/app/api/export/arus-kas/route")
    const res = await GET(new Request("http://localhost/api/export/arus-kas?groupBy=MONTH"))
    const csv = await readCsv(res)
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toContain("text/csv")
    expect(csv).toContain("periode,kas_masuk,kas_keluar,surplus")
    expect(csv).toContain("TOTAL")
  })

  it("exports buku besar CSV", async () => {
    vi.doMock("@/actions/akuntansi", () => ({
      getLedgerKasReport: vi.fn(async () => ({
        account: { id: "a1", code: "CASH_TUNAI", name: "Kas Tunai" },
        accounts: [],
        openingBalance: 0,
        closingBalance: 100,
        period: { mode: "MONTH", month: 5, year: 2026, week: 1, fromInput: "2026-05-01", toInput: "2026-05-31", label: "Mei 2026" },
        data: [
          {
            id: "r1",
            tanggal: "2026-05-02T00:00:00.000Z",
            kategori: "SETORAN",
            deskripsi: "Test",
            debit: 100,
            kredit: 0,
            saldo: 100,
            inputOleh: "Admin",
            buktiUrl: null,
          },
        ],
      })),
      getNeracaSederhana: vi.fn(),
      getRekonsiliasiKasList: vi.fn(),
    }))
    const { GET } = await import("@/app/api/export/buku-besar/route")
    const res = await GET(new Request("http://localhost/api/export/buku-besar"))
    const csv = await readCsv(res)
    expect(res.status).toBe(200)
    expect(csv).toContain("tanggal,kategori,deskripsi,debit,kredit,saldo,input_oleh,bukti_url")
    expect(csv).toContain("SETORAN")
  })

  it("exports neraca CSV", async () => {
    vi.doMock("@/actions/akuntansi", () => ({
      getNeracaSederhana: vi.fn(async () => ({
        period: { mode: "MONTH", month: 5, year: 2026, week: 1, fromInput: "2026-05-01", toInput: "2026-05-31", label: "Mei 2026" },
        aset: [{ code: "CASH_TUNAI", label: "Kas Tunai", nilai: 500 }],
        kewajiban: [{ code: "HUTANG", label: "Hutang", nilai: 100 }],
        ekuitas: [{ code: "MODAL", label: "Modal", nilai: 400 }],
        totals: { totalAset: 500, totalKewajiban: 100, totalEkuitas: 400, totalKewajibanEkuitas: 500, selisih: 0, isBalanced: true, totalKas: 500 },
      })),
      getLedgerKasReport: vi.fn(),
      getRekonsiliasiKasList: vi.fn(),
    }))
    const { GET } = await import("@/app/api/export/neraca/route")
    const res = await GET(new Request("http://localhost/api/export/neraca"))
    const csv = await readCsv(res)
    expect(res.status).toBe(200)
    expect(csv).toContain("kelompok,code,label,nilai")
    expect(csv).toContain("ASET,CASH_TUNAI")
    expect(csv).toContain("TOTAL,SELISIH")
  })

  it("exports laba rugi CSV", async () => {
    vi.doMock("@/actions/kas", () => ({
      getLabaRugiSummary: vi.fn(async () => ({
        period: { mode: "MONTH", month: 5, year: 2026, week: 1, fromInput: "2026-05-01", toInput: "2026-05-31", label: "Mei 2026" },
        pendapatan: [{ label: "Bunga", jumlah: 1000 }],
        beban: [{ label: "Operasional", jumlah: 400 }],
        totalPendapatan: 1000,
        totalBeban: 400,
        laba: 600,
      })),
    }))
    const { GET } = await import("@/app/api/export/laba-rugi/route")
    const res = await GET(new Request("http://localhost/api/export/laba-rugi"))
    const csv = await readCsv(res)
    expect(res.status).toBe(200)
    expect(csv).toContain("kelompok,label,jumlah")
    expect(csv).toContain("PENDAPATAN,Bunga,1000")
    expect(csv).toContain("TOTAL,Laba Bersih,600")
  })

  it("exports rekonsiliasi CSV", async () => {
    vi.doMock("@/actions/akuntansi", () => ({
      getRekonsiliasiKasList: vi.fn(async () => ({
        cashAccounts: [],
        rows: [
          {
            id: "x1",
            account: { name: "Kas Tunai" },
            periodMonth: 5,
            periodYear: 2026,
            saldoBook: "1000",
            saldoStatement: "900",
            selisih: "-100",
            status: "DRAFT",
            createdBy: { name: "Admin" },
            catatan: null,
            buktiUrl: null,
          },
        ],
      })),
      getLedgerKasReport: vi.fn(),
      getNeracaSederhana: vi.fn(),
    }))
    const { GET } = await import("@/app/api/export/rekonsiliasi/route")
    const res = await GET(new Request("http://localhost/api/export/rekonsiliasi"))
    const csv = await readCsv(res)
    expect(res.status).toBe(200)
    expect(csv).toContain("account,period_month,period_year,saldo_buku,saldo_statement,selisih,status,dibuat_oleh,catatan,bukti_url")
    expect(csv).toContain("Kas Tunai,5,2026,1000,900,-100,DRAFT,Admin")
  })

  it("exports transaksi per user CSV", async () => {
    vi.doMock("@/actions/pembayaran", () => ({
      getLaporanTransaksiUserReport: vi.fn(async () => ({
        period: { mode: "MONTH", month: 5, year: 2026, week: 1, fromInput: "2026-05-01", toInput: "2026-05-31", label: "Mei 2026" },
        kelompokOptions: [],
        summary: { totalDibayar: 0, kurang: 0, outstanding: 0, anomaliPembayaran: 0 },
        data: [
          {
            nasabahId: "n1",
            namaLengkap: "Budi",
            nomorAnggota: "AG001",
            kelompok: "Klp A",
            totalTagihan: 1000,
            totalDibayar: 700,
            kurangAngsuran: 300,
            outstanding: 2000,
            selesai: 3,
            belumJatuhTempo: 1,
            telat: 2,
            ranking: "B",
            tunggakanNominal: 300,
          },
        ],
      })),
    }))
    const { GET } = await import("@/app/api/export/transaksi-per-user/route")
    const res = await GET(new Request("http://localhost/api/export/transaksi-per-user"))
    const csv = await readCsv(res)
    expect(res.status).toBe(200)
    expect(csv).toContain("nasabah,nomor_anggota,kelompok,total_tagihan,total_dibayar,kurang_angsuran,outstanding,selesai,belum_jatuh_tempo,telat,ranking")
    expect(csv).toContain("Budi,AG001,Klp A,1000,700,300,2000,3,1,2,B")
  })
})

