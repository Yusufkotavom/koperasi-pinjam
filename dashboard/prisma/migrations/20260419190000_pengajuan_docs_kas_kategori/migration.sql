-- Add Pengajuan notes + supporting documents
ALTER TABLE "pengajuan"
ADD COLUMN IF NOT EXISTS "catatanPengajuan" TEXT;

ALTER TABLE "pengajuan"
ADD COLUMN IF NOT EXISTS "dokumenPendukungUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Kas kategori master (to support category management + enforce uniqueness)
CREATE TABLE IF NOT EXISTS "kas_kategori" (
  "id" TEXT NOT NULL,
  "nama" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "jenis" "JenisKas" NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "kas_kategori_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "kas_kategori_key_key" ON "kas_kategori"("key");
