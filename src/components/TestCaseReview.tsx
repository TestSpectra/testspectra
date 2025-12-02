import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, User, Calendar, Zap, Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { testCaseService } from '../services/test-case-service';
import { reviewService } from '../services/review-service';
import { authService } from '../services/auth-service';

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
  testCaseId: string;
  onBack: () => void;
}

export function TestCaseReview({ testCaseId, onBack }: TestCaseReviewProps) {
  const [testCase, setTestCase] = useState<TestCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUser = authService.getCurrentUser();

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
  }, [testCaseId]);

  const handleSubmitReview = async () => {
    if (!reviewAction) return;
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

  const getPriorityColor = (priority: string) => {
    const colors: any = {
      'Critical': 'bg-red-500/20 text-red-400 border-red-500/30',
      'High': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'Medium': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Low': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    };
    return colors[priority] || colors['Medium'];
  };

  const getCaseTypeColor = (caseType: string) => {
    const colors: any = {
      'Positive': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Negative': 'bg-red-500/20 text-red-400 border-red-500/30',
      'Edge': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    };
    return colors[caseType] || colors['Positive'];
  };

  const getActionIcon = (actionType: string) => {
    const icons: any = {
      'navigate': '🌐',
      'click': '👆',
      'type': '⌨️',
      'clear': '🧹',
      'select': '📋',
      'scroll': '📜',
      'swipe': '👉',
      'wait': '⏱️',
      'waitForElement': '⏳',
      'pressKey': '⌨️',
      'longPress': '👆⏱️',
      'doubleClick': '👆👆',
      'hover': '🖱️',
      'dragDrop': '↔️',
      'back': '◀️',
      'refresh': '🔄',
      'assert': '👁️',
      'elementDisplayed': '👁️',
      'elementNotDisplayed': '🚫',
      'elementExists': '✅',
      'elementClickable': '👆✅',
      'elementInViewport': '📱',
      'textEquals': '📝=',
      'textContains': '📝⊃',
      'valueEquals': '💾=',
      'valueContains': '💾⊃',
      'urlEquals': '🔗=',
      'urlContains': '🔗⊃',
      'titleEquals': '📄=',
      'titleContains': '📄⊃',
      'hasClass': '🎨',
      'hasAttribute': '🏷️',
      'isEnabled': '✅',
      'isDisabled': '❌',
      'isSelected': '☑️',
    };
    return icons[actionType] || '▶️';
  };

  const getActionLabel = (actionType: string) => {
    const labels: any = {
      'navigate': 'Navigate',
      'click': 'Click / Tap',
      'type': 'Type Text',
      'clear': 'Clear Input',
      'select': 'Select Option',
      'scroll': 'Scroll',
      'swipe': 'Swipe',
      'wait': 'Wait (Duration)',
      'waitForElement': 'Wait for Element',
      'pressKey': 'Press Key',
      'longPress': 'Long Press / Hold',
      'doubleClick': 'Double Click / Tap',
      'hover': 'Hover',
      'dragDrop': 'Drag and Drop',
      'back': 'Go Back',
      'refresh': 'Refresh Page',
      'assert': 'Assert',
      'elementDisplayed': 'Element is Visible',
      'elementNotDisplayed': 'Element is Hidden',
      'elementExists': 'Element Exists',
      'elementClickable': 'Element is Clickable',
      'elementInViewport': 'Element in Viewport',
      'textEquals': 'Text Equals',
      'textContains': 'Text Contains',
      'valueEquals': 'Value Equals',
      'valueContains': 'Value Contains',
      'urlEquals': 'URL Equals',
      'urlContains': 'URL Contains',
      'titleEquals': 'Title Equals',
      'titleContains': 'Title Contains',
      'hasClass': 'Has CSS Class',
      'hasAttribute': 'Has Attribute',
      'isEnabled': 'Is Enabled',
      'isDisabled': 'Is Disabled',
      'isSelected': 'Is Selected / Checked',
    };
    return labels[actionType] || actionType;
  };

  const steps: TestStep[] = testCase.steps || [];

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
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="mb-0">{testCase.title}</h1>
              <Badge variant="outline" className={`${getPriorityColor(testCase.priority)} border`}>
                {testCase.priority}
              </Badge>
              <Badge variant="outline" className={`${getCaseTypeColor(testCase.caseType)} border`}>
                {testCase.caseType}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span className="text-blue-400">{testCase.id}</span>
              <span>•</span>
              <span>{testCase.suite}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                {testCase.automation === 'Automated' ? (
                  <>
                    <Zap className="w-3 h-3 text-purple-400" />
                    <span className="text-purple-400">Automated</span>
                  </>
                ) : (
                  <>
                    <User className="w-3 h-3" />
                    <span>Manual</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="col-span-2 space-y-6">
          {/* Pre-condition */}
          {testCase.preCondition && (
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <h2 className="mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-400" />
                Pre-Condition
              </h2>
              <div
                className="text-slate-300 leading-relaxed prose prose-sm prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: testCase.preCondition }}
              />
            </div>
          )}

          {/* Description */}
          {testCase.description && (
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <h2 className="mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-400" />
                Description
              </h2>
              <p className="text-slate-300 leading-relaxed">{testCase.description}</p>
            </div>
          )}

          {/* Test Steps */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h2 className="mb-4">Test Steps</h2>
            {steps.length === 0 ? (
              <p className="text-slate-400 text-sm">No steps defined</p>
            ) : (
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div
                    key={step.id || index}
                    className="flex gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-blue-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-600/20 rounded-lg text-blue-400 shrink-0">
                      <span className="text-sm">{step.stepOrder}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getActionIcon(step.actionType)}</span>
                        <span className="text-sm text-teal-400 font-medium">{getActionLabel(step.actionType)}</span>
                      </div>

                      {/* Action Parameters */}
                      {step.actionParams && Object.keys(step.actionParams).length > 0 && (
                        <div className="space-y-1 text-xs mb-2">
                          {Object.entries(step.actionParams).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="text-slate-500 capitalize">{key}:</span>
                              <code className="text-purple-400 bg-purple-950/30 px-2 py-0.5 rounded">{String(value)}</code>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Assertions */}
                      {step.assertions && step.assertions.length > 0 && (
                        <div className="mt-2 pl-4 border-l-2 border-green-500/30">
                          <p className="text-xs text-green-400 mb-1">Assertions:</p>
                          <div className="space-y-1">
                            {step.assertions.map((assertion: any, idx: number) => (
                              <div key={idx} className="text-xs text-slate-300">
                                <span className="text-green-400 mr-1">{getActionIcon(assertion.assertionType)}</span>
                                <span className="text-green-400 font-medium">{getActionLabel(assertion.assertionType)}</span>
                                {assertion.selector && (
                                  <code className="ml-2 text-purple-400 bg-purple-950/30 px-1 py-0.5 rounded text-[10px]">
                                    {assertion.selector}
                                  </code>
                                )}
                                {assertion.expectedValue && (
                                  <span className="ml-2 text-orange-400">= {assertion.expectedValue}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Custom Expected Result */}
                      {step.customExpectedResult && (
                        <div
                          className="mt-2 text-xs text-slate-400 prose prose-sm prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: step.customExpectedResult }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Post-condition */}
          {testCase.postCondition && (
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <h2 className="mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Post-Condition
              </h2>
              <div
                className="text-slate-300 leading-relaxed prose prose-sm prose-invert max-w-none p-4 bg-green-950/20 border border-green-800/30 rounded-lg"
                dangerouslySetInnerHTML={{ __html: testCase.postCondition }}
              />
            </div>
          )}

          {/* Expected Outcome */}
          {testCase.expectedOutcome && (
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <h2 className="mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Expected Outcome
              </h2>
              <div className="p-4 bg-green-950/20 border border-green-800/30 rounded-lg">
                <p className="text-slate-300 leading-relaxed">
                  {testCase.expectedOutcome}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Review Actions */}
        <div className="space-y-6">
          {/* Review Action Card */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 sticky top-8">
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

          {/* Metadata */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h3 className="text-sm text-slate-400 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Metadata
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-slate-500 mb-1">Created By</p>
                <p className="text-slate-300">{testCase.createdByName || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Created At</p>
                <p className="text-slate-300">{testCase.createdAt ? new Date(testCase.createdAt).toLocaleString() : '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Last Modified</p>
                <p className="text-slate-300">{testCase.updatedAt ? new Date(testCase.updatedAt).toLocaleString() : '-'}</p>
              </div>
            </div>
          </div>

          {/* Tags */}
          {testCase.tags && testCase.tags.length > 0 && (
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <h3 className="text-sm text-slate-400 mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {testCase.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-slate-800 text-slate-300 border-slate-700"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
