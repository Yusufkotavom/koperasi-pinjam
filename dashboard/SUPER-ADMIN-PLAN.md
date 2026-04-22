# Perencanaan Fitur `SUPER_ADMIN` (Platform Admin)

Dokumen ini mendefinisikan scope, hak akses, dan guardrail untuk user ber-role `SUPER_ADMIN` di KoperasiApp.

## 1) Prinsip Dasar

- `SUPER_ADMIN` adalah role platform (lintas company) dengan akses operasional terbatas namun memiliki akses pemeliharaan yang kuat.
- Aksi super admin bersifat "high impact" sehingga wajib:
  - audit log lengkap,
  - reason wajib,
  - konfirmasi eksplisit,
  - opsi dry-run/preview bila masuk akal.
- `SUPER_ADMIN` tidak otomatis terhubung ke `companyId`.
  - Untuk mengelola user/konten sebuah company, super admin harus memilih company konteks (switch context) atau melakukan aksi melalui menu platform yang menarget `companyId` secara eksplisit.

## 2) Matriks Hak Akses (Versi 1)

Tujuan versi 1: minimal berguna, aman, dan cepat diimplementasikan tanpa memaksa migrasi multi-tenant penuh.

### A. User & Login

- Reset password user (set password baru atau temporary password)
  - target: user by email/id
  - output: temporary password (sekali tampil) atau link reset (jika ada email provider)
  - audit: actorId, targetUserId, method, reason
- Force logout user (invalidate session/token)
  - catatan: NextAuth JWT perlu strategi blacklist token atau rotate secret; versi 1 bisa pakai `isActive=false` sebagai kill-switch.
- Suspend/disable user (`isActive=false`)
  - gunakan untuk respon cepat saat akun disalahgunakan.

### B. Company Control

- Hold/Suspend company
  - efek: semua user di company tidak bisa akses halaman dashboard (middleware menolak)
  - reason wajib, bisa ada `suspendedUntil` opsional
- Re-activate company
- Delete company (disarankan soft delete)
  - versi 1: soft delete (`status=DELETED` / `deletedAt`) dan memutus akses login
  - hard delete hanya untuk environment dev atau dengan prosedur khusus (lihat "Guardrail")

### C. Data Maintenance (Platform)

- Cleanup data company tertentu (scope terbatas)
  - misal: `USERS`, `AKUNTANSI`, `TRANSAKSI` tapi hanya untuk satu company (butuh multi-tenant data model agar benar-benar aman).
- Import demo data untuk company tertentu
- Backfill jurnal untuk company tertentu

## 3) Guardrail Keamanan

### A. Wajib Audit Log

Setiap aksi `SUPER_ADMIN` minimal mencatat:
- `actorId`
- `action`: RESET_PASSWORD / SUSPEND_USER / SUSPEND_COMPANY / DELETE_COMPANY / REACTIVATE_COMPANY / etc.
- `target`: userId/companyId
- `reason` (string wajib)
- `metadata`: payload ringkas, misal `ip`, `userAgent`, `expiresAt`

Rekomendasi: tambah `entityType="PLATFORM_ADMIN"` pada audit agar mudah difilter.

### B. Konfirmasi & Friksi yang Disengaja

Untuk aksi high impact:
- `DELETE_COMPANY`: wajib ketik slug + kata konfirmasi (contoh: `HAPUS <slug>`)
- `RESET_PASSWORD`: wajib reason + pilihan "force temporary" vs "set explicit"
- `SUSPEND_COMPANY`: wajib reason + opsi durasi

### C. Least Privilege

- `SUPER_ADMIN` tidak boleh membuat role `SUPER_ADMIN` lain tanpa prosedur khusus (misal env var allowlist).
- `SUPER_ADMIN` tidak auto menjadi `OWNER`/`ADMIN` company; ia mengelola via menu platform.

## 4) Desain Data (Disarankan)

Saat ini model `Company` memiliki `isActive`. Untuk kontrol yang lebih jelas:

### A. Tambah status company

Tambahkan field pada `Company`:
- `status`: `ACTIVE | SUSPENDED | DELETED`
- `suspendedAt`, `suspendedReason`, `suspendedUntil` (opsional)
- `deletedAt`, `deletedReason` (opsional)

Aturan akses:
- `SUSPENDED` dan `DELETED` menolak akses dashboard (middleware).
- `DELETED` harus menolak login untuk user company tersebut, atau set semua user `isActive=false`.

### B. Platform action log (opsional)

Jika `AuditLog` sudah ada, cukup gunakan. Jika tidak cukup, buat `PlatformAdminLog`.

## 5) Desain UI (Route)

### A. Menu Platform Admin

Tambahkan modul khusus super admin, contoh:
- `/platform/companies`
- `/platform/users`
- `/platform/audit`

Halaman minimal:
- List company (search by name/slug/email)
- Detail company
  - tombol suspend/activate/delete (soft)
  - list user di company (read-only versi 1)
- List user (search by email)
  - reset password
  - disable user

### B. Company Context Switch (opsional, versi 2)

Untuk membantu debug:
- switch context (pilih company) dan menyimpan di session token sebagai `actingCompanyId`.
- semua query tenant-aware membaca `actingCompanyId` bila ada.

## 6) Catatan Penting: Multi-Tenant Data Belum Penuh

Saat ini baru `User` yang punya `companyId`. Banyak entitas lain (nasabah/pinjaman/kas/jurnal) belum menyimpan `companyId`.

Implikasinya:
- Aksi "delete company" versi 1 hanya realistis untuk memutus akses user (auth) dan identitas company; tidak aman untuk menghapus data operasional selektif per company.
- Untuk platform admin yang benar-benar multi-tenant, perlu Phase 2:
  - tambah `companyId` ke semua model data operasional,
  - index + FK,
  - semua query/filter selalu menyertakan `companyId`,
  - migrasi data existing.

## 7) Rencana Implementasi (Roadmap)

### Phase 0 (1-2 hari)
- Buat halaman docs: kebijakan dan SOP super admin (dokumen ini).
- Tambah guard di middleware untuk company `SUSPENDED/DELETED` (jika status ditambahkan).

### Phase 1 (2-4 hari)
- Platform pages minimal `/platform/users` dan `/platform/companies`.
- Actions server:
  - `resetUserPassword(userId, reason)`
  - `setUserActive(userId, isActive, reason)`
  - `setCompanyStatus(companyId, status, reason, until?)`
- Audit log lengkap untuk semua action.

### Phase 2 (lebih besar)
- Multi-tenant penuh pada semua tabel bisnis (companyId everywhere).
- Cleanup/import/backfill per company (aman).
- Context switch / impersonation dengan guardrail.

## 8) SOP Operasional (Template)

- Reset password:
  1. Verifikasi permintaan (ticket)
  2. Jalankan action reset dengan reason + ticket id
  3. Berikan temporary password via channel aman
  4. Minta user ganti password setelah login
- Suspend company:
  1. Dokumentasikan reason + siapa yang menyetujui
  2. Suspend dengan durasi bila perlu
  3. Komunikasi ke owner/admin company
  4. Reactivate setelah masalah selesai

