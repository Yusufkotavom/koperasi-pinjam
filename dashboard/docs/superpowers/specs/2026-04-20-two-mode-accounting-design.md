# Two-Mode Accounting Design

## Tujuan
Menyediakan satu modul akuntansi dengan dua mode operasi yang saling menggantikan:
- **Simple** untuk laporan inti yang ringan dan cepat dipakai
- **Proper** untuk akuntansi yang lebih lengkap, tetapi tetap ramah user

Mode dipilih dari **Company Settings** oleh **Admin saja**.

## Keputusan Produk
- **Default mode:** Simple
- **Mode bersifat mutually exclusive:** hanya satu yang aktif pada satu waktu
- **Perubahan mode berlaku setelah reload**
- **Tidak ada migrasi data** saat mode berubah
- **Proper mode tidak menyembunyikan laporan simple**; ringkasan sederhana tetap tersedia sebagai pintu masuk cepat

## Mode Simple
Mode ini ditujukan untuk user yang hanya ingin melihat angka inti dengan setup minimal.

### Fitur utama
- Arus kas sederhana
- Laba rugi sederhana
- Neraca sederhana
- Input kategori kas
- Mapping kategori kas ke akun secara ringan

### Karakteristik
- Cepat dipahami
- Minim konfigurasi
- Cocok untuk operasional harian
- Fokus pada ringkasan, bukan detail akuntansi penuh

## Mode Proper
Mode ini ditujukan untuk kebutuhan akuntansi yang lebih formal dan terstruktur, namun tetap disajikan dengan UX yang sederhana.

### Fitur utama
- Chart of Accounts (COA)
- Jurnal
- Buku besar
- Neraca saldo
- Jurnal penyesuaian
- Closing
- Audit trail
- Laporan sederhana tetap tersedia

### Karakteristik
- Lebih lengkap
- Tetap menampilkan laporan ringkas agar user tidak perlu masuk ke detail jika hanya ingin melihat hasil akhir
- Menggunakan struktur akuntansi yang lebih proper tanpa memaksa user operasional mempelajari seluruh detail sejak awal

## Aturan Switching
- Switch mode hanya tersedia di **Company Settings**
- Hanya **Admin** yang dapat mengubah mode
- Saat admin mengganti mode, nilai konfigurasi disimpan lalu perubahan aktif setelah aplikasi reload
- Karena tidak ada migrasi, data transaksi tetap sama dan hanya cara sistem menampilkan/mengolahnya yang berubah

## Prinsip UX
- User yang hanya butuh laporan cepat tetap mendapat jalur sederhana
- User yang butuh akuntansi formal bisa masuk ke struktur proper
- Proper memperluas kapabilitas, bukan mengganti total pengalaman simple

## Non-Goals
- Tidak ada konversi data otomatis antar-mode
- Tidak ada reformat transaksi historis
- Tidak ada pemisahan database untuk tiap mode
- Tidak ada implementasi teknis pada dokumen ini

## Acceptance Criteria
- Admin dapat memilih Simple atau Proper di Company Settings
- Hanya satu mode aktif pada satu waktu
- Simple menjadi default saat instalasi atau konfigurasi awal
- Perubahan mode baru terlihat setelah reload
- Proper mode tetap menampilkan laporan sederhana
- Tidak ada kebutuhan migrasi data ketika mode berubah
