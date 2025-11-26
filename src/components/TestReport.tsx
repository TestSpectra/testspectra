import { useState } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, Clock, AlertTriangle, Download, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';

interface TestReportProps {
  report: any;
  onBack: () => void;
}

export function TestReport({ report, onBack }: TestReportProps) {
  const [activeTab, setActiveTab] = useState('functional');
  const [logSearch, setLogSearch] = useState('');

  // Mock data
  const mockLogs = [
    { timestamp: '14:23:01.234', level: 'INFO', message: '[WDIO] Session initialized with Chrome 120' },
    { timestamp: '14:23:02.123', level: 'INFO', message: '[WDIO] Navigating to https://example.com/login' },
    { timestamp: '14:23:03.456', level: 'SUCCESS', message: '[WDIO] Page loaded successfully' },
    { timestamp: '14:23:04.789', level: 'INFO', message: '[WDIO] Entering username: test@example.com' },
    { timestamp: '14:23:05.234', level: 'INFO', message: '[WDIO] Entering password: ********' },
    { timestamp: '14:23:06.123', level: 'INFO', message: '[WDIO] Clicking login button' },
    { timestamp: '14:23:08.456', level: 'SUCCESS', message: '[WDIO] Login successful, redirected to dashboard' },
    { timestamp: '14:23:09.789', level: 'INFO', message: '[k6] Measuring Core Web Vitals...' },
    { timestamp: '14:23:10.234', level: 'SUCCESS', message: '[k6] LCP: 1.2s (Good)' },
    { timestamp: '14:23:10.567', level: 'SUCCESS', message: '[k6] FCP: 0.8s (Good)' },
    { timestamp: '14:23:10.890', level: 'SUCCESS', message: '[k6] TTI: 2.1s (Good)' },
    { timestamp: '14:23:11.123', level: 'INFO', message: '[Lighthouse] Running audit...' },
    { timestamp: '14:23:15.456', level: 'SUCCESS', message: '[Lighthouse] Performance Score: 92' },
    { timestamp: '14:23:15.789', level: 'SUCCESS', message: '[Lighthouse] Accessibility Score: 95' },
    { timestamp: '14:23:16.012', level: 'SUCCESS', message: '[WDIO] Test completed successfully' },
  ];

  const mockNetworkResources = [
    { url: 'https://example.com/login', type: 'Document', status: 200, size: '24.5 KB', loadTime: '234ms' },
    { url: 'https://example.com/css/main.css', type: 'CSS', status: 200, size: '48.2 KB', loadTime: '123ms' },
    { url: 'https://example.com/js/app.js', type: 'JS', status: 200, size: '156.7 KB', loadTime: '345ms' },
    { url: 'https://example.com/js/vendor.js', type: 'JS', status: 200, size: '234.1 KB', loadTime: '456ms' },
    { url: 'https://cdn.example.com/logo.png', type: 'Image', status: 200, size: '12.3 KB', loadTime: '89ms' },
    { url: 'https://cdn.example.com/hero.jpg', type: 'Image', status: 200, size: '89.4 KB', loadTime: '178ms' },
    { url: 'https://api.example.com/user/profile', type: 'XHR', status: 200, size: '2.1 KB', loadTime: '267ms' },
    { url: 'https://fonts.googleapis.com/css2', type: 'CSS', status: 200, size: '15.6 KB', loadTime: '145ms' },
  ];

  const filteredLogs = mockLogs.filter(log => 
    log.message.toLowerCase().includes(logSearch.toLowerCase()) ||
    log.level.toLowerCase().includes(logSearch.toLowerCase())
  );

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-400';
      case 'SUCCESS': return 'text-green-400';
      case 'WARNING': return 'text-orange-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-400';
    if (status >= 300 && status < 400) return 'text-blue-400';
    if (status >= 400 && status < 500) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="p-8 bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1>Test Execution Report</h1>
              <Badge variant="outline" className={`${
                report.status === 'passed' 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border-red-500/30'
              } border`}>
                {report.status === 'passed' ? 'PASSED' : 'FAILED'}
              </Badge>
            </div>
            <p className="text-slate-400">{report.suite} - {report.testCase || report.id}</p>
          </div>
        </div>
        <Button variant="outline" className="border-slate-600 bg-transparent text-slate-100 hover:bg-slate-800 hover:text-white">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            {report.status === 'passed' ? (
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400" />
            )}
            <span className="text-sm text-slate-400">Status</span>
          </div>
          <p className={`${report.status === 'passed' ? 'text-green-400' : 'text-red-400'}`}>
            {report.status === 'passed' ? 'Test Passed' : 'Test Failed'}
          </p>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-blue-400" />
            <span className="text-sm text-slate-400">Duration</span>
          </div>
          <p className="text-slate-200">{report.duration || '2m 34s'}</p>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <span className="text-sm text-slate-400">Passed Steps</span>
          </div>
          <p className="text-slate-200">{report.passed || 15} / 15</p>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="w-6 h-6 text-red-400" />
            <span className="text-sm text-slate-400">Failed Steps</span>
          </div>
          <p className="text-slate-200">{report.failed || 0} / 15</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="functional" className="data-[state=active]:bg-slate-800">
            Functional & Logs
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-slate-800">
            Performance & Quality Metrics
          </TabsTrigger>
          <TabsTrigger value="network" className="data-[state=active]:bg-slate-800">
            Network Resources
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Functional & Logs */}
        <TabsContent value="functional" className="space-y-6">
          {/* Log Viewer */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="mb-1">Execution Logs</h2>
                <p className="text-sm text-slate-400">Detail langkah eksekusi test</p>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 max-h-96 overflow-y-auto font-mono text-sm">
              {filteredLogs.map((log, index) => (
                <div key={index} className="flex gap-4 py-1 hover:bg-slate-900/50">
                  <span className="text-slate-500 text-xs">{log.timestamp}</span>
                  <span className={`${getLevelColor(log.level)} w-20 text-xs`}>{log.level}</span>
                  <span className="text-slate-300 flex-1">{log.message}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Failure Context (if failed) */}
          {report.status === 'failed' && (
            <div className="bg-slate-900 rounded-xl border border-red-800/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <h2 className="text-red-400">Failure Context</h2>
              </div>
              <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 mb-4">
                <p className="text-sm text-slate-300 mb-2">Error Message:</p>
                <p className="text-sm text-red-400 font-mono">
                  AssertionError: Expected element to be visible, but it was not found
                </p>
              </div>
              <div className="bg-slate-950 rounded-lg border border-slate-800 p-4">
                <p className="text-sm text-slate-300 mb-3">Screenshot at Failure:</p>
                <div className="bg-slate-800 rounded-lg h-64 flex items-center justify-center">
                  <p className="text-slate-500">Screenshot placeholder</p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Performance & Quality Metrics */}
        <TabsContent value="performance" className="space-y-6">
          {/* Core Web Vitals */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <div className="mb-6">
              <h2 className="mb-1">Core Web Vitals</h2>
              <p className="text-sm text-slate-400">Metrik performa web kunci</p>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-slate-800/50 rounded-lg p-6 border border-green-500/30">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-slate-400">LCP</span>
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 border">
                    Good
                  </Badge>
                </div>
                <p className="text-green-400 mb-1">1.2s</p>
                <p className="text-xs text-slate-500">Largest Contentful Paint</p>
                <div className="mt-4 bg-slate-900 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-6 border border-green-500/30">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-slate-400">FCP</span>
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 border">
                    Good
                  </Badge>
                </div>
                <p className="text-green-400 mb-1">0.8s</p>
                <p className="text-xs text-slate-500">First Contentful Paint</p>
                <div className="mt-4 bg-slate-900 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-6 border border-green-500/30">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-slate-400">TTI</span>
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 border">
                    Good
                  </Badge>
                </div>
                <p className="text-green-400 mb-1">2.1s</p>
                <p className="text-xs text-slate-500">Time to Interactive</p>
                <div className="mt-4 bg-slate-900 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Lighthouse Scores */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <div className="mb-6">
              <h2 className="mb-1">Lighthouse Audit Score</h2>
              <p className="text-sm text-slate-400">Analisis kualitas website komprehensif</p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Score Gauges */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Performance', score: 92, color: 'green' },
                  { label: 'Accessibility', score: 95, color: 'green' },
                  { label: 'Best Practices', score: 88, color: 'green' },
                  { label: 'SEO', score: 100, color: 'green' },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <div className="relative w-24 h-24 mx-auto mb-3">
                      <svg className="w-24 h-24 -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="#334155"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="#10b981"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${item.score * 2.51} 251`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-green-400">{item.score}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* Additional Metrics */}
              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Total Blocking Time</span>
                    <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 border text-xs">
                      Good
                    </Badge>
                  </div>
                  <p className="text-slate-200">150ms</p>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Speed Index</span>
                    <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 border text-xs">
                      Good
                    </Badge>
                  </div>
                  <p className="text-slate-200">1.8s</p>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Cumulative Layout Shift</span>
                    <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 border text-xs">
                      Good
                    </Badge>
                  </div>
                  <p className="text-slate-200">0.05</p>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">First Input Delay</span>
                    <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 border text-xs">
                      Good
                    </Badge>
                  </div>
                  <p className="text-slate-200">12ms</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Network Resources */}
        <TabsContent value="network" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-sm text-slate-400">Total Requests</span>
              </div>
              <p className="text-slate-200">{mockNetworkResources.length}</p>
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <Download className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-sm text-slate-400">Total Transfer Size</span>
              </div>
              <p className="text-slate-200">582.9 KB</p>
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-sm text-slate-400">Average Load Time</span>
              </div>
              <p className="text-slate-200">229ms</p>
            </div>
          </div>

          {/* Waterfall Chart */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <div className="mb-6">
              <h2 className="mb-1">Network Waterfall</h2>
              <p className="text-sm text-slate-400">Timeline pemuatan resource</p>
            </div>
            <div className="space-y-2">
              {mockNetworkResources.map((resource, index) => {
                const delay = index * 50;
                const duration = parseInt(resource.loadTime);
                const maxTime = 500;
                const startPercent = (delay / maxTime) * 100;
                const widthPercent = (duration / maxTime) * 100;
                
                return (
                  <div key={index} className="flex items-center gap-4">
                    <span className="text-xs text-slate-500 w-12">{delay}ms</span>
                    <div className="flex-1 bg-slate-800 rounded h-6 relative">
                      <div 
                        className="absolute h-6 bg-blue-500 rounded"
                        style={{ 
                          left: `${startPercent}%`,
                          width: `${widthPercent}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-400 w-20">{resource.loadTime}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resources Table */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h2 className="mb-1">Network Resources Detail</h2>
              <p className="text-sm text-slate-400">Detail setiap request jaringan</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/50">
                    <th className="text-left px-6 py-4 text-sm text-slate-400">URL</th>
                    <th className="text-center px-6 py-4 text-sm text-slate-400">Type</th>
                    <th className="text-center px-6 py-4 text-sm text-slate-400">Status</th>
                    <th className="text-right px-6 py-4 text-sm text-slate-400">Size</th>
                    <th className="text-right px-6 py-4 text-sm text-slate-400">Load Time</th>
                  </tr>
                </thead>
                <tbody>
                  {mockNetworkResources.map((resource, index) => (
                    <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-300 truncate max-w-md">{resource.url}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="outline" className={`${
                          resource.type === 'Document' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                          resource.type === 'CSS' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                          resource.type === 'JS' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          resource.type === 'Image' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                        } border text-xs`}>
                          {resource.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-sm ${getStatusColor(resource.status)}`}>
                          {resource.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-slate-300">{resource.size}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-slate-300">{resource.loadTime}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}