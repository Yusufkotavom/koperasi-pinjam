# Panduan Step-by-Step `$using-superpowers` (Untuk User)

Dokumen ini adalah panduan praktis untuk Anda (user) agar agent selalu bekerja dengan workflow yang disiplin: cek skill dulu sebelum melakukan tindakan apa pun.

## Kapan Dipakai

Pakai `$using-superpowers` saat Anda ingin:

- Agent mengikuti workflow yang konsisten dari awal (skill check dulu).
- Anda ingin agent mematuhi aturan repo seperti `AGENTS.md` / `CLAUDE.md` tanpa perlu diingatkan.
- Task Anda melibatkan perubahan file, penambahan halaman, debugging, atau hal yang mudah “melebar”.

## Prinsip Inti (Singkat)

1. Skill dipanggil **sebelum tindakan apa pun** (termasuk sebelum agent bertanya klarifikasi).
2. Kalau ada kemungkinan kecil (1%) sebuah skill relevan, agent tetap wajib meng-invoke skill.
3. Prioritas instruksi:
   - Instruksi Anda paling tinggi (termasuk batasan scope).
   - Skill superpowers membentuk “cara kerja”.
   - Default agent paling rendah.

## Step-by-Step Cara Meminta Agent Bekerja

### Step 1: Mulai prompt dengan skill

Tulis salah satu di baris paling atas:

- `$using-superpowers`
- `using-superpowers`

Contoh:

```text
$using-superpowers

Tolong bikin page baru /roadmap …
```

### Step 2: Jelaskan tujuan (1 sampai 3 poin)

Tulis tujuan dalam bentuk outcome:

- “Tambah page X untuk Y”
- “Update sidebar menu”
- “Buat doc penggunaan untuk user”

Contoh:

```text
Tujuan:
- Tambah page /roadmap untuk cek semua fitur
- Tambah menu di sidebar
- Buat doc step-by-step untuk user
```

### Step 3: Spesifikkan output yang wajib ada

Sebutkan yang tidak boleh ambigu:

- Route yang harus bisa diakses (contoh: `/roadmap`)
- Nama menu yang harus muncul
- Lokasi file doc (contoh: `dashboard/USING-SUPERPOWERS.md`)

Contoh:

```text
Output wajib:
- Route: /roadmap
- Sidebar: "Roadmap Fitur"
- File: dashboard/USING-SUPERPOWERS.md
```

### Step 4: Batasi scope (kalau perlu)

Ini penting supaya agent tidak refactor besar.

Contoh batasan:

- “Jangan refactor modul lain”
- “Jangan ubah schema DB”
- “Jangan ubah UI global”
- “Tambah file seminimal mungkin”

Contoh:

```text
Batasan:
- Jangan refactor file selain route + sidebar
- Jangan ubah desain global
```

### Step 5: Minta cara verifikasi yang Anda mau

Contoh:

- “Jalankan lint”
- “Pastikan tidak ada error TypeScript”
- “Pastikan route bisa dibuka setelah login”

Contoh:

```text
Verifikasi:
- Jalankan npm -C dashboard run lint
```

## Template Prompt Siap Pakai

```text
$using-superpowers

Tujuan:
- (isi singkat)

Output wajib:
- Route:
- Sidebar:
- File:

Batasan:
- (opsional)

Verifikasi:
- (opsional)
```

## Contoh Prompt (Skenario Umum)

### 1) Tambah halaman baru

```text
$using-superpowers

Tujuan:
- Tambah page /roadmap berisi checklist fitur + filter status

Output wajib:
- Route: /roadmap
- Sidebar: "Roadmap Fitur"

Batasan:
- Jangan refactor modul lain

Verifikasi:
- Jalankan lint
```

### 2) Debug bug yang spesifik

```text
$using-superpowers

Bug:
- Saat simpan pembayaran manual, nilai total kadang jadi 0.

Output wajib:
- Fix root cause
- Tambah guard/validasi bila perlu

Batasan:
- Jangan ubah schema DB

Verifikasi:
- Sebutkan file yang diubah dan cara reproduksi setelah fix
```

### 3) “Review” PR atau perubahan

```text
$using-superpowers

Tolong review perubahan saya di folder dashboard/ dan fokus:
- Risiko bug/regresi
- Edge case
- Rekomendasi test minimal
```

## Apa yang Bisa Anda Harapkan dari Agent (Jika Skill Dipakai)

Agent seharusnya melakukan urutan ini:

1. Invoke skill dulu.
2. Baca aturan repo yang berlaku (`AGENTS.md`, `CLAUDE.md`, dll) untuk file yang disentuh.
3. Eksplorasi struktur project seperlunya (tanpa refactor).
4. Implementasi perubahan yang diminta.
5. Verifikasi (lint/test) sesuai permintaan Anda.
6. Ringkas hasil: file mana yang berubah, route apa yang ditambah, dan apa langkah next.

## Anti-Pattern yang Perlu Anda Hindari

- Meminta “cepat aja” tapi mengharapkan workflow rapi.
- Tidak menyebut output wajib (route/file/menu) sehingga agent menebak.
- Tidak memberi batasan scope tapi marah ketika agent merapikan hal lain.
- Menggabungkan banyak task besar tanpa prioritas (lebih baik pecah jadi 2 sampai 3 batch).

## Troubleshooting

- Jika agent menanyakan hal yang Anda anggap “sudah jelas”, jawab dengan format Step 2 sampai Step 5 di atas (tujuan, output wajib, batasan, verifikasi).
- Jika agent mengubah terlalu banyak file, tambahkan batasan scope eksplisit: “maksimal ubah X file”, atau “hanya ubah route dan sidebar”.

