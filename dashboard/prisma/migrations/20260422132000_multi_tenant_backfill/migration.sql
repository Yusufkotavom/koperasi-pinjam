-- Multi-tenant baseline: attach all existing rows to demo company.
-- NOTE: This is safe for current single-tenant DB. For real multi-tenant production, run per-customer backfill strategy.

DO $$
DECLARE
  owner_id TEXT;
BEGIN
  SELECT id INTO owner_id FROM "users" WHERE email = 'admin@koperasi.id' LIMIT 1;
  IF owner_id IS NULL THEN
    SELECT id INTO owner_id FROM "users" ORDER BY "createdAt" ASC NULLS LAST LIMIT 1;
  END IF;

  IF owner_id IS NULL THEN
    INSERT INTO "users" ("id","name","email","password","isActive","createdAt","updatedAt")
    VALUES (
      'user_system_owner',
      'System Owner',
      'system@koperasiapp.local',
      '$2b$12$RNj14atU5BE0rJi525nQUesxbn4sf7HPz8PQAm67YJlfuemLmk/Vu',
      true,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("email") DO NOTHING;

    owner_id := 'user_system_owner';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM "companies" WHERE id = 'company_demo_default') THEN
    INSERT INTO "companies" ("id", "name", "slug", "email", "ownerId", "createdAt", "updatedAt")
    VALUES ('company_demo_default', 'Koperasi Demo Sejahtera', 'koperasi-demo-sejahtera', 'admin@koperasi.id', owner_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("slug") DO NOTHING;
  END IF;
END $$;

-- 1) Add companyId columns (nullable), backfill, and enforce NOT NULL + FK.

ALTER TABLE "kelompok" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
UPDATE "kelompok" SET "companyId" = 'company_demo_default' WHERE "companyId" IS NULL;
ALTER TABLE "kelompok" ALTER COLUMN "companyId" SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'kelompok_companyId_fkey') THEN
    ALTER TABLE "kelompok" ADD CONSTRAINT "kelompok_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "kelompok_companyId_idx" ON "kelompok"("companyId");

ALTER TABLE "nasabah" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
UPDATE "nasabah" SET "companyId" = COALESCE("companyId", (SELECT "companyId" FROM "kelompok" k WHERE k.id = "nasabah"."kelompokId" LIMIT 1), 'company_demo_default');
UPDATE "nasabah" SET "companyId" = 'company_demo_default' WHERE "companyId" IS NULL;
ALTER TABLE "nasabah" ALTER COLUMN "companyId" SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'nasabah_companyId_fkey') THEN
    ALTER TABLE "nasabah" ADD CONSTRAINT "nasabah_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "nasabah_companyId_idx" ON "nasabah"("companyId");

ALTER TABLE "penjamin" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
UPDATE "penjamin" p SET "companyId" = n."companyId" FROM "nasabah" n WHERE p."nasabahId" = n.id AND p."companyId" IS NULL;
UPDATE "penjamin" SET "companyId" = 'company_demo_default' WHERE "companyId" IS NULL;
ALTER TABLE "penjamin" ALTER COLUMN "companyId" SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'penjamin_companyId_fkey') THEN
    ALTER TABLE "penjamin" ADD CONSTRAINT "penjamin_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "penjamin_companyId_idx" ON "penjamin"("companyId");

ALTER TABLE "simpanan" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
UPDATE "simpanan" s SET "companyId" = n."companyId" FROM "nasabah" n WHERE s."nasabahId" = n.id AND s."companyId" IS NULL;
UPDATE "simpanan" SET "companyId" = 'company_demo_default' WHERE "companyId" IS NULL;
ALTER TABLE "simpanan" ALTER COLUMN "companyId" SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'simpanan_companyId_fkey') THEN
    ALTER TABLE "simpanan" ADD CONSTRAINT "simpanan_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "simpanan_companyId_idx" ON "simpanan"("companyId");

ALTER TABLE "pengajuan" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
UPDATE "pengajuan" p SET "companyId" = n."companyId" FROM "nasabah" n WHERE p."nasabahId" = n.id AND p."companyId" IS NULL;
UPDATE "pengajuan" SET "companyId" = 'company_demo_default' WHERE "companyId" IS NULL;
ALTER TABLE "pengajuan" ALTER COLUMN "companyId" SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pengajuan_companyId_fkey') THEN
    ALTER TABLE "pengajuan" ADD CONSTRAINT "pengajuan_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "pengajuan_companyId_idx" ON "pengajuan"("companyId");

ALTER TABLE "pinjaman" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
UPDATE "pinjaman" p SET "companyId" = pj."companyId" FROM "pengajuan" pj WHERE p."pengajuanId" = pj.id AND p."companyId" IS NULL;
UPDATE "pinjaman" SET "companyId" = 'company_demo_default' WHERE "companyId" IS NULL;
ALTER TABLE "pinjaman" ALTER COLUMN "companyId" SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pinjaman_companyId_fkey') THEN
    ALTER TABLE "pinjaman" ADD CONSTRAINT "pinjaman_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "pinjaman_companyId_idx" ON "pinjaman"("companyId");

ALTER TABLE "jadwal_angsuran" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
UPDATE "jadwal_angsuran" j SET "companyId" = p."companyId" FROM "pinjaman" p WHERE j."pinjamanId" = p.id AND j."companyId" IS NULL;
UPDATE "jadwal_angsuran" SET "companyId" = 'company_demo_default' WHERE "companyId" IS NULL;
ALTER TABLE "jadwal_angsuran" ALTER COLUMN "companyId" SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jadwal_angsuran_companyId_fkey') THEN
    ALTER TABLE "jadwal_angsuran" ADD CONSTRAINT "jadwal_angsuran_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "jadwal_angsuran_companyId_idx" ON "jadwal_angsuran"("companyId");

ALTER TABLE "pembayaran" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
UPDATE "pembayaran" b SET "companyId" = p."companyId" FROM "pinjaman" p WHERE b."pinjamanId" = p.id AND b."companyId" IS NULL;
UPDATE "pembayaran" SET "companyId" = 'company_demo_default' WHERE "companyId" IS NULL;
ALTER TABLE "pembayaran" ALTER COLUMN "companyId" SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pembayaran_companyId_fkey') THEN
    ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "pembayaran_companyId_idx" ON "pembayaran"("companyId");

ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
UPDATE "accounts" SET "companyId" = 'company_demo_default' WHERE "companyId" IS NULL;
ALTER TABLE "accounts" ALTER COLUMN "companyId" SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'accounts_companyId_fkey') THEN
    ALTER TABLE "accounts" ADD CONSTRAINT "accounts_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "accounts_companyId_idx" ON "accounts"("companyId");

ALTER TABLE "journal_entries" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
UPDATE "journal_entries" SET "companyId" = 'company_demo_default' WHERE "companyId" IS NULL;
ALTER TABLE "journal_entries" ALTER COLUMN "companyId" SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'journal_entries_companyId_fkey') THEN
    ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "journal_entries_companyId_idx" ON "journal_entries"("companyId");

ALTER TABLE "rekonsiliasi_kas" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
UPDATE "rekonsiliasi_kas" SET "companyId" = 'company_demo_default' WHERE "companyId" IS NULL;
ALTER TABLE "rekonsiliasi_kas" ALTER COLUMN "companyId" SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rekonsiliasi_kas_companyId_fkey') THEN
    ALTER TABLE "rekonsiliasi_kas" ADD CONSTRAINT "rekonsiliasi_kas_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "rekonsiliasi_kas_companyId_idx" ON "rekonsiliasi_kas"("companyId");

ALTER TABLE "kas_kategori" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
UPDATE "kas_kategori" SET "companyId" = 'company_demo_default' WHERE "companyId" IS NULL;
ALTER TABLE "kas_kategori" ALTER COLUMN "companyId" SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'kas_kategori_companyId_fkey') THEN
    ALTER TABLE "kas_kategori" ADD CONSTRAINT "kas_kategori_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "kas_kategori_companyId_idx" ON "kas_kategori"("companyId");

ALTER TABLE "kas_transaksi" RENAME COLUMN "kategori" TO "kategoriKey";
ALTER TABLE "kas_transaksi" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
UPDATE "kas_transaksi" SET "companyId" = 'company_demo_default' WHERE "companyId" IS NULL;
ALTER TABLE "kas_transaksi" ALTER COLUMN "companyId" SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'kas_transaksi_companyId_fkey') THEN
    ALTER TABLE "kas_transaksi" ADD CONSTRAINT "kas_transaksi_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "kas_transaksi_companyId_idx" ON "kas_transaksi"("companyId");

ALTER TABLE "kas_transaksi" ADD COLUMN IF NOT EXISTS "kategoriId" TEXT;

-- Drop old FK from kas_transaksi.kategoriKey -> kas_kategori.key if it exists.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'kas_transaksi_kategori_fkey') THEN
    ALTER TABLE "kas_transaksi" DROP CONSTRAINT "kas_transaksi_kategori_fkey";
  END IF;
END $$;

-- Ensure all referenced keys exist in kas_kategori
INSERT INTO "kas_kategori" ("id", "companyId", "nama", "key", "jenis", "isActive", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'company_demo_default',
  kt."kategoriKey",
  kt."kategoriKey",
  kt."jenis",
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT "kategoriKey", "jenis"
  FROM "kas_transaksi"
) kt
LEFT JOIN "kas_kategori" k ON k."companyId" = 'company_demo_default' AND k."key" = kt."kategoriKey"
WHERE k.id IS NULL;

UPDATE "kas_transaksi" t
SET "kategoriId" = k.id
FROM "kas_kategori" k
WHERE t."kategoriId" IS NULL
  AND k."companyId" = t."companyId"
  AND k."key" = t."kategoriKey";

ALTER TABLE "kas_transaksi" ALTER COLUMN "kategoriId" SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'kas_transaksi_kategoriId_fkey') THEN
    ALTER TABLE "kas_transaksi" ADD CONSTRAINT "kas_transaksi_kategoriId_fkey"
    FOREIGN KEY ("kategoriId") REFERENCES "kas_kategori"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "kas_transaksi_kategoriId_idx" ON "kas_transaksi"("kategoriId");

ALTER TABLE "kolektor_targets" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
UPDATE "kolektor_targets" SET "companyId" = 'company_demo_default' WHERE "companyId" IS NULL;
ALTER TABLE "kolektor_targets" ALTER COLUMN "companyId" SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'kolektor_targets_companyId_fkey') THEN
    ALTER TABLE "kolektor_targets" ADD CONSTRAINT "kolektor_targets_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "kolektor_targets_companyId_idx" ON "kolektor_targets"("companyId");

ALTER TABLE "notifikasi" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
UPDATE "notifikasi" SET "companyId" = 'company_demo_default' WHERE "companyId" IS NULL;
ALTER TABLE "notifikasi" ALTER COLUMN "companyId" SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifikasi_companyId_fkey') THEN
    ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "notifikasi_companyId_idx" ON "notifikasi"("companyId");

-- 2) Per-company settings table
CREATE TABLE IF NOT EXISTS "company_settings" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "company_settings_key_idx" ON "company_settings"("key");
CREATE UNIQUE INDEX IF NOT EXISTS "company_settings_companyId_key_key" ON "company_settings"("companyId","key");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_settings_companyId_fkey') THEN
    ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- migrate selected app_settings into company_settings for demo company if present
INSERT INTO "company_settings" ("id","companyId","key","value","updatedAt")
SELECT gen_random_uuid()::text, 'company_demo_default', s."key", s."value", COALESCE(s."updatedAt", CURRENT_TIMESTAMP)
FROM "app_settings" s
WHERE s."key" IN ('RANKING_CONFIG', 'COMPANY_INFO', 'ACCOUNTING_MODE')
ON CONFLICT ("companyId","key") DO UPDATE
SET "value" = EXCLUDED."value", "updatedAt" = CURRENT_TIMESTAMP;

-- 3) Uniqueness per company (best-effort). Drop old unique indexes if they exist, then create new.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'nasabah_nomorAnggota_key') THEN
    EXECUTE 'DROP INDEX IF EXISTS "nasabah_nomorAnggota_key"';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'nasabah_nik_key') THEN
    EXECUTE 'DROP INDEX IF EXISTS "nasabah_nik_key"';
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "nasabah_companyId_nomorAnggota_key" ON "nasabah"("companyId","nomorAnggota");
CREATE UNIQUE INDEX IF NOT EXISTS "nasabah_companyId_nik_key" ON "nasabah"("companyId","nik");

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'kelompok_kode_key') THEN
    EXECUTE 'DROP INDEX IF EXISTS "kelompok_kode_key"';
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "kelompok_companyId_kode_key" ON "kelompok"("companyId","kode");

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'kas_kategori_key_key') THEN
    EXECUTE 'DROP INDEX IF EXISTS "kas_kategori_key_key"';
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "kas_kategori_companyId_key_key" ON "kas_kategori"("companyId","key");

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'accounts_code_key') THEN
    EXECUTE 'DROP INDEX IF EXISTS "accounts_code_key"';
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "accounts_companyId_code_key" ON "accounts"("companyId","code");
