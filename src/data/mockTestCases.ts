// Centralized mock test cases database with full details
// This ensures consistency between Dashboard, TestCasesList, and TestCaseDetail

export interface TestStep {
  action: string;
  target?: string;
  value?: string;
  description?: string;
}

export interface TestCaseSummary {
  id: string;
  title: string;
  suite: string;
  priority: string;
  caseType: string;
  automation: string;
  lastStatus: 'passed' | 'failed' | 'pending';
  pageLoadAvg: string;
  lastRun: string;
}

export interface TestCaseDetail extends TestCaseSummary {
  description?: string;
  steps?: TestStep[];
  expectedOutcome?: string;
  tags?: string[];
  createdBy?: string;
  createdAt?: string;
  lastModified?: string;
}

// Full test case details database
const TEST_CASE_DETAILS: Record<string, TestCaseDetail> = {
  'TC-1001': {
    id: 'TC-1001',
    title: 'Login dengan kredensial valid',
    suite: 'Authentication',
    priority: 'High',
    caseType: 'Positive',
    automation: 'Automated',
    lastStatus: 'passed',
    pageLoadAvg: '1.2s',
    lastRun: '5 menit lalu',
    description: 'Memverifikasi bahwa user dapat login dengan username dan password yang valid',
    steps: [
      { action: 'Open Browser', description: 'Buka browser Chrome' },
      { action: 'Navigate', target: 'https://app.example.com/login', description: 'Buka halaman login' },
      { action: 'Type', target: '#username', value: 'testuser@example.com', description: 'Input username yang valid' },
      { action: 'Type', target: '#password', value: '••••••••', description: 'Input password yang valid' },
      { action: 'Click', target: '#login-button', description: 'Klik tombol login' },
      { action: 'Verify', target: '.dashboard-header', description: 'Verifikasi halaman dashboard muncul' },
      { action: 'Verify', target: '.user-profile', description: 'Verifikasi profile user tampil' },
    ],
    expectedOutcome: 'User berhasil login dan diarahkan ke halaman dashboard. Profile user terlihat di header dengan nama dan avatar yang sesuai.',
    createdBy: 'Ahmad R.',
    createdAt: '2024-11-10 09:30:00',
    lastModified: '2024-11-20 14:45:00',
  },
  'TC-1002': {
    id: 'TC-1002',
    title: 'Login dengan password salah',
    suite: 'Authentication',
    priority: 'High',
    caseType: 'Negative',
    automation: 'Automated',
    lastStatus: 'passed',
    pageLoadAvg: '0.9s',
    lastRun: '5 menit lalu',
    description: 'Memverifikasi bahwa sistem menampilkan error message ketika user login dengan password yang salah',
    steps: [
      { action: 'Open Browser', description: 'Buka browser Chrome' },
      { action: 'Navigate', target: 'https://app.example.com/login', description: 'Buka halaman login' },
      { action: 'Type', target: '#username', value: 'testuser@example.com', description: 'Input username yang valid' },
      { action: 'Type', target: '#password', value: 'WrongPassword123', description: 'Input password yang salah' },
      { action: 'Click', target: '#login-button', description: 'Klik tombol login' },
      { action: 'Verify', target: '.error-message', description: 'Verifikasi error message muncul' },
      { action: 'Assert Text', target: '.error-message', value: 'Invalid credentials', description: 'Verifikasi text error sesuai' },
    ],
    expectedOutcome: 'Sistem menampilkan error message "Invalid credentials" dan user tetap di halaman login.',
    createdBy: 'Ahmad R.',
    createdAt: '2024-11-10 10:15:00',
    lastModified: '2024-11-19 11:20:00',
  },
  'TC-1003': {
    id: 'TC-1003',
    title: 'Logout dari dashboard',
    suite: 'Authentication',
    priority: 'Medium',
    caseType: 'Positive',
    automation: 'Automated',
    lastStatus: 'passed',
    pageLoadAvg: '0.7s',
    lastRun: '5 menit lalu',
    description: 'Memverifikasi bahwa user dapat logout dari aplikasi',
    steps: [
      { action: 'Navigate', target: 'https://app.example.com/dashboard', description: 'Buka halaman dashboard (asumsi sudah login)' },
      { action: 'Click', target: '.user-menu', description: 'Klik menu user di header' },
      { action: 'Click', target: '#logout-button', description: 'Klik tombol logout' },
      { action: 'Wait', target: '2000', description: 'Tunggu redirect' },
      { action: 'Verify', target: 'url', value: '/login', description: 'Verifikasi redirect ke halaman login' },
    ],
    expectedOutcome: 'User berhasil logout dan diarahkan kembali ke halaman login. Session cleared.',
    createdBy: 'Ahmad R.',
    createdAt: '2024-11-10 11:00:00',
    lastModified: '2024-11-18 15:30:00',
  },
  'TC-1004': {
    id: 'TC-1004',
    title: 'Login dengan username 255 karakter (max length)',
    suite: 'Authentication',
    priority: 'Low',
    caseType: 'Edge',
    automation: 'Automated',
    lastStatus: 'passed',
    pageLoadAvg: '1.1s',
    lastRun: '1 jam lalu',
    description: 'Memverifikasi bahwa sistem dapat handle username dengan panjang maksimal 255 karakter',
    steps: [
      { action: 'Navigate', target: 'https://app.example.com/login', description: 'Buka halaman login' },
      { action: 'Type', target: '#username', value: 'a'.repeat(255) + '@example.com', description: 'Input username 255 karakter' },
      { action: 'Type', target: '#password', value: 'ValidPassword123', description: 'Input password valid' },
      { action: 'Click', target: '#login-button', description: 'Klik tombol login' },
      { action: 'Verify', target: '.dashboard-header', description: 'Verifikasi berhasil login' },
    ],
    expectedOutcome: 'Sistem dapat memproses username dengan panjang maksimal dan login berhasil.',
    createdBy: 'Ahmad R.',
    createdAt: '2024-11-11 09:00:00',
    lastModified: '2024-11-17 10:15:00',
  },
  'TC-2001': {
    id: 'TC-2001',
    title: 'Tambah produk ke keranjang',
    suite: 'E-Commerce',
    priority: 'High',
    caseType: 'Positive',
    automation: 'Automated',
    lastStatus: 'failed',
    pageLoadAvg: '2.1s',
    lastRun: '30 menit lalu',
    description: 'Memverifikasi bahwa user dapat menambahkan produk ke keranjang belanja',
    steps: [
      { action: 'Navigate', target: 'https://app.example.com/products', description: 'Buka halaman produk' },
      { action: 'Wait', target: '2000', description: 'Tunggu produk dimuat' },
      { action: 'Click', target: '.product-card:first-child', description: 'Pilih produk pertama' },
      { action: 'Verify', target: '.product-detail', description: 'Verifikasi halaman detail produk muncul' },
      { action: 'Click', target: '#add-to-cart', description: 'Klik tombol tambah ke keranjang' },
      { action: 'Wait', target: '1000', description: 'Tunggu animasi' },
      { action: 'Verify', target: '.cart-badge', description: 'Verifikasi badge keranjang bertambah' },
      { action: 'Assert Text', target: '.cart-badge', value: '1', description: 'Verifikasi jumlah item = 1' },
    ],
    expectedOutcome: 'Produk berhasil ditambahkan ke keranjang. Badge keranjang menampilkan jumlah item yang benar.',
    createdBy: 'Sarah K.',
    createdAt: '2024-11-12 10:00:00',
    lastModified: '2024-11-22 16:20:00',
  },
  'TC-2002': {
    id: 'TC-2002',
    title: 'Update kuantitas produk di keranjang',
    suite: 'E-Commerce',
    priority: 'Medium',
    caseType: 'Positive',
    automation: 'Automated',
    lastStatus: 'passed',
    pageLoadAvg: '1.5s',
    lastRun: '30 menit lalu',
    description: 'Memverifikasi bahwa user dapat mengubah kuantitas produk di keranjang',
    steps: [
      { action: 'Navigate', target: 'https://app.example.com/cart', description: 'Buka halaman keranjang (asumsi ada 1 item)' },
      { action: 'Click', target: '.quantity-increase', description: 'Klik tombol tambah kuantitas' },
      { action: 'Wait', target: '500', description: 'Tunggu update' },
      { action: 'Assert Text', target: '.quantity-value', value: '2', description: 'Verifikasi kuantitas menjadi 2' },
      { action: 'Verify', target: '.total-price', description: 'Verifikasi total price terupdate' },
    ],
    expectedOutcome: 'Kuantitas produk berhasil diupdate dan total harga berubah sesuai.',
    createdBy: 'Sarah K.',
    createdAt: '2024-11-12 11:30:00',
    lastModified: '2024-11-21 09:45:00',
  },
  'TC-2003': {
    id: 'TC-2003',
    title: 'Hapus produk dari keranjang',
    suite: 'E-Commerce',
    priority: 'Medium',
    caseType: 'Positive',
    automation: 'Manual',
    lastStatus: 'pending',
    pageLoadAvg: '-',
    lastRun: 'Belum dijalankan',
    description: 'Memverifikasi bahwa user dapat menghapus produk dari keranjang',
    steps: [
      { action: 'Navigate', target: 'https://app.example.com/cart', description: 'Buka halaman keranjang' },
      { action: 'Click', target: '.remove-item-button', description: 'Klik tombol hapus item' },
      { action: 'Confirm', description: 'Konfirmasi dialog penghapusan' },
      { action: 'Verify', target: '.cart-empty-message', description: 'Verifikasi pesan keranjang kosong muncul' },
    ],
    expectedOutcome: 'Produk berhasil dihapus dari keranjang dan pesan "Keranjang kosong" ditampilkan.',
    createdBy: 'Sarah K.',
    createdAt: '2024-11-13 14:00:00',
    lastModified: '2024-11-13 14:00:00',
  },
  'TC-3001': {
    id: 'TC-3001',
    title: 'Proses checkout dengan kartu kredit',
    suite: 'Payment',
    priority: 'Critical',
    caseType: 'Positive',
    automation: 'Automated',
    lastStatus: 'passed',
    pageLoadAvg: '3.2s',
    lastRun: '1 jam lalu',
    description: 'Memverifikasi bahwa user dapat menyelesaikan checkout dengan pembayaran kartu kredit',
    steps: [
      { action: 'Navigate', target: 'https://app.example.com/checkout', description: 'Buka halaman checkout' },
      { action: 'Type', target: '#card-number', value: '4111111111111111', description: 'Input nomor kartu kredit' },
      { action: 'Type', target: '#card-expiry', value: '12/25', description: 'Input tanggal expired' },
      { action: 'Type', target: '#card-cvv', value: '123', description: 'Input CVV' },
      { action: 'Type', target: '#card-name', value: 'Test User', description: 'Input nama di kartu' },
      { action: 'Click', target: '#submit-payment', description: 'Klik tombol bayar' },
      { action: 'Wait', target: '3000', description: 'Tunggu proses payment' },
      { action: 'Verify', target: '.success-message', description: 'Verifikasi pesan sukses muncul' },
      { action: 'Verify', target: 'url', value: '/order-confirmation', description: 'Verifikasi redirect ke konfirmasi order' },
    ],
    expectedOutcome: 'Payment berhasil diproses dan user diarahkan ke halaman konfirmasi order dengan detail transaksi.',
    createdBy: 'Budi S.',
    createdAt: '2024-11-14 10:30:00',
    lastModified: '2024-11-23 08:15:00',
  },
  'TC-4001': {
    id: 'TC-4001',
    title: 'Filter produk berdasarkan kategori',
    suite: 'Product Catalog',
    priority: 'Medium',
    caseType: 'Positive',
    automation: 'Automated',
    lastStatus: 'passed',
    pageLoadAvg: '1.8s',
    lastRun: '2 jam lalu',
    description: 'Memverifikasi bahwa user dapat memfilter produk berdasarkan kategori yang dipilih',
    steps: [
      { action: 'Navigate', target: 'https://app.example.com/products', description: 'Buka halaman produk' },
      { action: 'Wait', target: '2000', description: 'Tunggu produk dimuat' },
      { action: 'Click', target: '#category-electronics', description: 'Pilih kategori Electronics' },
      { action: 'Wait', target: '1500', description: 'Tunggu produk difilter' },
      { action: 'Verify', target: '.product-list', description: 'Verifikasi hanya produk elektronik yang muncul' },
      { action: 'Assert', target: '.category-filter.active', value: 'Electronics', description: 'Verifikasi filter aktif' },
    ],
    expectedOutcome: 'Halaman menampilkan hanya produk dari kategori yang dipilih. Filter aktif terlihat dengan highlight.',
    createdBy: 'Budi S.',
    createdAt: '2024-11-15 11:30:00',
    lastModified: '2024-11-23 09:15:00',
  },
};

// Summary list for table display
export const TEST_CASES_LIST: TestCaseSummary[] = [
  {
    id: 'TC-1001',
    title: 'Login dengan kredensial valid',
    suite: 'Authentication',
    priority: 'High',
    caseType: 'Positive',
    automation: 'Automated',
    lastStatus: 'passed',
    pageLoadAvg: '1.2s',
    lastRun: '5 menit lalu'
  },
  {
    id: 'TC-1002',
    title: 'Login dengan password salah',
    suite: 'Authentication',
    priority: 'High',
    caseType: 'Negative',
    automation: 'Automated',
    lastStatus: 'passed',
    pageLoadAvg: '0.9s',
    lastRun: '5 menit lalu'
  },
  {
    id: 'TC-1003',
    title: 'Logout dari dashboard',
    suite: 'Authentication',
    priority: 'Medium',
    caseType: 'Positive',
    automation: 'Automated',
    lastStatus: 'passed',
    pageLoadAvg: '0.7s',
    lastRun: '5 menit lalu'
  },
  {
    id: 'TC-1004',
    title: 'Login dengan username 255 karakter (max length)',
    suite: 'Authentication',
    priority: 'Low',
    caseType: 'Edge',
    automation: 'Automated',
    lastStatus: 'passed',
    pageLoadAvg: '1.1s',
    lastRun: '1 jam lalu'
  },
  {
    id: 'TC-2001',
    title: 'Tambah produk ke keranjang',
    suite: 'E-Commerce',
    priority: 'High',
    caseType: 'Positive',
    automation: 'Automated',
    lastStatus: 'failed',
    pageLoadAvg: '2.1s',
    lastRun: '30 menit lalu'
  },
  {
    id: 'TC-2002',
    title: 'Update kuantitas produk di keranjang',
    suite: 'E-Commerce',
    priority: 'Medium',
    caseType: 'Positive',
    automation: 'Automated',
    lastStatus: 'passed',
    pageLoadAvg: '1.5s',
    lastRun: '30 menit lalu'
  },
  {
    id: 'TC-2003',
    title: 'Hapus produk dari keranjang',
    suite: 'E-Commerce',
    priority: 'Medium',
    caseType: 'Positive',
    automation: 'Manual',
    lastStatus: 'pending',
    pageLoadAvg: '-',
    lastRun: 'Belum dijalankan'
  },
  {
    id: 'TC-2004',
    title: 'Tambah 9999 produk ke keranjang (max quantity)',
    suite: 'E-Commerce',
    priority: 'Medium',
    caseType: 'Edge',
    automation: 'Automated',
    lastStatus: 'passed',
    pageLoadAvg: '2.3s',
    lastRun: '1 jam lalu'
  },
  {
    id: 'TC-2005',
    title: 'Checkout dengan keranjang kosong',
    suite: 'E-Commerce',
    priority: 'Medium',
    caseType: 'Edge',
    automation: 'Automated',
    lastStatus: 'passed',
    pageLoadAvg: '0.8s',
    lastRun: '2 jam lalu'
  },
  {
    id: 'TC-3001',
    title: 'Proses checkout dengan kartu kredit',
    suite: 'Payment',
    priority: 'Critical',
    caseType: 'Positive',
    automation: 'Automated',
    lastStatus: 'passed',
    pageLoadAvg: '3.2s',
    lastRun: '1 jam lalu'
  },
  {
    id: 'TC-3002',
    title: 'Proses checkout dengan transfer bank',
    suite: 'Payment',
    priority: 'High',
    caseType: 'Positive',
    automation: 'Manual',
    lastStatus: 'pending',
    pageLoadAvg: '-',
    lastRun: 'Belum dijalankan'
  },
  {
    id: 'TC-4001',
    title: 'Filter produk berdasarkan kategori',
    suite: 'Product Catalog',
    priority: 'Medium',
    caseType: 'Positive',
    automation: 'Automated',
    lastStatus: 'passed',
    pageLoadAvg: '1.8s',
    lastRun: '2 jam lalu'
  },
  {
    id: 'TC-4002',
    title: 'Pencarian produk dengan keyword',
    suite: 'Product Catalog',
    priority: 'High',
    caseType: 'Positive',
    automation: 'Automated',
    lastStatus: 'passed',
    pageLoadAvg: '1.4s',
    lastRun: '2 jam lalu'
  },
  {
    id: 'TC-4003',
    title: 'Pencarian dengan special characters (!@#$%)',
    suite: 'Product Catalog',
    priority: 'Low',
    caseType: 'Edge',
    automation: 'Automated',
    lastStatus: 'passed',
    pageLoadAvg: '1.3s',
    lastRun: '3 jam lalu'
  },
  {
    id: 'TC-5001',
    title: 'Upload foto profil dengan ukuran 10MB (max size)',
    suite: 'User Profile',
    priority: 'Medium',
    caseType: 'Edge',
    automation: 'Manual',
    lastStatus: 'pending',
    pageLoadAvg: '-',
    lastRun: 'Belum dijalankan'
  },
];

// Helper function to get full test case detail by ID
export function getTestCaseDetail(id: string): TestCaseDetail | undefined {
  return TEST_CASE_DETAILS[id];
}

// Helper function to enrich summary data with full details
export function enrichTestCase(summary: TestCaseSummary): TestCaseDetail {
  const details = TEST_CASE_DETAILS[summary.id];
  if (details) {
    return details;
  }
  // If no details found, return summary with default values
  return {
    ...summary,
    description: 'No description available',
    steps: [],
    expectedOutcome: 'No expected outcome defined',
    createdBy: 'Unknown',
    createdAt: '-',
    lastModified: '-',
  };
}
