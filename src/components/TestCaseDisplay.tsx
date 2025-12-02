import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from './ui/badge';

interface TestStep {
  id?: string;
  stepOrder: number;
  actionType: string;
  actionParams: any;
  assertions: any[];
  customExpectedResult?: string | null;
}

interface TestCaseDisplayProps {
  testCase: {
    description?: string;
    preCondition: string | null;
    postCondition: string | null;
    steps?: TestStep[];
    expectedOutcome?: string;
    tags?: string[];
  };
}

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

export function TestCaseDisplay({ testCase }: TestCaseDisplayProps) {
  const steps: TestStep[] = testCase.steps || [];

  return (
    <div className="space-y-6">
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
            <CheckCircle2 className="w-5 h-5 text-green-400" />
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
            <CheckCircle2 className="w-5 h-5 text-green-400" />
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
  );
}
