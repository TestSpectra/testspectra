import { useState, useEffect, useCallback } from 'react';
import { Eye, CheckCircle, XCircle, Clock, Search, User, Calendar, MessageSquare, Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { testCaseService, TestCaseSummary, ReviewStatus } from '../services/test-case-service';
import { reviewService, Review, ReviewStats } from '../services/review-service';
import { authService } from '../services/auth-service';
import { getTimeAgo } from '../lib/utils';
import { useWebSocket } from '../contexts/WebSocketContext';

interface TestCaseReviewQueueProps {
  onViewDetail: (testCaseId: string) => void;
  onReviewTestCase: (testCaseId: string) => void;
}

export function TestCaseReviewQueue({ onViewDetail, onReviewTestCase }: TestCaseReviewQueueProps) {
  const [testCases, setTestCases] = useState<TestCaseSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterSuite, setFilterSuite] = useState('all');

  // Stats
  const [stats, setStats] = useState<ReviewStats>({ pending: 0, approved: 0, needs_revision: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Last review cache
  const [lastReviews, setLastReviews] = useState<Record<string, Review | null>>({});
  const [loadingReviews, setLoadingReviews] = useState<Record<string, boolean>>({});

  // WebSocket for realtime updates
  const { onMessage } = useWebSocket();

  // Current user
  const canReview = authService.hasPermission('review_approve_test_cases');

  // Handle stats card click
  const handleStatsCardClick = (status: string) => {
    setFilterStatus(status);
  };

  // Fetch test cases
  const fetchTestCases = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await testCaseService.listTestCases({
        searchQuery: searchQuery || undefined,
        priorityFilter: filterPriority !== 'all' ? filterPriority : undefined,
        reviewStatusFilter: filterStatus !== 'all' ? filterStatus : undefined,
        page: 1,
        pageSize: 100, // Get more items for review queue
      });
      
      // Sort: pending first, then by oldest
      const sorted = response.testCases.sort((a, b) => {
        // Pending first
        if (a.reviewStatus === 'pending' && b.reviewStatus !== 'pending') return -1;
        if (a.reviewStatus !== 'pending' && b.reviewStatus === 'pending') return 1;
        
        // Then by oldest (updatedAt ascending)
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      });
      
      setTestCases(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch test cases');
      console.error('Failed to fetch test cases:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filterStatus, filterPriority, filterSuite]);

  useEffect(() => {
    fetchTestCases();
  }, [fetchTestCases]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      const data = await reviewService.getReviewStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch review stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Listen for WebSocket updates
  useEffect(() => {
    const unsubscribe = onMessage((message) => {
      if (message.type === 'review_stats_update') {
        // Backend sends data in 'payload' field, not 'data'
        const stats = message.payload || message.data;
        if (stats) {
          setStats(stats as ReviewStats);
        }
      }
    });

    return unsubscribe;
  }, [onMessage]);

  // Lazy load last review for a test case
  const loadLastReview = useCallback(async (testCaseId: string) => {
    // Skip if already loaded or loading
    if (lastReviews[testCaseId] !== undefined || loadingReviews[testCaseId]) {
      return;
    }

    setLoadingReviews(prev => ({ ...prev, [testCaseId]: true }));
    
    try {
      const review = await reviewService.getLastReview(testCaseId);
      setLastReviews(prev => ({ ...prev, [testCaseId]: review }));
    } catch (err) {
      console.error(`Failed to load last review for ${testCaseId}:`, err);
      setLastReviews(prev => ({ ...prev, [testCaseId]: null }));
    } finally {
      setLoadingReviews(prev => ({ ...prev, [testCaseId]: false }));
    }
  }, [lastReviews, loadingReviews]);

  // Load last reviews for visible test cases
  useEffect(() => {
    filteredQueue.forEach(tc => {
      if (tc.reviewStatus !== 'pending') {
        loadLastReview(tc.id);
      }
    });
  }, [testCases, filterStatus, filterPriority, filterSuite, searchQuery]);

  // Filter test cases
  const filteredQueue = testCases.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.createdByName && item.createdByName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || item.reviewStatus === filterStatus;
    const matchesPriority = filterPriority === 'all' || item.priority.toLowerCase() === filterPriority;
    const matchesSuite = filterSuite === 'all' || item.suite === filterSuite;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesSuite;
  });

  // Get unique suites for filter dropdown
  const uniqueSuites = Array.from(new Set(testCases.map(tc => tc.suite))).sort();

  // Use stats from API instead of filtering
  const pendingCount = stats.pending;
  const approvedCount = stats.approved;
  const rejectedCount = stats.needs_revision;

  const getPriorityColor = (priority: string) => {
    const colors: any = {
      'Critical': 'bg-red-500/20 text-red-400 border-red-500/30',
      'High': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'Medium': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Low': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    };
    return colors[priority] || colors['Medium'];
  };

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border">
            <Clock className="w-3 h-3 mr-1" />
            Pending Review
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 border">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'needs_revision':
        return (
          <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30 border">
            <XCircle className="w-3 h-3 mr-1" />
            Needs Revision
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-teal-400" />
          Test Case Review Queue
        </h1>
        <p className="text-slate-400">Review and approve test cases submitted by QA Engineers</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div 
          onClick={() => handleStatsCardClick('pending')}
          className={`bg-linear-to-br from-yellow-500/10 to-yellow-600/5 border rounded-xl p-6 cursor-pointer transition-all ${
            filterStatus === 'pending' 
              ? 'border-yellow-500/50 ring-2 ring-yellow-500/30 bg-yellow-500/15' 
              : 'border-yellow-500/20 hover:border-yellow-500/40 hover:bg-yellow-500/15'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-slate-400">Pending Review</h3>
            <Clock className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-3xl text-yellow-400">{isLoadingStats ? '-' : pendingCount}</p>
          <p className="text-xs text-slate-500 mt-1">Awaiting your review</p>
        </div>

        <div 
          onClick={() => handleStatsCardClick('approved')}
          className={`bg-linear-to-br from-green-500/10 to-green-600/5 border rounded-xl p-6 cursor-pointer transition-all ${
            filterStatus === 'approved' 
              ? 'border-green-500/50 ring-2 ring-green-500/30 bg-green-500/15' 
              : 'border-green-500/20 hover:border-green-500/40 hover:bg-green-500/15'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-slate-400">Approved</h3>
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-3xl text-green-400">{isLoadingStats ? '-' : approvedCount}</p>
          <p className="text-xs text-slate-500 mt-1">Recently approved</p>
        </div>

        <div 
          onClick={() => handleStatsCardClick('needs_revision')}
          className={`bg-linear-to-br from-red-500/10 to-red-600/5 border rounded-xl p-6 cursor-pointer transition-all ${
            filterStatus === 'needs_revision' 
              ? 'border-red-500/50 ring-2 ring-red-500/30 bg-red-500/15' 
              : 'border-red-500/20 hover:border-red-500/40 hover:bg-red-500/15'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-slate-400">Needs Revision</h3>
            <XCircle className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-3xl text-red-400">{isLoadingStats ? '-' : rejectedCount}</p>
          <p className="text-xs text-slate-500 mt-1">Need revision</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
        <div className="grid grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by ID, title, or submitter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Suite Filter */}
          <div>
            <select
              value={filterSuite}
              onChange={(e) => setFilterSuite(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Suites</option>
              {uniqueSuites.map(suite => (
                <option key={suite} value={suite}>{suite}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
          <Loader2 className="w-12 h-12 text-teal-400 mx-auto mb-4 animate-spin" />
          <p className="text-slate-400">Loading review queue...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-950/50 border border-red-800/50 rounded-xl p-4 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Review Queue List */}
      {!isLoading && (
        <div className="space-y-4">
          {filteredQueue.length === 0 ? (
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
              <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No test cases found</p>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            filteredQueue.map((item) => {
              const lastReview = lastReviews[item.id];
              const isLoadingReview = loadingReviews[item.id];

              return (
                <div
                  key={item.id}
                  className={`bg-slate-900 border rounded-xl p-6 transition-all hover:border-slate-700 ${
                    item.reviewStatus === 'pending' 
                      ? 'border-yellow-500/30 hover:border-yellow-500/50' 
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-6">
                    {/* Left: Test Case Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        {/* Status Indicator */}
                        <div
                          className={`w-1 h-20 rounded-full ${
                            item.reviewStatus === 'pending'
                              ? 'bg-yellow-500'
                              : item.reviewStatus === 'approved'
                              ? 'bg-green-500'
                              : 'bg-red-500'
                          }`}
                        />

                        <div className="flex-1">
                          {/* Title & ID */}
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-slate-200">{item.title}</h3>
                            <span className="text-sm text-blue-400">{item.id}</span>
                            {getStatusBadge(item.reviewStatus)}
                          </div>

                          {/* Metadata */}
                          <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                            <span className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5" />
                              {item.createdByName || 'Unknown'}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {getTimeAgo(item.updatedAt)}
                            </span>
                          </div>

                          {/* Badges */}
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700">
                              {item.suite}
                            </Badge>
                            <Badge variant="outline" className={getPriorityColor(item.priority) + ' border'}>
                              {item.priority}
                            </Badge>
                            <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700">
                              {item.caseType}
                            </Badge>
                          </div>

                          {/* Last Review Comment */}
                          {item.reviewStatus !== 'pending' && (
                            <div
                              className={`mt-4 p-3 rounded-lg border ${
                                item.reviewStatus === 'approved'
                                  ? 'bg-green-950/30 border-green-800/30'
                                  : 'bg-red-950/30 border-red-800/30'
                              }`}
                            >
                              {isLoadingReview ? (
                                <div className="flex items-center gap-2">
                                  <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                                  <span className="text-xs text-slate-400">Loading review...</span>
                                </div>
                              ) : lastReview ? (
                                <>
                                  <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare
                                      className={`w-3.5 h-3.5 ${
                                        item.reviewStatus === 'approved' ? 'text-green-400' : 'text-red-400'
                                      }`}
                                    />
                                    <span className="text-xs text-slate-400">
                                      Review by {lastReview.reviewerName} • {getTimeAgo(lastReview.createdAt)}
                                    </span>
                                  </div>
                                  {lastReview.comment && (
                                    <p className="text-sm text-slate-300 line-clamp-2">{lastReview.comment}</p>
                                  )}
                                </>
                              ) : (
                                <p className="text-xs text-slate-500">No review comment</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => onViewDetail(item.id)}
                        variant="outline"
                        className="bg-transparent border-slate-600 text-slate-100 hover:bg-slate-800 hover:border-slate-500"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>

                      {item.reviewStatus === 'pending' && canReview && (
                        <Button
                          onClick={() => onReviewTestCase(item.id)}
                          className="bg-teal-600 hover:bg-teal-700 text-white"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Review Now
                        </Button>
                      )}

                      {item.reviewStatus === 'needs_revision' && canReview && (
                        <Button
                          onClick={() => onReviewTestCase(item.id)}
                          variant="outline"
                          className="bg-transparent border-orange-600 text-orange-300 hover:bg-orange-600/10 hover:border-orange-500"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Re-review
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Empty State for users without review permission */}
      {!canReview && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center mt-6">
          <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Review Queue Access Restricted</p>
          <p className="text-sm text-slate-500 mt-1">You need "Review and approve test cases" permission to access this page</p>
        </div>
      )}
    </div>
  );
}
