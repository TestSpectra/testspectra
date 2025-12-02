import { useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { reviewService, type CreateReviewRequest } from '../services/review-service';

interface ReviewSectionProps {
  testCaseId: string;
  onReviewSubmitted?: () => void;
}

export function ReviewSection({ testCaseId, onReviewSubmitted }: ReviewSectionProps) {
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const request: CreateReviewRequest = {
        action: 'approved',
        comment: comment.trim() || undefined,
      };

      await reviewService.createReview(testCaseId, request);
      setComment('');
      onReviewSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve test case');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestEdit = async () => {
    setError(null);

    // Validate that comment is not empty for request edit
    if (!comment.trim()) {
      setError('Comment is required when requesting edits');
      return;
    }

    setIsLoading(true);

    try {
      const request: CreateReviewRequest = {
        action: 'needs_revision',
        comment: comment.trim(),
      };

      await reviewService.createReview(testCaseId, request);
      setComment('');
      onReviewSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request edit');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
      <h2 className="mb-4 flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-blue-400" />
        Review Test Case
      </h2>

      {/* Comment textarea */}
      <div className="mb-4">
        <label htmlFor="review-comment" className="block text-sm text-slate-400 mb-2">
          Review Comment {' '}
          <span className="text-slate-500">(required for request edit)</span>
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add your review comments here..."
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={4}
          disabled={isLoading}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
          <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleApprove}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approve
            </>
          )}
        </Button>

        <Button
          onClick={handleRequestEdit}
          disabled={isLoading}
          variant="outline"
          className="border-orange-600/50 text-orange-400 hover:bg-orange-600/20 hover:text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 mr-2" />
              Request Edit
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
