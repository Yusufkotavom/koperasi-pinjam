import { z } from "zod"

export const nasabahSchema = z.object({
  namaLengkap: z.string().min(3, "Nama minimal 3 karakter"),
  nik: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || (val.length === 16 && /^\d+$/.test(val)),
      "NIK harus 16 digit angka (jika diisi)"
    ),
  tempatLahir: z.string().optional(),
  tanggalLahir: z.string().optional(),
  alamat: z.string().min(10, "Alamat minimal 10 karakter"),
  kelurahan: z.string().optional(),
  kecamatan: z.string().optional(),
  kotaKab: z.string().optional(),
  noHp: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^(\+62|62|0)8\d{7,11}$/.test(val),
      "Format HP tidak valid (contoh: 08xxxxxxxxxx)"
    ),
  pekerjaan: z.string().optional(),
  namaUsaha: z.string().optional(),
  kelompokId: z.string().optional(),
  kolektorId: z.string().optional(),
  dokumenUrls: z.array(z.string().min(3)).optional(),
  status: z.enum(["AKTIF", "NON_AKTIF", "KELUAR"]).default("AKTIF"),
})

export type NasabahInput = z.infer<typeof nasabahSchema>
