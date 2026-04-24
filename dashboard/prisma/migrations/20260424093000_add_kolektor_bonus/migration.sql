CREATE TYPE "KolektorBonusStatus" AS ENUM ('PENDING', 'READY', 'PAID', 'CANCELED');

CREATE TABLE "kolektor_bonus" (
  "id" TEXT NOT NULL,
  "pinjamanId" TEXT NOT NULL,
  "kolektorId" TEXT NOT NULL,
  "nominal" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "status" "KolektorBonusStatus" NOT NULL DEFAULT 'PENDING',
  "eligibleAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "paidById" TEXT,
  "catatan" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "companyId" TEXT NOT NULL,

  CONSTRAINT "kolektor_bonus_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "kolektor_bonus_pinjamanId_key" ON "kolektor_bonus"("pinjamanId");
CREATE INDEX "kolektor_bonus_companyId_idx" ON "kolektor_bonus"("companyId");
CREATE INDEX "kolektor_bonus_kolektorId_status_idx" ON "kolektor_bonus"("kolektorId", "status");
CREATE INDEX "kolektor_bonus_status_eligibleAt_idx" ON "kolektor_bonus"("status", "eligibleAt");

ALTER TABLE "kolektor_bonus"
  ADD CONSTRAINT "kolektor_bonus_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "kolektor_bonus"
  ADD CONSTRAINT "kolektor_bonus_kolektorId_fkey"
  FOREIGN KEY ("kolektorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "kolektor_bonus"
  ADD CONSTRAINT "kolektor_bonus_paidById_fkey"
  FOREIGN KEY ("paidById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "kolektor_bonus"
  ADD CONSTRAINT "kolektor_bonus_pinjamanId_fkey"
  FOREIGN KEY ("pinjamanId") REFERENCES "pinjaman"("id") ON DELETE CASCADE ON UPDATE CASCADE;
