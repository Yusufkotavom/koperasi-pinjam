# Changelog

Semua perubahan penting pada aplikasi didokumentasikan di file ini.
Fokus changelog ini: fitur operasional user dashboard (bukan super admin).

## 2026-05-09
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
