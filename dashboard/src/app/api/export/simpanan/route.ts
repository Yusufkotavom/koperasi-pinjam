import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireCompanyId } from "@/lib/tenant"
import { csvResponse } from "@/lib/export-utils"

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

    const data = await prisma.simpanan.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            penggunaan: { where: { statusKembali: "TERPAKAI" } },
          },
        },
      },
    })

    const rows = data.map((item) => ({
      "No. Rekening": item.nomorRekening,
      "Nama Penyimpan": item.namaPenyimpan,
      "NIK": item.nik || "-",
      "No. HP": item.noHp,
      "Alamat": item.alamat || "-",
      "Saldo Awal": Number(item.saldoAwal),
      "Saldo Tersedia": Number(item.saldoTersedia),
      "Saldo Terpakai": Number(item.saldoTerpakai),
      "Persen Bagi Hasil (%)": Number(item.persenBagiHasil),
      "Periode Bagi Hasil": item.periodeBagiHasil,
      "Status": item.status,
      "Tanggal Buka": new Date(item.tanggalBuka).toLocaleDateString("id-ID"),
      "Tanggal Tutup": item.tanggalTutup ? new Date(item.tanggalTutup).toLocaleDateString("id-ID") : "-",
      "Pinjaman Aktif": item._count.penggunaan,
    }))

    return csvResponse(rows, `simpanan-${new Date().toISOString().slice(0, 10)}.csv`)
  } catch (error) {
    console.error("Export simpanan error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

