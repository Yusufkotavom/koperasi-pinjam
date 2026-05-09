import { z } from "zod"

export const simpananSchema = z.object({
  namaPenyimpan: z.string().min(3, "Nama minimal 3 karakter"),
  nik: z.string().optional(),
  noHp: z.string().min(10, "No HP minimal 10 digit"),
  alamat: z.string().optional(),
  saldoAwal: z.coerce.number().min(100000, "Saldo minimal Rp 100.000"),
  persenBagiHasil: z.coerce.number().min(0).max(100, "Persen 0-100"),
  periodeBagiHasil: z.enum(["BULANAN", "TRIWULAN", "TAHUNAN"]).default("BULANAN"),
})

export type SimpananInput = z.infer<typeof simpananSchema>

export const transaksiSimpananSchema = z.object({
  simpananId: z.string(),
  jenis: z.enum(["SETOR", "TARIK"]),
  jumlah: z.coerce.number().min(1, "Jumlah harus positif"),
  keterangan: z.string().optional(),
})

export type TransaksiSimpananInput = z.infer<typeof transaksiSimpananSchema>
