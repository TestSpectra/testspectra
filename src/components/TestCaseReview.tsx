import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { testCaseService } from '../services/test-case-service';
import { reviewService } from '../services/review-service';
import { TestCaseHeader } from './TestCaseHeader';
import { TestCaseDisplay } from './TestCaseDisplay';
import { TestCaseMetadata } from './TestCaseMetadata';
import { ReviewHistory } from './ReviewHistory';

interface TestStep {
  id?: string;
  stepOrder: number;
  actionType: string;
  actionParams: any;
  assertions: any[];
  customExpectedResult?: string | null;
}

interface TestCase {
  id: string;
  title: string;
  suite: string;
  priority: string;
  caseType: string;
  automation: string;
  description?: string;
  preCondition: string | null;
  postCondition: string | null;
  steps?: TestStep[];
  expectedOutcome?: string;
  tags?: string[];
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
  reviewStatus?: string;
}

interface TestCaseReviewProps {
  testCaseId?: string;
  onBack: () => void;
  isReReview?: boolean;
}

export function TestCaseReview({ testCaseId: propTestCaseId, onBack, isReReview = false }: TestCaseReviewProps) {
  const { testCaseId: urlTestCaseId } = useParams<{ testCaseId: string }>();
  const testCaseId = propTestCaseId || urlTestCaseId;
  const [testCase, setTestCase] = useState<TestCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTestCase = async () => {
      if (!testCaseId) return;
      
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
  }, [testCaseId]);

  const handleSubmitReview = async () => {
    if (!reviewAction || !testCaseId) return;
    if (reviewAction === 'reject' && !comment.trim()) {
      alert('Comment is required when requesting changes');
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewService.createReview(testCaseId, {
        action: reviewAction === 'approve' ? 'approved' : 'needs_revision',
        comment: comment.trim() || undefined,
      });

      // Success - go back to queue
      onBack();
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-400 mx-auto mb-4 animate-spin" />
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



  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Queue</span>
          </button>
          <div className="border-l border-slate-700 h-8"></div>
          <TestCaseHeader testCase={testCase} />
          
          {/* Re-Review Badge */}
          {isReReview && (
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-purple-400">Re-Review</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="col-span-2 space-y-6">
          <TestCaseDisplay testCase={testCase} />
          
          {/* Show review history if this is a re-review */}
          {testCase.reviewStatus && testCase.reviewStatus !== 'pending' && (
            <ReviewHistory testCaseId={testCase.id} />
          )}
        </div>

        {/* Sidebar - Review Actions */}
        <div className="space-y-6">
          {/* Review Action Card */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h3 className="text-lg mb-4">Submit Review</h3>
            
            {!reviewAction ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-400 mb-4">Choose your review action:</p>
                
                <button
                  onClick={() => setReviewAction('approve')}
                  className="w-full bg-green-950/30 hover:bg-green-950/50 border-2 border-green-800/50 hover:border-green-700 rounded-xl p-4 text-left transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-green-500/30 transition-colors">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h4 className="text-green-400 mb-1">Approve Test Case</h4>
                      <p className="text-sm text-slate-400">Test case is well-written and ready for execution</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setReviewAction('reject')}
                  className="w-full bg-red-950/30 hover:bg-red-950/50 border-2 border-red-800/50 hover:border-red-700 rounded-xl p-4 text-left transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-red-500/30 transition-colors">
                      <XCircle className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h4 className="text-red-400 mb-1">Request Changes</h4>
                      <p className="text-sm text-slate-400">Test case needs revision before it can be approved</p>
                    </div>
                  </div>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border-2 ${
                  reviewAction === 'approve' 
                    ? 'bg-green-950/30 border-green-800/50' 
                    : 'bg-red-950/30 border-red-800/50'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    {reviewAction === 'approve' ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-green-400 font-medium">Approving Test Case</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-400" />
                        <span className="text-red-400 font-medium">Requesting Changes</span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setReviewAction(null);
                      setComment('');
                    }}
                    className="text-xs text-slate-400 hover:text-slate-300 underline"
                  >
                    Change action
                  </button>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Comment {reviewAction === 'reject' && <span className="text-red-400">*</span>}
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={
                      reviewAction === 'approve'
                        ? 'Add optional feedback...'
                        : 'Explain what needs to be changed...'
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[120px] resize-none"
                    required={reviewAction === 'reject'}
                  />
                  {reviewAction === 'reject' && (
                    <p className="text-xs text-slate-500 mt-1">Comment is required when requesting changes</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmitReview}
                    disabled={isSubmitting || (reviewAction === 'reject' && !comment.trim())}
                    className={`flex-1 ${
                      reviewAction === 'approve'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    } text-white`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        {reviewAction === 'approve' ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Submit Approval
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Submit Changes
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <TestCaseMetadata testCase={testCase} />
        </div>
      </div>
    </div>
  );
}
