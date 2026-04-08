# Unified Script Editor

Unified Script Editor di TestSpectra adalah editor berbasis **Monaco Editor** (sama dengan yang digunakan di VS Code) yang dirancang khusus untuk menulis script pengujian otomatisasi dan manajemen Page Objects.

## 1. Fitur Utama Editor

- **Intellisense & Autocomplete**: Mendapatkan saran saat mengetik perintah, nama Page Object, atau Shared Step.
- **Auto-Formatting**: Merapikan kode Anda secara otomatis dengan menekan shortcut atau klik kanan.
- **Shared Step Identifier Integration**: Mengenali Shared Steps secara instan melalui identifikasi unik mereka dalam script.
- **Pseudo-Git Versioning**: Melacak riwayat perubahan secara lokal melalui sistem versioning internal kami.

## 2. Cara Kerja Editor

1. Pilih **Test Case** atau **Page Object** yang ingin Anda edit melalui sidebar.
2. Gunakan shortcut `Ctrl+S` untuk menyimpan perubahan Anda secara lokal (akan disimpan ke Pseudo-Git).
3. Anda dapat beralih antara tampilan visual (Manual Steps) dan Script Editor melalui toggle yang tersedia di UI aplikasi.

---

## 3. Shortcut Berguna

- `Ctrl + P`: Cepat beralih antar file pengujian.
- `Alt + Shift + F`: Format dokumen (Merapikan kode).
- `Ctrl + F`: Mencari kata kunci dalam script.

> [!TIP]
> Maksimalkan penggunaan **Intellisense** dengan mengetikkan beberapa karakter awal dari elemen Page Object Anda.
