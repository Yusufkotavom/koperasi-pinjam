# Roadmap Tambahan

Dokumen ini dibaca otomatis oleh halaman `/roadmap`.
Gunakan checklist agar status terbaca:
- `[x]` = DONE
- `[ ]` = PLANNED

## Dashboard & Overview
Ringkasan inti operasional untuk pengurus dan admin harian.
- [x] Stat utama dashboard (nasabah aktif, pinjaman aktif, outstanding, tunggakan)
- [x] Quick menu ke modul operasional paling sering dipakai
- [x] Arus kas 6 bulan terakhir + indikator surplus bulan berjalan
- [x] Top tunggakan per kelompok
- [x] Quick view penagihan mingguan dan bulanan
- [x] Panel pokok berjalan per sistem (mingguan vs bulanan)
- [ ] Widget tren WoW/MoM untuk outstanding dan tunggakan
- [ ] Alert center terpusat (jatuh tempo, overdue, target kolektor)

## Monitoring Operasional
Monitoring kualitas portofolio pinjaman dan ritme penagihan.
- [x] Monitoring tunggakan (aging report)
- [x] Rekap kolektor (target, realisasi, setoran, tunggakan)
- [x] Monitoring pokok berjalan detail kontrak (`/monitoring/pokok-berjalan`)
- [x] Export CSV multi-mode untuk monitoring pokok berjalan (detail/summary/per-sistem/risk/per-nasabah)
- [ ] Export PDF monitoring pokok berjalan (landscape + header company)
- [ ] Filter monitoring pokok berjalan per kolektor
- [ ] Filter monitoring pokok berjalan per wilayah/kelompok
- [ ] Bucket risiko configurable (mis. 1-7, 8-30, 31-60, >60)
- [ ] Drill-down dari dashboard card ke list detail terfilter otomatis

## Pengajuan, Pencairan, Pembayaran
Alur inti kredit dari request sampai pembayaran cicilan.
- [x] Pengajuan pinjaman (baru, daftar, detail, approval)
- [x] Simulasi angsuran editable (bunga/desimal lebih fleksibel)
- [x] Pencairan pinjaman dengan validasi saldo kas
- [x] Pencairan dari simpanan (pilih sumber dana: KAS atau SIMPANAN)
- [x] Submit guard anti double-submit pada pencairan
- [x] Backdate pencairan dan transaksi kas
- [x] Pembayaran angsuran + pembatalan pembayaran
- [x] Filter schedule aktif untuk proses pembayaran
- [x] Auto-kembalikan saldo simpanan saat pinjaman lunas
- [ ] Batch posting pembayaran (multi kontrak)
- [ ] Reminder otomatis untuk angsuran jatuh tempo

## Simpanan & Modal Alternatif
Kelola modal dari penyimpan non-anggota untuk pencairan pinjaman.
- [x] CRUD simpanan (create/list/detail/edit)
- [x] Identitas penyimpan (nama, NIK, HP, alamat, nomor rekening)
- [x] Tracking saldo tersedia vs terpakai
- [x] Bagi hasil (persen + periode: bulanan/triwulan/tahunan)
- [x] Integrasi pencairan: pilih simpanan spesifik dari dropdown
- [x] Tracking penggunaan simpanan per pinjaman
- [x] Jurnal akuntansi pencairan dari simpanan
- [x] Auto-kembalikan saldo saat pinjaman lunas
- [x] Tutup simpanan dengan validasi saldo terpakai = 0
- [x] Transaksi setor/tarik simpanan
- [x] Hitung bagi hasil manual per periode
- [x] Bayar bagi hasil simpanan
- [x] Export CSV simpanan
- [ ] Dashboard simpanan (total modal, terpakai, ROI)
- [ ] Auto-hitung bagi hasil via cron job
- [ ] Notifikasi ke penyimpan saat dana dipakai/dikembalikan

## Kas & Akuntansi
Menjaga konsistensi arus kas dan jurnal akuntansi.
- [x] Kas masuk/keluar dengan alur approval
- [x] Mapping kategori kas ke akun akuntansi
- [x] Sinkronisasi jurnal saat edit kategori kas
- [x] Laporan arus kas, buku besar, neraca, laba rugi, rekonsiliasi
- [x] Export CSV laporan utama (arus kas, buku besar, neraca, laba rugi, rekonsiliasi, transaksi per user)
- [x] Export PDF landscape laporan utama dengan kop `CompanyDocumentHeader`
- [x] Scope laporan per company (tenant-safe)
- [x] Denda dinamis via settings
- [ ] Dashboard kualitas jurnal (unposted/imbalanced check)
- [ ] Rekonsiliasi kas semi-otomatis dengan rule engine

## Master Data & Dokumen
Kelola data inti dan output dokumen operasional.
- [x] Nasabah (create/list/detail/edit)
- [x] Kelompok (create/list/edit)
- [x] Kolektor (create/list/edit/delete)
- [x] Dokumen cetak (kuitansi, dokumen pencairan, kartu angsuran)
- [x] Upload dokumen ke Vercel Blob
- [x] Export CSV master nasabah dengan filter (search/status/kelompok)
- [x] Export PDF landscape master nasabah dengan kop `CompanyDocumentHeader`
- [ ] Import data nasabah/kelompok via CSV template
- [ ] Arsip dokumen dengan tag + pencarian cepat

## UX, Audit, dan Produktivitas
Meningkatkan kecepatan kerja tim operasional.
- [x] Validasi error lebih jelas di form kas
- [x] Stabilitas auth/middleware produksi
- [x] Panduan pengguna dan roadmap di dashboard
- [ ] Global search dengan hasil nyata lintas modul
- [ ] Notification panel in-app
- [ ] Riwayat aktivitas user-level untuk audit operasional
- [ ] Saved filter preset per user pada halaman monitoring/laporan
- [x] Baseline automated test export API (Vitest)
- [x] Baseline smoke E2E (Playwright) untuk health-check UI
