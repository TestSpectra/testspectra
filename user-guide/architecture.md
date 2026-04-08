# High-Level Architecture

TestSpectra dirancang sebagai aplikasi desktop modern menggunakan framework **Tauri**, yang mengutamakan performa tinggi dan keamanan dengan memisahkan logic berat ke sistem operasi (Rust) dan antarmuka pengguna ke web (React).

## 1. Komponen Utama

### A. Desktop Wrapper (Tauri + Rust)
- **Host System Access**: Menangani akses file, notifikasi sistem, dan kontrol window.
- **Tauri Bridge**: Menghubungkan frontend React dengan backend Rust menggunakan mekanisme RPC yang aman.

### B. Frontend (React + Vite)
- **UI Framework**: React dengan TypeScript untuk tipe data yang ketat.
- **Navigation**: Client-side routing untuk pengalaman aplikasi yang cepat.
- **State Management**: Menggunakan React Context untuk data pengguna, proyek aktif, dan WebSocket.
- **Editor**: Terintegrasi dengan **Monaco Editor** untuk penulisan script yang kaya fitur (intellisense, formatting).

### C. Backend (Rust + Axum)
- **API Server**: Menggunakan `Axum` untuk melayani request RESTful.
- **Concurrency**: Memanfaatkan `Tokio` runtime untuk pengolahan data paralel yang efisien.
- **Versioning (Pseudo-Git)**: Sistem unik untuk menyimpan riwayat versi script pengujian dan page objects secara lokal tanpa memerlukan instalasi Git eksternal di komputer pengguna.
- **Real-time Communication**: WebSocket server untuk pembaruan status pengujian secara instan ke semua klien yang terhubung.

### D. Persistence Layer (PostgreSQL)
- **Multi-Tenancy**: Menggunakan pendekatan **Schema-based Multi-tenancy**. Setiap proyek baru yang dibuat akan memiliki skema database sendiri (`search_path`). Hal ini menjamin isolasi data total antar proyek.
- **Shared Data**: Data pengguna dan konfigurasi global disimpan di skema `public`.

---

## 2. Alur Kerja Data

1. **Authentication**: Pengguna login via REST API -> Backend memvalidasi kredo -> Mengembalikan Token JWT.
2. **Project Selection**: Saat proyek dipilih, backend menyesuaikan `search_path` PostgreSQL untuk hanya mengakses data milik proyek tersebut.
3. **Script Execution**: 
   - Script ditulis di editor -> Disimpan via Pseudo-Git.
   - Test Runner (Rust) mengambil script dan data fixture.
   - Hasil pengujian dikirim secara real-time via WebSocket ke UI.

---

## 3. Tech Stack Summary

| Layer | Technology |
|-------|------------|
| UI | React, Tailwind CSS |
| Desktop | Tauri (Rust) |
| API | Rust (Axum) |
| Database | PostgreSQL (sqlx) |
| Real-time | WebSockets |
| Editor | Monaco Editor |
| Versioning | Pseudo-Git (Rust) |
