--
-- PostgreSQL database dump
--

\restrict 1beX2zBxNjxc5eDG7MiwaK7ZmLmxHGYIdYiVIROfVS7vYKeOFNfyITcjwvWa0sM

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AccountType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AccountType" AS ENUM (
    'ASSET',
    'LIABILITY',
    'EQUITY',
    'REVENUE',
    'EXPENSE'
);


--
-- Name: ApprovalEntityType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ApprovalEntityType" AS ENUM (
    'PENGAJUAN',
    'PEMBAYARAN',
    'KAS'
);


--
-- Name: ApprovalStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ApprovalStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


--
-- Name: AuditAction; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AuditAction" AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE',
    'APPROVE',
    'REJECT',
    'DISBURSE',
    'PAYMENT',
    'CASH',
    'LOGIN',
    'LOGOUT'
);


--
-- Name: CompanyStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CompanyStatus" AS ENUM (
    'ACTIVE',
    'SUSPENDED',
    'DELETED'
);


--
-- Name: JenisKas; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."JenisKas" AS ENUM (
    'MASUK',
    'KELUAR',
    'TRANSFER'
);


--
-- Name: JenisPinjaman; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."JenisPinjaman" AS ENUM (
    'REGULAR',
    'MIKRO',
    'USAHA'
);


--
-- Name: JenisTransaksiSimpanan; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."JenisTransaksiSimpanan" AS ENUM (
    'SETOR',
    'TARIK'
);


--
-- Name: JournalSourceType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."JournalSourceType" AS ENUM (
    'PEMBAYARAN',
    'PENCAIRAN',
    'KAS',
    'SIMPANAN',
    'ADJUSTMENT',
    'REVERSAL',
    'DEMO_IMPORT'
);


--
-- Name: JournalStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."JournalStatus" AS ENUM (
    'DRAFT',
    'POSTED',
    'VOIDED'
);


--
-- Name: KasJenis; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."KasJenis" AS ENUM (
    'TUNAI',
    'BANK'
);


--
-- Name: KolektorBonusStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."KolektorBonusStatus" AS ENUM (
    'PENDING',
    'READY',
    'PAID',
    'CANCELED'
);


--
-- Name: MetodeBayar; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MetodeBayar" AS ENUM (
    'TUNAI',
    'TRANSFER'
);


--
-- Name: NotifikasiJenis; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NotifikasiJenis" AS ENUM (
    'JATUH_TEMPO',
    'TUNGGAKAN',
    'APPROVAL',
    'KAS',
    'REMINDER',
    'SYSTEM'
);


--
-- Name: RekonsiliasiStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RekonsiliasiStatus" AS ENUM (
    'DRAFT',
    'SELESAI'
);


--
-- Name: RoleType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RoleType" AS ENUM (
    'ADMIN',
    'TELLER',
    'KOLEKTOR',
    'SURVEYOR',
    'MANAGER',
    'PIMPINAN',
    'AKUNTANSI',
    'SUPER_ADMIN',
    'OWNER'
);


--
-- Name: StatusBayar; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."StatusBayar" AS ENUM (
    'BELUM_BAYAR',
    'SUDAH_BAYAR'
);


--
-- Name: StatusNasabah; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."StatusNasabah" AS ENUM (
    'AKTIF',
    'NON_AKTIF',
    'KELUAR'
);


--
-- Name: StatusPengajuan; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."StatusPengajuan" AS ENUM (
    'DRAFT',
    'DIAJUKAN',
    'DISURVEY',
    'DISETUJUI',
    'DITOLAK',
    'DICAIRKAN',
    'SELESAI'
);


--
-- Name: StatusPengembalian; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."StatusPengembalian" AS ENUM (
    'TERPAKAI',
    'DIKEMBALIKAN'
);


--
-- Name: StatusPinjaman; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."StatusPinjaman" AS ENUM (
    'AKTIF',
    'MENUNGGAK',
    'MACET',
    'LUNAS'
);


--
-- Name: StatusSimpanan; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."StatusSimpanan" AS ENUM (
    'AKTIF',
    'TUTUP'
);


--
-- Name: SumberDana; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SumberDana" AS ENUM (
    'KAS',
    'SIMPANAN'
);


--
-- Name: TenorType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TenorType" AS ENUM (
    'BULANAN',
    'MINGGUAN'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    type public."AccountType" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL
);


--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_settings (
    key text NOT NULL,
    value jsonb NOT NULL,
    "updatedAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: approval_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approval_logs (
    id text NOT NULL,
    "entityType" public."ApprovalEntityType" NOT NULL,
    "entityId" text NOT NULL,
    status public."ApprovalStatus" DEFAULT 'PENDING'::public."ApprovalStatus" NOT NULL,
    catatan text,
    "requestedById" text NOT NULL,
    "approvedById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    "actorId" text,
    "entityType" text NOT NULL,
    "entityId" text,
    action public."AuditAction" NOT NULL,
    "beforeData" jsonb,
    "afterData" jsonb,
    metadata jsonb,
    "ipAddress" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: bagi_hasil_simpanan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bagi_hasil_simpanan (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "simpananId" text NOT NULL,
    periode text NOT NULL,
    "jumlahBagiHasil" numeric(15,2) NOT NULL,
    "tanggalBayar" timestamp(3) without time zone,
    "statusBayar" public."StatusBayar" DEFAULT 'BELUM_BAYAR'::public."StatusBayar" NOT NULL,
    "catatanBayar" text
);


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    address text,
    phone text,
    email text,
    "isActive" boolean DEFAULT true NOT NULL,
    "ownerId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    status public."CompanyStatus" DEFAULT 'ACTIVE'::public."CompanyStatus" NOT NULL,
    "suspendedAt" timestamp(3) without time zone,
    "suspendedReason" text,
    "suspendedUntil" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    "deletedReason" text
);


--
-- Name: company_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_settings (
    id text NOT NULL,
    "companyId" text NOT NULL,
    key text NOT NULL,
    value jsonb NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: jadwal_angsuran; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jadwal_angsuran (
    id text NOT NULL,
    "pinjamanId" text NOT NULL,
    "angsuranKe" integer NOT NULL,
    "tanggalJatuhTempo" timestamp(3) without time zone NOT NULL,
    pokok numeric(15,2) NOT NULL,
    bunga numeric(15,2) NOT NULL,
    total numeric(15,2) NOT NULL,
    "sudahDibayar" boolean DEFAULT false NOT NULL,
    "tanggalBayar" timestamp(3) without time zone,
    "dendaHarian" numeric(15,2) DEFAULT 0 NOT NULL,
    "companyId" text NOT NULL,
    dpd integer DEFAULT 0 NOT NULL,
    "cycleScore" integer
);


--
-- Name: journal_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_entries (
    id text NOT NULL,
    "entryNo" text NOT NULL,
    "entryDate" timestamp(3) without time zone NOT NULL,
    description text NOT NULL,
    "sourceType" public."JournalSourceType" NOT NULL,
    "sourceId" text,
    status public."JournalStatus" DEFAULT 'POSTED'::public."JournalStatus" NOT NULL,
    "postedById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL
);


--
-- Name: journal_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_lines (
    id text NOT NULL,
    "journalEntryId" text NOT NULL,
    "accountId" text NOT NULL,
    debit numeric(15,2) DEFAULT 0 NOT NULL,
    credit numeric(15,2) DEFAULT 0 NOT NULL,
    memo text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: kas_kategori; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kas_kategori (
    id text NOT NULL,
    nama text NOT NULL,
    key text NOT NULL,
    jenis public."JenisKas" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "accountId" text,
    "companyId" text NOT NULL
);


--
-- Name: kas_transaksi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kas_transaksi (
    id text NOT NULL,
    tanggal timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    jenis public."JenisKas" NOT NULL,
    "kategoriKey" text NOT NULL,
    deskripsi text NOT NULL,
    jumlah numeric(15,2) NOT NULL,
    "kasJenis" text DEFAULT 'TUNAI'::text NOT NULL,
    "buktiUrl" text,
    "inputOlehId" text NOT NULL,
    "isApproved" boolean DEFAULT true NOT NULL,
    "referensiId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "companyId" text NOT NULL,
    "kategoriId" text NOT NULL,
    "kasJenisTujuan" text
);


--
-- Name: kelompok; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kelompok (
    id text NOT NULL,
    kode text NOT NULL,
    nama text NOT NULL,
    ketua text,
    wilayah text,
    "jadwalPertemuan" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL
);


--
-- Name: kolektor_bonus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kolektor_bonus (
    id text NOT NULL,
    "pinjamanId" text NOT NULL,
    "kolektorId" text NOT NULL,
    nominal numeric(15,2) DEFAULT 0 NOT NULL,
    status public."KolektorBonusStatus" DEFAULT 'PENDING'::public."KolektorBonusStatus" NOT NULL,
    "eligibleAt" timestamp(3) without time zone,
    "paidAt" timestamp(3) without time zone,
    "paidById" text,
    catatan text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL
);


--
-- Name: kolektor_targets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kolektor_targets (
    id text NOT NULL,
    "kolektorId" text NOT NULL,
    "periodMonth" integer NOT NULL,
    "periodYear" integer NOT NULL,
    "targetTagihan" numeric(15,2) NOT NULL,
    "realisasiTagihan" numeric(15,2) DEFAULT 0 NOT NULL,
    "targetKunjungan" integer DEFAULT 0 NOT NULL,
    "realisasiKunjungan" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL
);


--
-- Name: nasabah; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nasabah (
    id text NOT NULL,
    "nomorAnggota" text NOT NULL,
    "namaLengkap" text NOT NULL,
    nik text NOT NULL,
    "tempatLahir" text,
    "tanggalLahir" timestamp(3) without time zone,
    alamat text NOT NULL,
    kelurahan text,
    kecamatan text,
    "kotaKab" text,
    "noHp" text NOT NULL,
    pekerjaan text,
    "namaUsaha" text,
    status public."StatusNasabah" DEFAULT 'AKTIF'::public."StatusNasabah" NOT NULL,
    "tanggalGabung" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "fotoUrl" text,
    "dokumenUrls" text[],
    "kolektorId" text,
    "kelompokId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL
);


--
-- Name: notifikasi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifikasi (
    id text NOT NULL,
    "userId" text,
    jenis public."NotifikasiJenis" NOT NULL,
    judul text NOT NULL,
    pesan text NOT NULL,
    link text,
    "isRead" boolean DEFAULT false NOT NULL,
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "companyId" text NOT NULL
);


--
-- Name: pembayaran; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pembayaran (
    id text NOT NULL,
    "nomorTransaksi" text NOT NULL,
    "pinjamanId" text NOT NULL,
    "tanggalBayar" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    pokok numeric(15,2) NOT NULL,
    bunga numeric(15,2) NOT NULL,
    denda numeric(15,2) DEFAULT 0 NOT NULL,
    "totalBayar" numeric(15,2) NOT NULL,
    metode public."MetodeBayar" DEFAULT 'TUNAI'::public."MetodeBayar" NOT NULL,
    catatan text,
    "inputOlehId" text NOT NULL,
    "isBatalkan" boolean DEFAULT false NOT NULL,
    "alasanBatal" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "buktiBayarUrl" text,
    "companyId" text NOT NULL
);


--
-- Name: pengajuan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pengajuan (
    id text NOT NULL,
    "nomorPengajuan" text NOT NULL,
    "nasabahId" text NOT NULL,
    "kelompokId" text,
    "jenisPinjaman" public."JenisPinjaman" DEFAULT 'REGULAR'::public."JenisPinjaman" NOT NULL,
    "plafonDiajukan" numeric(15,2) NOT NULL,
    "plafonDisetujui" numeric(15,2),
    tenor integer NOT NULL,
    "bungaPerBulan" numeric(5,4) NOT NULL,
    "tujuanPinjaman" text,
    agunan text,
    "hasilSurvey" text,
    "catatanApproval" text,
    status public."StatusPengajuan" DEFAULT 'DRAFT'::public."StatusPengajuan" NOT NULL,
    "tanggalPengajuan" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "tanggalSurvey" timestamp(3) without time zone,
    "tanggalApproval" timestamp(3) without time zone,
    "surveyorId" text,
    "approverId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "tenorType" public."TenorType" DEFAULT 'BULANAN'::public."TenorType" NOT NULL,
    "catatanPengajuan" text,
    "dokumenPendukungUrls" text[] DEFAULT ARRAY[]::text[],
    "companyId" text NOT NULL
);


--
-- Name: penggunaan_simpanan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.penggunaan_simpanan (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "simpananId" text NOT NULL,
    "pinjamanId" text NOT NULL,
    "jumlahDigunakan" numeric(15,2) NOT NULL,
    "tanggalPakai" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "tanggalKembali" timestamp(3) without time zone,
    "statusKembali" public."StatusPengembalian" DEFAULT 'TERPAKAI'::public."StatusPengembalian" NOT NULL
);


--
-- Name: penjamin; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.penjamin (
    id text NOT NULL,
    "namaLengkap" text NOT NULL,
    nik text NOT NULL,
    hubungan text NOT NULL,
    "noHp" text NOT NULL,
    alamat text,
    "nasabahId" text NOT NULL,
    "companyId" text NOT NULL
);


--
-- Name: pinjaman; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pinjaman (
    id text NOT NULL,
    "nomorKontrak" text NOT NULL,
    "pengajuanId" text NOT NULL,
    "pokokPinjaman" numeric(15,2) NOT NULL,
    tenor integer NOT NULL,
    "bungaPerBulan" numeric(5,4) NOT NULL,
    "angsuranPokok" numeric(15,2) NOT NULL,
    "angsuranBunga" numeric(15,2) NOT NULL,
    "totalAngsuran" numeric(15,2) NOT NULL,
    "potonganAdmin" numeric(15,2) DEFAULT 0 NOT NULL,
    "potonganProvisi" numeric(15,2) DEFAULT 0 NOT NULL,
    "nilaiCair" numeric(15,2) NOT NULL,
    "tanggalCair" timestamp(3) without time zone NOT NULL,
    "tanggalJatuhTempo" timestamp(3) without time zone NOT NULL,
    "sisaPinjaman" numeric(15,2) NOT NULL,
    status public."StatusPinjaman" DEFAULT 'AKTIF'::public."StatusPinjaman" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "tenorType" public."TenorType" DEFAULT 'BULANAN'::public."TenorType" NOT NULL,
    "companyId" text NOT NULL,
    "sumberDana" public."SumberDana" DEFAULT 'KAS'::public."SumberDana" NOT NULL,
    "simpananId" text,
    "kasJenis" public."KasJenis",
    "finalScore" numeric(5,2),
    "categoryGrade" character varying(2)
);


--
-- Name: rekonsiliasi_kas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rekonsiliasi_kas (
    id text NOT NULL,
    "accountId" text NOT NULL,
    "periodMonth" integer NOT NULL,
    "periodYear" integer NOT NULL,
    "saldoStatement" numeric(15,2) NOT NULL,
    "saldoBook" numeric(15,2) NOT NULL,
    selisih numeric(15,2) NOT NULL,
    catatan text,
    "buktiUrl" text,
    status public."RekonsiliasiStatus" DEFAULT 'DRAFT'::public."RekonsiliasiStatus" NOT NULL,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL
);


--
-- Name: simpanan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.simpanan (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "nomorRekening" text NOT NULL,
    "namaPenyimpan" text NOT NULL,
    nik text,
    "noHp" text NOT NULL,
    alamat text,
    "saldoAwal" numeric(15,2) NOT NULL,
    "saldoTersedia" numeric(15,2) NOT NULL,
    "saldoTerpakai" numeric(15,2) DEFAULT 0 NOT NULL,
    "persenBagiHasil" numeric(5,2) NOT NULL,
    "periodeBagiHasil" integer DEFAULT 1 NOT NULL,
    status public."StatusSimpanan" DEFAULT 'AKTIF'::public."StatusSimpanan" NOT NULL,
    "tanggalBuka" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "tanggalTutup" timestamp(3) without time zone,
    "catatanPenutupan" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text
);


--
-- Name: transaksi_simpanan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transaksi_simpanan (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "simpananId" text NOT NULL,
    jenis public."JenisTransaksiSimpanan" NOT NULL,
    jumlah numeric(15,2) NOT NULL,
    tanggal timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    keterangan text,
    "inputOlehId" text
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id text NOT NULL,
    "userId" text NOT NULL,
    role public."RoleType" NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text
);


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts (id, code, name, type, "isActive", "createdAt", "updatedAt", "companyId") FROM stdin;
cmrj1sh0t000tgb8ssdc9t1qe	BEBAN_BONUS_KOLEKTOR	Beban Bonus Kolektor	EXPENSE	t	2026-07-13 09:56:38.574	2026-07-28 11:11:12.409	cmrj0udei0005ik8s8kp0cmsm
cmrjcbrh90003ji8sk8dv8qo4	CASH_BANK_BCA	Kas Bank BCA	ASSET	t	2026-07-13 14:51:34.75	2026-07-28 11:11:12.208	cmrj0udei0005ik8s8kp0cmsm
cmrj1sh0z000ugb8sopypv31b	BEBAN_LAINNYA	Beban Lainnya	EXPENSE	t	2026-07-13 09:56:38.58	2026-07-28 11:11:12.418	cmrj0udei0005ik8s8kp0cmsm
cmrj1sh15000vgb8s51juglxn	PENYESUAIAN	Penyesuaian	EXPENSE	t	2026-07-13 09:56:38.585	2026-07-28 11:11:12.426	cmrj0udei0005ik8s8kp0cmsm
cmrjcbrhi0004ji8s9u1lpiy3	CASH_BANK_MANDIRI	Kas Bank Mandiri	ASSET	t	2026-07-13 14:51:34.759	2026-07-28 11:11:12.222	cmrj0udei0005ik8s8kp0cmsm
cmrj1sgz5000hgb8smowtds56	PIUTANG_PINJAMAN	Piutang Pinjaman	ASSET	t	2026-07-13 09:56:38.513	2026-07-28 11:11:12.238	cmrj0udei0005ik8s8kp0cmsm
cmrj1sgzb000igb8s1tbtuym5	SIMPANAN_ANGGOTA	Simpanan Anggota	LIABILITY	t	2026-07-13 09:56:38.519	2026-07-28 11:11:12.253	cmrj0udei0005ik8s8kp0cmsm
cmrj1sgzg000jgb8slsmbaeg8	UTANG_USAHA	Utang Usaha	LIABILITY	t	2026-07-13 09:56:38.524	2026-07-28 11:11:12.273	cmrj0udei0005ik8s8kp0cmsm
cmrj1uwsv001egb8s0u8agngy	AKUN_SAVING	akun_saving	ASSET	t	2026-07-13 09:58:32.335	2026-07-13 09:58:32.335	cmrj0udei0005ik8s8kp0cmsm
cmrj1sgzl000kgb8swa8ju0yh	MODAL_ANGGOTA	Modal Anggota	EQUITY	t	2026-07-13 09:56:38.529	2026-07-28 11:11:12.295	cmrj0udei0005ik8s8kp0cmsm
cmrj1sgzq000lgb8s0gdhifsk	SHU_DITAHAN	SHU Ditahan	EQUITY	t	2026-07-13 09:56:38.534	2026-07-28 11:11:12.307	cmrj0udei0005ik8s8kp0cmsm
cmrj1sgzv000mgb8s2qlxximl	PENDAPATAN_BUNGA	Pendapatan Bunga Pinjaman	REVENUE	t	2026-07-13 09:56:38.54	2026-07-28 11:11:12.32	cmrj0udei0005ik8s8kp0cmsm
cmrj1sh00000ngb8s0ubrh6xv	PENERIMAAN_ANGSURAN	Penerimaan Angsuran	REVENUE	t	2026-07-13 09:56:38.544	2026-07-28 11:11:12.331	cmrj0udei0005ik8s8kp0cmsm
cmrj1sgyg000fgb8sexy13w1p	CASH_TUNAI	Kas Tunai	ASSET	t	2026-07-13 09:56:38.488	2026-07-28 11:11:12.146	cmrj0udei0005ik8s8kp0cmsm
cmrj1sh04000ogb8su33lmyai	PENDAPATAN_DENDA	Pendapatan Denda	REVENUE	t	2026-07-13 09:56:38.549	2026-07-28 11:11:12.343	cmrj0udei0005ik8s8kp0cmsm
cmrj1sgz0000ggb8sl847qqyh	CASH_BANK	Kas Bank	ASSET	t	2026-07-13 09:56:38.508	2026-07-28 11:11:12.164	cmrj0udei0005ik8s8kp0cmsm
cmrj1sh09000pgb8s0c6h5p03	PENDAPATAN_ADMIN	Pendapatan Administrasi/Provisi	REVENUE	t	2026-07-13 09:56:38.553	2026-07-28 11:11:12.366	cmrj0udei0005ik8s8kp0cmsm
cmrj1sh0e000qgb8svprkeb99	PENDAPATAN_LAINNYA	Pendapatan Lainnya	REVENUE	t	2026-07-13 09:56:38.558	2026-07-28 11:11:12.377	cmrj0udei0005ik8s8kp0cmsm
cmrj1sh0k000rgb8s6gpwph4r	BEBAN_OPERASIONAL	Beban Operasional	EXPENSE	t	2026-07-13 09:56:38.564	2026-07-28 11:11:12.39	cmrj0udei0005ik8s8kp0cmsm
cmrjcbrgr0002ji8s3q1s2601	CASH_BANK_BRI	Kas Bank BRI	ASSET	t	2026-07-13 14:51:34.732	2026-07-28 11:11:12.182	cmrj0udei0005ik8s8kp0cmsm
cmrj1sh0o000sgb8s9as4u0b6	BEBAN_GAJI	Beban Gaji	EXPENSE	t	2026-07-13 09:56:38.569	2026-07-28 11:11:12.4	cmrj0udei0005ik8s8kp0cmsm
\.


--
-- Data for Name: app_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_settings (key, value, "updatedAt") FROM stdin;
\.


--
-- Data for Name: approval_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.approval_logs (id, "entityType", "entityId", status, catatan, "requestedById", "approvedById", "createdAt", "updatedAt") FROM stdin;
cmrs43qup000of58sjf1wfl18	PENGAJUAN	cmrs43kfg000lf58synh2xq9o	APPROVED		cmrj0udea0002ik8sx9h68js0	cmrj0udea0002ik8sx9h68js0	2026-07-19 18:11:19.345	2026-07-19 18:11:19.345
cmrs4av5b010of58s5892pa05	PENGAJUAN	cmrs4aqt5010lf58srmiavf9a	APPROVED		cmrj0udea0002ik8sx9h68js0	cmrj0udea0002ik8sx9h68js0	2026-07-19 18:16:51.503	2026-07-19 18:16:51.503
cms4jwl660158f58suxlx2lz7	PENGAJUAN	cms4jw9bo0155f58si088mau0	APPROVED		cmrj0udea0002ik8sx9h68js0	cmrj0udea0002ik8sx9h68js0	2026-07-28 11:06:53.358	2026-07-28 11:06:53.358
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, "actorId", "entityType", "entityId", action, "beforeData", "afterData", metadata, "ipAddress", "createdAt") FROM stdin;
cmrj1uwt5001fgb8su0oajio7	cmrj0udea0002ik8sx9h68js0	ACCOUNT	cmrj1uwsv001egb8s0u8agngy	CREATE	\N	{"code": "AKUN_SAVING", "name": "akun_saving", "type": "ASSET"}	\N	\N	2026-07-13 09:58:32.345
cmrs43kft000nf58soa51i0b0	cmrj0udea0002ik8sx9h68js0	PENGAJUAN	cmrs43kfg000lf58synh2xq9o	CREATE	\N	{"status": "DIAJUKAN", "nasabahId": "cmrs432u6000kf58sgqhdxa4r"}	\N	\N	2026-07-19 18:11:11.033
cmrs43qux000pf58sik5zndka	cmrj0udea0002ik8sx9h68js0	PENGAJUAN	cmrs43kfg000lf58synh2xq9o	APPROVE	\N	{"status": "DISETUJUI", "plafonDisetujui": "40000000"}	\N	\N	2026-07-19 18:11:19.353
cmrs450q50033f58sfovlco20	cmrj0udea0002ik8sx9h68js0	KAS_TRANSAKSI	cmrs450om002yf58souwqtt1a	CASH	\N	{"jenis": "MASUK", "jumlah": "1000000000", "kategoriKey": "MODAL"}	\N	\N	2026-07-19 18:12:18.797
cmrs47k5b00ahf58se0a0rsu7	cmrj0udea0002ik8sx9h68js0	KAS_TRANSAKSI	cmrs47k4k00acf58sk0n8q8ap	CASH	\N	{"jenis": "MASUK", "jumlah": "1000000000", "kategoriKey": "MODAL"}	\N	\N	2026-07-19 18:14:17.279
cmrs4a82d00zgf58sywnpmnty	cmrj0udea0002ik8sx9h68js0	PINJAMAN	cmrs4a81c00yyf58sab2ctyvd	DISBURSE	\N	\N	{"nilaiCair": 40000000, "pengajuanId": "cmrs43kfg000lf58synh2xq9o", "nomorKontrak": "KNT-MRS4A7ZM"}	\N	2026-07-19 18:16:21.589
cmrs4aqtf010nf58sjvuj0aye	cmrj0udea0002ik8sx9h68js0	PENGAJUAN	cmrs4aqt5010lf58srmiavf9a	CREATE	\N	{"status": "DIAJUKAN", "nasabahId": "cmrs432u6000kf58sgqhdxa4r"}	\N	\N	2026-07-19 18:16:45.892
cmrs4av5g010pf58sk1wayn6h	cmrj0udea0002ik8sx9h68js0	PENGAJUAN	cmrs4aqt5010lf58srmiavf9a	APPROVE	\N	{"status": "DISETUJUI", "plafonDisetujui": "100000"}	\N	\N	2026-07-19 18:16:51.508
cmrs4b1s8012cf58sfgwtrngp	cmrj0udea0002ik8sx9h68js0	PINJAMAN	cmrs4b1rj011uf58sjrsqiu7h	DISBURSE	\N	\N	{"nilaiCair": 100000, "pengajuanId": "cmrs4aqt5010lf58srmiavf9a", "nomorKontrak": "KNT-MRS4B1PO"}	\N	2026-07-19 18:17:00.104
cms4jw9bx0157f58sp6bfivzn	cmrj0udea0002ik8sx9h68js0	PENGAJUAN	cms4jw9bo0155f58si088mau0	CREATE	\N	{"status": "DIAJUKAN", "nasabahId": "cmrs432u6000kf58sgqhdxa4r"}	\N	\N	2026-07-28 11:06:38.013
cms4jwl6f0159f58sres9j1sh	cmrj0udea0002ik8sx9h68js0	PENGAJUAN	cms4jw9bo0155f58si088mau0	APPROVE	\N	{"status": "DISETUJUI", "plafonDisetujui": "250000"}	\N	\N	2026-07-28 11:06:53.367
cms4jx2z70175f58s4wwqushf	cmrj0udea0002ik8sx9h68js0	PINJAMAN	cms4jx2yh016yf58sfjhvrfat	DISBURSE	\N	\N	{"nilaiCair": 250000, "pengajuanId": "cms4jw9bo0155f58si088mau0", "nomorKontrak": "KNT-MS4JX2WR"}	\N	2026-07-28 11:07:16.435
cms4k04fw01dff58su74bhpt1	cmrj0udea0002ik8sx9h68js0	KAS_TRANSAKSI	cms4k04fa01daf58sbfai8249	CASH	\N	{"jenis": "TRANSFER", "jumlah": "2000000", "kategoriKey": "TRANSFER", "kasJenisSumber": "CASH_TUNAI", "kasJenisTujuan": "CASH_BANK"}	\N	\N	2026-07-28 11:09:38.3
\.


--
-- Data for Name: bagi_hasil_simpanan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bagi_hasil_simpanan (id, "companyId", "simpananId", periode, "jumlahBagiHasil", "tanggalBayar", "statusBayar", "catatanBayar") FROM stdin;
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.companies (id, name, slug, address, phone, email, "isActive", "ownerId", "createdAt", "updatedAt", status, "suspendedAt", "suspendedReason", "suspendedUntil", "deletedAt", "deletedReason") FROM stdin;
cmrj0udei0005ik8s8kp0cmsm	Koperasi Demo Sejahtera	koperasi-demo-sejahtera	\N	\N	admin@koperasi.id	t	cmrj0udea0002ik8sx9h68js0	2026-07-13 09:30:07.578	2026-07-13 09:30:07.578	ACTIVE	\N	\N	\N	\N	\N
\.


--
-- Data for Name: company_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.company_settings (id, "companyId", key, value, "updatedAt") FROM stdin;
cmrj1tf5g000wgb8spo1d9q5y	cmrj0udei0005ik8s8kp0cmsm	ACCOUNTING_MODE	"PROPER"	2026-07-13 09:57:22.804
\.


--
-- Data for Name: jadwal_angsuran; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.jadwal_angsuran (id, "pinjamanId", "angsuranKe", "tanggalJatuhTempo", pokok, bunga, total, "sudahDibayar", "tanggalBayar", "dendaHarian", "companyId", dpd, "cycleScore") FROM stdin;
cmrs4a81m00yzf58sds51smzv	cmrs4a81c00yyf58sab2ctyvd	1	2026-08-20 12:00:00	3333333.33	600000.00	3933333.33	f	\N	0.00	cmrj0udei0005ik8s8kp0cmsm	0	\N
cmrs4a81m00z0f58stslx144r	cmrs4a81c00yyf58sab2ctyvd	2	2026-09-20 12:00:00	3333333.33	600000.00	3933333.33	f	\N	0.00	cmrj0udei0005ik8s8kp0cmsm	0	\N
cmrs4a81m00z1f58s0y72l54o	cmrs4a81c00yyf58sab2ctyvd	3	2026-10-20 12:00:00	3333333.33	600000.00	3933333.33	f	\N	0.00	cmrj0udei0005ik8s8kp0cmsm	0	\N
cmrs4a81m00z2f58stgtmy67j	cmrs4a81c00yyf58sab2ctyvd	4	2026-11-20 12:00:00	3333333.33	600000.00	3933333.33	f	\N	0.00	cmrj0udei0005ik8s8kp0cmsm	0	\N
cmrs4a81m00z3f58s90xd66by	cmrs4a81c00yyf58sab2ctyvd	5	2026-12-20 12:00:00	3333333.33	600000.00	3933333.33	f	\N	0.00	cmrj0udei0005ik8s8kp0cmsm	0	\N
cmrs4a81m00z4f58sld0zrxs5	cmrs4a81c00yyf58sab2ctyvd	6	2027-01-20 12:00:00	3333333.33	600000.00	3933333.33	f	\N	0.00	cmrj0udei0005ik8s8kp0cmsm	0	\N
cmrs4a81m00z5f58s44nvj66e	cmrs4a81c00yyf58sab2ctyvd	7	2027-02-20 12:00:00	3333333.33	600000.00	3933333.33	f	\N	0.00	cmrj0udei0005ik8s8kp0cmsm	0	\N
cmrs4a81m00z6f58scc9bosz0	cmrs4a81c00yyf58sab2ctyvd	8	2027-03-20 12:00:00	3333333.33	600000.00	3933333.33	f	\N	0.00	cmrj0udei0005ik8s8kp0cmsm	0	\N
cmrs4a81m00z7f58srf3ucdlc	cmrs4a81c00yyf58sab2ctyvd	9	2027-04-20 12:00:00	3333333.33	600000.00	3933333.33	f	\N	0.00	cmrj0udei0005ik8s8kp0cmsm	0	\N
cmrs4a81m00z8f58ssrl8vylc	cmrs4a81c00yyf58sab2ctyvd	10	2027-05-20 12:00:00	3333333.33	600000.00	3933333.33	f	\N	0.00	cmrj0udei0005ik8s8kp0cmsm	0	\N
cmrs4a81m00z9f58somope86g	cmrs4a81c00yyf58sab2ctyvd	11	2027-06-20 12:00:00	3333333.33	600000.00	3933333.33	f	\N	0.00	cmrj0udei0005ik8s8kp0cmsm	0	\N
cmrs4a81m00zaf58skdr7m8mn	cmrs4a81c00yyf58sab2ctyvd	12	2027-07-20 12:00:00	3333333.33	600000.00	3933333.33	f	\N	0.00	cmrj0udei0005ik8s8kp0cmsm	0	\N
cmrs4b1ro011vf58sg5bjnivg	cmrs4b1rj011uf58sjrsqiu7h	1	2026-08-20 12:00:00	8333.33	1500.00	9833.33	f	\N	0.00	cmrj0udei0005ik8s8kp0cmsm	0	\N
cmrs4b1ro011wf58sk2i89qdk	cmrs4b1rj011uf58sjrsqiu7h	2	2026-09-20 12:00:00	8333.33	1500.00	9833.33	f	\N	0.00	cmrj0udei0005ik8s8kp0cmsm	0	\N
cmrs4b1ro011xf58sn1jwbn2d	cmrs4b1rj011uf58sjrsqiu7h	3	2026-10-20 12:00:00	8333.33	1500.00	9833.33	f	\N	0.00	cmrj0udei0005ik8s8kp0cmsm	0	\N
cmrs4b1ro011yf58so4p916ri	cmrs4b1rj011uf58sjrsqiu7h	4	2026-11-20 12:00:00	8333.33	1500.00	9833.33	f	\N	0.00	cmrj0udei0005ik8s8kp0cmsm	0	\N
cmrs4b1ro011zf58spqbwelac	cmrs4b1rj011uf58sjrsqiu7h	5	2026-12-20 12:00:00	8333.33	1500.00	9833.33	f	\N	0.00	cmrj0udei0005ik8s8kp0cmsm	0	\N
cmrs4b1ro0120f58s5579g56h	cmrs4b1rj011uf58sjrsqiu7h	6	2027-01-20 12:00:00	8333.33	1500.00	9833.33	f	\N	0.00	cmrj0udei0005ik8s8kp0cmsm	0	\N
cmrs4b1ro0121f58sefsgy42h	cmrs4b1rj011uf58sjrsqiu7h	7	2027-02-20 12:00:00	8333.33	1500.00	9833.33	f	\N	0.00	cmrj0udei0005ik8s8kp0cmsm	0	\N
cmrs4b1ro0122f58s9lrkvtta	cmrs4b1rj011uf58sjrsqiu7h	8	2027-03-20 12:00:00	8333.33	1500.00	9833.33	f	\N	0.00	cmrj0udei0005ik8s8kp0cmsm	0	\N
cmrs4b1rp0123f58sod71lzmo	cmrs4b1rj011uf58sjrsqiu7h	9	2027-04-20 12:00:00	8333.33	1500.00	9833.33	f	\N	0.00	cmrj0udei0005ik8s8kp0cmsm	0	\N
cmrs4b1rp0124f58snja191dd	cmrs4b1rj011uf58sjrsqiu7h	10	2027-05-20 12:00:00	8333.33	1500.00	9833.33	f	\N	0.00	cmrj0udei0005ik8s8kp0cmsm	0	\N
cmrs4b1rp0125f58s3wczes8x	cmrs4b1rj011uf58sjrsqiu7h	11	2027-06-20 12:00:00	8333.33	1500.00	9833.33	f	\N	0.00	cmrj0udei0005ik8s8kp0cmsm	0	\N
cmrs4b1rp0126f58sweusivk1	cmrs4b1rj011uf58sjrsqiu7h	12	2027-07-20 12:00:00	8333.33	1500.00	9833.33	f	\N	0.00	cmrj0udei0005ik8s8kp0cmsm	0	\N
cms4jx2ym016zf58skr6rpjbn	cms4jx2yh016yf58sfjhvrfat	1	2026-08-04 12:00:00	250000.00	3750.00	253750.00	f	\N	0.00	cmrj0udei0005ik8s8kp0cmsm	0	\N
\.


--
-- Data for Name: journal_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.journal_entries (id, "entryNo", "entryDate", description, "sourceType", "sourceId", status, "postedById", "createdAt", "updatedAt", "companyId") FROM stdin;
cmrs450pt002zf58srnaor0p9	cmrs450pt0030f58svdisaase	2026-07-20 12:00:00	jajaja	KAS	cmrs450om002yf58souwqtt1a	POSTED	cmrj0udea0002ik8sx9h68js0	2026-07-19 18:12:18.785	2026-07-19 18:12:18.785	cmrj0udei0005ik8s8kp0cmsm
cmrs47k5100adf58s98k63dvv	cmrs47k5100aef58swu2a4kqk	2026-07-20 12:00:00	Jaj	KAS	cmrs47k4k00acf58sk0n8q8ap	POSTED	cmrj0udea0002ik8sx9h68js0	2026-07-19 18:14:17.269	2026-07-19 18:14:17.269	cmrj0udei0005ik8s8kp0cmsm
cmrs4a82300zcf58sitwp6e7o	cmrs4a82400zdf58snb8bxo2j	2026-07-20 12:00:00	Pencairan pinjaman KNT-MRS4A7ZM	PENCAIRAN	cmrs4a81c00yyf58sab2ctyvd	POSTED	cmrj0udea0002ik8sx9h68js0	2026-07-19 18:16:21.58	2026-07-19 18:16:21.58	cmrj0udei0005ik8s8kp0cmsm
cmrs4b1s10128f58skx4na8hf	cmrs4b1s10129f58s9lbwnwln	2026-07-20 12:00:00	Pencairan pinjaman KNT-MRS4B1PO	PENCAIRAN	cmrs4b1rj011uf58sjrsqiu7h	POSTED	cmrj0udea0002ik8sx9h68js0	2026-07-19 18:17:00.097	2026-07-19 18:17:00.097	cmrj0udei0005ik8s8kp0cmsm
cms4jx2yy0171f58s6jb11dku	cms4jx2yy0172f58sppnikdss	2026-07-28 12:00:00	Pencairan pinjaman KNT-MS4JX2WR	PENCAIRAN	cms4jx2yh016yf58sfjhvrfat	POSTED	cmrj0udea0002ik8sx9h68js0	2026-07-28 11:07:16.426	2026-07-28 11:07:16.426	cmrj0udei0005ik8s8kp0cmsm
cms4k04fk01dbf58st6dbwwgf	cms4k04fk01dcf58s9n56zldc	2026-07-28 12:00:00	ket	KAS	cms4k04fa01daf58sbfai8249	POSTED	cmrj0udea0002ik8sx9h68js0	2026-07-28 11:09:38.288	2026-07-28 11:09:38.288	cmrj0udei0005ik8s8kp0cmsm
\.


--
-- Data for Name: journal_lines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.journal_lines (id, "journalEntryId", "accountId", debit, credit, memo, "createdAt") FROM stdin;
cmrs450pv0031f58s4d85imxx	cmrs450pt002zf58srnaor0p9	cmrj1sgyg000fgb8sexy13w1p	1000000000.00	0.00	\N	2026-07-19 18:12:18.785
cmrs450pv0032f58svtk1gvbw	cmrs450pt002zf58srnaor0p9	cmrj1sgzl000kgb8swa8ju0yh	0.00	1000000000.00	\N	2026-07-19 18:12:18.785
cmrs47k5200aff58sfll8wn5i	cmrs47k5100adf58s98k63dvv	cmrj1sgyg000fgb8sexy13w1p	1000000000.00	0.00	\N	2026-07-19 18:14:17.269
cmrs47k5200agf58sms8i57yq	cmrs47k5100adf58s98k63dvv	cmrj1sgzl000kgb8swa8ju0yh	0.00	1000000000.00	\N	2026-07-19 18:14:17.269
cmrs4a82500zef58sg7kp5xuz	cmrs4a82300zcf58sitwp6e7o	cmrj1sgz5000hgb8smowtds56	40000000.00	0.00	Pengakuan piutang	2026-07-19 18:16:21.58
cmrs4a82500zff58shdzep30b	cmrs4a82300zcf58sitwp6e7o	cmrj1sgyg000fgb8sexy13w1p	0.00	40000000.00	Kas dicairkan	2026-07-19 18:16:21.58
cmrs4b1s2012af58sphwb7wpq	cmrs4b1s10128f58skx4na8hf	cmrj1sgz5000hgb8smowtds56	100000.00	0.00	Pengakuan piutang	2026-07-19 18:17:00.097
cmrs4b1s2012bf58sqjv9gif2	cmrs4b1s10128f58skx4na8hf	cmrj1sgyg000fgb8sexy13w1p	0.00	100000.00	Kas dicairkan	2026-07-19 18:17:00.097
cms4jx2yz0173f58s506xht7z	cms4jx2yy0171f58s6jb11dku	cmrj1sgz5000hgb8smowtds56	250000.00	0.00	Pengakuan piutang	2026-07-28 11:07:16.426
cms4jx2yz0174f58s7296d0jj	cms4jx2yy0171f58s6jb11dku	cmrj1sgyg000fgb8sexy13w1p	0.00	250000.00	Kas dicairkan	2026-07-28 11:07:16.426
cms4k04fm01ddf58slcyjfui7	cms4k04fk01dbf58st6dbwwgf	cmrj1sgz0000ggb8sl847qqyh	2000000.00	0.00	Transfer masuk ke CASH_BANK	2026-07-28 11:09:38.288
cms4k04fm01def58su9wrdq0c	cms4k04fk01dbf58st6dbwwgf	cmrj1sgyg000fgb8sexy13w1p	0.00	2000000.00	Transfer keluar dari CASH_TUNAI	2026-07-28 11:09:38.288
\.


--
-- Data for Name: kas_kategori; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kas_kategori (id, nama, key, jenis, "isActive", "createdAt", "updatedAt", "accountId", "companyId") FROM stdin;
cmrj1qo610000gb8s81fgxhbw	ANGSURAN	ANGSURAN	MASUK	t	2026-07-13 09:55:14.521	2026-07-13 09:55:14.521	\N	cmrj0udei0005ik8s8kp0cmsm
cmrj1qo6k0001gb8skg0evkhf	PELUNASAN	PELUNASAN	MASUK	t	2026-07-13 09:55:14.54	2026-07-13 09:55:14.54	\N	cmrj0udei0005ik8s8kp0cmsm
cmrj1qo700002gb8st0s7fhr1	SIMPANAN	SIMPANAN	MASUK	t	2026-07-13 09:55:14.556	2026-07-13 09:55:14.556	\N	cmrj0udei0005ik8s8kp0cmsm
cmrj1qo7e0003gb8s98ddoa05	MODAL	MODAL	MASUK	t	2026-07-13 09:55:14.57	2026-07-13 09:55:14.57	\N	cmrj0udei0005ik8s8kp0cmsm
cmrj1qo7s0004gb8sawirt1ij	ADMIN	ADMIN	MASUK	t	2026-07-13 09:55:14.584	2026-07-13 09:55:14.584	\N	cmrj0udei0005ik8s8kp0cmsm
cmrj1qo880005gb8sjjm8odff	DENDA	DENDA	MASUK	t	2026-07-13 09:55:14.6	2026-07-13 09:55:14.6	\N	cmrj0udei0005ik8s8kp0cmsm
cmrj1qo8l0006gb8sz1s8v8ta	LAINNYA	LAINNYA	MASUK	t	2026-07-13 09:55:14.613	2026-07-13 09:55:14.613	\N	cmrj0udei0005ik8s8kp0cmsm
cmrj1qo8z0007gb8so6p7o03v	LAINNYA_MASUK	LAINNYA_MASUK	MASUK	t	2026-07-13 09:55:14.628	2026-07-13 09:55:14.628	\N	cmrj0udei0005ik8s8kp0cmsm
cmrj1qo9f0008gb8sfv4oigcw	PENCAIRAN	PENCAIRAN	KELUAR	t	2026-07-13 09:55:14.643	2026-07-13 09:55:14.643	\N	cmrj0udei0005ik8s8kp0cmsm
cmrj1qo9t0009gb8sk0wgar67	PEMBATALAN_ANGSURAN	PEMBATALAN_ANGSURAN	KELUAR	t	2026-07-13 09:55:14.657	2026-07-13 09:55:14.657	\N	cmrj0udei0005ik8s8kp0cmsm
cmrj1qoa7000agb8s574t2sin	BONUS_KOLEKTOR	BONUS_KOLEKTOR	KELUAR	t	2026-07-13 09:55:14.671	2026-07-13 09:55:14.671	\N	cmrj0udei0005ik8s8kp0cmsm
cmrj1qoal000bgb8sboia1szz	GAJI	GAJI	KELUAR	t	2026-07-13 09:55:14.685	2026-07-13 09:55:14.685	\N	cmrj0udei0005ik8s8kp0cmsm
cmrj1qob1000cgb8skuz86ozh	OPERASIONAL	OPERASIONAL	KELUAR	t	2026-07-13 09:55:14.701	2026-07-13 09:55:14.701	\N	cmrj0udei0005ik8s8kp0cmsm
cmrj1qobd000dgb8sjk66622y	LAINNYA_KELUAR	LAINNYA_KELUAR	KELUAR	t	2026-07-13 09:55:14.714	2026-07-13 09:55:14.714	\N	cmrj0udei0005ik8s8kp0cmsm
cmrj1qobt000egb8smibn690u	TRANSFER	TRANSFER	TRANSFER	t	2026-07-13 09:55:14.73	2026-07-13 09:55:14.73	\N	cmrj0udei0005ik8s8kp0cmsm
\.


--
-- Data for Name: kas_transaksi; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kas_transaksi (id, tanggal, jenis, "kategoriKey", deskripsi, jumlah, "kasJenis", "buktiUrl", "inputOlehId", "isApproved", "referensiId", "createdAt", "companyId", "kategoriId", "kasJenisTujuan") FROM stdin;
cmrs450om002yf58souwqtt1a	2026-07-20 12:00:00	MASUK	MODAL	jajaja	1000000000.00	AKUN_SAVING	\N	cmrj0udea0002ik8sx9h68js0	t	\N	2026-07-19 18:12:18.742	cmrj0udei0005ik8s8kp0cmsm	cmrj1qo7e0003gb8s98ddoa05	\N
cmrs47k4k00acf58sk0n8q8ap	2026-07-20 12:00:00	MASUK	MODAL	Jaj	1000000000.00	CASH_BANK	\N	cmrj0udea0002ik8sx9h68js0	t	\N	2026-07-19 18:14:17.252	cmrj0udei0005ik8s8kp0cmsm	cmrj1qo7e0003gb8s98ddoa05	\N
cmrs4a81v00zbf58sb6m0q0jz	2026-07-20 12:00:00	KELUAR	PENCAIRAN	Pencairan pinjaman KNT-MRS4A7ZM	40000000.00	CASH_BANK	\N	cmrj0udea0002ik8sx9h68js0	t	cmrs4a81c00yyf58sab2ctyvd	2026-07-19 18:16:21.571	cmrj0udei0005ik8s8kp0cmsm	cmrj1qo9f0008gb8sfv4oigcw	\N
cmrs4b1ru0127f58s4z4mh1xj	2026-07-20 12:00:00	KELUAR	PENCAIRAN	Pencairan pinjaman KNT-MRS4B1PO	100000.00	CASH_BANK_BRI	\N	cmrj0udea0002ik8sx9h68js0	t	cmrs4b1rj011uf58sjrsqiu7h	2026-07-19 18:17:00.09	cmrj0udei0005ik8s8kp0cmsm	cmrj1qo9f0008gb8sfv4oigcw	\N
cms4jx2yr0170f58sq94b14pv	2026-07-28 12:00:00	KELUAR	PENCAIRAN	Pencairan pinjaman KNT-MS4JX2WR	250000.00	AKUN_SAVING	\N	cmrj0udea0002ik8sx9h68js0	t	cms4jx2yh016yf58sfjhvrfat	2026-07-28 11:07:16.419	cmrj0udei0005ik8s8kp0cmsm	cmrj1qo9f0008gb8sfv4oigcw	\N
cms4k04fa01daf58sbfai8249	2026-07-28 12:00:00	TRANSFER	TRANSFER	ket	2000000.00	CASH_TUNAI	\N	cmrj0udea0002ik8sx9h68js0	t	\N	2026-07-28 11:09:38.278	cmrj0udei0005ik8s8kp0cmsm	cmrj1qobt000egb8smibn690u	CASH_BANK
\.


--
-- Data for Name: kelompok; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kelompok (id, kode, nama, ketua, wilayah, "jadwalPertemuan", "createdAt", "updatedAt", "companyId") FROM stdin;
cmrj0ue4g000aik8s9wt7zs53	KL-001	Kelompok Mentari	Pak Suryo	Wonosobo	Senin	2026-07-13 09:30:08.513	2026-07-13 09:30:08.513	cmrj0udei0005ik8s8kp0cmsm
cmrj0ue4h000bik8sb9v67p6y	KL-002	Mitra Sejahtera	Bu Siti	Kertek	Selasa	2026-07-13 09:30:08.513	2026-07-13 09:30:08.513	cmrj0udei0005ik8s8kp0cmsm
cmrj0ue4h000cik8sho8r9tl8	KL-003	Guyub Rukun	Pak Slamet	Garung	Rabu	2026-07-13 09:30:08.513	2026-07-13 09:30:08.513	cmrj0udei0005ik8s8kp0cmsm
\.


--
-- Data for Name: kolektor_bonus; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kolektor_bonus (id, "pinjamanId", "kolektorId", nominal, status, "eligibleAt", "paidAt", "paidById", catatan, "createdAt", "updatedAt", "companyId") FROM stdin;
\.


--
-- Data for Name: kolektor_targets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kolektor_targets (id, "kolektorId", "periodMonth", "periodYear", "targetTagihan", "realisasiTagihan", "targetKunjungan", "realisasiKunjungan", "createdAt", "updatedAt", "companyId") FROM stdin;
\.


--
-- Data for Name: nasabah; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.nasabah (id, "nomorAnggota", "namaLengkap", nik, "tempatLahir", "tanggalLahir", alamat, kelurahan, kecamatan, "kotaKab", "noHp", pekerjaan, "namaUsaha", status, "tanggalGabung", "fotoUrl", "dokumenUrls", "kolektorId", "kelompokId", "createdAt", "updatedAt", "companyId") FROM stdin;
cmrs432u6000kf58sgqhdxa4r	N-26-0001	hhxhsh	5975756775675456	Karanganyar	2026-07-20 00:00:00	jdjekr krjr rkr j				08566565656			AKTIF	2026-07-19 18:10:48.219	\N	{}	\N	\N	2026-07-19 18:10:48.222	2026-07-19 18:10:48.222	cmrj0udei0005ik8s8kp0cmsm
\.


--
-- Data for Name: notifikasi; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifikasi (id, "userId", jenis, judul, pesan, link, "isRead", "readAt", "createdAt", "companyId") FROM stdin;
\.


--
-- Data for Name: pembayaran; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pembayaran (id, "nomorTransaksi", "pinjamanId", "tanggalBayar", pokok, bunga, denda, "totalBayar", metode, catatan, "inputOlehId", "isBatalkan", "alasanBatal", "createdAt", "buktiBayarUrl", "companyId") FROM stdin;
\.


--
-- Data for Name: pengajuan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pengajuan (id, "nomorPengajuan", "nasabahId", "kelompokId", "jenisPinjaman", "plafonDiajukan", "plafonDisetujui", tenor, "bungaPerBulan", "tujuanPinjaman", agunan, "hasilSurvey", "catatanApproval", status, "tanggalPengajuan", "tanggalSurvey", "tanggalApproval", "surveyorId", "approverId", "createdAt", "updatedAt", "tenorType", "catatanPengajuan", "dokumenPendukungUrls", "companyId") FROM stdin;
cmrs43kfg000lf58synh2xq9o	cmrs43kfg000mf58so8fnsrte	cmrs432u6000kf58sgqhdxa4r	\N	REGULAR	40000000.00	40000000.00	12	0.0150	usaha		\N		DICAIRKAN	2026-07-19 18:11:11.02	\N	2026-07-19 18:11:19.326	\N	cmrj0udea0002ik8sx9h68js0	2026-07-19 18:11:11.02	2026-07-19 18:16:21.568	BULANAN		{}	cmrj0udei0005ik8s8kp0cmsm
cmrs4aqt5010lf58srmiavf9a	cmrs4aqt5010mf58scuqkrx9x	cmrs432u6000kf58sgqhdxa4r	\N	REGULAR	100000.00	100000.00	12	0.0150	usaha		\N		DICAIRKAN	2026-07-19 18:16:45.881	\N	2026-07-19 18:16:51.493	\N	cmrj0udea0002ik8sx9h68js0	2026-07-19 18:16:45.881	2026-07-19 18:17:00.088	BULANAN		{}	cmrj0udei0005ik8s8kp0cmsm
cms4jw9bo0155f58si088mau0	cms4jw9bp0156f58sb4n90b14	cmrs432u6000kf58sgqhdxa4r	\N	REGULAR	250000.00	250000.00	1	0.0150	usaha		\N		DICAIRKAN	2026-07-28 11:06:38.005	\N	2026-07-28 11:06:53.349	\N	cmrj0udea0002ik8sx9h68js0	2026-07-28 11:06:38.005	2026-07-28 11:07:16.417	MINGGUAN		{}	cmrj0udei0005ik8s8kp0cmsm
\.


--
-- Data for Name: penggunaan_simpanan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.penggunaan_simpanan (id, "companyId", "simpananId", "pinjamanId", "jumlahDigunakan", "tanggalPakai", "tanggalKembali", "statusKembali") FROM stdin;
\.


--
-- Data for Name: penjamin; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.penjamin (id, "namaLengkap", nik, hubungan, "noHp", alamat, "nasabahId", "companyId") FROM stdin;
\.


--
-- Data for Name: pinjaman; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pinjaman (id, "nomorKontrak", "pengajuanId", "pokokPinjaman", tenor, "bungaPerBulan", "angsuranPokok", "angsuranBunga", "totalAngsuran", "potonganAdmin", "potonganProvisi", "nilaiCair", "tanggalCair", "tanggalJatuhTempo", "sisaPinjaman", status, "createdAt", "updatedAt", "tenorType", "companyId", "sumberDana", "simpananId", "kasJenis", "finalScore", "categoryGrade") FROM stdin;
cmrs4a81c00yyf58sab2ctyvd	KNT-MRS4A7ZM	cmrs43kfg000lf58synh2xq9o	40000000.00	12	0.0150	3333333.33	600000.00	3933333.33	0.00	0.00	40000000.00	2026-07-20 12:00:00	2027-07-20 12:00:00	40000000.00	AKTIF	2026-07-19 18:16:21.552	2026-07-19 18:16:21.552	BULANAN	cmrj0udei0005ik8s8kp0cmsm	KAS	\N	BANK	\N	\N
cmrs4b1rj011uf58sjrsqiu7h	KNT-MRS4B1PO	cmrs4aqt5010lf58srmiavf9a	100000.00	12	0.0150	8333.33	1500.00	9833.33	0.00	0.00	100000.00	2026-07-20 12:00:00	2027-07-20 12:00:00	100000.00	AKTIF	2026-07-19 18:17:00.079	2026-07-19 18:17:00.079	BULANAN	cmrj0udei0005ik8s8kp0cmsm	KAS	\N	BANK	\N	\N
cms4jx2yh016yf58sfjhvrfat	KNT-MS4JX2WR	cms4jw9bo0155f58si088mau0	250000.00	1	0.0150	250000.00	3750.00	253750.00	0.00	0.00	250000.00	2026-07-28 12:00:00	2026-08-04 12:00:00	250000.00	AKTIF	2026-07-28 11:07:16.409	2026-07-28 11:07:16.409	MINGGUAN	cmrj0udei0005ik8s8kp0cmsm	KAS	\N	TUNAI	\N	\N
\.


--
-- Data for Name: rekonsiliasi_kas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rekonsiliasi_kas (id, "accountId", "periodMonth", "periodYear", "saldoStatement", "saldoBook", selisih, catatan, "buktiUrl", status, "createdById", "createdAt", "updatedAt", "companyId") FROM stdin;
\.


--
-- Data for Name: simpanan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.simpanan (id, "companyId", "nomorRekening", "namaPenyimpan", nik, "noHp", alamat, "saldoAwal", "saldoTersedia", "saldoTerpakai", "persenBagiHasil", "periodeBagiHasil", status, "tanggalBuka", "tanggalTutup", "catatanPenutupan", "createdAt", "updatedAt", "createdById") FROM stdin;
\.


--
-- Data for Name: transaksi_simpanan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transaksi_simpanan (id, "companyId", "simpananId", jenis, jumlah, tanggal, keterangan, "inputOlehId") FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (id, "userId", role) FROM stdin;
cmrj0ud2h0001ik8sqwjqmavb	cmrj0ud2c0000ik8sv2ozq9ii	SUPER_ADMIN
cmrj0udeb0003ik8svmwho7fo	cmrj0udea0002ik8sx9h68js0	OWNER
cmrj0udeb0004ik8s5fj2u82u	cmrj0udea0002ik8sx9h68js0	ADMIN
cmrj0udqx0007ik8so9yu1z94	cmrj0udqw0006ik8sb8su84ao	TELLER
cmrj0ue480009ik8snbx714pt	cmrj0ue450008ik8s8ssgbu46	MANAGER
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password, "isActive", "createdAt", "updatedAt", "companyId") FROM stdin;
cmrj0ud2c0000ik8sv2ozq9ii	Super Admin	super@koperasi.id	$2b$12$EXHNXg1dJu8IRjazrlSp2ul4737Dby8TqpjuGtVw78NNXZQXtw9/e	t	2026-07-13 09:30:07.14	2026-07-13 09:30:07.14	\N
cmrj0udea0002ik8sx9h68js0	Administrator	admin@koperasi.id	$2b$12$NftfwoBZI0Cmph4QnWeYxOuOuH0CS5iQ296MK6qrBrh1c8PWZ/pr.	t	2026-07-13 09:30:07.57	2026-07-13 09:30:07.589	cmrj0udei0005ik8s8kp0cmsm
cmrj0udqw0006ik8sb8su84ao	Teller	teller@koperasi.id	$2b$12$6pr0QId2K6lG1AVa37nABu24DAqrJb5o96Uh4CeYplT8Yth7p5PDe	t	2026-07-13 09:30:08.024	2026-07-13 09:30:08.024	cmrj0udei0005ik8s8kp0cmsm
cmrj0ue450008ik8s8ssgbu46	Manager	manager@koperasi.id	$2b$12$Wn1WyqCgBImI0Sii0f3Fb.xEk4ERHoWZCZS4znC4nMK.C0eKbTb8m	t	2026-07-13 09:30:08.501	2026-07-13 09:30:08.501	cmrj0udei0005ik8s8kp0cmsm
\.


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (key);


--
-- Name: approval_logs approval_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_logs
    ADD CONSTRAINT approval_logs_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: bagi_hasil_simpanan bagi_hasil_simpanan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bagi_hasil_simpanan
    ADD CONSTRAINT bagi_hasil_simpanan_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: company_settings company_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_pkey PRIMARY KEY (id);


--
-- Name: jadwal_angsuran jadwal_angsuran_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jadwal_angsuran
    ADD CONSTRAINT jadwal_angsuran_pkey PRIMARY KEY (id);


--
-- Name: journal_entries journal_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_pkey PRIMARY KEY (id);


--
-- Name: journal_lines journal_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_lines
    ADD CONSTRAINT journal_lines_pkey PRIMARY KEY (id);


--
-- Name: kas_kategori kas_kategori_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kas_kategori
    ADD CONSTRAINT kas_kategori_pkey PRIMARY KEY (id);


--
-- Name: kas_transaksi kas_transaksi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kas_transaksi
    ADD CONSTRAINT kas_transaksi_pkey PRIMARY KEY (id);


--
-- Name: kelompok kelompok_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kelompok
    ADD CONSTRAINT kelompok_pkey PRIMARY KEY (id);


--
-- Name: kolektor_bonus kolektor_bonus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kolektor_bonus
    ADD CONSTRAINT kolektor_bonus_pkey PRIMARY KEY (id);


--
-- Name: kolektor_targets kolektor_targets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kolektor_targets
    ADD CONSTRAINT kolektor_targets_pkey PRIMARY KEY (id);


--
-- Name: nasabah nasabah_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nasabah
    ADD CONSTRAINT nasabah_pkey PRIMARY KEY (id);


--
-- Name: notifikasi notifikasi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifikasi
    ADD CONSTRAINT notifikasi_pkey PRIMARY KEY (id);


--
-- Name: pembayaran pembayaran_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pembayaran
    ADD CONSTRAINT pembayaran_pkey PRIMARY KEY (id);


--
-- Name: pengajuan pengajuan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pengajuan
    ADD CONSTRAINT pengajuan_pkey PRIMARY KEY (id);


--
-- Name: penggunaan_simpanan penggunaan_simpanan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.penggunaan_simpanan
    ADD CONSTRAINT penggunaan_simpanan_pkey PRIMARY KEY (id);


--
-- Name: penjamin penjamin_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.penjamin
    ADD CONSTRAINT penjamin_pkey PRIMARY KEY (id);


--
-- Name: pinjaman pinjaman_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pinjaman
    ADD CONSTRAINT pinjaman_pkey PRIMARY KEY (id);


--
-- Name: rekonsiliasi_kas rekonsiliasi_kas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rekonsiliasi_kas
    ADD CONSTRAINT rekonsiliasi_kas_pkey PRIMARY KEY (id);


--
-- Name: simpanan simpanan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.simpanan
    ADD CONSTRAINT simpanan_pkey PRIMARY KEY (id);


--
-- Name: transaksi_simpanan transaksi_simpanan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaksi_simpanan
    ADD CONSTRAINT transaksi_simpanan_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: accounts_companyId_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "accounts_companyId_code_key" ON public.accounts USING btree ("companyId", code);


--
-- Name: accounts_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "accounts_companyId_idx" ON public.accounts USING btree ("companyId");


--
-- Name: accounts_type_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "accounts_type_isActive_idx" ON public.accounts USING btree (type, "isActive");


--
-- Name: approval_logs_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "approval_logs_entityType_entityId_idx" ON public.approval_logs USING btree ("entityType", "entityId");


--
-- Name: approval_logs_requestedById_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "approval_logs_requestedById_createdAt_idx" ON public.approval_logs USING btree ("requestedById", "createdAt");


--
-- Name: audit_logs_actorId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "audit_logs_actorId_createdAt_idx" ON public.audit_logs USING btree ("actorId", "createdAt");


--
-- Name: audit_logs_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "audit_logs_entityType_entityId_idx" ON public.audit_logs USING btree ("entityType", "entityId");


--
-- Name: bagi_hasil_simpanan_companyId_statusBayar_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "bagi_hasil_simpanan_companyId_statusBayar_idx" ON public.bagi_hasil_simpanan USING btree ("companyId", "statusBayar");


--
-- Name: bagi_hasil_simpanan_simpananId_periode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "bagi_hasil_simpanan_simpananId_periode_key" ON public.bagi_hasil_simpanan USING btree ("simpananId", periode);


--
-- Name: companies_ownerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "companies_ownerId_idx" ON public.companies USING btree ("ownerId");


--
-- Name: companies_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX companies_slug_key ON public.companies USING btree (slug);


--
-- Name: company_settings_companyId_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "company_settings_companyId_key_key" ON public.company_settings USING btree ("companyId", key);


--
-- Name: company_settings_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX company_settings_key_idx ON public.company_settings USING btree (key);


--
-- Name: jadwal_angsuran_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "jadwal_angsuran_companyId_idx" ON public.jadwal_angsuran USING btree ("companyId");


--
-- Name: journal_entries_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "journal_entries_companyId_idx" ON public.journal_entries USING btree ("companyId");


--
-- Name: journal_entries_entryDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "journal_entries_entryDate_idx" ON public.journal_entries USING btree ("entryDate");


--
-- Name: journal_entries_entryNo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "journal_entries_entryNo_key" ON public.journal_entries USING btree ("entryNo");


--
-- Name: journal_entries_sourceType_sourceId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "journal_entries_sourceType_sourceId_idx" ON public.journal_entries USING btree ("sourceType", "sourceId");


--
-- Name: journal_entries_sourceType_sourceId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "journal_entries_sourceType_sourceId_key" ON public.journal_entries USING btree ("sourceType", "sourceId");


--
-- Name: journal_lines_accountId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "journal_lines_accountId_idx" ON public.journal_lines USING btree ("accountId");


--
-- Name: journal_lines_journalEntryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "journal_lines_journalEntryId_idx" ON public.journal_lines USING btree ("journalEntryId");


--
-- Name: kas_kategori_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "kas_kategori_companyId_idx" ON public.kas_kategori USING btree ("companyId");


--
-- Name: kas_kategori_companyId_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "kas_kategori_companyId_key_key" ON public.kas_kategori USING btree ("companyId", key);


--
-- Name: kas_transaksi_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "kas_transaksi_companyId_idx" ON public.kas_transaksi USING btree ("companyId");


--
-- Name: kas_transaksi_kategoriId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "kas_transaksi_kategoriId_idx" ON public.kas_transaksi USING btree ("kategoriId");


--
-- Name: kelompok_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "kelompok_companyId_idx" ON public.kelompok USING btree ("companyId");


--
-- Name: kelompok_companyId_kode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "kelompok_companyId_kode_key" ON public.kelompok USING btree ("companyId", kode);


--
-- Name: kolektor_bonus_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "kolektor_bonus_companyId_idx" ON public.kolektor_bonus USING btree ("companyId");


--
-- Name: kolektor_bonus_kolektorId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "kolektor_bonus_kolektorId_status_idx" ON public.kolektor_bonus USING btree ("kolektorId", status);


--
-- Name: kolektor_bonus_pinjamanId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "kolektor_bonus_pinjamanId_key" ON public.kolektor_bonus USING btree ("pinjamanId");


--
-- Name: kolektor_bonus_status_eligibleAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "kolektor_bonus_status_eligibleAt_idx" ON public.kolektor_bonus USING btree (status, "eligibleAt");


--
-- Name: kolektor_targets_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "kolektor_targets_companyId_idx" ON public.kolektor_targets USING btree ("companyId");


--
-- Name: kolektor_targets_kolektorId_periodMonth_periodYear_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "kolektor_targets_kolektorId_periodMonth_periodYear_key" ON public.kolektor_targets USING btree ("kolektorId", "periodMonth", "periodYear");


--
-- Name: kolektor_targets_periodYear_periodMonth_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "kolektor_targets_periodYear_periodMonth_idx" ON public.kolektor_targets USING btree ("periodYear", "periodMonth");


--
-- Name: nasabah_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "nasabah_companyId_idx" ON public.nasabah USING btree ("companyId");


--
-- Name: nasabah_companyId_nik_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "nasabah_companyId_nik_key" ON public.nasabah USING btree ("companyId", nik);


--
-- Name: nasabah_companyId_nomorAnggota_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "nasabah_companyId_nomorAnggota_key" ON public.nasabah USING btree ("companyId", "nomorAnggota");


--
-- Name: notifikasi_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "notifikasi_companyId_idx" ON public.notifikasi USING btree ("companyId");


--
-- Name: notifikasi_userId_isRead_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "notifikasi_userId_isRead_createdAt_idx" ON public.notifikasi USING btree ("userId", "isRead", "createdAt");


--
-- Name: pembayaran_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "pembayaran_companyId_idx" ON public.pembayaran USING btree ("companyId");


--
-- Name: pembayaran_nomorTransaksi_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "pembayaran_nomorTransaksi_key" ON public.pembayaran USING btree ("nomorTransaksi");


--
-- Name: pengajuan_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "pengajuan_companyId_idx" ON public.pengajuan USING btree ("companyId");


--
-- Name: pengajuan_nomorPengajuan_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "pengajuan_nomorPengajuan_key" ON public.pengajuan USING btree ("nomorPengajuan");


--
-- Name: penggunaan_simpanan_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "penggunaan_simpanan_companyId_idx" ON public.penggunaan_simpanan USING btree ("companyId");


--
-- Name: penggunaan_simpanan_pinjamanId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "penggunaan_simpanan_pinjamanId_idx" ON public.penggunaan_simpanan USING btree ("pinjamanId");


--
-- Name: penggunaan_simpanan_simpananId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "penggunaan_simpanan_simpananId_idx" ON public.penggunaan_simpanan USING btree ("simpananId");


--
-- Name: penjamin_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "penjamin_companyId_idx" ON public.penjamin USING btree ("companyId");


--
-- Name: pinjaman_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "pinjaman_companyId_idx" ON public.pinjaman USING btree ("companyId");


--
-- Name: pinjaman_nomorKontrak_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "pinjaman_nomorKontrak_key" ON public.pinjaman USING btree ("nomorKontrak");


--
-- Name: pinjaman_pengajuanId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "pinjaman_pengajuanId_key" ON public.pinjaman USING btree ("pengajuanId");


--
-- Name: pinjaman_simpananId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "pinjaman_simpananId_idx" ON public.pinjaman USING btree ("simpananId");


--
-- Name: rekonsiliasi_kas_account_period_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX rekonsiliasi_kas_account_period_key ON public.rekonsiliasi_kas USING btree ("accountId", "periodMonth", "periodYear");


--
-- Name: rekonsiliasi_kas_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "rekonsiliasi_kas_companyId_idx" ON public.rekonsiliasi_kas USING btree ("companyId");


--
-- Name: rekonsiliasi_kas_period_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX rekonsiliasi_kas_period_idx ON public.rekonsiliasi_kas USING btree ("periodYear", "periodMonth");


--
-- Name: simpanan_companyId_nik_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "simpanan_companyId_nik_key" ON public.simpanan USING btree ("companyId", nik);


--
-- Name: simpanan_companyId_nomorRekening_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "simpanan_companyId_nomorRekening_key" ON public.simpanan USING btree ("companyId", "nomorRekening");


--
-- Name: simpanan_companyId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "simpanan_companyId_status_idx" ON public.simpanan USING btree ("companyId", status);


--
-- Name: transaksi_simpanan_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "transaksi_simpanan_companyId_idx" ON public.transaksi_simpanan USING btree ("companyId");


--
-- Name: transaksi_simpanan_simpananId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "transaksi_simpanan_simpananId_idx" ON public.transaksi_simpanan USING btree ("simpananId");


--
-- Name: user_roles_userId_role_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "user_roles_userId_role_key" ON public.user_roles USING btree ("userId", role);


--
-- Name: users_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "users_companyId_idx" ON public.users USING btree ("companyId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: accounts accounts_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT "accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: approval_logs approval_logs_approvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_logs
    ADD CONSTRAINT "approval_logs_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: approval_logs approval_logs_requestedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_logs
    ADD CONSTRAINT "approval_logs_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_actorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: bagi_hasil_simpanan bagi_hasil_simpanan_simpananId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bagi_hasil_simpanan
    ADD CONSTRAINT "bagi_hasil_simpanan_simpananId_fkey" FOREIGN KEY ("simpananId") REFERENCES public.simpanan(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: companies companies_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT "companies_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: company_settings company_settings_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT "company_settings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: jadwal_angsuran jadwal_angsuran_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jadwal_angsuran
    ADD CONSTRAINT "jadwal_angsuran_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: jadwal_angsuran jadwal_angsuran_pinjamanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jadwal_angsuran
    ADD CONSTRAINT "jadwal_angsuran_pinjamanId_fkey" FOREIGN KEY ("pinjamanId") REFERENCES public.pinjaman(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: journal_entries journal_entries_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT "journal_entries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: journal_entries journal_entries_postedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT "journal_entries_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: journal_lines journal_lines_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_lines
    ADD CONSTRAINT "journal_lines_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public.accounts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: journal_lines journal_lines_journalEntryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_lines
    ADD CONSTRAINT "journal_lines_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES public.journal_entries(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: kas_kategori kas_kategori_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kas_kategori
    ADD CONSTRAINT "kas_kategori_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public.accounts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: kas_kategori kas_kategori_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kas_kategori
    ADD CONSTRAINT "kas_kategori_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: kas_transaksi kas_transaksi_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kas_transaksi
    ADD CONSTRAINT "kas_transaksi_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: kas_transaksi kas_transaksi_inputOlehId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kas_transaksi
    ADD CONSTRAINT "kas_transaksi_inputOlehId_fkey" FOREIGN KEY ("inputOlehId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: kas_transaksi kas_transaksi_kategoriId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kas_transaksi
    ADD CONSTRAINT "kas_transaksi_kategoriId_fkey" FOREIGN KEY ("kategoriId") REFERENCES public.kas_kategori(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: kelompok kelompok_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kelompok
    ADD CONSTRAINT "kelompok_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: kolektor_bonus kolektor_bonus_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kolektor_bonus
    ADD CONSTRAINT "kolektor_bonus_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: kolektor_bonus kolektor_bonus_kolektorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kolektor_bonus
    ADD CONSTRAINT "kolektor_bonus_kolektorId_fkey" FOREIGN KEY ("kolektorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: kolektor_bonus kolektor_bonus_paidById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kolektor_bonus
    ADD CONSTRAINT "kolektor_bonus_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: kolektor_bonus kolektor_bonus_pinjamanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kolektor_bonus
    ADD CONSTRAINT "kolektor_bonus_pinjamanId_fkey" FOREIGN KEY ("pinjamanId") REFERENCES public.pinjaman(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: kolektor_targets kolektor_targets_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kolektor_targets
    ADD CONSTRAINT "kolektor_targets_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: kolektor_targets kolektor_targets_kolektorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kolektor_targets
    ADD CONSTRAINT "kolektor_targets_kolektorId_fkey" FOREIGN KEY ("kolektorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: nasabah nasabah_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nasabah
    ADD CONSTRAINT "nasabah_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: nasabah nasabah_kelompokId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nasabah
    ADD CONSTRAINT "nasabah_kelompokId_fkey" FOREIGN KEY ("kelompokId") REFERENCES public.kelompok(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: nasabah nasabah_kolektorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nasabah
    ADD CONSTRAINT "nasabah_kolektorId_fkey" FOREIGN KEY ("kolektorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notifikasi notifikasi_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifikasi
    ADD CONSTRAINT "notifikasi_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifikasi notifikasi_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifikasi
    ADD CONSTRAINT "notifikasi_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pembayaran pembayaran_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pembayaran
    ADD CONSTRAINT "pembayaran_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pembayaran pembayaran_inputOlehId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pembayaran
    ADD CONSTRAINT "pembayaran_inputOlehId_fkey" FOREIGN KEY ("inputOlehId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pembayaran pembayaran_pinjamanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pembayaran
    ADD CONSTRAINT "pembayaran_pinjamanId_fkey" FOREIGN KEY ("pinjamanId") REFERENCES public.pinjaman(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pengajuan pengajuan_approverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pengajuan
    ADD CONSTRAINT "pengajuan_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pengajuan pengajuan_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pengajuan
    ADD CONSTRAINT "pengajuan_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pengajuan pengajuan_kelompokId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pengajuan
    ADD CONSTRAINT "pengajuan_kelompokId_fkey" FOREIGN KEY ("kelompokId") REFERENCES public.kelompok(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pengajuan pengajuan_nasabahId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pengajuan
    ADD CONSTRAINT "pengajuan_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES public.nasabah(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pengajuan pengajuan_surveyorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pengajuan
    ADD CONSTRAINT "pengajuan_surveyorId_fkey" FOREIGN KEY ("surveyorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: penggunaan_simpanan penggunaan_simpanan_pinjamanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.penggunaan_simpanan
    ADD CONSTRAINT "penggunaan_simpanan_pinjamanId_fkey" FOREIGN KEY ("pinjamanId") REFERENCES public.pinjaman(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: penggunaan_simpanan penggunaan_simpanan_simpananId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.penggunaan_simpanan
    ADD CONSTRAINT "penggunaan_simpanan_simpananId_fkey" FOREIGN KEY ("simpananId") REFERENCES public.simpanan(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: penjamin penjamin_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.penjamin
    ADD CONSTRAINT "penjamin_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: penjamin penjamin_nasabahId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.penjamin
    ADD CONSTRAINT "penjamin_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES public.nasabah(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pinjaman pinjaman_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pinjaman
    ADD CONSTRAINT "pinjaman_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pinjaman pinjaman_pengajuanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pinjaman
    ADD CONSTRAINT "pinjaman_pengajuanId_fkey" FOREIGN KEY ("pengajuanId") REFERENCES public.pengajuan(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pinjaman pinjaman_simpananId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pinjaman
    ADD CONSTRAINT "pinjaman_simpananId_fkey" FOREIGN KEY ("simpananId") REFERENCES public.simpanan(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: rekonsiliasi_kas rekonsiliasi_kas_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rekonsiliasi_kas
    ADD CONSTRAINT "rekonsiliasi_kas_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public.accounts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: rekonsiliasi_kas rekonsiliasi_kas_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rekonsiliasi_kas
    ADD CONSTRAINT "rekonsiliasi_kas_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: rekonsiliasi_kas rekonsiliasi_kas_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rekonsiliasi_kas
    ADD CONSTRAINT "rekonsiliasi_kas_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: simpanan simpanan_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.simpanan
    ADD CONSTRAINT "simpanan_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: simpanan simpanan_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.simpanan
    ADD CONSTRAINT "simpanan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transaksi_simpanan transaksi_simpanan_inputOlehId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaksi_simpanan
    ADD CONSTRAINT "transaksi_simpanan_inputOlehId_fkey" FOREIGN KEY ("inputOlehId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transaksi_simpanan transaksi_simpanan_simpananId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaksi_simpanan
    ADD CONSTRAINT "transaksi_simpanan_simpananId_fkey" FOREIGN KEY ("simpananId") REFERENCES public.simpanan(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict 1beX2zBxNjxc5eDG7MiwaK7ZmLmxHGYIdYiVIROfVS7vYKeOFNfyITcjwvWa0sM

