import { prisma } from "@/lib/prisma"
import { format } from "date-fns"

export type JenisNomorDokumen = "AJU" | "KTR" | "BYR"

interface SequenceConfig {
  prefix: JenisNomorDokumen
  seqName: string
}

const SEQUENCE_MAP: Record<JenisNomorDokumen, SequenceConfig> = {
  AJU: { prefix: "AJU", seqName: "seq_nomor_pengajuan" },
  KTR: { prefix: "KTR", seqName: "seq_nomor_kontrak" },
  BYR: { prefix: "BYR", seqName: "seq_nomor_pembayaran" },
}

/**
 * Format string nomor urut:
 * Minimal 6 digit. Jika seq > 999999, otomatis bertambah menjadi 7 digit tanpa terpotong.
 */
export function formatNomorUrut(seq: number): string {
  return String(seq).padStart(6, "0")
}

/**
 * Generate nomor dokumen otomatis yang atomic & concurrency-safe menggunakan PostgreSQL SEQUENCE.
 * - Format: PREFIX-YYMM-XXXXXX (contoh: AJU-2611-000125, KTR-2611-000098, BYR-2611-001250)
 * - Sequence tidak pernah direset (berkelanjutan lintas hari/bulan/tahun).
 * - Bebas dari race condition & duplikasi.
 */
export async function generateNomorDokumen(
  type: JenisNomorDokumen,
  date: Date = new Date(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any = prisma
): Promise<string> {
  const { prefix, seqName } = SEQUENCE_MAP[type]

  // Pastikan sequence PostgreSQL sudah ada
  await client.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS ${seqName} START WITH 1;`)

  // Ambil nomor urut berikutnya secara atomic dari database
  const rawResult = await client.$queryRawUnsafe(
    `SELECT nextval('${seqName}') as nextval;`
  )
  const result = rawResult as Array<{ nextval: bigint | number | string }>
  const nextVal = Number(result[0].nextval)

  const yyMM = format(date, "yyMM")
  const seqStr = formatNomorUrut(nextVal)

  return `${prefix}-${yyMM}-${seqStr}`
}
