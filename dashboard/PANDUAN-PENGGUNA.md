# Panduan Penggunaan Aplikasi (Internal)

Panduan ini ditujukan untuk user operasional koperasi untuk menjalankan aplikasi dari awal sampai laporan. Fokusnya adalah langkah kerja dan penjelasan field sesuai yang tampil di aplikasi (berdasarkan form dan validasi).

## Navigasi Cepat (Menu)

- `Overview`: Dashboard, Roadmap, Panduan.
- `Master Data`: Nasabah, Kelompok, Kolektor.
- `Transaksi`: Pengajuan, Pencairan, Pembayaran, Arus Kas.
- `Monitoring`: Tunggakan, Rekap Kolektor.
- `Laporan`: Transaksi User, Buku Besar, Neraca, Rekonsiliasi, Arus Kas, Laba Rugi.
- `Settings`: Company settings, mode akuntansi, ranking risiko.

## 0) Checklist Sebelum Operasional

1. Pastikan Anda bisa login (`/login`).
2. Isi `Settings` sekali di awal: Company info dan zona waktu.
3. Buat `Kelompok` jika koperasi menggunakan sistem kelompok.
4. Buat `Kolektor` jika penagihan dibagi per petugas.

## 1) Login dan Akses Dashboard

Langkah:

1. Buka halaman Login.
2. Masukkan email dan password.
3. Setelah berhasil, Anda masuk ke Dashboard.

Catatan:

- Jika sesi login habis, aplikasi akan mengarahkan kembali ke `/login`.

## 2) Settings (Wajib Dicek Sekali)

### 2.1 Company Information

Menu: `Settings` → Company Information

Field dan fungsinya:

- `Nama Perusahaan / Koperasi`: muncul di sidebar dan kop dokumen.
- `Zona Waktu`: dipakai untuk format tanggal dan jam di aplikasi (penting untuk laporan).
- `Tagline` (opsional): teks kecil di sidebar.
- `Alamat / Telepon / Email / Website` (opsional): dipakai untuk dokumen/branding.
- `Logo` (opsional): tampil di sidebar dan header dokumen print.

Catatan penting:

- Logo dibatasi ukuran sekitar 600KB dan harus file gambar.

### 2.2 Mode Akuntansi

Menu: `Settings` → Mode Akuntansi

- `Simple`: pencatatan ringkas (kas masuk/keluar dan laporan sederhana).
- `Proper`: membuka fitur akuntansi lebih lengkap (mis. COA).

Catatan:

- Perubahan mode biasanya perlu reload halaman untuk aktif.

### 2.3 Pengaturan Ranking Risiko

Menu: `Settings` → Pengaturan Ranking Risiko

Field:

- `B: Maks Telat (angsuran)` dan `B: Maks Tunggakan (Rp)`
- `C: Maks Telat (angsuran)` dan `C: Maks Tunggakan (Rp)`

Logika ringkas:

- A: telat = 0 dan tunggakan = 0
- B: telat ≤ batas B dan tunggakan < batas B
- C: telat ≤ batas C dan tunggakan < batas C
- D: selain itu

Dipakai untuk:

- Laporan `Transaksi User` (kolektibilitas nasabah/kelompok).

## 3) Master Data: Kelompok

Menu: `Master Data` → `Kelompok`

### 3.1 Buat Kelompok Baru

Langkah:

1. Buka `Kelompok` → `Kelompok Baru`.
2. Isi field.
3. Centang anggota (nasabah) yang masuk kelompok.
4. Pilih `Ketua Kelompok` dari anggota atau isi manual.
5. Simpan.

Field dan fungsinya:

- `Kode Kelompok` (wajib, 3-20 karakter): kode unik internal, contoh `KLP-001`.
- `Nama Kelompok` (wajib, 3-120 karakter): nama kelompok.
- `Wilayah` (opsional): dipakai untuk filter monitoring/laporan berbasis wilayah.
- `Jadwal Pertemuan` (opsional): catatan jadwal, contoh `Senin, 09:00 WIB`.
- `Anggota` (checkbox): memilih nasabah yang menjadi anggota kelompok.
- `Ketua Kelompok`:
  - Pilih dari anggota (disarankan), atau
  - Input manual (jika ketua belum terdaftar sebagai nasabah).

Catatan:

- Nasabah yang sudah menjadi anggota kelompok lain biasanya tidak muncul sebagai opsi (kecuali kelompok yang sedang diedit).

## 4) Master Data: Nasabah

Menu: `Master Data` → `Nasabah Baru` atau `Nasabah (Daftar)`

### 4.1 Buat Nasabah Baru (Step-by-step)

Form dibuat bertahap (3 langkah):

#### Step 1: Data Diri

Field:

- `Nama Lengkap` (wajib, min 3 karakter): sesuai KTP.
- `NIK` (wajib, 16 digit, angka saja).
- `Tempat Lahir` (opsional).
- `Tanggal Lahir` (opsional).
- `Alamat Lengkap` (wajib, min 10 karakter).
- `Kelurahan/Desa` (opsional).
- `Kecamatan` (opsional).
- `Kota/Kab` (opsional).

#### Step 2: Data Kontak dan Usaha

Field:

- `No. HP Aktif` (wajib, format `08xxxxxxxxxx`): minimal 10 digit setelah 08, maksimal 13 digit total (mengikuti validasi).
- `Pekerjaan` (opsional): contoh pedagang/wiraswasta/karyawan.
- `Nama Usaha` (opsional).
- `Status Nasabah`:
  - `AKTIF`: default, dipakai untuk operasional.
  - `NON_AKTIF`: tidak aktif sementara.
  - `KELUAR`: sudah keluar dari keanggotaan.

#### Step 3: Penugasan dan Dokumen

Field:

- `Kelompok` (opsional): relasi ke kelompok nasabah.
- `Kolektor` (opsional): petugas penagihan untuk nasabah ini.
- `Dokumen Pendukung` (opsional):
  - Bisa upload file (jpg/png/webp/pdf).
  - Atau input URL manual (1 baris 1 URL, atau pisahkan dengan koma).

Setelah simpan:

- Nasabah akan muncul di `Nasabah (Daftar)`.

### 4.2 Edit Nasabah

Menu: `Nasabah (Daftar)` → pilih nasabah → `Edit`.

Field edit pada dasarnya sama dengan saat pembuatan, termasuk dokumen pendukung.

## 5) Master Data: Kolektor dan Role

Menu: `Master Data` → `Kolektor`

Tiga cara menambah kolektor:

1. `Input Manual`:
   - `Nama Lengkap`
   - `Email`
   - `Password Sementara`
   - `Tambah role ADMIN` (checkbox, opsional)
2. `Promosi Nasabah`:
   - Pilih nasabah aktif, jadikan petugas
   - Opsional role ADMIN
3. `Ketua Kelompok`:
   - Pilih kelompok, jadikan ketua sebagai petugas
   - Opsional role ADMIN

Catatan:

- Role `ADMIN` biasanya memberi akses lebih luas, termasuk mengubah pengaturan.

## 6) Transaksi: Pengajuan Pinjaman

Menu: `Transaksi` → `Pengajuan Pinjaman` → `Pengajuan Baru`

### 6.1 Field Pengajuan (Apa untuk Apa)

Field wajib:

- `Nasabah`: pilih peminjam.
- `Jenis Pinjaman`: `REGULAR | MIKRO | USAHA` (untuk klasifikasi internal).
- `Tenor Type`: `BULANAN` atau `MINGGUAN` (satuan periode angsuran).
- `Plafon Diajukan (Rp)`: nominal pinjaman yang diminta (min 1, max 100 juta).
- `Tenor`: jumlah periode (min 1, max 36).
- `Bunga Flat/per periode (%)`: bunga flat per bulan atau per minggu (min 0.1, max 5).
- `Tujuan Pinjaman`: wajib, min 5 karakter.

Field opsional:

- `Kelompok`: biasanya otomatis mengikuti kelompok nasabah.
- `Agunan / Jaminan`: catatan jaminan.
- `Catatan`: catatan internal.
- `Dokumen Pendukung`: upload file (jpg/png/webp/pdf, max 5MB per file).

### 6.2 Simulasi Angsuran (Cara Baca)

Di halaman pengajuan ada kartu “Simulasi Angsuran” yang menghitung:

- `Angsuran Pokok/periode` = plafon / tenor
- `Bunga Flat/periode` = plafon * (bunga%/100)
- `Total Angsuran/periode` = pokok + bunga
- `Total Keseluruhan` = total angsuran per periode * tenor

Catatan:

- Ini simulasi flat sederhana sesuai input, bukan amortisasi menurun.

## 7) Transaksi: Approval Pengajuan

Menu: `Pengajuan Pinjaman` → pilih pengajuan berstatus `DIAJUKAN` → `Approve`

Field:

- `Plafon yang Disetujui` (wajib saat setuju): nominal final yang disetujui.
- `Catatan` (opsional): alasan setuju/tolak.

Aksi:

- `Setujui`: pengajuan lanjut ke pencairan.
- `Tolak`: pengajuan berhenti (status ditolak).

## 8) Transaksi: Pencairan

Menu: `Transaksi` → `Pencairan`

Field pencairan:

- `Potongan Admin (Rp)`: biaya administrasi (boleh 0).
- `Potongan Provisi (Rp)`: biaya provisi (boleh 0).
- `Tanggal Pencairan`: tanggal real pencairan.

Cara baca “Nilai Bersih Diterima”:

- `Nilai Bersih` = `Plafon Disetujui` - `Potongan Admin` - `Potongan Provisi`

Setelah pencairan sukses:

- Sistem membuat `No. Kontrak`.
- Anda akan diarahkan ke dokumen pencairan.

## 9) Transaksi: Pembayaran Angsuran

Menu: `Transaksi` → `Pembayaran Angsuran`

Halaman ini punya 2 pola kerja:

1. `Input Pembayaran Manual` (pencarian cepat)
2. `Jadwal Penagihan Aktif` (berdasarkan jatuh tempo)

### 9.1 Input Pembayaran Manual (Cara Pakai)

Tujuan: cari jadwal angsuran berdasarkan:

- Nama nasabah
- Nomor anggota
- NIK
- Nomor kontrak

Langkah:

1. (Opsional) pilih dropdown `Semua nasabah aktif` untuk mengunci pencarian ke 1 nasabah.
2. Isi search minimal 3 karakter, lalu klik `Cari`.
3. Buka kontrak yang tampil.
4. Klik tombol `Bayar` pada angsuran ke-n.

### 9.2 Form “Bayar” (Field dan Makna)

Field:

- `Tipe Pembayaran`:
  - `FULL`: sesuai tagihan periode itu.
  - `PARSIAL`: bayar sebagian, wajib isi `Nominal Dibayar`.
  - `PELUNASAN`: pelunasan dipercepat.
- `Nominal Dibayar (Rp)`: muncul hanya untuk `PARSIAL`.
- `Metode`: `TUNAI` atau `TRANSFER`.
- `Tanggal Bayar`: wajib.
- `Bukti Transfer/Dokumen` (opsional): upload file (max 5MB).

Setelah sukses:

- Sistem dapat menambahkan `denda` jika ada keterlambatan (jika rules denda diterapkan).
- Dialog sukses menyediakan tombol `Cetak Kuitansi`.

### 9.3 Status Jadwal Penagihan Aktif (Cara Baca)

Tabel “Jadwal Penagihan Aktif” menampilkan:

- `Nasabah` dan `Kelompok`
- `No. Kontrak`
- `Ke-`: angsuran ke berapa
- `Tagihan`
- `Status`:
  - `Lancar`: belum telat
  - `KDP`: dalam keterlambatan <= 30 hari
  - `Macet`: terlambat > 30 hari

## 10) Transaksi: Arus Kas (Kas Masuk/Keluar)

Menu: `Transaksi` → `Arus Kas`

Tab yang tersedia:

- `Riwayat`: melihat transaksi kas.
- `Input Baru`: input transaksi manual.
- `Approval`: persetujuan transaksi kas (jika workflow approval dipakai).
- `Kategori`: kelola kategori kas masuk/keluar.

### 10.1 Input Transaksi Kas (Field Detail)

Field:

- `Jenis Transaksi`: `Kas Masuk` atau `Kas Keluar`.
- `Kategori Pembukuan` (wajib dipilih): kategori kas untuk pengelompokan laporan.
- `Jumlah (Rp)` (wajib): nominal transaksi.
- `Jenis Kas`: `Kas Tunai` atau `Kas Bank` (memengaruhi Buku Besar Kas).
- `Keterangan`: deskripsi singkat transaksi.
- `Bukti Transaksi` (opsional): upload file (jpg/png/pdf, max 5MB).

Catatan:

- Tanggal transaksi kas diinput otomatis oleh sistem saat Anda menyimpan (di UI tidak ada field tanggal).

### 10.2 Approval Transaksi Kas

Di tab `Approval`:

- `Approve`: transaksi masuk perhitungan laporan/ledger (untuk laporan yang “Approved only”).
- `Reject`: transaksi ditolak (akan diminta alasan reject via prompt).

### 10.3 Kategori Kas

Field:

- `Jenis Kategori`: `Kas Masuk` atau `Kas Keluar`.
- `Nama Kategori`: contoh `OPERASIONAL`, `PENDAPATAN`, dll.

Tips:

- Buat kategori yang konsisten karena laporan Laba Rugi dan Arus Kas menggunakan kategori ini.

## 11) Monitoring: Tunggakan (Aging Report)

Menu: `Monitoring` → `Tunggakan`

### 11.1 Filter (Cara Pakai)

Anda bisa memfilter berdasarkan:

- `Tanggal Dari` dan `Tanggal Sampai`
- `Kolektor`
- `Kelompok`
- `Wilayah`

### 11.2 Cara Baca Ringkasan Aging

Ringkasan dibagi bucket keterlambatan:

- `1-7 hari`
- `8-30 hari`
- `31-60 hari`
- `>60 hari (NPL)`

Istilah:

- `Total Tunggakan`: total nilai tagihan yang jatuh tempo dan belum dibayar (sesuai filter).
- `Outstanding NPL`: outstanding yang masuk bucket NPL (>60 hari).
- `Rasio NPL`: persentase NPL terhadap total (indikator risiko).

### 11.3 Cara Baca Tabel Detail

Kolom penting:

- `Nasabah`: nama + no HP.
- `Kelompok` / `Wilayah`: untuk routing penagihan.
- `No. Kontrak`: identitas pinjaman.
- `Ke-`: angsuran ke berapa yang menunggak.
- `Status Aging`: bucket keterlambatan + jumlah hari telat.
- `Total Tagihan`: nominal tagihan angsuran.

## 12) Laporan (Cara Membaca)

Menu: `Laporan`

### 12.1 Laporan Arus Kas

Menu: `Laporan` → `Arus Kas`

Filter:

- `Bulanan` atau `Mingguan`
- `from` dan `to` (rentang tanggal)

Cara baca:

- `Kas Masuk`: total pemasukan kas dalam periode.
- `Kas Keluar`: total pengeluaran kas dalam periode.
- `Surplus`: `masuk - keluar` (positif = surplus, negatif = defisit).

Tabel rincian menampilkan per periode:

- Periode
- Kas masuk, kas keluar, surplus

### 12.2 Laporan Laba Rugi (Sumber: Transaksi Kas)

Menu: `Laporan` → `Laba Rugi`

Cara baca:

- `Pendapatan` diambil dari transaksi kas masuk pada periode.
- `Beban` diambil dari transaksi kas keluar pada periode.
- `Laba Bersih` = `Total Pendapatan - Total Beban`.

Catatan:

- Akurasi sangat bergantung pada pemilihan kategori kas dan kelengkapan input kas.

### 12.3 Buku Besar Kas (Approved Only)

Menu: `Laporan` → `Buku Besar`

Filter:

- `Kas Jenis`: Tunai atau Bank
- `Bulan` dan `Tahun`

Cara baca:

- `Opening Balance`: saldo awal periode.
- `Closing Balance`: saldo akhir setelah seluruh transaksi approved dihitung.
- Di tabel:
  - `Debit`: kas masuk (menambah saldo).
  - `Kredit`: kas keluar (mengurangi saldo).
  - `Saldo`: saldo berjalan setelah transaksi.

### 12.4 Neraca Sederhana

Menu: `Laporan` → `Neraca`

Filter:

- Bulan dan Tahun

Cara baca:

- `Aset`: yang dimiliki (contoh: kas, outstanding).
- `Kewajiban`: yang harus dibayar (contoh: simpanan).
- `Ekuitas`: selisih (operasional) antara aset dan kewajiban.

Catatan:

- Ini neraca versi operasional; detail akun akuntansi penuh tergantung mode dan implementasi.

### 12.5 Rekonsiliasi Kas/Bank

Menu: `Laporan` → `Rekonsiliasi`

Tujuan:

- Membandingkan saldo sistem vs saldo statement bank/kas pada periode tertentu.

Field:

- `Akun Kas`
- `Bulan` dan `Tahun`
- `Saldo Statement`: saldo menurut statement.
- `Catatan` (opsional)
- `Bukti` (opsional)

Cara baca riwayat:

- `Selisih`: `saldo statement - saldo sistem` (selisih 0 berarti match).
- `Status`: status rekonsiliasi (sesuai sistem).

### 12.6 Laporan Transaksi User (Kolektibilitas)

Menu: `Laporan` → `Transaksi User`

Filter:

- `Search`: nama, nomor anggota, atau NIK.
- `Kelompok`: filter per kelompok.
- `View`: lihat per `Nasabah` atau agregasi per `Kelompok`.

View “per Nasabah” (kolom):

- `Selesai`: progress pembayaran (paid/total), jika tersedia.
- `Telat`: jumlah telat atau detail telat tertua (due + hari telat).
- `Tunggakan`: nominal tunggakan.
- `Outstanding`: sisa pokok/outstanding.
- `Ranking`: A/B/C/D berdasarkan pengaturan ranking di Settings.

View “per Kelompok” (agregasi):

- Total nasabah
- Total tagihan, total dibayar, kurang angsuran
- Outstanding total
- Distribusi ranking A/B/C/D dan “worstRank”

Catatan:

- Menu `History Pembayaran` dan `Per Kelompok` saat ini mengarah ke halaman ini (`/laporan/transaksi-per-user`).

## Troubleshooting Cepat

- Tidak bisa akses dashboard: pastikan login aktif.
- Data “tidak muncul”: cek filter tanggal/periode, atau status data (mis. transaksi kas belum approved).
- Laporan tidak sesuai: cek input kas/pembayaran dan kategori, serta periode yang dipilih.
