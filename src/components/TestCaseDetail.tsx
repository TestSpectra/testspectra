import { ArrowLeft, CheckCircle2, ClipboardCheck, Clock, Edit, Play, Trash2, TrendingUp, XCircle, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { testCaseService } from '../services/test-case-service';
import { reviewService } from '../services/review-service';
import { ReviewHistory } from './ReviewHistory';
import { Button } from './ui/button';
import { TestCaseHeader } from './TestCaseHeader';
import { TestCaseDisplay } from './TestCaseDisplay';
import { TestCaseMetadata } from './TestCaseMetadata';
import { toast } from 'sonner';

interface TestStep {
  id?: string;
  stepOrder: number;
  actionType: string;
  actionParams: any;
  assertions: any[];
  customExpectedResult?: string | null;
}

interface ExecutionHistory {
  id: string;
  timestamp: string;
  status: 'passed' | 'failed' | 'pending';
  duration: string;
  executor: string;
  environment: string;
  pageLoadTime?: string;
}

interface TestCase {
  id: string;
  title: string;
  suite: string;
  priority: string;
  caseType: string;
  automation: string;
  lastStatus: 'passed' | 'failed' | 'pending';
  pageLoadAvg?: string;
  lastRun?: string;
  description?: string;
  preCondition: string | null;
  postCondition: string | null;
  steps?: TestStep[];
  expectedOutcome?: string;
  tags?: string[];
  createdByName?: string;
  reviewStatus: 'pending' | 'pending_revision' | 'approved' | 'needs_revision';
  createdAt?: string;
  updatedAt?: string;
}

interface TestCaseDetailProps {
  testCaseId: string;
  onBack: () => void;
  onEdit: (testCaseId: string) => void;
  onDelete: (id: string) => void;
  onRunTest: (report: any) => void;
  onRecordManualResult?: (testCaseId: string) => void;
}

export function TestCaseDetail({ testCaseId, onBack, onEdit, onDelete, onRunTest, onRecordManualResult }: TestCaseDetailProps) {
  const [testCase, setTestCase] = useState<TestCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewRefreshTrigger, setReviewRefreshTrigger] = useState(0);
  const [isMarkingRevised, setIsMarkingRevised] = useState(false);

  useEffect(() => {
    const fetchTestCase = async () => {
      try {
        setIsLoading(true);
        const data = await testCaseService.getTestCase(testCaseId);
        setTestCase(data);
      } catch (err) {
        console.error('Failed to load test case:', err);
        setError('Failed to load test case');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestCase();
  }, [testCaseId, reviewRefreshTrigger]);

  const handleMarkAsRevised = async () => {
    try {
      setIsMarkingRevised(true);
      await reviewService.markAsRevised(testCaseId);

      toast.success('Test case marked as revised', {
        description: 'Reviewers have been notified to review again.',
      });

      // Refresh test case data to get updated reviewStatus
      setReviewRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Failed to mark as revised:', err);
      toast.error('Failed to mark as revised', {
        description: err instanceof Error ? err.message : 'An error occurred',
      });
    } finally {
      setIsMarkingRevised(false);
    }
  };



  if (isLoading) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading test case...</p>
        </div>
      </div>
    );
  }

  if (error || !testCase) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Test case not found'}</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const executionHistory: ExecutionHistory[] = [
    {
      id: 'RUN-001',
      timestamp: '2024-01-15 14:30:25',
      status: 'passed',
      duration: '45.2s',
      executor: 'John Doe',
      environment: 'Chrome 120 - Windows',
      pageLoadTime: '1.2s'
    },
    {
      id: 'RUN-002',
      timestamp: '2024-01-14 10:15:42',
      status: 'passed',
      duration: '43.8s',
      executor: 'Jane Smith',
      environment: 'Firefox 121 - macOS',
      pageLoadTime: '1.1s'
    },
    {
      id: 'RUN-003',
      timestamp: '2024-01-13 16:45:10',
      status: 'failed',
      duration: '38.5s',
      executor: 'Automated',
      environment: 'Chrome 119 - Linux',
      pageLoadTime: '2.3s'
    },
    {
      id: 'RUN-004',
      timestamp: '2024-01-12 09:20:15',
      status: 'passed',
      duration: '46.1s',
      executor: 'John Doe',
      environment: 'Edge 120 - Windows',
      pageLoadTime: '1.0s'
    },
  ];

  const performanceMetrics = {
    avgDuration: '43.4s',
    avgPageLoad: '1.2s',
    successRate: '75%',
    totalRuns: 12,
    lastWeekRuns: 4,
  };

  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="border-l border-slate-700 h-8"></div>
          <TestCaseHeader testCase={testCase} />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Show Mark as Revised button if status is needs_revision */}
          {testCase.reviewStatus === 'needs_revision' && (
            <Button
              onClick={handleMarkAsRevised}
              disabled={isMarkingRevised}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isMarkingRevised ? 'animate-spin' : ''}`} />
              {isMarkingRevised ? 'Marking...' : 'Mark as Revised'}
            </Button>
          )}

          {testCase.automation === 'Automated' ? (
            <Button
              onClick={() => onRunTest({
                id: 'RUN-' + testCase.id.split('-')[1],
                suite: testCase.suite,
                testCase: testCase.title,
                status: testCase.lastStatus,
                duration: '45s',
                timestamp: testCase.lastRun
              })}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Play className="w-4 h-4 mr-2" />
              Run Test
            </Button>
          ) : (
            <Button
              onClick={() => onRecordManualResult?.(testCase.id)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Record Test Result
            </Button>
          )}
          <Button
            onClick={() => onEdit(testCase.id)}
            variant="outline"
            className="border-blue-600/50 text-blue-400 hover:bg-blue-600/20 hover:text-white"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            onClick={() => onDelete(testCase.id)}
            variant="outline"
            className="border-red-600/50 text-red-400 hover:bg-red-600/20 hover:text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="col-span-2 space-y-6">
          <TestCaseDisplay testCase={testCase} />

          {/* Execution History */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h2 className="mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Execution History
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-4 py-3 text-xs text-slate-400">Run ID</th>
                    <th className="text-left px-4 py-3 text-xs text-slate-400">Timestamp</th>
                    <th className="text-center px-4 py-3 text-xs text-slate-400">Status</th>
                    <th className="text-center px-4 py-3 text-xs text-slate-400">Duration</th>
                    <th className="text-center px-4 py-3 text-xs text-slate-400">Page Load</th>
                    <th className="text-left px-4 py-3 text-xs text-slate-400">Executor</th>
                    <th className="text-left px-4 py-3 text-xs text-slate-400">Environment</th>
                  </tr>
                </thead>
                <tbody>
                  {executionHistory.map((run) => (
                    <tr key={run.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-blue-400">{run.id}</td>
                      <td className="px-4 py-3 text-sm text-slate-300">{run.timestamp}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center">
                          {run.status === 'passed' && (
                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded text-green-400">
                              <CheckCircle2 className="w-3 h-3" />
                              <span className="text-xs">Passed</span>
                            </div>
                          )}
                          {run.status === 'failed' && (
                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded text-red-400">
                              <XCircle className="w-3 h-3" />
                              <span className="text-xs">Failed</span>
                            </div>
                          )}
                          {run.status === 'pending' && (
                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-slate-500/20 rounded text-slate-400">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs">Pending</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-slate-300">{run.duration}</td>
                      <td className="px-4 py-3 text-sm text-center text-slate-300">{run.pageLoadTime || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-300">{run.executor}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{run.environment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Review History */}
          <ReviewHistory
            testCaseId={testCase.id}
            refreshTrigger={reviewRefreshTrigger}
            reviewStatus={testCase.reviewStatus}
          />

          {/* Last Execution Status */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h3 className="text-sm text-slate-400 mb-4">Last Execution</h3>
            <div className="space-y-4">
              <div>
                {testCase.lastStatus === 'passed' && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-green-500/20 rounded-lg border border-green-500/30">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-sm text-green-400">Passed</p>
                      <p className="text-xs text-green-400/60">{testCase.lastRun}</p>
                    </div>
                  </div>
                )}
                {testCase.lastStatus === 'failed' && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-500/20 rounded-lg border border-red-500/30">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <div>
                      <p className="text-sm text-red-400">Failed</p>
                      <p className="text-xs text-red-400/60">{testCase.lastRun}</p>
                    </div>
                  </div>
                )}
                {testCase.lastStatus === 'pending' && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-slate-500/20 rounded-lg border border-slate-500/30">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-400">Pending</p>
                      <p className="text-xs text-slate-400/60">Belum dijalankan</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="pt-3 border-t border-slate-800">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-slate-400">Page Load Time</span>
                  <span className="text-slate-200">{testCase.pageLoadAvg}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h3 className="text-sm text-slate-400 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Performance Metrics
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-400">Avg Duration</span>
                  <span className="text-sm text-blue-400">{performanceMetrics.avgDuration}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-400">Avg Page Load</span>
                  <span className="text-sm text-teal-400">{performanceMetrics.avgPageLoad}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: '70%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-400">Success Rate</span>
                  <span className="text-sm text-green-400">{performanceMetrics.successRate}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Total Runs</span>
                  <span className="text-slate-200">{performanceMetrics.totalRuns}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Last Week</span>
                  <span className="text-slate-200">{performanceMetrics.lastWeekRuns} runs</span>
                </div>
              </div>
            </div>
          </div>

          <TestCaseMetadata testCase={testCase} />
        </div>
      </div>
    </div>
  );
}