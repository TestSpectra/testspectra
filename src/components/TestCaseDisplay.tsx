import { AlertCircle, CheckCircle2 } from "lucide-react";
import { TestStepsDisplay } from "./TestStepsDisplay";
import { TestCase, TestStep } from "@/services/test-case-service";

interface TestCaseDisplayProps {
  testCase: Partial<TestCase>;
}

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
          <div
            className="text-slate-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: testCase.description }}
          />
        </div>
      )}

      {/* Test Steps */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h2 className="mb-4">Test Steps</h2>
        <TestStepsDisplay steps={steps} />
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
    </div>
  );
}
