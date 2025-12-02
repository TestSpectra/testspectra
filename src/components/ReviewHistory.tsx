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
      return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />;
    }
    return <XCircle className="w-3.5 h-3.5 text-red-400" />;
  };

  const getActionLabel = (action: string) => {
    if (action === 'approved') {
      return 'Approved';
    }
    return 'Requested Edit';
  };

  const getActionColor = (action: string) => {
    if (action === 'approved') {
      return 'bg-green-950/30 border-green-800/30';
    }
    return 'bg-red-950/30 border-red-800/30';
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
              className={`p-3 rounded-lg border ${getActionColor(review.action)}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare
                  className={`w-3.5 h-3.5 ${
                    review.action === 'approved' ? 'text-green-400' : 'text-red-400'
                  }`}
                />
                <span className="text-xs text-slate-400">
                  Review by {review.reviewerName} • {formatTimestamp(review.createdAt)}
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-slate-300">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
