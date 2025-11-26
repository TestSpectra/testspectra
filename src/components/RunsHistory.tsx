import { useState } from 'react';
import { Search, Eye, CheckCircle2, XCircle, Clock, Monitor, User, Calendar, X } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface RunsHistoryProps {
  onViewReport: (report: any) => void;
  filterTestCaseId?: string | null;
}

export function RunsHistory({ onViewReport, filterTestCaseId }: RunsHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTestCase, setFilterTestCase] = useState(filterTestCaseId || 'all');
  const [filterExecutor, setFilterExecutor] = useState('all');

  // Mock runs history data
  const runsHistory = [
    {
      id: 'RUN-154',
      testCaseId: 'TC-1001',
      testCaseTitle: 'Login dengan kredensial valid',
      suite: 'Authentication',
      executor: 'Ahmad Rahman',
      device: 'Chrome 120 - Windows 11',
      status: 'passed',
      duration: '45s',
      timestamp: '5 menit lalu',
      timestampFull: '2025-11-25 14:30:00',
      passed: 8,
      failed: 0
    },
    {
      id: 'RUN-153',
      testCaseId: 'TC-1002',
      testCaseTitle: 'Login dengan password salah',
      suite: 'Authentication',
      executor: 'Ahmad Rahman',
      device: 'Chrome 120 - Windows 11',
      status: 'passed',
      duration: '32s',
      timestamp: '5 menit lalu',
      timestampFull: '2025-11-25 14:29:15',
      passed: 6,
      failed: 0
    },
    {
      id: 'RUN-152',
      testCaseId: 'TC-1003',
      testCaseTitle: 'Logout dari dashboard',
      suite: 'Authentication',
      executor: 'Ahmad Rahman',
      device: 'Chrome 120 - Windows 11',
      status: 'passed',
      duration: '28s',
      timestamp: '6 menit lalu',
      timestampFull: '2025-11-25 14:28:00',
      passed: 5,
      failed: 0
    },
    {
      id: 'RUN-151',
      testCaseId: 'TC-2001',
      testCaseTitle: 'Tambah produk ke keranjang',
      suite: 'E-Commerce',
      executor: 'Sarah Kusuma',
      device: 'Firefox 119 - Ubuntu 22.04',
      status: 'failed',
      duration: '1m 12s',
      timestamp: '30 menit lalu',
      timestampFull: '2025-11-25 14:05:00',
      passed: 7,
      failed: 2
    },
    {
      id: 'RUN-150',
      testCaseId: 'TC-2002',
      testCaseTitle: 'Update kuantitas produk di keranjang',
      suite: 'E-Commerce',
      executor: 'Sarah Kusuma',
      device: 'Firefox 119 - Ubuntu 22.04',
      status: 'passed',
      duration: '52s',
      timestamp: '31 menit lalu',
      timestampFull: '2025-11-25 14:04:00',
      passed: 9,
      failed: 0
    },
    {
      id: 'RUN-149',
      testCaseId: 'TC-3001',
      testCaseTitle: 'Proses checkout dengan kartu kredit',
      suite: 'Payment',
      executor: 'Budi Santoso',
      device: 'Edge 120 - Windows 11',
      status: 'passed',
      duration: '2m 15s',
      timestamp: '1 jam lalu',
      timestampFull: '2025-11-25 13:35:00',
      passed: 12,
      failed: 0
    },
    {
      id: 'RUN-148',
      testCaseId: 'TC-1001',
      testCaseTitle: 'Login dengan kredensial valid',
      suite: 'Authentication',
      executor: 'Ahmad Rahman',
      device: 'Safari 17 - macOS Sonoma',
      status: 'passed',
      duration: '48s',
      timestamp: '1 jam lalu',
      timestampFull: '2025-11-25 13:30:00',
      passed: 8,
      failed: 0
    },
    {
      id: 'RUN-147',
      testCaseId: 'TC-4001',
      testCaseTitle: 'Filter produk berdasarkan kategori',
      suite: 'Product Catalog',
      executor: 'Dewi Lestari',
      device: 'Chrome 120 - macOS Sonoma',
      status: 'passed',
      duration: '1m 5s',
      timestamp: '2 jam lalu',
      timestampFull: '2025-11-25 12:35:00',
      passed: 10,
      failed: 0
    },
    {
      id: 'RUN-146',
      testCaseId: 'TC-4002',
      testCaseTitle: 'Pencarian produk dengan keyword',
      suite: 'Product Catalog',
      executor: 'Dewi Lestari',
      device: 'Chrome 120 - macOS Sonoma',
      status: 'passed',
      duration: '58s',
      timestamp: '2 jam lalu',
      timestampFull: '2025-11-25 12:34:00',
      passed: 9,
      failed: 0
    },
    {
      id: 'RUN-145',
      testCaseId: 'TC-2001',
      testCaseTitle: 'Tambah produk ke keranjang',
      suite: 'E-Commerce',
      executor: 'Ahmad Rahman',
      device: 'Chrome 120 - Windows 11',
      status: 'failed',
      duration: '1m 18s',
      timestamp: '3 jam lalu',
      timestampFull: '2025-11-25 11:35:00',
      passed: 6,
      failed: 3
    },
  ];

  const filteredRuns = runsHistory.filter(run => {
    const matchesSearch = run.testCaseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         run.testCaseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         run.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || run.status === filterStatus;
    const matchesTestCase = filterTestCase === 'all' || run.testCaseId === filterTestCase;
    const matchesExecutor = filterExecutor === 'all' || run.executor === filterExecutor;
    
    return matchesSearch && matchesStatus && matchesTestCase && matchesExecutor;
  });

  const testCases = Array.from(new Set(runsHistory.map(run => run.testCaseId + '|' + run.testCaseTitle)))
    .map(tc => {
      const [id, title] = tc.split('|');
      return { id, title };
    });
  
  const executors = Array.from(new Set(runsHistory.map(run => run.executor)));

  const activeFilteredTestCase = filterTestCaseId 
    ? testCases.find(tc => tc.id === filterTestCaseId)
    : null;

  return (
    <div className="p-8 bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="mb-2">Runs History</h1>
          <p className="text-slate-400">Riwayat eksekusi semua test runs</p>
          {activeFilteredTestCase && (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg">
              <span className="text-sm text-blue-400">
                Filter: {activeFilteredTestCase.id} - {activeFilteredTestCase.title}
              </span>
              <button 
                onClick={() => setFilterTestCase('all')}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-slate-700 text-slate-300 px-4 py-2">
            Total: {runsHistory.length} runs
          </Badge>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
        <div className="grid grid-cols-4 gap-4">
          {/* Search */}
          <div className="col-span-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari run ID atau test case..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Test Case Filter */}
          <div>
            <select
              value={filterTestCase}
              onChange={(e) => setFilterTestCase(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Test Case</option>
              {testCases.map(tc => (
                <option key={tc.id} value={tc.id}>{tc.id} - {tc.title}</option>
              ))}
            </select>
          </div>

          {/* Executor Filter */}
          <div>
            <select
              value={filterExecutor}
              onChange={(e) => setFilterExecutor(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Executor</option>
              {executors.map(executor => (
                <option key={executor} value={executor}>{executor}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Status</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-slate-400">
          Menampilkan {filteredRuns.length} dari {runsHistory.length} runs
        </p>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Passed</p>
              <p className="text-green-400">{runsHistory.filter(r => r.status === 'passed').length}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-500/65" />
          </div>
        </div>
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Failed</p>
              <p className="text-red-400">{runsHistory.filter(r => r.status === 'failed').length}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500/65" />
          </div>
        </div>
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Pass Rate</p>
              <p className="text-blue-400">
                {((runsHistory.filter(r => r.status === 'passed').length / runsHistory.length) * 100).toFixed(1)}%
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-blue-500/65" />
          </div>
        </div>
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Executors</p>
              <p className="text-purple-400">{executors.length}</p>
            </div>
            <User className="w-8 h-8 text-purple-500/65" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                <th className="text-left px-6 py-4 text-sm text-slate-400">Run ID</th>
                <th className="text-left px-6 py-4 text-sm text-slate-400">Test Case</th>
                <th className="text-left px-6 py-4 text-sm text-slate-400">Executor</th>
                <th className="text-left px-6 py-4 text-sm text-slate-400">Device / Platform</th>
                <th className="text-center px-6 py-4 text-sm text-slate-400">Status</th>
                <th className="text-center px-6 py-4 text-sm text-slate-400">Duration</th>
                <th className="text-left px-6 py-4 text-sm text-slate-400">Executed At</th>
                <th className="text-center px-6 py-4 text-sm text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRuns.map((run) => (
                <tr key={run.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm text-blue-400">{run.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">{run.testCaseId}</p>
                      <p className="text-sm text-slate-200">{run.testCaseTitle}</p>
                      <p className="text-xs text-slate-500 mt-1">{run.suite}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="text-sm text-slate-300">{run.executor}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-300">{run.device}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {run.status === 'passed' && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-400">Passed</span>
                      </div>
                    )}
                    {run.status === 'failed' && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-lg">
                        <XCircle className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-red-400">Failed</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-300">{run.duration}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-300">{run.timestamp}</p>
                        <p className="text-xs text-slate-500">{run.timestampFull}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => onViewReport({
                          id: run.id,
                          suite: run.suite,
                          testCase: run.testCaseTitle,
                          status: run.status,
                          duration: run.duration,
                          timestamp: run.timestamp,
                          executor: run.executor,
                          device: run.device,
                          passed: run.passed,
                          failed: run.failed
                        })}
                        className="p-2 text-slate-400 hover:text-teal-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="View Report"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}