import { useEffect, useState } from "react";
import { testCaseService, TestStep } from "../services/test-case-service";

interface TestStepsDisplayProps {
  steps: TestStep[];
}

export function TestStepsDisplay({ steps }: TestStepsDisplayProps) {
  const [labelMap, setLabelMap] = useState<Record<string, string>>({});
  const [iconMap, setIconMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    const loadMetadata = async () => {
      try {
        const metadata = await testCaseService.getTestStepMetadata();
        if (cancelled) return;

        const labels: Record<string, string> = {};
        const icons: Record<string, string> = {};

        metadata.actions.forEach((a) => {
          labels[a.value] = a.label;
          if (a.icon) {
            icons[a.value] = a.icon;
          }
        });

        metadata.assertions.forEach((a) => {
          labels[a.value] = a.label;
        });

        setLabelMap(labels);
        setIconMap(icons);
      } catch (error) {
        console.error("Failed to load test step metadata for labels:", error);
      }
    };

    loadMetadata();

    return () => {
      cancelled = true;
    };
  }, []);

  const getActionLabel = (actionType: string) => {
    return labelMap[actionType] || actionType;
  };

  const getActionIcon = (actionType: string) => {
    return iconMap[actionType];
  };

  const stepsToDisplay: TestStep[] = steps || [];

  if (stepsToDisplay.length === 0) {
    return <p className="text-slate-400 text-sm">No steps defined</p>;
  }

  return (
    <div className="space-y-3">
      {stepsToDisplay.map((step, index) => (
        <div
          key={step.id || index}
          className="flex gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-blue-500/30 transition-colors"
        >
          <div className="flex items-center justify-center w-8 h-8 bg-blue-600/20 rounded-lg text-blue-400 shrink-0">
            <span className="text-sm">{index + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{getActionIcon(step.actionType)}</span>
              <span className="text-sm text-teal-400 font-medium">
                {getActionLabel(step.actionType)}
              </span>
            </div>

            {/* Action Parameters */}
            {step.actionParams && Object.keys(step.actionParams).length > 0 && (
              <div className="space-y-1 text-xs mb-2">
                {Object.entries(step.actionParams).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <span className="text-slate-500 capitalize">{key}:</span>
                    <code className="text-purple-400 bg-purple-950/30 px-2 py-0.5 rounded">
                      {String(value)}
                    </code>
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
                      <span className="text-green-400 mr-1">
                        {getActionIcon(assertion.assertionType)}
                      </span>
                      <span className="text-green-400 font-medium">
                        {getActionLabel(assertion.assertionType)}
                      </span>
                      {assertion.selector && (
                        <code className="ml-2 text-purple-400 bg-purple-950/30 px-1 py-0.5 rounded text-[10px]">
                          {assertion.selector}
                        </code>
                      )}
                      {assertion.expectedValue && (
                        <span className="ml-2 text-orange-400">
                          = {assertion.expectedValue}
                        </span>
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
  );
}
