import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireCompanyId } from "@/lib/tenant"

type ExportMode = "detail" | "summary" | "tenor" | "risk" | "nasabah"
type TenorFilter = "MINGGUAN" | "BULANAN" | "ALL"
type StatusFilter = "AKTIF" | "MENUNGGAK" | "ALL"

type ExportRow = Record<string, string | number | boolean | null | undefined>

function csvEscape(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) return ""
  const raw = String(value)
  if (raw.includes(",") || raw.includes("\"") || raw.includes("\n")) {
    return `"${raw.replace(/"/g, "\"\"")}"`
  }
  return raw
}

function toCsv(rows: ExportRow[]) {
  if (rows.length === 0) return "info\nTidak ada data\n"
  const headers = Object.keys(rows[0])
  const lines = [headers.join(",")]
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(","))
  }
  return `${lines.join("\n")}\n`
}

function fmtDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

function parseMode(value: string | null): ExportMode {
  if (value === "summary" || value === "tenor" || value === "risk" || value === "nasabah") return value
  return "detail"
}

function parseTenor(value: string | null): TenorFilter {
  if (value === "MINGGUAN" || value === "BULANAN") return value
  return "ALL"
}

function parseStatus(value: string | null): StatusFilter {
  if (value === "AKTIF" || value === "MENUNGGAK") return value
  return "ALL"
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { companyId } = requireCompanyId(
    session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null,
  )

  const { searchParams } = new URL(request.url)
  const mode = parseMode(searchParams.get("mode"))
  const tenorType = parseTenor(searchParams.get("tenorType"))
  const status = parseStatus(searchParams.get("status"))
  const search = searchParams.get("search")?.trim()
  const today = new Date()
  const end7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

  const loans = await prisma.pinjaman.findMany({
    where: {
      companyId,
      status: status === "ALL" ? { in: ["AKTIF", "MENUNGGAK"] } : status,
      ...(tenorType === "ALL" ? {} : { tenorType }),
      ...(search
        ? {
            OR: [
              { nomorKontrak: { contains: search, mode: "insensitive" } },
              { pengajuan: { nasabah: { namaLengkap: { contains: search, mode: "insensitive" } } } },
              { pengajuan: { nasabah: { nomorAnggota: { contains: search, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      nomorKontrak: true,
      status: true,
      tenorType: true,
      pokokPinjaman: true,
      sisaPinjaman: true,
      tanggalCair: true,
      tanggalJatuhTempo: true,
      pengajuan: {
        select: {
          nasabah: {
            select: {
              namaLengkap: true,
              nomorAnggota: true,
              noHp: true,
            },
          },
          kelompok: {
            select: {
              nama: true,
              wilayah: true,
            },
          },
        },
      },
    },
    orderBy: [{ tenorType: "asc" }, { sisaPinjaman: "desc" }],
  })

  const loanIds = loans.map((loan) => loan.id)
  const [dueSoonRows, overdueRows] = await Promise.all([
    loanIds.length === 0
      ? Promise.resolve([])
      : prisma.jadwalAngsuran.findMany({
          where: {
            companyId,
            pinjamanId: { in: loanIds },
            sudahDibayar: false,
            tanggalJatuhTempo: { gte: today, lte: end7Days },
          },
          select: { pinjamanId: true },
        }),
    loanIds.length === 0
      ? Promise.resolve([])
      : prisma.jadwalAngsuran.findMany({
          where: {
            companyId,
            pinjamanId: { in: loanIds },
            sudahDibayar: false,
            tanggalJatuhTempo: { lt: today },
          },
          select: { pinjamanId: true },
        }),
  ])

  const dueSoonByLoanId = new Set(dueSoonRows.map((row) => row.pinjamanId))
  const overdueByLoanId = new Set(overdueRows.map((row) => row.pinjamanId))

  const rows = loans.map((loan) => {
    const principal = Number(loan.pokokPinjaman ?? 0)
    const outstanding = Number(loan.sisaPinjaman ?? 0)
    const progressPct = principal > 0 ? ((principal - outstanding) / principal) * 100 : 0
    return {
      id: loan.id,
      nomorKontrak: loan.nomorKontrak,
      status: loan.status,
      tenorType: loan.tenorType,
      pokokPinjaman: principal,
      sisaPinjaman: outstanding,
      progressPct: Math.max(0, Math.min(100, progressPct)),
      tanggalCair: loan.tanggalCair,
      tanggalJatuhTempo: loan.tanggalJatuhTempo,
      due7Days: dueSoonByLoanId.has(loan.id),
      overdue: overdueByLoanId.has(loan.id),
      nasabah: {
        namaLengkap: loan.pengajuan.nasabah.namaLengkap,
        nomorAnggota: loan.pengajuan.nasabah.nomorAnggota,
        noHp: loan.pengajuan.nasabah.noHp,
      },
      kelompok: {
        nama: loan.pengajuan.kelompok?.nama ?? "—",
        wilayah: loan.pengajuan.kelompok?.wilayah ?? "—",
      },
    }
  })

  const summary = {
    generatedAt: new Date().toISOString(),
    totalPrincipal: rows.reduce((sum, row) => sum + row.pokokPinjaman, 0),
    totalOutstanding: rows.reduce((sum, row) => sum + row.sisaPinjaman, 0),
    totalLoans: rows.length,
    totalBorrowers: new Set(rows.map((row) => row.nasabah.nomorAnggota)).size,
    due7DaysCount: rows.filter((row) => row.due7Days).length,
    overdueCount: rows.filter((row) => row.overdue).length,
    mingguanOutstanding: rows
      .filter((row) => row.tenorType === "MINGGUAN")
      .reduce((sum, row) => sum + row.sisaPinjaman, 0),
    bulananOutstanding: rows
      .filter((row) => row.tenorType === "BULANAN")
      .reduce((sum, row) => sum + row.sisaPinjaman, 0),
  }

  let exportRows: ExportRow[] = []
  if (mode === "detail") {
    exportRows = rows.map((row) => ({
      nomor_kontrak: row.nomorKontrak,
      status: row.status,
      sistem: row.tenorType,
      nasabah: row.nasabah.namaLengkap,
      nomor_anggota: row.nasabah.nomorAnggota,
      no_hp: row.nasabah.noHp,
      kelompok: row.kelompok.nama,
      wilayah: row.kelompok.wilayah,
      tanggal_cair: fmtDate(new Date(row.tanggalCair)),
      jatuh_tempo: fmtDate(new Date(row.tanggalJatuhTempo)),
      pokok_awal: row.pokokPinjaman,
      sisa_pokok: row.sisaPinjaman,
      progress_pct: Number(row.progressPct.toFixed(2)),
      jatuh_tempo_7_hari: row.due7Days,
      overdue: row.overdue,
    }))
  } else if (mode === "summary") {
    exportRows = [
      {
        generated_at: summary.generatedAt,
        filter_tenor: tenorType,
        filter_status: status,
        filter_search: search ?? "",
        total_kontrak: summary.totalLoans,
        total_nasabah: summary.totalBorrowers,
        total_pokok_awal: summary.totalPrincipal,
        total_sisa_pokok: summary.totalOutstanding,
        outstanding_mingguan: summary.mingguanOutstanding,
        outstanding_bulanan: summary.bulananOutstanding,
        jatuh_tempo_7_hari: summary.due7DaysCount,
        overdue: summary.overdueCount,
      },
    ]
  } else if (mode === "tenor") {
    const byTenor = ["MINGGUAN", "BULANAN"].map((tenor) => {
      const filtered = rows.filter((row) => row.tenorType === tenor)
      return {
        sistem: tenor,
        total_kontrak: filtered.length,
        total_nasabah: new Set(filtered.map((row) => row.nasabah.nomorAnggota)).size,
        total_pokok_awal: filtered.reduce((sum, row) => sum + row.pokokPinjaman, 0),
        total_sisa_pokok: filtered.reduce((sum, row) => sum + row.sisaPinjaman, 0),
        avg_sisa_per_kontrak:
          filtered.length > 0 ? filtered.reduce((sum, row) => sum + row.sisaPinjaman, 0) / filtered.length : 0,
        jatuh_tempo_7_hari: filtered.filter((row) => row.due7Days).length,
        overdue: filtered.filter((row) => row.overdue).length,
      }
    })
    exportRows = byTenor
  } else if (mode === "risk") {
    exportRows = rows
      .filter((row) => row.overdue || row.due7Days)
      .map((row) => ({
        prioritas: row.overdue ? "TINGGI-OVERDUE" : "SEDANG-JATUH_TEMPO_7_HARI",
        nomor_kontrak: row.nomorKontrak,
        sistem: row.tenorType,
        status: row.status,
        nasabah: row.nasabah.namaLengkap,
        nomor_anggota: row.nasabah.nomorAnggota,
        no_hp: row.nasabah.noHp,
        kelompok: row.kelompok.nama,
        wilayah: row.kelompok.wilayah,
        sisa_pokok: row.sisaPinjaman,
        jatuh_tempo: fmtDate(new Date(row.tanggalJatuhTempo)),
      }))
  } else {
    const mapByNasabah = new Map<
      string,
      {
        nasabah: string
        nomor_anggota: string
        no_hp: string
        total_kontrak: number
        total_pokok_awal: number
        total_sisa_pokok: number
        kontrak_overdue: number
        kontrak_due7: number
      }
    >()
    for (const row of rows) {
      const key = row.nasabah.nomorAnggota
      const existing = mapByNasabah.get(key)
      if (!existing) {
        mapByNasabah.set(key, {
          nasabah: row.nasabah.namaLengkap,
          nomor_anggota: row.nasabah.nomorAnggota,
          no_hp: row.nasabah.noHp,
          total_kontrak: 1,
          total_pokok_awal: row.pokokPinjaman,
          total_sisa_pokok: row.sisaPinjaman,
          kontrak_overdue: row.overdue ? 1 : 0,
          kontrak_due7: row.due7Days ? 1 : 0,
        })
      } else {
        existing.total_kontrak += 1
        existing.total_pokok_awal += row.pokokPinjaman
        existing.total_sisa_pokok += row.sisaPinjaman
        existing.kontrak_overdue += row.overdue ? 1 : 0
        existing.kontrak_due7 += row.due7Days ? 1 : 0
      }
    }
    exportRows = Array.from(mapByNasabah.values()).sort((a, b) => b.total_sisa_pokok - a.total_sisa_pokok)
  }

  const csv = toCsv(exportRows)
  const filename = `export-pokok-berjalan-${mode}-${new Date().toISOString().slice(0, 10)}.csv`
  return new Response(`\uFEFF${csv}`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"${filename}\"`,
      "Cache-Control": "no-store",
    },
  })
}
