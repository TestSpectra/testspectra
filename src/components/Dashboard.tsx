import {
  CheckCircle2,
  Clock,
  FileCheck,
  PlayCircle,
  TrendingUp,
  XCircle,
  Zap
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { testCaseService } from "../services/test-case-service";
import { getTimeAgo } from "../lib/utils";
import { StatCard } from "./StatCard";

interface DashboardProps {
  onNavigateToTestCases: () => void;
  onViewReport: (report: any) => void;
  onNavigateToRunsHistory: () => void;
  onViewTestCaseDetail: (testCaseId: string) => void;
}

export function Dashboard({
  onNavigateToTestCases,
  onViewReport,
  onNavigateToRunsHistory,
  onViewTestCaseDetail,
}: DashboardProps) {
  // Mock data for trend visualization - last 7 runs with calculated metrics
  const trendData = [
    { name: "Run #148", passed: 88, failed: 2, total: 90, passRate: 97.8 },
    { name: "Run #149", passed: 84, failed: 6, total: 90, passRate: 93.3 },
    { name: "Run #150", passed: 89, failed: 1, total: 90, passRate: 98.9 },
    { name: "Run #151", passed: 86, failed: 4, total: 90, passRate: 95.6 },
    { name: "Run #152", passed: 90, failed: 0, total: 90, passRate: 100 },
    { name: "Run #153", passed: 87, failed: 3, total: 90, passRate: 96.7 },
    { name: "Run #154", passed: 89, failed: 1, total: 90, passRate: 98.9 },
  ];

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-xl">
          <p className="text-slate-300 mb-3">{label}</p>
          
          {/* Pass Rate with icon */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Pass Rate</p>
              <p className="text-blue-400">{data.passRate.toFixed(1)}%</p>
            </div>
          </div>

          <div className="border-t border-slate-700 my-2 pt-2 space-y-2">
            {/* Passed */}
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-xs text-slate-400">Passed:</span>
              <span className="text-green-400">{data.passed}</span>
            </div>
            
            {/* Failed */}
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-slate-400">Failed:</span>
              <span className="text-red-400">{data.failed}</span>
            </div>

            {/* Total */}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-600 rounded flex items-center justify-center text-[10px] text-slate-300">Σ</div>
              <span className="text-xs text-slate-400">Total:</span>
              <span className="text-slate-300">{data.total}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // State for recent test cases
  const [recentTestCases, setRecentTestCases] = useState<any[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);

  // Fetch recent test cases
  useEffect(() => {
    const fetchRecentTestCases = async () => {
      try {
        const response = await testCaseService.listTestCases({
          page: 1,
          pageSize: 5,
        });
        setRecentTestCases(response.testCases);
      } catch (error) {
        console.error("Failed to fetch recent test cases:", error);
      } finally {
        setIsLoadingRecent(false);
      }
    };

    fetchRecentTestCases();
  }, []);

  // Format time ago
  // Removed local getTimeAgo implementation in favor of shared utility


  const recentRuns = [
    {
      id: "RUN-154",
      suite: "E2E Authentication",
      status: "passed",
      passed: 89,
      failed: 1,
      time: "5 menit lalu",
    },
    {
      id: "RUN-153",
      suite: "Checkout Flow",
      status: "passed",
      passed: 87,
      failed: 3,
      time: "30 menit lalu",
    },
    {
      id: "RUN-152",
      suite: "Product Catalog",
      status: "passed",
      passed: 90,
      failed: 0,
      time: "1 jam lalu",
    },
    {
      id: "RUN-151",
      suite: "User Dashboard",
      status: "failed",
      passed: 86,
      failed: 4,
      time: "2 jam lalu",
    },
  ];

  return (
    <div className="p-8 bg-slate-950">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2">TCM Dashboard</h1>
        <p className="text-slate-400">
          Ringkasan eksekusi dan manajemen test case
        </p>
      </div>

      {/* Key Statistics Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Test Cases"
          value="1,247"
          icon={FileCheck}
          color="blue"
          trend="+12 bulan ini"
          onClick={onNavigateToTestCases}
        />
        <StatCard
          title="Test Cases Otomatis"
          value="892"
          icon={Zap}
          color="purple"
          trend="71.5% dari total"
        />
        <StatCard
          title="Total Test Runs"
          value="154"
          icon={PlayCircle}
          color="cyan"
          trend="+8 minggu ini"
        />
        <StatCard
          title="Pass Rate Global"
          value="97.2%"
          icon={TrendingUp}
          color="green"
          trend="+2.1% vs bulan lalu"
        />
      </div>

      {/* Trend Visualization */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="mb-1">
              Tren Pass/Fail - 7 Test Run Terakhir
            </h2>
            <p className="text-sm text-slate-400">
              Visualisasi performa eksekusi test dengan pass rate trend
            </p>
          </div>
          {/* Summary Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-slate-400">Avg Passed:</span>
              <span className="text-green-400">87.6</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-slate-400">Avg Failed:</span>
              <span className="text-red-400">2.4</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-slate-400">Avg Rate:</span>
              <span className="text-blue-400">97.3%</span>
            </div>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {/* Gradient for Passed Area */}
              <linearGradient id="passedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
              
              {/* Gradient for Failed Area */}
              <linearGradient id="failedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
              </linearGradient>

              {/* Gradient for Pass Rate Line */}
              <linearGradient id="passRateGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.8} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            
            <XAxis 
              dataKey="name" 
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={{ stroke: '#475569' }}
            />
            
            {/* Left Y-Axis for Test Counts */}
            <YAxis 
              yAxisId="left"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={{ stroke: '#475569' }}
              label={{ value: 'Test Count', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
            />
            
            {/* Right Y-Axis for Pass Rate */}
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={{ stroke: '#475569' }}
              domain={[90, 100]}
              label={{ value: 'Pass Rate %', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 12 }}
            />
            
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b', opacity: 0.5 }} />
            
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            
            {/* Area Charts for Passed/Failed */}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="passed"
              name="Passed"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#passedGradient)"
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#064e3b' }}
            />
            
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="failed"
              name="Failed"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#failedGradient)"
              activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2, fill: '#7f1d1d' }}
            />

            {/* Pass Rate Line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="passRate"
              name="Pass Rate %"
              stroke="url(#passRateGradient)"
              strokeWidth={3}
              dot={{ r: 4, fill: '#3b82f6', stroke: '#1e40af', strokeWidth: 2 }}
              activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 3, fill: '#1e3a8a' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Activity Section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Test Cases */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="mb-1">Test Case Terbaru</h2>
              <p className="text-sm text-slate-400">
                Baru dibuat atau diupdate
              </p>
            </div>
            <button
              onClick={onNavigateToTestCases}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Lihat Semua →
            </button>
          </div>
          <div className="space-y-4">
            {isLoadingRecent ? (
              <div className="text-center text-slate-400 py-4">Loading...</div>
            ) : recentTestCases.length === 0 ? (
              <div className="text-center text-slate-400 py-4">No test cases yet</div>
            ) : (
              recentTestCases.map((tc) => (
                <div
                  key={tc.id}
                  className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  onClick={() => onViewTestCaseDetail(tc.id)}
                >
                  <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center shrink-0">
                    <FileCheck className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-slate-400">
                        {tc.id}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                        {tc.suite}
                      </span>
                    </div>
                    <p className="text-sm text-slate-200 mb-1 truncate">
                      {tc.title}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>oleh {tc.createdByName || "Unknown"}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeAgo(tc.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Test Runs */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="mb-1">Status Run Terbaru</h2>
              <p className="text-sm text-slate-400">
                Eksekusi test terkini
              </p>
            </div>
            <button
              onClick={onNavigateToRunsHistory}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Lihat Semua →
            </button>
          </div>
          <div className="space-y-4">
            {recentRuns.map((run) => (
              <div
                key={run.id}
                className="p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                onClick={() =>
                  onViewReport({
                    id: run.id,
                    suite: run.suite,
                    status: run.status,
                    passed: run.passed,
                    failed: run.failed,
                    duration: "2m 34s",
                    timestamp: run.time,
                  })
                }
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-400">
                      {run.id}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        run.status === "passed"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {run.status === "passed"
                        ? "Passed"
                        : "Failed"}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {run.time}
                  </span>
                </div>
                <p className="text-sm text-slate-200 mb-3">
                  {run.suite}
                </p>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-slate-400">
                      {run.passed} Passed
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-slate-400">
                      {run.failed} Failed
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}