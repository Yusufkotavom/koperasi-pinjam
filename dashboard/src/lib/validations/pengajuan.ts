import { z } from "zod"

export const pengajuanSchema = z.object({
  nasabahId: z.string().min(1, "Pilih nasabah"),
  kelompokId: z.string().optional(),
  jenisPinjaman: z.enum(["REGULAR", "MIKRO", "USAHA", "BARANG"]).default("REGULAR"),
  tenorType: z.enum(["BULANAN", "MINGGUAN"]).default("BULANAN"),
  plafonDiajukan: z.coerce.number().min(1, "Harus isi nominal positif").max(100000000, "Maksimal Rp 100 juta"),
  tenor: z.coerce.number().min(1).max(36),
  bungaPerBulan: z.coerce.number().min(0),
  tujuanPinjaman: z.string().min(5, "Tujuan harus diisi"),
  agunan: z.string().optional(),
  catatanPengajuan: z.string().optional(),
  dokumenPendukungUrls: z.array(z.string().min(3)).optional(),

  // Khusus Kredit Barang (Opsi A)
  namaBarang: z.string().optional(),
  hargaBarang: z.coerce.number().min(0).optional(),
  uangMuka: z.coerce.number().min(0).optional(),
  vendorBarang: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.jenisPinjaman === "BARANG") {
    if (!data.namaBarang || data.namaBarang.trim().length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["namaBarang"],
        message: "Nama barang wajib diisi minimal 3 karakter",
      })
    }
    const harga = Number(data.hargaBarang || 0)
    const dp = Number(data.uangMuka || 0)
    if (harga <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hargaBarang"],
        message: "Harga barang harus lebih besar dari Rp 0",
      })
    }
    if (dp < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["uangMuka"],
        message: "Uang muka tidak boleh negatif",
      })
    }
    if (harga > 0 && dp >= harga) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["uangMuka"],
        message: "Uang muka tidak boleh melebihi atau sama dengan harga barang",
      })
    }
    // Plafon bersih harus cocok harga - DP
    if (harga > 0 && dp < harga) {
      const expectedPlafon = harga - dp
      if (Math.abs(data.plafonDiajukan - expectedPlafon) > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["plafonDiajukan"],
          message: `Plafon diajukan harus tepat selisih harga barang - DP (Rp ${expectedPlafon.toLocaleString("id-ID")})`,
        })
      }
    }
  }
})

export type PengajuanInput = z.infer<typeof pengajuanSchema>

export const approvalSchema = z.object({
  pengajuanId: z.string(),
  aksi: z.enum(["SETUJU", "TOLAK"]),
  plafonDisetujui: z.coerce.number().optional(),
  // Bunga flat per bulan dalam PERSEN (mis. 1.5 = 1,5%/bulan). Opsional saat approval.
  bungaDisetujui: z.coerce.number().min(0, "Bunga tidak boleh negatif").max(100, "Bunga maksimal 100%").optional(),
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

export const bayarDpSchema = z.object({
  pengajuanId: z.string().min(1, "Pengajuan ID wajib"),
  kasJenis: z.enum(["TUNAI", "BANK"]).default("TUNAI"),
  keterangan: z.string().optional(),
  buktiDpUrl: z.string().optional(),
})

export type BayarDpInput = z.infer<typeof bayarDpSchema>
