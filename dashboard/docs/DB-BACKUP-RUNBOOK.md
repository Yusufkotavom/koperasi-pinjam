# DB Backup Runbook

Runbook ini untuk backup/restore PostgreSQL production secara terjadwal.

## 1) Prasyarat

- `DATABASE_URL` tersedia (pakai env production yang benar).
- PostgreSQL client tools terpasang di host:
  - `pg_dump`
  - `pg_restore`
- Jalankan dari folder `dashboard/`.

## 2) Backup manual

```bash
cd /home/ubuntu/koperasi-pinjam/dashboard
set -a && source .env.vercel.production && set +a
npm run db:backup
```

Output file:
- `./backups/dashboard-prod-<timestamp>.dump`
- `./backups/dashboard-prod-<timestamp>.dump.sha256`

## 3) Restore manual

```bash
cd /home/ubuntu/koperasi-pinjam/dashboard
set -a && source .env.vercel.production && set +a
npm run db:restore -- ./backups/dashboard-prod-YYYYMMDDTHHMMSSZ.dump
```

Opsional drop object lama dulu:

```bash
RESTORE_CLEAN=1 npm run db:restore -- ./backups/dashboard-prod-YYYYMMDDTHHMMSSZ.dump
```

## 4) Jadwal backup (cron)

Contoh backup harian jam 01:30 UTC, retention 14 hari:

```cron
30 1 * * * cd /home/ubuntu/koperasi-pinjam/dashboard && set -a && source .env.vercel.production && set +a && BACKUP_RETENTION_DAYS=14 npm run db:backup >> /var/log/koperasi-db-backup.log 2>&1
```

## 5) Verifikasi cepat

1. Cek file dump terbaru ada di `backups/`.
2. Cek checksum:
```bash
cd /home/ubuntu/koperasi-pinjam/dashboard
sha256sum -c backups/*.sha256
```
3. Simulasi restore ke database staging sebelum restore ke production.

## 6) Catatan penting

- Backup script tidak melakukan delete data DB.
- Simpan backup ke storage terpisah (object storage atau server backup lain).
- Jangan commit file dump ke Git.
