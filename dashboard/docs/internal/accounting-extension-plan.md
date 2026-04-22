# Accounting Extension Plan

## Current Gap

Modul akuntansi saat ini masih berbasis operasional kas:

- Buku besar hanya membaca mutasi `KasTransaksi` untuk `Kas Tunai` dan `Kas Bank`.
- Laba rugi masih mengelompokkan transaksi kas masuk/keluar, belum dari jurnal pendapatan dan beban.
- Neraca menghitung ekuitas sebagai selisih aset dan kewajiban, sehingga modal terlihat seperti angka residual tanpa batas.
- Pembayaran, pencairan, simpanan, dan pembatalan belum menghasilkan jurnal debit/kredit yang seimbang.

## Target

Bangun akuntansi koperasi berbasis double-entry agar laporan utama berasal dari sumber yang sama:

- `JournalEntry` sebagai header transaksi akuntansi.
- `JournalLine` sebagai baris debit/kredit per akun.
- Semua transaksi posted wajib seimbang: total debit = total kredit.
- Semua jurnal punya `sourceType` dan `sourceId` untuk audit ke transaksi operasional.
- Pembatalan tidak mengubah histori jurnal, tetapi membuat reversal entry.

## Proposed Schema

### JournalEntry

- `id`
- `entryNo`
- `entryDate`
- `description`
- `sourceType`: `PEMBAYARAN`, `PENCAIRAN`, `SIMPANAN`, `KAS`, `ADJUSTMENT`, `CLOSING`
- `sourceId`
- `status`: `DRAFT`, `POSTED`, `VOIDED`
- `postedById`
- `postedAt`
- `createdAt`
- `updatedAt`

### JournalLine

- `id`
- `journalEntryId`
- `accountId`
- `debit`
- `credit`
- `memo`
- `createdAt`

### AccountingPeriod

- `id`
- `month`
- `year`
- `status`: `OPEN`, `CLOSED`
- `closedById`
- `closedAt`

## COA Expansion

### Asset

- `CASH_TUNAI`
- `CASH_BANK`
- `PIUTANG_PINJAMAN`
- `PIUTANG_BUNGA`
- `PIUTANG_DENDA`
- `CADANGAN_KERUGIAN_PIUTANG`

### Liability

- `SIMPANAN_POKOK`
- `SIMPANAN_WAJIB`
- `SIMPANAN_SUKARELA`
- `UTANG_BIAYA`
- `TITIPAN_ANGGOTA`

### Equity

- `MODAL_DISETOR`
- `SHU_TAHUN_BERJALAN`
- `SHU_DITAHAN`

### Revenue

- `PENDAPATAN_BUNGA`
- `PENDAPATAN_ADMIN`
- `PENDAPATAN_DENDA`

### Expense

- `BEBAN_OPERASIONAL`
- `BEBAN_GAJI`
- `BEBAN_PENYISIHAN_PIUTANG`
- `BEBAN_LAINNYA`

## Posting Rules

### Pencairan Pinjaman

- Debit `PIUTANG_PINJAMAN`
- Kredit `CASH_TUNAI` atau `CASH_BANK`
- Kredit `PENDAPATAN_ADMIN` bila ada potongan admin

### Pembayaran Angsuran

- Debit `CASH_TUNAI` atau `CASH_BANK`
- Kredit `PIUTANG_PINJAMAN` untuk pokok
- Kredit `PENDAPATAN_BUNGA` untuk jasa/bunga
- Kredit `PENDAPATAN_DENDA` untuk denda

### Simpanan Anggota

- Debit `CASH_TUNAI` atau `CASH_BANK`
- Kredit akun simpanan sesuai jenis: pokok, wajib, sukarela

### Kas Keluar

- Debit akun beban/aset/utang sesuai mapping kategori
- Kredit `CASH_TUNAI` atau `CASH_BANK`

### Pembatalan

- Buat reversal journal dari entry asli.
- Tandai entry asli tetap `POSTED`.
- Link reversal ke sumber pembatalan untuk audit.

## Report Migration

### Buku Besar

- Filter semua akun aktif, bukan hanya kas.
- Ambil opening balance dari akumulasi `JournalLine` sebelum tanggal mulai.
- Tampilkan debit, kredit, saldo berjalan.

### Neraca Saldo

- Tampilkan total debit/kredit per akun.
- Validasi total debit = total kredit.
- Highlight akun tidak balance atau belum dimapping.

### Laba Rugi

- Ambil dari akun `REVENUE` dan `EXPENSE`.
- Dukung periode bulanan, mingguan, dan custom date range.
- Pisahkan pendapatan bunga, admin, denda, dan beban operasional.

### Neraca

- Aset, kewajiban, dan ekuitas berasal dari saldo jurnal.
- `SHU_TAHUN_BERJALAN` dihitung dari laba rugi periode berjalan.
- Hindari ekuitas residual tanpa akun sumber.

### Piutang dan Aging

- Pisahkan piutang pokok, bunga, dan denda.
- Kelompokkan aging: belum jatuh tempo, 1-30 hari, 31-60 hari, 61-90 hari, >90 hari.
- Tambahkan kolektibilitas berdasarkan tunggakan dan umur piutang.

## Migration Steps

1. Tambah schema `JournalEntry`, `JournalLine`, dan `AccountingPeriod`.
2. Seed COA koperasi yang lebih lengkap.
3. Implement posting service shared, misalnya `postJournalEntry()`.
4. Tambah posting otomatis untuk pencairan, pembayaran, simpanan, dan kas.
5. Tambah reversal untuk pembatalan pembayaran dan koreksi kas.
6. Backfill jurnal dari data lama.
7. Ganti laporan akuntansi agar membaca jurnal.
8. Tambah closing period dan adjustment journal.
9. Tambah audit report untuk transaksi tanpa jurnal atau jurnal tidak balance.

## Validation Rules

- Setiap journal posted wajib balance.
- Periode closed tidak boleh menerima posting baru kecuali adjustment resmi.
- Transaksi operasional tidak boleh dihapus jika sudah punya jurnal posted.
- Pembatalan wajib reversal, bukan mutasi ulang baris lama.
- Mapping kategori kas wajib ada sebelum posting kas non-pinjaman.
