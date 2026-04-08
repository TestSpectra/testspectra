# Peran dan Izin Akses (RBAC)

TestSpectra menggunakan sistem **Role-Based Access Control (RBAC)** yang bersifat granular. Setiap pengguna memiliki peran (Role) yang diberikan oleh Admin saat pembuatan akun atau penambahan anggota proyek.

## 1. Daftar Peran (Roles)

| Nama Peran | Deskripsi Singkat |
|------------|-------------------|
| **Admin** | Memiliki akses penuh ke seluruh sistem, manajemen pengguna, dan konfigurasi proyek. |
| **QA Lead** | Memimpin tim qa, menyetujui test case di Review Queue, dan mengelola anggota proyek QA Engineer. |
| **QA Engineer** | Pengguna utama yang membuat, mengedit, dan menjalankan test case (manual maupun otomatis). |
| **Developer** | Memiliki akses untuk menjalankan test case otomatis dalam lingkungan lokal atau CI/CD. |
| **Product Manager** | Fokus pada laporan (reports) dan metrik pengujian demi tujuan bisnis. |
| **UI/UX Designer** | Memantau test case untuk memastikan visi desain terimplementasi dengan benar. |
| **Viewer** | Hak akses baca saja (Read-only) untuk pemantauan progres. |

---

## 2. Pemetaan Izin Akses Halaman Utama

| Halaman | Izin yang Dibutuhkan |
|---------|-----------------------|
| **Dashboard** | `view_all_data` |
| **Test Cases (Lihat)** | `view_all_data` |
| **Test Cases (Buat/Edit/Hapus)** | `create_edit_test_cases` |
| **Review Queue** | `review_approve_test_cases` |
| **Test Suites** | `view_all_data` |
| **Shared Steps** | `create_edit_test_cases` |
| **Runs History** | `view_all_data` |
| **Configuration** | `manage_configurations` |
| **User Management** | `manage_users` |

---

## 3. Izin Akses Tindakan (Action-Level)

Selain akses halaman, beberapa tindakan spesifik juga dibatasi:

- **Menjalankan Tes Otomatis**: Membutuhkan `execute_automated_tests`.
- **Mencatat Hasil Manual**: Membutuhkan `record_test_results`.
- **Menyetujui Test Case**: Membutuhkan `review_approve_test_cases`.
- **Ekspor Laporan**: Membutuhkan `export_reports`.

---

## 4. Keanggotaan Proyek (Project Membership)

Meskipun memiliki peran global, seorang pengguna **hanya dapat mengakses data proyek jika mereka telah terdaftar sebagai anggota proyek tersebut**. 

> [!IMPORTANT]
> Admin dapat menambahkan siapa saja ke proyek mana pun. QA Lead hanya dapat menambahkan QA Engineer ke proyek yang sedang dikelolanya.
