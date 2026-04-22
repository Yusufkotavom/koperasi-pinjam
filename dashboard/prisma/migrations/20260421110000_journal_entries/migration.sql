DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'JournalSourceType') THEN
    CREATE TYPE "JournalSourceType" AS ENUM ('PEMBAYARAN', 'PENCAIRAN', 'KAS', 'SIMPANAN', 'ADJUSTMENT', 'REVERSAL', 'DEMO_IMPORT');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'JournalStatus') THEN
    CREATE TYPE "JournalStatus" AS ENUM ('DRAFT', 'POSTED', 'VOIDED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "journal_entries" (
  "id" TEXT NOT NULL,
  "entryNo" TEXT NOT NULL,
  "entryDate" TIMESTAMP(3) NOT NULL,
  "description" TEXT NOT NULL,
  "sourceType" "JournalSourceType" NOT NULL,
  "sourceId" TEXT,
  "status" "JournalStatus" NOT NULL DEFAULT 'POSTED',
  "postedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "journal_lines" (
  "id" TEXT NOT NULL,
  "journalEntryId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "debit" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "credit" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "memo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "journal_lines_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "journal_entries_entryNo_key" ON "journal_entries"("entryNo");
CREATE UNIQUE INDEX IF NOT EXISTS "journal_entries_sourceType_sourceId_key" ON "journal_entries"("sourceType", "sourceId");
CREATE INDEX IF NOT EXISTS "journal_entries_entryDate_idx" ON "journal_entries"("entryDate");
CREATE INDEX IF NOT EXISTS "journal_entries_sourceType_sourceId_idx" ON "journal_entries"("sourceType", "sourceId");
CREATE INDEX IF NOT EXISTS "journal_lines_journalEntryId_idx" ON "journal_lines"("journalEntryId");
CREATE INDEX IF NOT EXISTS "journal_lines_accountId_idx" ON "journal_lines"("accountId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'journal_entries_postedById_fkey') THEN
    ALTER TABLE "journal_entries"
    ADD CONSTRAINT "journal_entries_postedById_fkey"
    FOREIGN KEY ("postedById") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'journal_lines_journalEntryId_fkey') THEN
    ALTER TABLE "journal_lines"
    ADD CONSTRAINT "journal_lines_journalEntryId_fkey"
    FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'journal_lines_accountId_fkey') THEN
    ALTER TABLE "journal_lines"
    ADD CONSTRAINT "journal_lines_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "accounts"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
