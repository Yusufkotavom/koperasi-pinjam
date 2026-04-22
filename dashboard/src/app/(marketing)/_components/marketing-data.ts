import {
  Banknote,
  BarChart3,
  ClipboardCheck,
  FileText,
  Landmark,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react"

export const metrics = [
  { value: "4x", label: "lebih cepat menyiapkan laporan bulanan" },
  { value: "24", label: "modul kerja harian dalam satu portal" },
  { value: "1", label: "sumber data untuk tim lapangan & kantor" },
]

export const productFeatures = [
  {
    icon: Users,
    title: "Data Nasabah Terpusat",
    description: "Profil anggota, kelompok, simpanan, dokumen, dan riwayat pinjaman tersimpan dalam alur yang mudah ditelusuri.",
    image: "/snitch/project/master_nasabah_client_data_management/nasabah.png",
  },
  {
    icon: ClipboardCheck,
    title: "Pengajuan sampai Pencairan",
    description: "Tim bisa memproses plafon, tenor, bunga, approval, potongan, dan kontrak tanpa spreadsheet terpisah.",
    image: "/snitch/project/pengajuan_pinjaman_loan_application_form/pengajuan.png",
  },
  {
    icon: WalletCards,
    title: "Angsuran & Bukti Bayar",
    description: "Pembayaran tunai atau transfer tercatat dengan jadwal, denda, bukti bayar, dan kuitansi yang siap dicetak.",
    image: "/snitch/project/data_tunggakan_arrears_monitoring/pembayaran.png",
  },
  {
    icon: Banknote,
    title: "Kas Masuk Keluar",
    description: "Kategori kas menjaga transaksi operasional, pencairan, simpanan, dan angsuran tetap jelas setiap hari.",
    image: "/snitch/project/kas_masuk_keluar_cash_flow_management/kas.png",
  },
  {
    icon: BarChart3,
    title: "Laporan Akuntansi",
    description: "Buku besar, neraca, laba rugi, arus kas, dan transaksi per user tersedia untuk evaluasi manajemen.",
    image: "/snitch/project/laporan_laba_rugi_profit_loss_report/laporan.png",
  },
  {
    icon: ShieldCheck,
    title: "Kontrol Risiko",
    description: "Ranking tunggakan membantu pengurus membaca risiko lebih cepat sebelum kredit bermasalah membesar.",
    image: "/snitch/project/cooperative_manager_dashboard/dashboard.png",
  },
]

export const testimonials = [
  {
    quote: "Kami tidak lagi menunggu rekap manual akhir minggu. Pengajuan, kas, dan tunggakan bisa dibaca di hari yang sama.",
    name: "Rina Wulandari",
    role: "Manajer Operasional KSP",
  },
  {
    quote: "Tim lapangan lebih disiplin karena bukti bayar, jadwal angsuran, dan status pinjaman berada dalam satu alur.",
    name: "Bambang Prasetyo",
    role: "Koordinator Kolektor",
  },
  {
    quote: "Laporan pengurus jadi lebih tenang. Angka kas dan pinjaman tidak perlu dicocokkan dari banyak file.",
    name: "Dewi Kartika",
    role: "Bendahara Koperasi",
  },
]

export const blogPosts = [
  {
    slug: "mengurangi-tunggakan-koperasi",
    title: "Cara Membaca Risiko Tunggakan sebelum Menjadi Macet",
    category: "Risiko",
    excerpt: "Gunakan umur tunggakan, pola bayar, dan data kelompok untuk menentukan prioritas penagihan yang lebih adil.",
    readTime: "5 menit",
  },
  {
    slug: "alur-pengajuan-pinjaman",
    title: "Alur Pengajuan Pinjaman yang Rapi untuk Koperasi",
    category: "Operasional",
    excerpt: "Mulai dari data anggota, survey, approval, pencairan, hingga dokumen kontrak tanpa kehilangan jejak keputusan.",
    readTime: "6 menit",
  },
  {
    slug: "laporan-keuangan-koperasi",
    title: "Laporan Keuangan Koperasi yang Siap Dibaca Pengurus",
    category: "Akuntansi",
    excerpt: "Pisahkan transaksi kas, simpanan, bunga, denda, dan pencairan agar laporan bulanan lebih mudah diaudit.",
    readTime: "4 menit",
  },
]

export const processSteps = [
  { title: "Rapikan Data", description: "Impor atau input anggota, kelompok, user, dan kategori transaksi." },
  { title: "Jalankan Alur Pinjaman", description: "Buat pengajuan, approval, pencairan, jadwal, dan pembayaran." },
  { title: "Pantau Risiko", description: "Baca tunggakan, histori bayar, dan ranking nasabah setiap hari." },
  { title: "Cetak Laporan", description: "Siapkan dokumen pengurus, kuitansi, kartu angsuran, dan laporan akuntansi." },
]

export const productPlans = [
  {
    name: "Operasional",
    price: "Untuk koperasi kecil",
    description: "Cocok untuk mulai merapikan nasabah, pengajuan, pembayaran, dan kas harian.",
    features: ["Data nasabah & kelompok", "Pengajuan pinjaman", "Jadwal angsuran", "Kas masuk keluar"],
  },
  {
    name: "Manajemen",
    price: "Paling direkomendasikan",
    description: "Untuk koperasi yang butuh monitoring risiko, dokumen, dan laporan pengurus.",
    features: ["Semua fitur Operasional", "Monitoring tunggakan", "Dokumen siap cetak", "Laporan laba rugi & neraca"],
  },
  {
    name: "Multi-Tim",
    price: "Untuk cabang & tim besar",
    description: "Dirancang untuk kontrol akses, audit aktivitas, dan operasional lintas peran.",
    features: ["Role user", "Audit aktivitas", "Rekonsiliasi", "Laporan transaksi per user"],
  },
]

export const trustPoints = [
  { icon: Landmark, label: "Dibuat khusus untuk koperasi simpan pinjam" },
  { icon: FileText, label: "Dokumen operasional siap cetak" },
  { icon: ShieldCheck, label: "Kontrol akses & riwayat aktivitas" },
]

