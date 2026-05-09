import { z } from "zod"

export const pengajuanSchema = z.object({
  nasabahId: z.string().min(1, "Pilih nasabah"),
  kelompokId: z.string().optional(),
  jenisPinjaman: z.enum(["REGULAR", "MIKRO", "USAHA"]).default("REGULAR"),
  tenorType: z.enum(["BULANAN", "MINGGUAN"]).default("BULANAN"),
  plafonDiajukan: z.coerce.number().min(1, "Harus isi nominal positif").max(100000000, "Maksimal Rp 100 juta"),
  tenor: z.coerce.number().min(1).max(36),
  bungaPerBulan: z.coerce.number().min(0),
  tujuanPinjaman: z.string().min(5, "Tujuan harus diisi"),
  agunan: z.string().optional(),
  catatanPengajuan: z.string().optional(),
  dokumenPendukungUrls: z.array(z.string().min(3)).optional(),
})

export type PengajuanInput = z.infer<typeof pengajuanSchema>

export const approvalSchema = z.object({
  pengajuanId: z.string(),
  aksi: z.enum(["SETUJU", "TOLAK"]),
  plafonDisetujui: z.coerce.number().optional(),
  catatanApproval: z.string().optional(),
})

export type ApprovalInput = z.infer<typeof approvalSchema>

export const pencairanSchema = z.object({
  pengajuanId: z.string(),
  potonganAdmin: z.coerce.number().min(0).default(0),
  potonganProvisi: z.coerce.number().min(0).default(0),
  bonusKolektorNominal: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce.number().min(0).optional(),
  ),
  tanggalCair: z.string().min(1, "Tanggal cair wajib diisi"),
  sumberDana: z.enum(["KAS", "SIMPANAN"]).default("KAS"),
  kasJenis: z.enum(["TUNAI", "BANK"]).optional(),
  simpananId: z.string().optional(),
}).refine(
  (data) => {
    if (data.sumberDana === "KAS") return !!data.kasJenis
    if (data.sumberDana === "SIMPANAN") return !!data.simpananId
    return true
  },
  {
    message: "Pilih kas jenis atau simpanan sesuai sumber dana",
    path: ["sumberDana"],
  }
)

export type PencairanInput = z.infer<typeof pencairanSchema>
