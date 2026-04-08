# Manajemen Proyek

TestSpectra memungkinkan pengelolaan banyak proyek dalam satu aplikasi desktop (Multi-Tenancy). Setiap proyek memiliki isolasi data yang aman.

## 1. Membuat Proyek Baru

Pembuatan proyek baru hanya dapat dilakukan oleh pengguna dengan peran **Admin**.

**Langkah-langkah:**
1. Gunakan API atau antarmuka Dashboard utama untuk membuat proyek baru.
2. Masukkan **Project Name** dan **Slug** (misal: `project_alpha`).
3. Sistem secara otomatis akan membuat skema database baru di PostgreSQL khusus untuk proyek tersebut.

## 2. Berpindah Antar Proyek (Project Switching)

Pengguna dapat berpindah proyek dengan mudah melalui menu navigasi (sidebar atau dropdown projects).

- Data (Test Cases, Shared Steps, Fixtures) akan diperbarui secara otomatis sesuai proyek yang aktif.
- State proyek disimpan secara lokal dalam sesi aplikasi.

## 3. Integrasi Skema (Multi-Tenancy)

- Setiap proyek memiliki skemanya sendiri (Isolasi Data).
- **Shared Data**: Data global seperti `users` atau `projects` sendiri berada di skema `public`.
- **Project Data**: Semua data pengujian (test cases, shared steps, dsb.) berada di skema proyek yang bersangkutan.

---

## 4. Manajemen Anggota Proyek

Pengguna tidak akan memiliki akses ke proyek tertentu sampai mereka didaftarkan sebagai anggota proyek.

- **Admin** dapat melakukan penugasan pengguna global ke proyek mana pun.
- **QA Lead** hanya dapat mengelola QA Engineer yang terhubung ke proyek aktif di mana QA Lead tersebut bertugas.

> [!NOTE]
> Satu pengguna dapat menjadi anggota di lebih dari satu proyek secara bersamaan.
