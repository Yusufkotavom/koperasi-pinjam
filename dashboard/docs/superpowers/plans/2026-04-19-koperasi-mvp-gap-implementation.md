# Koperasi MVP Gap Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menutup gap fitur utama berdasarkan `../plan.md` sampai operasional Tahap 1 + fondasi Tahap 2 berjalan stabil di production.

**Architecture:** Aplikasi tetap menggunakan Next.js App Router + Server Actions + Prisma PostgreSQL. Implementasi dilakukan bertahap per domain (master data, transaksi, monitoring, laporan, akses), dengan tiap tahap menghasilkan fitur yang siap dipakai dan tervalidasi build/lint.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Prisma 7, PostgreSQL, NextAuth, Base UI + Tailwind.

---

## 1) Baseline Saat Ini (As-Is)

### Sudah tersedia
- Master Nasabah: list/detail/create/edit + upload dokumen pendukung (dasar).
- Master Kelompok: create/update + kelola anggota + set ketua kelompok.
- Pengajuan pinjaman: create/list/detail + upload dokumen pendukung + catatan + approval sederhana (role-based).
- Pencairan pinjaman: kontrak + jadwal angsuran (bulanan/mingguan) + kas keluar + dokumen pencairan + kartu angsuran.
- Pembayaran angsuran: full/parsial/pelunasan + bukti bayar + kas masuk + pembatalan via approval.
- Monitoring tunggakan: filter kolektor/kelompok/wilayah + bucket aging + metrik NPL.
- Rekap kolektor: target vs realisasi + setoran (berbasis transaksi).
- Arus kas: input transaksi + kategori kas + larangan kategori masuk/keluar sama + tab Add Category.
- Laporan: transaksi per user (filter by user/kelompok) + tooltips alasan ranking; laba-rugi dari transaksi kas.
- RBAC + audit trail (minimum) untuk action sensitif.
- Dashboard: header cepat + jam/tanggal + notif penagihan hari ini + quick menu.

### Masih kurang utama
- Survey workflow detail (status `DISURVEY`, input hasil survey, tanggal survey) + alur operasional surveyor.
- Master data lanjutan: jenis pinjaman, tarif bunga, cabang/wilayah, pengaturan akun (bila dibutuhkan), user-role CRUD yang lebih lengkap.
- Kas lanjutan: rekonsiliasi, laporan kas per cabang/wilayah, dan kontrol approval yang lebih kaya.
- Notifikasi in-app tersimpan (jatuh tempo, approval pending, kas pending).
- Dokumen tambahan: surat tunggakan, rekap kolektor, export/cetak laporan per kelompok/arus kas/laba rugi.

---

## 2) Prioritas Implementasi (To-Be)

### Gelombang A (Wajib Operasional Tahap 1)
1. Master Kelompok full CRUD + penugasan kolektor.
2. Pembayaran lanjutan (parsial, pembatalan approval, pelunasan dipercepat).
3. Monitoring tunggakan lengkap (filter kolektor/kelompok/wilayah, NPL ratio).
4. Rekap kolektor lengkap (target vs realisasi + setoran).
5. Dokumen transaksi minimal: kuitansi pembayaran + bukti pencairan.

### Gelombang B (Tahap 2 Fondasi)
1. Arus kas lanjutan (approval, bukti, rekonsiliasi).
2. Laporan laba-rugi real dari transaksi.
3. Role-based access end-to-end + audit trail.
4. Notifikasi internal (in-app) untuk jatuh tempo dan approval pending.

---

## 3) Gap Matrix (Plan vs Implementasi)

| Domain | Status | Keterangan |
|---|---|---|
| Master Nasabah | Partial | Create/list/detail/edit + upload dokumen sudah ada; UI nonaktif/keluar + export masih minimal |
| Master Kelompok | Partial | CRUD inti + anggota + ketua sudah ada; penugasan kolektor eksplisit per kelompok belum ada |
| Pengajuan | Partial | Upload + catatan + approval ada; survey workflow detail belum |
| Pencairan | Done | Kontrak + jadwal + kas keluar + dokumen pencairan + kartu angsuran |
| Pembayaran | Done | Full/parsial/pelunasan + bukti bayar + pembatalan via approval |
| Tunggakan | Done | Filter + bucket aging + NPL ratio tersedia |
| Rekap Kolektor | Done | Target vs realisasi + setoran tersedia (berbasis transaksi) |
| Arus Kas | Partial | Input + kategori + laba-rugi sudah; rekonsiliasi + kas per cabang/wilayah belum |
| Laba Rugi | Done | Laporan laba-rugi dari transaksi kas |
| Laporan Per Kelompok | Partial | Ringkasan ada; export/cetak belum |
| Hak Akses | Partial | RBAC + audit log ada; coverage per fitur masih bertahap |
| Notifikasi | Not Started | Model ada, modul UI + action belum |
| Dokumen & Cetak | Partial | Kuitansi + bukti pencairan + kartu angsuran ada; dokumen tambahan belum |

---

## 4) File Structure Plan

### Domain actions
- Modify: `src/actions/nasabah.ts`
- Modify: `src/actions/pengajuan.ts`
- Modify: `src/actions/pembayaran.ts`
- Modify: `src/actions/kas.ts`
- Modify: `src/actions/dashboard.ts`
- Create: `src/actions/kelompok.ts`
- Create: `src/actions/user-role.ts`
- Create: `src/actions/notifikasi.ts`

### Validation + utils
- Create: `src/lib/validations/kelompok.ts`
- Create: `src/lib/validations/kas.ts`
- Create: `src/lib/validations/role.ts`
- Create: `src/lib/roles.ts`
- Create: `src/lib/audit.ts`

### UI pages/components
- Modify: `src/app/(dashboard)/kelompok/page.tsx`
- Create: `src/app/(dashboard)/kelompok/baru/page.tsx`
- Create: `src/app/(dashboard)/kelompok/[id]/edit/page.tsx`
- Modify: `src/app/(dashboard)/pembayaran/page.tsx`
- Create: `src/app/(dashboard)/pembayaran/[id]/pembatalan/page.tsx`
- Modify: `src/app/(dashboard)/kas/page.tsx`
- Modify: `src/app/(dashboard)/laporan/laba-rugi/page.tsx`
- Create: `src/app/(dashboard)/dokumen/kuitansi/[id]/page.tsx`
- Create: `src/app/(dashboard)/dokumen/pencairan/[id]/page.tsx`

### DB schema + migration
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_phase_a_gap_closure/migration.sql`

### Documentation
- Modify: `README.md`
- Create: `docs/feature-matrix.md`
- Create: `docs/operational-runbook.md`

---

## 5) Execution Tasks (Bite-Sized)

### Task 1: Tambah model data untuk approval, audit, dan target kolektor

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_phase_a_gap_closure/migration.sql`

- [x] Tambah tabel `AuditLog`, `ApprovalLog`, `KolektorTarget`, `Notifikasi`.
- [x] Tambah relasi ke `User`, `Pengajuan`, `Pembayaran`, `KasTransaksi`.
- [x] Jalankan `npm run db:generate` dan validasi schema compile.

### Task 2: RBAC utility dan audit helper

**Files:**
- Create: `src/lib/roles.ts`
- Create: `src/lib/audit.ts`

- [x] Buat helper `requireRoles(session, allowedRoles)`.
- [x] Buat helper `writeAuditLog({...})` + `writeApprovalLog({...})`.
- [x] Integrasi ke action sensitif (`approve`, `cairkan`, `input kas`, `pembayaran`).

### Task 3: Master Kelompok full CRUD

**Files:**
- Create: `src/actions/kelompok.ts`
- Create: `src/lib/validations/kelompok.ts`
- Modify: `src/app/(dashboard)/kelompok/page.tsx`
- Create: `src/app/(dashboard)/kelompok/baru/page.tsx`
- Create: `src/app/(dashboard)/kelompok/[id]/edit/page.tsx`

- [x] Tambah create/update kelompok + validasi kode unik.
- [x] Lengkapi UI list + halaman create/edit + kelola anggota + set ketua.
- [ ] (Sisa) Penugasan kolektor eksplisit per kelompok (bukan turunan dari nasabah).
- [ ] (Sisa) Nonaktif/delete kelompok + proteksi data (jika dibutuhkan).

### Task 4: Pembayaran lanjutan

**Files:**
- Modify: `src/actions/pembayaran.ts`
- Modify: `src/lib/validations/pembayaran.ts`
- Modify: `src/app/(dashboard)/pembayaran/page.tsx`
- Create: `src/app/(dashboard)/pembayaran/[id]/pembatalan/page.tsx`

- [x] Tambah mode bayar parsial + alokasi ke pokok/bunga/denda.
- [x] Tambah pelunasan dipercepat.
- [x] Tambah pembatalan pembayaran dengan approval manager.
- [x] Tulis log audit tiap perubahan pembayaran.

### Task 5: Tunggakan & rekap kolektor versi operasional

**Files:**
- Modify: `src/actions/dashboard.ts`
- Modify: `src/app/(dashboard)/monitoring/tunggakan/page.tsx`
- Modify: `src/app/(dashboard)/monitoring/kolektor/page.tsx`

- [x] Tambah filter query: tanggal, kolektor, kelompok, wilayah.
- [x] Tambah metrik NPL formal + bucket aging detail.
- [x] Tambah KPI rekap kolektor: target, realisasi, tunggakan, setoran.

### Task 6: Dokumen transaksi (print-ready)

**Files:**
- Create: `src/app/(dashboard)/dokumen/kuitansi/[id]/page.tsx`
- Create: `src/app/(dashboard)/dokumen/pencairan/[id]/page.tsx`
- Modify: `src/app/(dashboard)/pembayaran/page.tsx`
- Modify: `src/app/(dashboard)/pencairan/pencairan-form.tsx`

- [x] Buat template kuitansi pembayaran (print CSS).
- [x] Buat template bukti pencairan (print CSS).
- [x] Tambah tombol/tautan dokumen di flow pembayaran dan pencairan.

### Task 7: Arus kas lanjutan + laba rugi real

**Files:**
- Modify: `src/actions/kas.ts`
- Modify: `src/app/(dashboard)/kas/page.tsx`
- Modify: `src/app/(dashboard)/laporan/laba-rugi/page.tsx`
- Create: `src/lib/validations/kas.ts`

- [x] Tambah approval transaksi kas (`isApproved=false` flow) untuk input teller + aksi approve/reject.
- [x] Tambah lampiran bukti URL transaksi kas (upload + simpan ke `buktiUrl`).
- [x] Hitung laba rugi dari kategori kas + transaksi pembayaran/denda (via transaksi kas).
- [ ] (Sisa) Rekonsiliasi kas + kas per cabang/wilayah (bila dipakai).

### Task 8: Notifikasi internal

**Files:**
- Create: `src/actions/notifikasi.ts`
- Modify: `src/app/(dashboard)/layout.tsx`
- Modify: `src/components/layout/app-sidebar.tsx`

- [ ] Simpan notifikasi jatuh tempo, approval pending, kas pending.
- [ ] Tampilkan badge jumlah notifikasi belum dibaca.
- [ ] Tambah halaman daftar notifikasi sederhana.
- [ ] Commit: `feat(notifications): add in-app reminder and pending alerts`.

### Task 9: Hardening, docs, dan UAT checklist

**Files:**
- Modify: `README.md`
- Create: `docs/feature-matrix.md`
- Create: `docs/operational-runbook.md`

- [ ] Update README sesuai modul yang sudah aktif.
- [ ] Tambah matrix fitur Done/Partial/Not Started.
- [ ] Tambah runbook operasional harian (kas, tagihan, approval).
- [ ] Commit: `docs: add feature matrix and operational runbook`.

---

## 6) Acceptance Criteria

- Build production sukses (`npm run build`).
- Lint tanpa error (`npm run lint`).
- Semua flow inti Tahap 1 bisa dieksekusi end-to-end:
  - Nasabah -> Pengajuan -> Approval -> Pencairan -> Pembayaran -> Tunggakan -> Rekap Kolektor.
- Dokumen kuitansi dan bukti pencairan bisa dicetak dengan format rapi.
- Role restriction berjalan konsisten di server action kritikal.

---

## 7) Test & Verification Command Set

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- `npm run db:generate`
- `npm run dev`

UAT minimum:
- Buat 1 nasabah, 1 pengajuan, approve, cairkan, bayar, cek tunggakan dan laporan.
- Uji role `ADMIN` vs `TELLER` vs `MANAGER` terhadap action sensitif.

---

## 8) Risiko dan Mitigasi

- **Perubahan schema berdampak data existing**
  - Mitigasi: migration bertahap + backup DB.
- **Perhitungan keuangan tidak konsisten lintas modul**
  - Mitigasi: sentralisasi fungsi hitung di `src/lib`.
- **Scope creep**

---

## 9) Progress Update (2026-04-19)

- [x] Perbaikan relasi `nasabah -> kelompok` di form create nasabah (dropdown kelompok + kolektor saat input awal).
- [x] Penambahan input dokumen pendukung pelanggan baru (`dokumenUrls`) pada create nasabah.
- [x] Tenor pinjaman dual type: `BULANAN` dan `MINGGUAN` (schema + form + pencairan jadwal).
- [x] Upload bukti bayar pelanggan (`buktiBayarUrl`) pada proses pembayaran.
- [x] Laporan history pembayaran customer + indikator ranking (`A/B/C/D`) + status lunas/kurang/telat.
- [x] Form kelompok: pilih anggota kelompok + pilih ketua dari anggota.
- [x] Modul daftar kolektor baru: sumber dari nasabah, ketua kelompok, atau input manual; dukung role kolektor+admin.
- [x] Tabel user-role manajemen ditampilkan di modul kolektor.
- [x] Modul akuntansi sederhana (pemasukan/pengeluaran) di halaman kas menggunakan data transaksi riil.
- [x] Laporan laba-rugi diperbarui dari transaksi kas nyata (bukan placeholder statis).
  - Mitigasi: implementasi wajib hanya Gelombang A dahulu.

---

## 9) Rekomendasi Eksekusi

Urutan aman implementasi:
1. Task 1 -> 2 (fondasi data + RBAC/audit)
2. Task 3 -> 4 -> 5 (core operasional)
3. Task 6 -> 7 -> 8 (dokumen + finance + notifikasi)
4. Task 9 (stabilisasi & dokumentasi)
