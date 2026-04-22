import { Building2, Users, FileText, Wallet, BarChart3, Settings, ShieldCheck, HelpCircle } from "lucide-react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function PanduanPenggunaPage() {
  return (
    <div className="container max-w-5xl py-10 space-y-10">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Panduan Pengguna KoperasiApp</h1>
        <p className="text-xl text-muted-foreground">
          Panduan lengkap operasional sistem informasi koperasi dari pengaturan awal hingga pelaporan keuangan.
        </p>
      </div>

      <Alert className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <AlertTitle className="text-emerald-800 dark:text-emerald-400">Keamanan Data</AlertTitle>
        <AlertDescription className="text-emerald-700 dark:text-emerald-500">
          Seluruh data transaksi dan informasi nasabah dienkripsi dan diproteksi sesuai hak akses masing-masing role (Admin, Manager, Teller, Kolektor).
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 w-full h-auto gap-2 bg-transparent p-0">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">Overview</TabsTrigger>
          <TabsTrigger value="master" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">Master Data</TabsTrigger>
          <TabsTrigger value="pengajuan" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">Pinjaman</TabsTrigger>
          <TabsTrigger value="pembayaran" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">Pembayaran</TabsTrigger>
          <TabsTrigger value="kas" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">Arus Kas</TabsTrigger>
          <TabsTrigger value="laporan" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">Laporan</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">Settings & User</TabsTrigger>
        </TabsList>

        {/* --- OVERVIEW --- */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
                Dashboard Utama
              </CardTitle>
              <CardDescription>Pusat kontrol dan ringkasan aktivitas koperasi secara real-time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-xl border overflow-hidden bg-muted">
                <Image 
                  src="/docs/screenshots/dashboard.png" 
                  alt="Dashboard KoperasiApp" 
                  width={1200} 
                  height={675}
                  className="w-full object-cover"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold">Statistik Utama</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Total Nasabah Aktif</li>
                    <li>Total Pinjaman (Outstanding)</li>
                    <li>Arus Kas Hari Ini</li>
                    <li>Status Tunggakan Terkini</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Quick Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Gunakan sidebar kiri untuk navigasi cepat antar modul. Dashboard juga menampilkan notifikasi penting terkait pengajuan baru yang butuh approval.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- MASTER DATA --- */}
        <TabsContent value="master" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Manajemen Nasabah & Kelompok
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">1. Daftar Nasabah</h3>
                <div className="rounded-xl border overflow-hidden bg-muted">
                  <Image 
                    src="/docs/screenshots/nasabah.png" 
                    alt="Manajemen Nasabah" 
                    width={1200} 
                    height={675}
                    className="w-full object-cover"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Modul ini digunakan untuk mengelola data anggota koperasi. Pastikan NIK diinput dengan benar untuk validasi duplikasi. Dokumen pendukung seperti foto KTP dapat diupload langsung ke profil nasabah.
                </p>
              </div>

              <div className="space-y-4 border-t pt-8">
                <h3 className="text-lg font-semibold">2. Pengelompokan (Groups)</h3>
                <p className="text-sm text-muted-foreground">
                  Kelompok memudahkan manajemen penagihan massal. Nasabah dapat dikelompokkan berdasarkan wilayah atau jadwal pertemuan yang sama.
                </p>
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg text-sm flex gap-3 border border-blue-100 dark:border-blue-900">
                  <HelpCircle className="h-5 w-5 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-bold">Tips:</span> Gunakan fitur &quot;Ketua Kelompok&quot; untuk menentukan penanggung jawab komunikasi di tiap kelompok.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- PINJAMAN --- */}
        <TabsContent value="pengajuan" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600" />
                Siklus Pinjaman: Pengajuan & Approval
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">1. Form Pengajuan Baru</h3>
                <div className="rounded-xl border overflow-hidden bg-muted">
                  <Image 
                    src="/docs/screenshots/pengajuan.png" 
                    alt="Form Pengajuan Pinjaman" 
                    width={1200} 
                    height={675}
                    className="w-full object-cover"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="border p-3 rounded-lg">
                    <span className="font-bold block mb-1">Simulasi Otomatis</span>
                    Sistem akan menghitung angsuran pokok dan bunga secara real-time saat Anda mengisi plafon dan tenor.
                  </div>
                  <div className="border p-3 rounded-lg">
                    <span className="font-bold block mb-1">Dokumen Jaminan</span>
                    Lampirkan foto agunan atau surat perjanjian di bagian &quot;Dokumen Pendukung&quot;.
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t pt-8">
                <h3 className="text-lg font-semibold">2. Alur Approval</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <span className="bg-orange-100 text-orange-700 size-5 flex items-center justify-center rounded-full font-bold shrink-0">1</span>
                    <span>Admin/Teller menginput pengajuan nasabah.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="bg-orange-100 text-orange-700 size-5 flex items-center justify-center rounded-full font-bold shrink-0">2</span>
                    <span>Manager/Pimpinan mereview melalui menu Approval.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="bg-orange-100 text-orange-700 size-5 flex items-center justify-center rounded-full font-bold shrink-0">3</span>
                    <span>Jika disetujui, dana dapat dicairkan melalui modul Pencairan.</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- PEMBAYARAN --- */}
        <TabsContent value="pembayaran" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-600" />
                Penerimaan Angsuran
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-xl border overflow-hidden bg-muted">
                <Image 
                  src="/docs/screenshots/pembayaran.png" 
                  alt="Modul Pembayaran" 
                  width={1200} 
                  height={675}
                  className="w-full object-cover"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold">Metode Pencarian</h4>
                  <p className="text-sm text-muted-foreground">
                    Cari jadwal tagihan berdasarkan nama nasabah, NIK, atau nomor kontrak. Sistem akan menampilkan jadwal angsuran yang harus dibayar.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Tipe Bayar</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li><strong>Full:</strong> Bayar tepat sesuai tagihan periode.</li>
                    <li><strong>Parsial:</strong> Bayar sebagian (mencicil tagihan).</li>
                    <li><strong>Pelunasan:</strong> Melunasi seluruh sisa pokok sekaligus.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- ARUS KAS --- */}
        <TabsContent value="kas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-cyan-600" />
                Manajemen Kas (Masuk & Keluar)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-xl border overflow-hidden bg-muted">
                <Image 
                  src="/docs/screenshots/kas.png" 
                  alt="Manajemen Arus Kas" 
                  width={1200} 
                  height={675}
                  className="w-full object-cover"
                />
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border">
                <h4 className="font-semibold mb-2">Workflow Approval Kas</h4>
                <p className="text-sm text-muted-foreground">
                  Setiap transaksi kas manual (seperti biaya operasional atau pendapatan lain-lain) memerlukan approval dari Manager sebelum masuk ke Buku Besar dan Laporan Laba Rugi.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- LAPORAN --- */}
        <TabsContent value="laporan" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Laporan Keuangan & Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="rounded-xl border overflow-hidden bg-muted">
                <Image 
                  src="/docs/screenshots/laporan.png" 
                  alt="Laporan Keuangan" 
                  width={1200} 
                  height={675}
                  className="w-full object-cover"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: "Arus Kas", desc: "Monitor mutasi kas tunai & bank." },
                  { title: "Laba Rugi", desc: "Pendapatan bunga vs beban operasional." },
                  { title: "Neraca", desc: "Posisi aset, kewajiban, dan modal." },
                  { title: "Tunggakan", desc: "Laporan aging nasabah (NPL)." },
                  { title: "Buku Besar", desc: "Rincian per akun/kategori kas." },
                  { title: "Kolektibilitas", desc: "Ranking risiko nasabah (A/B/C/D)." },
                ].map((item) => (
                  <div key={item.title} className="p-4 border rounded-lg bg-card shadow-sm">
                    <h5 className="font-bold text-sm mb-1">{item.title}</h5>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- SETTINGS --- */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-slate-600" />
                Konfigurasi Sistem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-xl border overflow-hidden bg-muted">
                <Image 
                  src="/docs/screenshots/settings.png" 
                  alt="Pengaturan Sistem" 
                  width={1200} 
                  height={675}
                  className="w-full object-cover"
                />
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold underline underline-offset-4">Struktur Settings Baru</h4>
                <div className="grid md:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-2">
                    <p className="font-bold">Company</p>
                    <p className="text-muted-foreground">Kelola nama koperasi, logo, alamat, kontak, dan zona waktu untuk dokumen operasional.</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold">User Company</p>
                    <p className="text-muted-foreground">Owner/Admin dapat membuat user baru sebagai Admin, Teller, Kolektor, Surveyor, Manager, Pimpinan, atau Akuntansi.</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold">Akuntansi</p>
                    <p className="text-muted-foreground">Pilih Simple untuk pencatatan dasar atau Proper untuk double-entry dan COA.</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold">Database</p>
                    <p className="text-muted-foreground">Cleanup, import demo data, dan backfill jurnal ada di halaman Database dengan akses terbatas.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <footer className="text-center py-10 border-t">
        <p className="text-sm text-muted-foreground">
          © 2024 KoperasiApp Dashboard • Dokumen Internal v1.1
        </p>
      </footer>
    </div>
  )
}
