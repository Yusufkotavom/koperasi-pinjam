-- 1. Backfill DPD & cycleScore untuk jadwal_angsuran yang SUDAH dibayar
UPDATE jadwal_angsuran
SET 
  dpd = GREATEST(0, FLOOR(EXTRACT(EPOCH FROM ("tanggalBayar" - "tanggalJatuhTempo")) / 86400)::INT),
  "cycleScore" = CASE
    WHEN GREATEST(0, FLOOR(EXTRACT(EPOCH FROM ("tanggalBayar" - "tanggalJatuhTempo")) / 86400)::INT) <= 0 THEN 100
    WHEN GREATEST(0, FLOOR(EXTRACT(EPOCH FROM ("tanggalBayar" - "tanggalJatuhTempo")) / 86400)::INT) <= 3 THEN 70
    WHEN GREATEST(0, FLOOR(EXTRACT(EPOCH FROM ("tanggalBayar" - "tanggalJatuhTempo")) / 86400)::INT) <= 7 THEN 40
    WHEN GREATEST(0, FLOOR(EXTRACT(EPOCH FROM ("tanggalBayar" - "tanggalJatuhTempo")) / 86400)::INT) <= 14 THEN 0
    ELSE -50
  END
WHERE "sudahDibayar" = true AND "tanggalBayar" IS NOT NULL;

-- 2. Backfill DPD & cycleScore untuk jadwal BELUM bayar (running status per NOW)
UPDATE jadwal_angsuran
SET 
  dpd = GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - "tanggalJatuhTempo")) / 86400)::INT),
  "cycleScore" = CASE
    WHEN GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - "tanggalJatuhTempo")) / 86400)::INT) <= 0 THEN 100
    WHEN GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - "tanggalJatuhTempo")) / 86400)::INT) <= 3 THEN 70
    WHEN GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - "tanggalJatuhTempo")) / 86400)::INT) <= 7 THEN 40
    WHEN GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - "tanggalJatuhTempo")) / 86400)::INT) <= 14 THEN 0
    ELSE -50
  END
WHERE "sudahDibayar" = false;

-- 3. Backfill finalScore & categoryGrade untuk pinjaman yang LUNAS
WITH loan_scores AS (
  SELECT 
    "pinjamanId",
    LEAST(100.0, GREATEST(0.0, ROUND(AVG("cycleScore")::numeric, 2))) AS computed_score
  FROM jadwal_angsuran
  WHERE "cycleScore" IS NOT NULL
  GROUP BY "pinjamanId"
)
UPDATE pinjaman p
SET 
  "finalScore" = ls.computed_score,
  "categoryGrade" = CASE
    WHEN ls.computed_score >= 80.0 THEN 'A'
    WHEN ls.computed_score >= 65.0 THEN 'B'
    WHEN ls.computed_score >= 50.0 THEN 'C'
    WHEN ls.computed_score >= 30.0 THEN 'D'
    ELSE 'E'
  END
FROM loan_scores ls
WHERE p.id = ls."pinjamanId" AND p.status = 'LUNAS';
