import { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, User, MessageSquare } from 'lucide-react';
import { reviewService, type Review } from '../services/review-service';

interface ReviewHistoryProps {
  testCaseId: string;
  refreshTrigger?: number;
}

export function ReviewHistory({ testCaseId, refreshTrigger }: ReviewHistoryProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await reviewService.getReviewHistory(testCaseId);
        setReviews(data);
      } catch (err) {
        console.error('Failed to load review history:', err);
        setError('Failed to load review history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [testCaseId, refreshTrigger]);

  const getActionIcon = (action: string) => {
    if (action === 'approved') {
      return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    }
    return <XCircle className="w-5 h-5 text-orange-400" />;
  };

  const getActionLabel = (action: string) => {
    if (action === 'approved') {
      return 'Approved';
    }
    return 'Requested Edit';
  };

  const getActionColor = (action: string) => {
    if (action === 'approved') {
      return 'bg-green-500/20 border-green-500/30 text-green-400';
    }
    return 'bg-orange-500/20 border-orange-500/30 text-orange-400';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h2 className="mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-400" />
          Review History
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h2 className="mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-400" />
          Review History
        </h2>
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
      <h2 className="mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-purple-400" />
        Review History
      </h2>

      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No reviews have been performed yet</p>
          <p className="text-slate-500 text-xs mt-1">
            Reviews will appear here once someone with review permission reviews this test case
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`p-4 rounded-lg border ${getActionColor(review.action)}`}
            >
              {/* Review header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getActionIcon(review.action)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {getActionLabel(review.action)}
                      </span>
                      <span className="text-xs text-slate-500">by</span>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="text-sm">{review.reviewerName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs opacity-75">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(review.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Review comment */}
              {review.comment && (
                <div className="mt-3 pt-3 border-t border-current/20">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 shrink-0 mt-0.5 opacity-75" />
                    <p className="text-sm leading-relaxed">{review.comment}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
