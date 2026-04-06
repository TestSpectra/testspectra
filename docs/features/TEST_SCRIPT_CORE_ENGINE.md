# 📑 AI Agent Directive: Pseudo-Git Core Engine Implementation

## 📖 Context & Background (The "Why")

TestSpectra bertujuan memberikan pengalaman **"Postman-style"** untuk test automation. User tidak boleh berurusan dengan kompleksitas Git (commit, push, merge), namun sistem harus memiliki ketangguhan versioning tingkat enterprise.

### Core Philosophy:

1.  **Isolation for Test Independence**: Memisahkan "Ruang Kerja" dan "Ruang Eksekusi". Draft yang sedang diedit (PostgreSQL) tidak boleh memengaruhi script yang sedang dijalankan oleh Runner (Bare Git) [cite: 2025-11-25].
2.  **Zero-Loss Drafting**: Setiap ketikan user adalah aset. Database berfungsi sebagai buffer permanen agar tidak ada data yang hilang jika aplikasi tertutup tiba-tiba.
3.  **Schema-Level Multi-Tenancy**: Semua operasi harus terisolasi di dalam PostgreSQL Schema masing-masing project.

---

## 🏗️ Phase 1: Hybrid Storage Architecture

### 1. Database Layer (PostgreSQL - Project Schema)

Implementasikan tabel-tabel berikut dengan kontrol akses ketat:

- **`script_metadata`**:
  - `id` (UUID), `file_path` (TEXT), `last_commit_hash` (VARCHAR).
- **`script_drafts`**:
  - `content` (TEXT): Menyimpan teks mentah hasil auto-save.
  - `base_commit_hash`: Hash Git terakhir saat user mulai mengedit (untuk deteksi konflik).

### 2. Versioning Layer (Bare Git Repo)

- **Initialization**: `git init --bare` di direktori server yang tersembunyi.
- **Constraint**: Tidak ada file fisik `.js` yang dapat diakses langsung. Semua konten dikelola sebagai objek Git melalui backend Rust.

---

## 🔄 Phase 2: Persistence & Rehydration Workflow

1.  **Opening a File**:
    - Jika tersedia, muat konten dari `script_drafts` terlebih dahulu (Persistence). Jika kosong, baru ambil dari Bare Git via `last_commit_hash`.
2.  **Auto-Save**:
    - Gunakan _debounce_ 2 detik (terhitung sejak pengetikan terakhir) untuk melakukan `UPSERT` draf ke database.

---

## 🚀 Phase 3: Atomic "Publish" Logic (The Rust Bridge)

Saat user menekan "Publish", AI Agent harus mengeksekusi urutan atomik di backend:

1.  **Git Blob Creation**: Tulis `content` dari draf ke Bare Repo sebagai objek blob (`git hash-object`).
2.  **Commit Generation**: Buat tree dan commit baru secara internal (`git commit-tree`).
3.  **Metadata Sync**: Simpan hash baru ke `script_metadata.last_commit_hash`.
4.  **Draft Cleanup**: Hapus baris di `script_drafts` hanya SETELAH commit berhasil dikonfirmasi.

---

## 🏃 Phase 4: Execution Isolation

Untuk menjaga **Test Independence** [cite: 2025-11-25]:

- **Source of Truth**: Runner (WDIO) boleh mengambil kode dari **Bare Git Repo** dan user draft jika local run.
- **Sandbox**: Ekstrak script ke folder `/tmp` unik per sesi lari. Jangan pernah menjalankan kode langsung dari tabel draf.

---

## ⚠️ Phase 5: Edge Case Management (Critical)

Bagian ini menangani skenario luar biasa yang menjaga integritas kolaborasi:

### 1. The "Outdated Draft" Conflict

- **Scenario**: User A sedang mengedit file. User B melakukan "Publish" versi baru. User A mencoba mempublikasikan draf miliknya.
- **Detection**: Saat User A mencoba mempublikasikan, AI Agent harus membandingkan:
  `IF (draft.base_commit_hash != metadata.last_commit_hash)`
- **Resolution**:
  - Sistem mendeteksi draf User A sudah tidak relevan (_outdated_).
  - AI Agent harus memicu **Conflict UI** (Diff View) yang menampilkan perbedaan antara draf lokal User A dan versi terbaru di Git milik User B.
  - User A diberikan pilihan: _Discard Draft_, _Overwrite_ (dengan peringatan keras), atau _Manual Merge_.

### 2. Synchronous Script Title Patching (Implemented)

- **Scenario**: User mengupdate `title` suatu TestCase melalui UI (misal: `TestCaseForm`). Karena framework sistem menggunakan `.test.ts` executable murni, perubahan title di database harus langsung direfleksikan menjadi parameter pertama `it('...', async () => {` di dalam file agar Runner (WebdriverIO) menampilkan nama tes yang akurat.
- **Constraint**: Menunggu user membuka Script Editor untuk mensinkronisasi title secara _on-the-fly_ sangat rentan _out-of-sync_. Jika _test suite_ dijalankan secara terpusat (Terminal/CI/CD) sebelum user membuka UI Editor, file lama dengan title lama masih akan digunakan.
- **Logic**: Operasi **Synchronous Patching** dilakukan di `update_test_case` handler (Rust). Backend secara atomik memuat draft/commit `.test.ts` terbaru, mencari block wrapper `it()` menggunakan pencarian teks aman (bukan regex global), me-replace title-nya, dan melakukan commit baru ke Git Repo.
- **Draft & Live Sync**: Sistem juga me-_patch_ semua draf aktif di database agar tetap sinkron dan tidak terjadi konflik saat user mempublikasikan karyanya. Pemberitahuan dikirim via **WebSocket** (`SCRIPT_TITLE_UPDATED`) agar UI Editor yang sedang terbuka otomatis memperbarui baris judul secara _real-time_.
- **Outcome**: File `.test.ts` selalu siap eksekusi (_CI/CD ready_) dengan Data Consistency 100% antara database dan file system tanpa perlu manipulasi manual di editor.
