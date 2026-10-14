# Changelog

Semua perubahan penting pada aplikasi didokumentasikan di file ini.
Fokus changelog ini: fitur operasional user dashboard (bukan super admin).

## 2026-10-14
- feat(kredit-barang): **implementasi skema Kredit Barang & Uang Muka (DP) Opsi A (Netral Laba)**.
  - Skema akuntansi Opsi A: Anggota menyetor DP yang dicatat di Neraca sebagai Kewajiban Lancar (`UTANG_TITIPAN_DP`), kas masuk kategori `DP_KREDIT_BARANG` (P&L Rp 0).
  - Pokok pinjaman nasabah adalah harga bersih (`hargaBarang - uangMuka`), bunga flat pinjaman HANYA dihitung dari pokok bersih ini.
  - Guard pencairan: pinjaman jenis `BARANG` wajib melunasi DP sebelum dicairkan (`dpTerbayar = true`).
  - Total kas keluar saat pencairan adalah pelunasan penuh ke vendor (`nilaiCair + uangMuka`), dengan jurnal debit `PIUTANG_PINJAMAN` (pokok) + debit `UTANG_TITIPAN_DP` (menutup titipan) dan kredit `CASH_*` (total vendor) sehingga balance 100% dan P&L Rp 0.
  - UI baru: Form pengajuan kredit barang (nama barang, vendor, harga, DP otomatis hitung pokok), dialog penerimaan DP di detail pengajuan, serta rincian kredit barang pada halaman pencairan dan detail pinjaman.
  - Dokumen bisnis & teknis client tersedia di `docs/laporan/Sistem-DP-Kredit-Barang-Koperasi.pdf`.
- fix(pinjaman): **sisa pembulatan BUNGA kini diserap ke cicilan terakhir** (perbaikan bug "kelebihan/kekurangan" total bayar). Sebelumnya bunga flat dibulatkan ke ribuan per-periode lalu dikali tenor → residu terbuang tiap periode (mis. 500.000 / 1,875% / 8 minggu: bunga exact 9.375 → dibulatkan 9.000 → Σ 72.000, total **572.000**, padahal seharusnya **575.000** = plafon + 75.000). Kini `Σ bunga = round(plafon × rate × tenor)` TEPAT, sisa ditumpuk di cicilan terakhir (paralel dengan pokok). Contoh: minggu 1–7 bunga 9.000, minggu 8 bunga 12.000 (total 71.000); Σ bunga 75.000 → total bayar **575.000**. Bug ini sama pola dengan residu pokok 0,04 yang sudah diperbaiki.
- fix(ui): **label satuan bunga/angsuran mengikuti tipe tenor** (`periodeLabel`). Sebelumnya "Bunga per Bulan", "Angsuran/minggu", "Angsuran Pokok/bln" statis walau pinjaman MINGGUAN — kini otomatis "per Minggu"/"per bulan" di kartu & detail pinjaman, detail pengajuan, approval, form pencairan, dan daftar siap cair.
- fix(data): **regenerasi jadwal angsuran** seluruh pinjaman ke skema pembulatan baru — semua baris kini bulat ribuan (sebelumnya 1.748/2.755 baris bernilai koma dari pembagian lama), `Σ pokok = pokokPinjaman` di semua pinjaman (0 drift, sebelumnya 12 pinjaman drift), dan `sisaPinjaman = plafon − Σ pokok dibayar` konsisten. Pinjaman yang lunas dengan residu (mis. sisa 0,04) kini benar-benar **LUNAS sisa 0**. Jadwal diperbaiki untuk semua pinjaman; nominal baris pembayaran disinkronkan hanya untuk pinjaman berpola 1:1 berurutan (jurnal/ledger tidak diubah).
- feat(pinjaman): **pembulatan cicilan ke ribuan bulat** (skenario 2). Pokok per cicilan dibulatkan **ke atas** ke ribuan; **cicilan terakhir menampung seluruh sisa** (sehingga Σ pokok = plafon TEPAT). Bunga flat per cicilan dibulatkan ke ribuan terdekat; cicilan terakhir menampung sisa bunga. Jaminan "tidak miss": Σ pokok = plafon, Σ bunga = round(plafon × rate × tenor), grand total = plafon + Σ bunga. Contoh 1jt/12bln/1,5%: 84.000 ×11 + 76.000 (terakhir), bunga 15.000 → total 1.180.000. Logika di `src/lib/angsuran.ts` (`buildRencanaAngsuran`), dipakai oleh pencairan, form pengajuan, simulasi, dan seed demo.
- fix(pinjaman): pinjaman yang dibayar penuh kini **pasti tertutup** (status LUNAS, sisa 0) — sebelumnya pembagian tanpa pembulatan meninggalkan residu (mis. sisa Rp 0,04) sehingga pinjaman tidak pernah lunas dan skor final tak tersimpan.
- feat(pengajuan): **bunga juga bisa diubah saat approval** (selain plafon) di form approval `Form Approval` → tersimpan ke `pengajuan.bungaPerBulan` dan dipakai saat pencairan. Tambah `bungaDisetujui` (persen) di `approvalSchema` + `approvePengajuan`.
- feat(pengajuan): estimasi angsuran di detail pengajuan & form pencairan kini menampilkan **Total Angsuran/bln** dan **Cicilan Terakhir** (angka bulat) memakai rumus yang sama.

## 2026-10-13
- fix(credit-scoring): urutan pinjaman kini **deterministik** saat `tanggalCair` sama (tiebreaker `createdAt` → `pinjamanId`); sebelumnya bobot recency bisa tak stabil dan menampilkan skor berbeda (mis. 97 vs 98) antar halaman.
- feat(credit-scoring): **skor agregat per-pinjaman berbobot recency** — skor tiap pinjaman dihitung dari rata-rata siklusnya, lalu digabung dengan bobot `latestLoanWeight` (default 60% untuk pinjaman terakhir, sisa dibagi rata ke pinjaman sebelumnya). Contoh: pinjaman #1 skor 70 & #2 skor 100 → 88. Bobot editable di `/settings/ranking`.
- feat(credit-scoring): **rincian skor per pinjaman** (nomor kontrak, status, skor, kategori, bobot, jumlah cicilan, daftar cicilan terlambat) + **Kelebihan/Kekurangan (Pros/Cons)** otomatis: menyebut **cicilan ke-berapa** yang terlambat, keterlambatan terparah, tren membaik/menurun, dan rekomendasi plafon.
- feat(credit-scoring): mesin skor performa baru 0-100 (rata-rata nilai per siklus, anti-bias tenor) + kategori A-E. Menambah kolom `Pinjaman.finalScore`/`categoryGrade` dan `JadwalAngsuran.dpd`/`cycleScore`.
- feat(credit-scoring): plafon saran dinamis = plafon pinjaman terakhir × persentase kategori (informasional, tanpa guard transaksi, tanpa tier rounding).
- feat(credit-scoring): konfigurasi terpusat `CREDIT_SCORING_CONFIG` (matriks DPD, threshold kategori, % plafon) editable di `/settings/ranking`.
- feat(nasabah): panel **Aksi Cepat** di detail nasabah — Bayar Cicilan, Kartu Angsuran, Ajukan Pinjaman, Buka Simpanan, Cairkan Pinjaman (muncul bila ada pengajuan DISETUJUI), Riwayat Pembayaran.
- feat(nasabah): card **Riwayat Skor Kredit** (skor berjalan per pembayaran, DPD, skor rata-rata, keterangan, legend matriks penilaian) + anchor nav `#skor`.
- feat(pinjaman): tombol **Bayar Angsuran** di halaman detail pinjaman → `/pembayaran?search=<nomorKontrak>`.
- feat(settings): halaman `Ranking Risiko` → `Credit Scoring & Plafon`.

## 2026-06-19
- fix(pembayaran): pelunasan dipercepat sekarang menghitung **bunga proporsional** berdasarkan hari aktual per angsuran (bukan menghapus semua bunga). Angsuran yang sudah lewat jatuh tempo = bunga penuh, yang belum = proporsional.
- feat(pembayaran): **nominal negosiasi** pada pelunasan dipercepat — user bisa edit nominal bayar (misal kesepakatan diskon). Alokasi: denda → pokok → bunga, sehingga pokok selalu lunas penuh.
- feat(pembayaran): tambah server action `hitungTotalPelunasan` untuk kalkulasi breakdown pelunasan (pokok + bunga proporsional + denda) sebelum submit.
- feat(nasabah): tambah dropdown **limit** (20/50/100 per halaman) dan **sorting** (terbaru/terlama ditambahkan, nama A-Z/Z-A, no. anggota A-Z/Z-A) di Master Nasabah.
- fix(nasabah): semua parameter filter (search, status, kelompok, limit, sort) sekarang preserved di navigasi pagination dan link export CSV/PDF.

## 2026-05-20
- feat(monitoring): tambah filter skema pinjaman `MINGGUAN` dan `BULANAN` pada halaman `/monitoring/tunggakan`.
- feat(monitoring): filter tunggakan sekarang bisa dibatasi berdasarkan `pinjaman.tenorType` selain filter tanggal/kolektor/kelompok/wilayah.

## 2026-05-09
- feat(platform-backup): tambah halaman `/platform/backups` (SUPER_ADMIN) untuk create snapshot Neon, list snapshot, dan restore ke branch baru.
- feat(platform-backup): tambah server actions Neon API dengan audit trail `PLATFORM_BACKUP` untuk aksi snapshot/restore.
- ops(db-backup): tambah mekanisme backup/restore PostgreSQL via script `scripts/db/backup.sh` dan `scripts/db/restore.sh`, plus runbook `docs/DB-BACKUP-RUNBOOK.md`.
- feat(simpanan): tambah modul **Simpanan** untuk kelola modal dari penyimpan non-anggota.
- feat(simpanan): CRUD simpanan dengan identitas jelas (nama, NIK, HP, alamat, nomor rekening auto-generate).
- feat(simpanan): tracking saldo tersedia vs terpakai, persen bagi hasil, dan periode bagi hasil (bulanan/triwulan/tahunan).
- feat(pencairan): integrasi pencairan pinjaman dari simpanan - user pilih sumber dana (KAS atau SIMPANAN) dengan dropdown simpanan spesifik.
- feat(pencairan): validasi saldo simpanan sebelum cairkan, kurangi `saldoTersedia`, tambah `saldoTerpakai`.
- feat(pencairan): tracking penggunaan simpanan per pinjaman (`PenggunaanSimpanan`) dengan info pinjaman yang pakai simpanan.
- feat(pelunasan): kembalikan saldo simpanan otomatis saat pinjaman lunas (increment `saldoTersedia`, decrement `saldoTerpakai`).
- feat(akuntansi): jurnal pencairan dari simpanan (Debit PIUTANG_PINJAMAN, Credit SIMPANAN_ANGGOTA).
- feat(simpanan): edit simpanan (nama, HP, alamat, % bagi hasil, periode) - NIK dan saldo awal read-only.
- feat(simpanan): tutup simpanan dengan validasi saldo terpakai = 0, input alasan penutupan.
- feat(simpanan): transaksi setor/tarik simpanan dengan dialog form dan validasi saldo.
- feat(simpanan): hitung bagi hasil manual per periode (YYYY-MM) dengan estimasi otomatis.
- feat(simpanan): bayar bagi hasil dengan catat kas keluar dan update status.
- feat(simpanan): halaman `/simpanan/bagi-hasil` untuk kelola pembayaran bagi hasil.
- feat(simpanan): export CSV simpanan dengan filter search dan status.
- feat(ui): tambah menu sidebar **Simpanan** dengan submenu (Daftar, Baru, Bagi Hasil).
- feat(ui): detail simpanan menampilkan penggunaan untuk pinjaman aktif dan riwayat transaksi.

## 2026-05-06
- feat(nasabah-export): aktifkan tombol export di Master Nasabah menjadi `Export CSV` dan `Export PDF` (landscape).
- feat(api-export): tambah endpoint `/api/export/nasabah` dengan dukungan filter `search`, `status`, `kelompokId`.
- feat(pdf-print): halaman Master Nasabah mendukung print mode dengan `CompanyDocumentHeader` agar konsisten dokumen existing.
- test(export): setup `vitest` integration test untuk semua endpoint export utama + validasi header/shape CSV.
- test(e2e): tambah baseline Playwright smoke (`/login`) dan script `test:api`, `test:e2e`, `test:all`.
- feat(report-export): tambah endpoint CSV untuk laporan utama (`arus kas`, `buku besar`, `neraca`, `laba rugi`, `rekonsiliasi`, `transaksi per user`).
- feat(report-pdf): tambah mode print `landscape` + auto print untuk export PDF pada halaman laporan utama.
- feat(report-doc): standardisasi kop dokumen laporan export dengan `CompanyDocumentHeader` agar konsisten dengan dokumen existing (kuitansi/pencairan/kartu angsuran).
- docs(process): tambah aturan disiplin update `CHANGELOG.md` + `ROADMAP.md` di `AGENTS.md` dan `README.md`.
- feat(dashboard): tambah panel **Pokok Berjalan per Sistem** (mingguan vs bulanan) di `/dashboard`.
- feat(monitoring): tambah halaman detail `/monitoring/pokok-berjalan` dengan filter sistem, status, dan pencarian kontrak/nasabah.
- feat(monitoring): tambah ringkasan outstanding total, outstanding mingguan/bulanan, jumlah nasabah berjalan, dan indikator overdue.
- feat(navigation): tambah menu sidebar `Monitoring > Pokok Berjalan` untuk akses cepat.
- docs(roadmap): roadmap sekarang bisa membaca `ROADMAP.md` + `CHANGELOG.md` agar update fitur otomatis terdokumentasi.

## 2026-05-05
- fix(kas): dukung filter tanggal pada histori kas agar audit transaksi harian lebih akurat.
- fix(akuntansi): sinkronisasi jurnal saat edit kategori kas supaya laporan tidak drift.
- fix(pengajuan): perbaiki label tenor pada tabel pengajuan agar konteks mingguan/bulanan jelas.
- feat(pembayaran): tambah filter schedule aktif untuk memudahkan pemilihan tagihan yang harus diproses.
- feat(kolektor): tambah kontrol bonus kolektor manual (assign/payout) untuk operasional lapangan.

## 2026-05-04
- feat(kolektor): tambah alur edit dan hapus data kolektor.
- fix(reporting): pastikan laporan akuntansi dan kas terscope per company (tenant-safe).
- feat(settings): konfigurasi denda dinamis dari pengaturan perusahaan.
- fix(pembayaran): perbaiki dialog sukses pembayaran agar feedback transaksi lebih jelas.

## 2026-05-03
- feat(transaksi): dukung backdate tanggal pencairan dan transaksi kas untuk koreksi input operasional.
- feat(pengajuan): tambah flow pembatalan/reversal pencairan pinjaman.
- feat(simulasi): field simulasi angsuran bisa diedit dengan presisi desimal dan UX input yang lebih nyaman.
- fix(pencairan): perbaiki validasi saldo kas di batas akhir hari untuk menghindari false negative.
- fix(ui): submit lock di form pencairan untuk mencegah double submit/toast ganda.

## 2026-05-02
- fix(kas): tampilkan error validasi level field saat submit kas agar koreksi input lebih cepat.
- fix(kas): kurangi risiko timeout posting jurnal pada modal dan approval kas.
- feat(upload): migrasi upload dokumen operasional ke Vercel Blob untuk reliabilitas penyimpanan.
- fix(nasabah): harden flow submit pembuatan nasabah (termasuk step akhir) agar lebih stabil.

## 2026-05-01
- feat(auth): stabilisasi login/register redirect dan hidrasi sesi produksi.
- fix(middleware): perbaiki parsing token middleware untuk Auth.js v5 secure cookie.
- feat(dashboard): polishing tampilan dashboard agar pembacaan metrik lebih cepat.
- docs(user-guide): penambahan halaman roadmap + panduan pengguna lebih detail.
