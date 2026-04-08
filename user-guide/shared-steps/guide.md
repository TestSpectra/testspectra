# Shared Steps & Reusability

Shared Steps adalah mekanisme untuk mengekstrak langkah-langkah pengujian yang sering dilakukan menjadi satu blok yang dapat digunakan kembali di banyak test case.

## 1. Mengapa Menggunakan Shared Steps?

- **Efisiensi**: Cukup tulis langkah (misal: "Login") satu kali.
- **Maintenance**: Jika alur "Login" berubah, Anda hanya perlu memperbarui satu Shared Step, dan semua test case yang menggunakannya akan otomatis terbarui.
- **Kejelasan**: Membuat skenario test case utama lebih bersih dan fokus pada alur bisnis.

## 2. Membuat Shared Step Baru

1. Navigasi ke menu **Shared Steps**.
2. Klik **New Shared Step**.
3. Masukkan **Name** dan **Identifier** (misal: `login_admin_user`).
4. Tuliskan langkah-langkah (steps) secara manual atau gunakan Script Editor untuk otomatisasi.
5. Simpan perubahan.

## 3. Menggunakan Shared Step di Test Case

- Saat membuat atau mengedit **Test Case**, cari opsi **Add Shared Step**.
- Pilih Shared Step yang telah dibuat dari daftar yang tersedia.
- Anda dapat menyisipkan Shared Step di posisi mana pun dalam urutan pengujian Anda.

---

## 4. Integrasi Script Editor

Jika Anda menggunakan fitur otomatisasi:
- Gunakan **Identifier** unik dari Shared Step untuk memanggilnya dalam script pengujian Anda.
- Test runner akan secara otomatis menarik rangkaian instruksi dari Shared Step tersebut saat eksekusi dimulai.

> [!TIP]
> Kami menyarankan pemberian nama Shared Step yang deskriptif namun singkat agar mudah dikenali saat pengembangannya berkembang.
