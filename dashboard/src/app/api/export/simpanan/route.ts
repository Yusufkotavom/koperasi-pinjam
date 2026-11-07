import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireCompanyId } from "@/lib/tenant"
import { csvResponse, formatDateId, formatDateTimeId, formatExcelText, formatPhoneNumber, type CsvOptions } from "@/lib/export-utils"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { companyId } = requireCompanyId(session as any)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""

    const where: any = {
      AND: [
        { companyId },
        status ? { status: status as "AKTIF" | "TUTUP" } : {},
        search
          ? {
              OR: [
                { namaPenyimpan: { contains: search, mode: "insensitive" } },
                { nomorRekening: { contains: search, mode: "insensitive" } },
                { nik: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    }

    const [company, data] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId }, select: { name: true } }),
      prisma.simpanan.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              penggunaan: { where: { statusKembali: "TERPAKAI" } },
            },
          },
        },
      }),
    ])

    const rows = data.map((item, idx) => ({
      "No.": idx + 1,
      "No. Rekening": item.nomorRekening,
      "Nama Penyimpan": item.namaPenyimpan,
      "NIK": item.nik ? formatExcelText(item.nik) : "-",
      "No. HP": formatPhoneNumber(item.noHp),
      "Alamat": item.alamat || "-",
      "Saldo Awal (Rp)": Number(item.saldoAwal),
      "Saldo Tersedia (Rp)": Number(item.saldoTersedia),
      "Saldo Terpakai (Rp)": Number(item.saldoTerpakai),
      "Persen Bagi Hasil (%)": Number(item.persenBagiHasil),
      "Periode Bagi Hasil": item.periodeBagiHasil,
      "Status": item.status,
      "Tanggal Buka": formatDateId(item.tanggalBuka),
      "Tanggal Tutup": item.tanggalTutup ? formatDateId(item.tanggalTutup) : "-",
      "Pinjaman Aktif": item._count.penggunaan,
    }))

    const totalSaldoAwal = rows.reduce((acc, r) => acc + Number(r["Saldo Awal (Rp)"]), 0)
    const totalSaldoTersedia = rows.reduce((acc, r) => acc + Number(r["Saldo Tersedia (Rp)"]), 0)
    const totalSaldoTerpakai = rows.reduce((acc, r) => acc + Number(r["Saldo Terpakai (Rp)"]), 0)

    const totalRow = {
      "No.": "TOTAL",
      "No. Rekening": `${rows.length} Rekening`,
      "Nama Penyimpan": "",
      "NIK": "",
      "No. HP": "",
      "Alamat": "",
      "Saldo Awal (Rp)": totalSaldoAwal,
      "Saldo Tersedia (Rp)": totalSaldoTersedia,
      "Saldo Terpakai (Rp)": totalSaldoTerpakai,
      "Persen Bagi Hasil (%)": "",
      "Periode Bagi Hasil": "",
      "Status": "",
      "Tanggal Buka": "",
      "Tanggal Tutup": "",
      "Pinjaman Aktif": "",
    }

    const filterInfo: string[] = []
    if (status) filterInfo.push(`Status: ${status}`)
    if (search) filterInfo.push(`Pencarian: "${search}"`)
    if (filterInfo.length === 0) filterInfo.push("Semua Data Rekening Simpanan")

    const options: CsvOptions = {
      header: {
        companyName: company?.name || "KOPERASI SIMPAN PINJAM",
        title: "LAPORAN MASTER DATA SIMPANAN & TABUNGAN",
        generatedAt: formatDateTimeId(new Date()),
        filterInfo,
      },
      totalRow,
    }

    return csvResponse(rows, `simpanan-${new Date().toISOString().slice(0, 10)}.csv`, options)
  } catch (error) {
    console.error("Export simpanan error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
