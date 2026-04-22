# Panduan Penggunaan `$using-superpowers`

Dokumen lengkap (step-by-step untuk user) dipusatkan di:

- `dashboard/USING-SUPERPOWERS.md`

File ini disimpan di `dashboard/docs/superpowers/` sebagai indeks/arsip agar mudah ditemukan bersama dokumen superpowers lainnya.

## Tujuan

- Memastikan agent selalu mengecek dan memakai skill yang relevan sebelum bertindak.
- Mengurangi miskomunikasi: skill menentukan _cara kerja_, user menentukan _apa yang dikerjakan_.
- Menjaga kualitas: eksplorasi, coding, dan perubahan file berjalan dengan disiplin.

## Aturan Inti

1. Agent wajib meng-invoke skill yang relevan **sebelum** melakukan tindakan apa pun, termasuk sebelum bertanya klarifikasi.
2. Jika ada kemungkinan kecil (bahkan 1%) skill relevan, agent tetap harus meng-invoke skill itu dulu.
3. Prioritas instruksi:
   - Instruksi user (termasuk `AGENTS.md`, `CLAUDE.md`) paling tinggi.
   - Skill superpowers (mis. `using-superpowers`) mengalahkan default perilaku agent.
   - Default sistem yang terakhir.

## Cara Memanggil Skill

Gunakan salah satu:

- Tulis: `$using-superpowers`
- Atau sebut langsung: `using-superpowers`

Jika environment mendukung blok skill (seperti yang Anda pakai sebelumnya), sertakan blok `<skill>` dengan nama dan path agar agent langsung punya referensi yang tepat.

## Checklist Saat Memakai Skill

Sebelum minta agent melakukan sesuatu:

- Sertakan skill yang ingin dipakai (contoh: `$using-superpowers`).
- Tulis output yang Anda inginkan: halaman apa, route apa, file doc di mana.
- Jika ada batasan: “jangan ubah UI lain”, “jangan refactor”, “cukup tambah page”.

Saat agent mulai bekerja, agent seharusnya:

- Meng-invoke skill dulu (sebelum eksplorasi repo, sebelum bertanya klarifikasi).
- Membaca instruksi repo (`AGENTS.md` dan sejenis) yang berlaku untuk file yang disentuh.
- Baru eksplorasi, implementasi, verifikasi, dan merangkum hasil.

## Contoh Prompt

```text
$using-superpowers

Buat page baru /roadmap berisi checklist semua fitur (yang sudah ada dicentang).
Tambahkan menu di sidebar.
Lalu buat doc markdown penggunaan detail using-superpowers di dashboard/docs/superpowers.
```

## Anti-Pattern (Yang Harus Dihindari)

- “Bikin cepat aja” tanpa menyebut skill padahal ingin workflow tertentu.
- Langsung minta agent eksplorasi atau coding sebelum skill dipanggil.
- Scope melebar: refactor besar, ganti desain global, atau ganti arsitektur tanpa diminta.
