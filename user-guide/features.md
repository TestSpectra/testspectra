# Fitur dan Menu

TestSpectra menyediakan ekosistem terpadu untuk pengujian perangkat lunak, mulai dari manajemen manual hingga pengujian otomatis yang canggih.

## 1. Dashboard
- **Overview Statis**: Menampilkan jumlah test case yang ada, status keberhasilan, dan kegagalan.
- **Aktivitas Terakhir**: Menampilkan riwayat eksekusi pengujian terbaru.
- **Analytics**: Grafik performa dan reliabilitas pengujian berdasarkan data historis.

## 2. Test Management

### A. Test Cases
- **List & Detail**: Menelusuri semua test case dalam proyek.
- **Creation/Edit**: Membuat skenario pengujian dengan langkah-langkah manual atau otomatis.
- **Manual Results**: Mencatat hasil pengujian yang dilakukan secara manual langsung ke dalam sistem.

### B. Test Suites
- **Pengelompokan**: Menggabungkan beberapa test case ke dalam satu suite (misal: Smoke Test, Regression Test).
- **Hooks**: Mendukung `Setup` dan `Teardown` hooks di level suite untuk manajemen state pengujian.

### C. Shared Steps
- **Reusability**: Membuat langkah-langkah pengujian yang sering dilakukan (misal: Login, Logout) dan menggunakannya kembali di banyak test case.
- **Identifier**: Menggunakan identifier unik untuk integrasi yang mudah dengan script editor.

## 3. Automation Engine

### A. Unified Script Editor
- **Multi-purpose Editor**: Satu editor untuk menulis script test case maupun mendefinisikan Page Objects.
- **Intellisense**: Mendapatkan saran pengetikan saat menulis script otomatisasi.
- **Versioning**: Simpan perubahan dalam sistem Pseudo-Git untuk mencegah kehilangan data dan melacak riwayat perubahan.

### B. Page Object Manager (POM)
- **Struktur Berbasis Halaman**: Mengorganisir interaksi elemen web/mobile berdasarkan halaman aplikasi yang sedang diuji.
- **Centralized Elements**: Jika ada perubahan UI, cukup ubah di Page Object dan semua test case yang menggunakannya akan terupdate.

### C. Fixture Management
- **Test Data**: Mengelola data statis atau dinamis (JSON/CSV) untuk digunakan sebagai input dalam pengujian.
- **Project-Specific**: Data fixture terisolasi per proyek untuk keamanan data maksimal.

## 4. Review Workflow

### Review Queue
- **Persetujuan**: Setiap test case baru atau yang mengalami perubahan harus melalui antrean review.
- **Collaborative Review**: QA Lead atau Admin dapat menyetujui, menolak, atau memberikan komentar pada draf test case.
- **Audit Trail**: Melacak siapa yang membuat, mengedit, dan menyetujui setiap skenario pengujian.

## 5. Reporting & History

- **Runs History**: Melihat detail setiap eksekusi pengujian di masa lalu, termasuk siapa yang menjalankan dan kapan.
- **Visual Reports**: Laporan grafis yang memudahkan identifikasi titik kegagalan (flaky tests).
- **Exporting**: (Mendukung ekspor laporan ke berbagai format seperti PDF/HTML).

## 6. Project & User Management

- **Multi-Project Switcher**: Berpindah antar proyek dengan mudah melalui sidebar.
- **Project Members**: Mengelola siapa saja yang berhak mengakses proyek tertentu.
- **Role-Based Access Control (RBAC)**: Pembatasan hak akses berdasarkan peran (Admin, QA Lead, QA Engineer, dll.) untuk menjaga integritas data.

## 7. Tools

- **Inspector**: Alat bantu untuk mengidentifikasi elemen UI pada aplikasi web atau mobile (Mobile Inspector).
- **Utility Tools**: Perkakas tambahan untuk membantu QA dalam melakukan pengujian harian.

---
> [!TIP]
> Maksimalkan penggunaan **Shared Steps** untuk mengurangi redundansi langkah pengujian di test case Anda.
