# Page Object Model (POM)

Page Object Model adalah pola desain untuk memisahkan logika interaksi elemen UI dari skenario pengujian utama.

## 1. Mengapa Menggunakan POM?

- **Abstraksi**: Test Case Anda hanya perlu memanggil fungsi seperti `loginPage.enterCredentials()`, bukan instruksi mentah seperti `click(id="login_button")`.
- **Maintainability**: Jika ada perubahan elemen UI (misal: ID tombol login berubah), Anda hanya perlu mengubahnya di satu tempat (Page Object).
- **Readable**: Script pengujian menjadi jauh lebih mudah dibaca oleh siapa saja, bahkan untuk pengembang junior atau manajer proyek.

## 2. Membuat Page Object

1. Pilih menu **Page Objects** atau **Page Object Manager**.
2. Klik **New Page Object**.
3. Beri nama (misal: `LoginPage`, `CheckoutPage`).
4. Tentukan **Project Namespace**.
5. Gunakan **Unified Script Editor** untuk mendefinisikan elemen-elemen UI dan fungsinya.

## 3. Integrasi dengan Script Editor

Di dalam **Unified Script Editor**, Anda dapat:
- Mengimpor Page Objects yang telah dibuat.
- Menggunakan fitur **Intellisense** untuk memanggil elemen-elemen yang sudah didefinisikan.

---

## 4. Struktur Page Object yang disarankan

- **Selectors**: Tempat menyimpan ID, Class, atau XPath dari elemen.
- **Actions**: Fungsi-fungsi yang dapat dilakukan pada halaman tersebut (misal: `clickLogin()`, `submitSearch()`).
- **Assertions**: Kondisi yang diharapkan untuk memvalidasi state halaman (misal: `isHeaderVisible()`).

> [!NOTE]
> Page Object juga didukung oleh sistem **Pseudo-Git**, sehingga Anda dapat melacak sejarah perubahan elemen UI dari waktu ke waktu.
