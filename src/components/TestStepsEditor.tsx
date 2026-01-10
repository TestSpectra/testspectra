import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Copy,
  GripVertical,
  Package,
  PackagePlus,
  Plus,
  PlusCircle,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  SharedStepDetail,
  sharedStepService,
} from "../services/shared-step-service";
import {
  TestStep,
  TestStepMetadataResponse,
} from "../services/test-case-service";
import "../styles/drag-handle.css";
import { ConfirmDialog } from "./SimpleDialog";
import { TestStepsDisplay } from "./TestStepsDisplay";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { RichTextEditor } from "./ui/rich-text-editor";

export type ActionType =
  | "navigate"
  | "click"
  | "type"
  | "clear"
  | "select"
  | "scroll"
  | "swipe"
  | "wait"
  | "waitForElement"
  | "pressKey"
  | "longPress"
  | "doubleClick"
  | "hover"
  | "dragDrop"
  | "back"
  | "refresh";

export type AssertionType =
  | "elementDisplayed"
  | "elementNotDisplayed"
  | "elementExists"
  | "elementClickable"
  | "elementInViewport"
  | "textEquals"
  | "textContains"
  | "valueEquals"
  | "valueContains"
  | "urlEquals"
  | "urlContains"
  | "titleEquals"
  | "titleContains"
  | "hasClass"
  | "hasAttribute"
  | "isEnabled"
  | "isDisabled"
  | "isSelected";

export interface Assertion {
  id?: string;
  assertionType: AssertionType;
  selector?: string;
  expectedValue?: string;
  attributeName?: string;
  attributeValue?: string;
}

export interface ActionParams {
  selector?: string;
  value?: string;
  text?: string;
  url?: string;
  timeout?: string;
  direction?: "up" | "down" | "left" | "right";
  targetSelector?: string;
  key?: string;
  duration?: string;
}

export interface TestStepWithoutOrder {
  id: string;
  actionType: ActionType;
  actionParams: ActionParams;
  assertions: Assertion[];
  customExpectedResult?: string;
  sharedStepId?: string; // Add this to identify shared steps
  sharedStepDetail?: SharedStepDetail; // Store full detail for shared steps
}

interface SortableStepItemProps {
  step: TestStepWithoutOrder;
  index: number;
  stepsLength: number;
  inputClass: string;
  isHighlighted: boolean;
  getStepColor: (type: ActionType) => string;
  getStepLabel: (type: ActionType) => string;
  actionDefinitions: {
    value: ActionType;
    label: string;
    platform: "both" | "web" | "mobile";
  }[];
  assertionsByAction: Record<ActionType, AssertionType[]>;
  assertionDefinitions: {
    value: AssertionType;
    label: string;
    needsSelector: boolean;
    needsValue: boolean;
    needsAttribute: boolean;
  }[];
  handleUpdateStep: (
    id: string,
    updates: Partial<TestStepWithoutOrder>
  ) => void;
  handleRemoveStep: (id: string) => void;
  handleDuplicateStep: (id: string) => void;
  handleInsertStepBelow: (id: string) => void;
  handleInsertSharedStepBelow: (id: string) => void;
  handleAddAssertion: (stepId: string) => void;
  handleUpdateAssertion: (
    stepId: string,
    assertionId: string,
    updates: Partial<Assertion>
  ) => void;
  handleRemoveAssertion: (stepId: string, assertionId: string) => void;
  renderStepFields: (step: TestStepWithoutOrder) => React.ReactNode;
  renderAssertionFields: (
    step: TestStepWithoutOrder,
    assertion: Assertion
  ) => React.ReactNode;
  allowAddSharedStep?: boolean;
}

function SortableStepItem({
  step,
  index,
  stepsLength,
  inputClass,
  isHighlighted,
  getStepColor,
  getStepLabel,
  actionDefinitions,
  assertionsByAction,
  assertionDefinitions,
  handleUpdateStep,
  handleRemoveStep,
  handleDuplicateStep,
  handleInsertStepBelow,
  handleInsertSharedStepBelow,
  handleAddAssertion,
  handleUpdateAssertion,
  handleRemoveAssertion,
  renderStepFields,
  renderAssertionFields,
  allowAddSharedStep,
}: SortableStepItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Check if this is a shared step
  const isSharedStep = !!step.sharedStepId && step.sharedStepDetail;

  // Convert shared step to display format
  const convertSharedStepToTestSteps = (
    sharedStep: SharedStepDetail
  ): TestStep[] => {
    if (!sharedStep.steps || sharedStep.steps.length === 0) return [];

    return sharedStep.steps
      .slice()
      .sort((a, b) => a.stepOrder - b.stepOrder)
      .map((step, index) => ({
        id: `shared-${sharedStep.id}-${step.id || index}`,
        stepOrder: step.stepOrder,
        actionType: step.actionType as ActionType,
        actionParams: step.actionParams || {},
        customExpectedResult: step.customExpectedResult || "",
        assertions: (step.assertions || []).map(
          (assertion: any, idx: number) => ({
            ...assertion,
            id: `shared-${sharedStep.id}-${step.id || index}-assertion-${idx}`,
          })
        ),
      }));
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-step-id={step.id}
      className={`bg-slate-800/50 p-4 rounded-lg transition-colors ${isDragging ? "ring-2 ring-blue-500" : ""
        } ${isHighlighted ? "step-card-highlighted" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="drag-handle-container" {...attributes} {...listeners}>
          <span className="step-number">{index + 1}.</span>
          <div className="drag-icon">
            <GripVertical size={18} />
          </div>
        </div>

        {isSharedStep ? (
          // Render shared step display
          <>
            <div className="flex flex-col gap-3 grow">
              <div className="flex items-center gap-2 pt-1.5">
                <Package className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-400">
                  {step.sharedStepDetail?.name}
                </span>
              </div>

              {step.sharedStepDetail?.description && (
                <p className="text-xs text-slate-400">
                  {step.sharedStepDetail.description}
                </p>
              )}
            </div>
          </>
        ) : (
          // Render regular step input fields
          <>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <select
                  value={step.actionType}
                  onChange={(e) => {
                    const newType = e.target.value as ActionType;
                    const availableAssertions =
                      assertionsByAction[newType] || [];
                    const defaultAssertionType =
                      availableAssertions[0] ||
                      ("elementDisplayed" as AssertionType);

                    handleUpdateStep(step.id, {
                      actionType: newType,
                      actionParams: {},
                      assertions: [
                        {
                          id: Date.now().toString(),
                          assertionType: defaultAssertionType,
                        },
                      ],
                      customExpectedResult: step.customExpectedResult,
                    });
                  }}
                  className={inputClass}
                >
                  {actionDefinitions.map((actionDef) => (
                    <option key={actionDef.value} value={actionDef.value}>
                      {actionDef.label}
                      {actionDef.platform !== "both"
                        ? ` (${actionDef.platform})`
                        : ""}
                    </option>
                  ))}
                </select>
                <Badge
                  variant="outline"
                  className={`${getStepColor(step.actionType)} border shrink-0`}
                >
                  {getStepLabel(step.actionType)}
                </Badge>
              </div>
              {renderStepFields(step)}
            </div>
          </>
        )}

        <div className="flex items-center gap-1 mt-1">
          <button
            onClick={() => handleDuplicateStep(step.id)}
            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
            title="Duplicate Step"
            tabIndex={1000 + index}
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleInsertStepBelow(step.id)}
            className="p-2 text-slate-400 hover:text-green-400 hover:bg-slate-700 rounded-lg transition-colors"
            title="Add Step Below"
            tabIndex={1000 + index}
          >
            <PlusCircle className="w-4 h-4" />
          </button>
          {allowAddSharedStep && (
            <button
              onClick={() => handleInsertSharedStepBelow(step.id)}
              className="p-2 text-slate-400 hover:text-purple-400 hover:bg-slate-700 rounded-lg transition-colors"
              title="Add Shared Step Below"
              tabIndex={1000 + index}
            >
              <PackagePlus className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleRemoveStep(step.id)}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
            title="Delete Step"
            tabIndex={1000 + index}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isSharedStep && (
        <div className="border-l-2 ml-9 mt-4 border-purple-500/30 pl-3">
          <TestStepsDisplay
            steps={convertSharedStepToTestSteps(step.sharedStepDetail!)}
          />
        </div>
      )}

      {/* Assertions */}
      {!isSharedStep && (
        <div className="mt-4 ml-9 border-t border-slate-700/50 pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-medium text-slate-400">
              Expected Result (Assertions){" "}
              <span className="font-normal text-slate-500">- opsional</span>
            </label>
            <button
              type="button"
              onClick={() => handleAddAssertion(step.id)}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <Plus size={12} />
              Add Assertion
            </button>
          </div>

          {(step.assertions || []).length > 0 && (
            <div className="space-y-2 mb-3">
              {(step.assertions || []).map((assertion) => {
                const availableAssertions =
                  assertionsByAction[step.actionType] || [];
                const filteredDefs = assertionDefinitions.filter((a) =>
                  availableAssertions.includes(a.value)
                );

                return (
                  <div
                    key={assertion.id}
                    className="flex items-center gap-2 bg-slate-700/30 p-2 rounded-lg"
                  >
                    <select
                      value={assertion.assertionType}
                      onChange={(e) =>
                        handleUpdateAssertion(step.id, assertion.id || "", {
                          assertionType: e.target.value as AssertionType,
                        })
                      }
                      className={`${inputClass} text-sm min-w-40`}
                    >
                      {filteredDefs.map((assertDef) => (
                        <option key={assertDef.value} value={assertDef.value}>
                          {assertDef.label}
                        </option>
                      ))}
                    </select>
                    {renderAssertionFields(step, assertion)}
                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveAssertion(step.id, assertion.id || "")
                      }
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div>
            <label className="text-xs text-slate-500 mb-2 block">
              Custom Assertion (opsional)
            </label>
            <RichTextEditor
              value={step.customExpectedResult || ""}
              onChange={(value) =>
                handleUpdateStep(step.id, {
                  customExpectedResult: value,
                })
              }
              placeholder="Assertion tambahan yang tidak tercakup di atas..."
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Shared step option from metadata
interface SharedStepOption {
  id: string;
  name: string;
}

// Add Shared Step Dialog
interface AddSharedStepDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (sharedStep: SharedStepDetail) => void;
  sharedStepsOptions: SharedStepOption[];
}

// Add Shared Step Dialog Component
function AddSharedStepDialog({
  isOpen,
  onClose,
  onAdd,
  sharedStepsOptions,
}: AddSharedStepDialogProps) {
  const [selectedSharedStepId, setSelectedSharedStepId] = useState<string>("");
  const [selectedSharedStep, setSelectedSharedStep] =
    useState<SharedStepDetail | null>(null);
  const [isLoadingSharedStep, setIsLoadingSharedStep] = useState(false);

  const inputClass =
    "bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 input-field-focus transition-colors duration-150";

  // Load selected shared step details when selected
  useEffect(() => {
    if (selectedSharedStepId) {
      const loadSharedStepDetail = async () => {
        try {
          setIsLoadingSharedStep(true);
          const data = await sharedStepService.getSharedStep(
            selectedSharedStepId
          );
          setSelectedSharedStep(data);
        } catch (error) {
          console.error("Failed to load shared step detail:", error);
          setSelectedSharedStep(null);
        } finally {
          setIsLoadingSharedStep(false);
        }
      };
      loadSharedStepDetail();
    } else {
      setSelectedSharedStep(null);
    }
  }, [selectedSharedStepId]);

  // Reset states when the dialog is closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedSharedStepId("");
      setSelectedSharedStep(null);
    }
  }, [isOpen]);

  const handleAdd = () => {
    if (selectedSharedStep) {
      onAdd(selectedSharedStep);
      onClose();
    }
  };

  const convertSharedStepToTestSteps = (
    sharedStep: SharedStepDetail
  ): TestStep[] => {
    if (!sharedStep.steps || sharedStep.steps.length === 0) return [];

    return sharedStep.steps
      .slice()
      .sort((a, b) => a.stepOrder - b.stepOrder)
      .map((step, index) => ({
        id: `shared-${sharedStep.id}-${step.id || index}`,
        stepOrder: step.stepOrder,
        actionType: step.actionType as ActionType,
        actionParams: step.actionParams || {},
        customExpectedResult: step.customExpectedResult || "",
        assertions: (step.assertions || []).map(
          (assertion: any, idx: number) => ({
            ...assertion,
            id: `shared-${sharedStep.id}-${step.id || index}-assertion-${idx}`,
          })
        ),
      }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 bg-slate-900 sticky top-0 z-10">
          <h3 className="text-lg font-medium text-slate-100">
            Add Shared Step
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Select Shared Step
            </label>
            <select
              value={selectedSharedStepId}
              onChange={(e) => setSelectedSharedStepId(e.target.value)}
              disabled={isLoadingSharedStep}
              className={`w-full ${inputClass} text-sm`}
            >
              <option value="">
                {isLoadingSharedStep ? "Loading..." : "Select a shared step..."}
              </option>
              {sharedStepsOptions.map((sharedStep) => (
                <option key={sharedStep.id} value={sharedStep.id}>
                  {sharedStep.name}
                </option>
              ))}
            </select>
          </div>

          {selectedSharedStep && (
            <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
              <div className="mb-3">
                <h4 className="text-sm font-medium text-slate-200 mb-1">
                  {selectedSharedStep.name}
                </h4>
                {selectedSharedStep.description && (
                  <p className="text-xs text-slate-400">
                    {selectedSharedStep.description}
                  </p>
                )}
              </div>

              <div className="text-xs text-slate-500 mb-2">
                Preview ({selectedSharedStep.stepCount} steps):
              </div>

              <TestStepsDisplay
                steps={convertSharedStepToTestSteps(selectedSharedStep)}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 bg-slate-900 sticky bottom-0 z-10">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-600 bg-transparent text-slate-100 hover:bg-slate-800 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!selectedSharedStep || isLoadingSharedStep}
            className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Shared Step
          </Button>
        </div>
      </div>
    </div>
  );
}

interface TestStepsEditorProps {
  steps: TestStepWithoutOrder[];
  onStepsChange: (steps: TestStepWithoutOrder[]) => void;
  stepMetadata: TestStepMetadataResponse;
  allowAddSharedStep?: boolean;
}

export function TestStepsEditor({
  steps,
  onStepsChange,
  stepMetadata,
  allowAddSharedStep = false,
}: TestStepsEditorProps) {
  const newStepIdRef = useRef<string | null>(null);
  const [highlightedStepId, setHighlightedStepId] = useState<string | null>(
    null
  );
  const highlightTimeoutRef = useRef<number | null>(null);
  const [stepToDelete, setStepToDelete] = useState<string | null>(null);

  // Add Shared Step Dialog state
  const [isAddSharedStepDialogOpen, setIsAddSharedStepDialogOpen] = useState(false);
  const [insertSharedStepIndex, setInsertSharedStepIndex] = useState<number | null>(null);

  // Get shared steps options from metadata
  const sharedStepsOptions: SharedStepOption[] = stepMetadata.sharedSteps || [];

  const actionDefinitions = (stepMetadata?.actions ?? []).map((a) => ({
    value: a.value as ActionType,
    label: a.label,
    platform: a.platform as "both" | "web" | "mobile",
  }));

  const assertionDefinitions = (stepMetadata?.assertions ?? []).map((a) => ({
    value: a.value as AssertionType,
    label: a.label,
    needsSelector: a.needsSelector,
    needsValue: a.needsValue,
    needsAttribute: a.needsAttribute,
  }));

  const assertionsByAction = (stepMetadata?.assertionsByAction ?? {}) as Record<
    ActionType,
    AssertionType[]
  >;

  const keyOptions = stepMetadata?.keyOptions ?? [];

  const handleAddSharedStep = (sharedStep: SharedStepDetail) => {
    const newStep: TestStepWithoutOrder = {
      id: `shared-step-${sharedStep.id}-${Date.now()}`,
      actionType: "navigate", // placeholder, won't be used for shared steps
      actionParams: {},
      assertions: [],
      customExpectedResult: "",
      sharedStepId: sharedStep.id,
      sharedStepDetail: sharedStep,
    };

    if (insertSharedStepIndex !== null) {
      const updatedSteps = [
        ...steps.slice(0, insertSharedStepIndex),
        newStep,
        ...steps.slice(insertSharedStepIndex),
      ];
      onStepsChange(updatedSteps);
      setInsertSharedStepIndex(null); // Reset the index
    } else {
      // Fallback to adding at the end if no specific index is set
      onStepsChange([...steps, newStep]);
    }
    newStepIdRef.current = newStep.id;
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (newStepIdRef.current) {
      const stepId = newStepIdRef.current;
      newStepIdRef.current = null;

      setHighlightedStepId(stepId);

      setTimeout(() => {
        const stepElement = document.querySelector(
          `[data-step-id="${stepId}"]`
        );
        if (stepElement) {
          const mainElement = document.querySelector("main");
          if (mainElement) {
            const stepRect = stepElement.getBoundingClientRect();
            const mainRect = mainElement.getBoundingClientRect();
            const scrollTop =
              (mainElement as HTMLElement).scrollTop +
              stepRect.top -
              mainRect.top -
              mainRect.height / 2 +
              stepRect.height / 2;

            (mainElement as HTMLElement).scrollTo({
              top: scrollTop,
              behavior: "smooth",
            });
          } else {
            (stepElement as HTMLElement).scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }

          const firstInput = stepElement.querySelector(
            "input, select"
          ) as HTMLElement;
          if (firstInput) {
            setTimeout(() => firstInput.focus(), 300);
          }
        }
      }, 50);

      if (highlightTimeoutRef.current !== null) {
        window.clearTimeout(highlightTimeoutRef.current);
      }

      highlightTimeoutRef.current = window.setTimeout(() => {
        setHighlightedStepId(null);
        highlightTimeoutRef.current = null;
      }, 1000);
    }
  }, [steps]);

  const inputClass =
    "bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 input-field-focus transition-colors duration-150";

  const handleUpdateStep = (
    id: string,
    updates: Partial<TestStepWithoutOrder>
  ) => {
    onStepsChange(
      steps.map((step) => (step.id === id ? { ...step, ...updates } : step))
    );
  };

  const handleUpdateStepParam = (
    id: string,
    paramKey: keyof ActionParams,
    value: any
  ) => {
    onStepsChange(
      steps.map((step) =>
        step.id === id
          ? {
            ...step,
            actionParams: { ...step.actionParams, [paramKey]: value },
          }
          : step
      )
    );
  };

  const handleAddStep = () => {
    const actionType: ActionType = "click";
    const availableAssertions = assertionsByAction[actionType] || [];
    const defaultAssertionType =
      availableAssertions[0] || ("elementDisplayed" as AssertionType);
    const newStepId = Date.now().toString();
    const newStep: TestStepWithoutOrder = {
      id: newStepId,
      actionType,
      actionParams: {},
      assertions: [
        { id: newStepId + "_a", assertionType: defaultAssertionType },
      ],
    };
    newStepIdRef.current = newStepId;
    onStepsChange([...steps, newStep]);
  };

  const handleAddAssertion = (stepId: string) => {
    const step = steps.find((s) => s.id === stepId);
    if (!step) return;

    const availableAssertions = assertionsByAction[step.actionType] || [];
    const newAssertion: Assertion = {
      id: Date.now().toString(),
      assertionType: availableAssertions[0],
    };

    handleUpdateStep(stepId, {
      assertions: [...(step.assertions || []), newAssertion],
    });
  };

  const handleUpdateAssertion = (
    stepId: string,
    assertionId: string,
    updates: Partial<Assertion>
  ) => {
    const step = steps.find((s) => s.id === stepId);
    if (!step) return;

    const updatedAssertions = (step.assertions || []).map((assertion) =>
      assertion.id === assertionId ? { ...assertion, ...updates } : assertion
    );

    handleUpdateStep(stepId, { assertions: updatedAssertions });
  };

  const handleRemoveAssertion = (stepId: string, assertionId: string) => {
    const step = steps.find((s) => s.id === stepId);
    if (!step) return;

    const updatedAssertions = (step.assertions || []).filter(
      (assertion) => assertion.id !== assertionId
    );

    handleUpdateStep(stepId, { assertions: updatedAssertions });
  };

  const stepHasData = (step: TestStepWithoutOrder): boolean => {
    if (step.actionParams && Object.keys(step.actionParams).length > 0) {
      const hasFilledParam = Object.values(step.actionParams).some(
        (val) => val !== undefined && val !== null && val !== ""
      );
      if (hasFilledParam) return true;
    }

    if (step.customExpectedResult) return true;

    if (step.assertions && step.assertions.length > 0) {
      for (const assertion of step.assertions) {
        if (
          assertion.selector ||
          assertion.expectedValue ||
          assertion.attributeName ||
          assertion.attributeValue
        ) {
          return true;
        }
      }
    }

    return false;
  };

  const handleRemoveStep = (id: string) => {
    const step = steps.find((s) => s.id === id);
    if (!step) return;

    if (!stepHasData(step)) {
      onStepsChange(steps.filter((s) => s.id !== id));
      return;
    }

    setStepToDelete(id);
  };

  const confirmRemoveStep = () => {
    if (stepToDelete) {
      onStepsChange(steps.filter((step) => step.id !== stepToDelete));
      setStepToDelete(null);
    }
  };

  const handleDuplicateStep = (id: string) => {
    const stepIndex = steps.findIndex((s) => s.id === id);
    if (stepIndex === -1) return;

    const stepToDuplicate = steps[stepIndex];
    const newStepId = Date.now().toString();
    const duplicatedStep: TestStepWithoutOrder = {
      ...stepToDuplicate,
      id: newStepId,
      assertions: (stepToDuplicate.assertions || []).map((a) => ({
        ...a,
        id: newStepId + "_" + Math.random().toString(36).substr(2, 9),
      })),
    };

    const newSteps = [...steps];
    newSteps.splice(stepIndex + 1, 0, duplicatedStep);
    newStepIdRef.current = newStepId;
    onStepsChange(newSteps);
  };

  const handleInsertStepBelow = (id: string) => {
    const stepIndex = steps.findIndex((s) => s.id === id);
    if (stepIndex === -1) return;

    const actionType: ActionType = "click";
    const availableAssertions = assertionsByAction[actionType] || [];
    const defaultAssertionType =
      availableAssertions[0] || ("elementDisplayed" as AssertionType);
    const newStepId = Date.now().toString();
    const newStep: TestStepWithoutOrder = {
      id: newStepId,
      actionType,
      actionParams: {},
      assertions: [
        { id: newStepId + "_a", assertionType: defaultAssertionType },
      ],
    };

    const newSteps = [...steps];
    newSteps.splice(stepIndex + 1, 0, newStep);
    newStepIdRef.current = newStepId;
    onStepsChange(newSteps);
  };

  const handleInsertSharedStepBelow = (id: string) => {
    const index = steps.findIndex((step) => step.id === id);
    if (index !== -1) {
      setInsertSharedStepIndex(index + 1);
      setIsAddSharedStepDialogOpen(true);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((s) => s.id === active.id);
      const newIndex = steps.findIndex((s) => s.id === over.id);
      onStepsChange(arrayMove(steps, oldIndex, newIndex));
    }
  };

  const getStepColor = (type: ActionType) => {
    const colors: Record<ActionType, string> = {
      navigate: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      click: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      type: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      clear: "bg-slate-500/20 text-slate-400 border-slate-500/30",
      select: "bg-teal-500/20 text-teal-400 border-teal-500/30",
      scroll: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      swipe: "bg-pink-500/20 text-pink-400 border-pink-500/30",
      wait: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      waitForElement: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      pressKey: "bg-lime-500/20 text-lime-400 border-lime-500/30",
      longPress: "bg-rose-500/20 text-rose-400 border-rose-500/30",
      doubleClick: "bg-violet-500/20 text-violet-400 border-violet-500/30",
      hover: "bg-sky-500/20 text-sky-400 border-sky-500/30",
      dragDrop: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      back: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      refresh: "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30",
    };
    return colors[type];
  };

  const getStepLabel = (type: ActionType) => {
    return actionDefinitions.find((a) => a.value === type)?.label || type;
  };

  const renderStepFields = (step: TestStepWithoutOrder) => {
    switch (step.actionType) {
      case "navigate":
        return (
          <input
            type="text"
            value={step.actionParams?.url || ""}
            onChange={(e) =>
              handleUpdateStepParam(step.id, "url", e.target.value)
            }
            placeholder="URL (e.g. https://example.com) or relative path (e.g. /some-path)"
            className={`w-full ${inputClass}`}
          />
        );

      case "click":
      case "doubleClick":
      case "longPress":
        return (
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={step.actionParams?.selector || ""}
              onChange={(e) =>
                handleUpdateStepParam(step.id, "selector", e.target.value)
              }
              placeholder="Selector (e.g., #submit-btn)"
              className={inputClass}
            />
            <input
              type="text"
              value={step.actionParams?.text || ""}
              onChange={(e) =>
                handleUpdateStepParam(step.id, "text", e.target.value)
              }
              placeholder="Or Text (e.g., 'Submit')"
              className={inputClass}
            />
          </div>
        );

      case "type":
        return (
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={step.actionParams?.selector || ""}
              onChange={(e) =>
                handleUpdateStepParam(step.id, "selector", e.target.value)
              }
              placeholder="Selector (e.g., #email)"
              className={inputClass}
            />
            <input
              type="text"
              value={step.actionParams?.value || ""}
              onChange={(e) =>
                handleUpdateStepParam(step.id, "value", e.target.value)
              }
              placeholder="Text to type"
              className={inputClass}
            />
          </div>
        );

      case "clear":
      case "hover":
        return (
          <input
            type="text"
            value={step.actionParams?.selector || ""}
            onChange={(e) =>
              handleUpdateStepParam(step.id, "selector", e.target.value)
            }
            placeholder="Selector (e.g., #input-field)"
            className={`w-full ${inputClass}`}
          />
        );

      case "select":
        return (
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={step.actionParams?.selector || ""}
              onChange={(e) =>
                handleUpdateStepParam(step.id, "selector", e.target.value)
              }
              placeholder="Selector (e.g., #country)"
              className={inputClass}
            />
            <input
              type="text"
              value={step.actionParams?.value || ""}
              onChange={(e) =>
                handleUpdateStepParam(step.id, "value", e.target.value)
              }
              placeholder="Option value or text"
              className={inputClass}
            />
          </div>
        );

      case "scroll":
        return (
          <div className="grid grid-cols-2 gap-3">
            <select
              value={step.actionParams?.direction || "down"}
              onChange={(e) =>
                handleUpdateStepParam(
                  step.id,
                  "direction",
                  e.target.value as any
                )
              }
              className={inputClass}
            >
              <option value="down">Down</option>
              <option value="up">Up</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
            <input
              type="text"
              value={step.actionParams?.selector || ""}
              onChange={(e) =>
                handleUpdateStepParam(step.id, "selector", e.target.value)
              }
              placeholder="Target selector (optional)"
              className={inputClass}
            />
          </div>
        );

      case "swipe":
        return (
          <div className="grid grid-cols-2 gap-3">
            <select
              value={step.actionParams?.direction || "up"}
              onChange={(e) =>
                handleUpdateStepParam(
                  step.id,
                  "direction",
                  e.target.value as any
                )
              }
              className={inputClass}
            >
              <option value="up">Swipe Up</option>
              <option value="down">Swipe Down</option>
              <option value="left">Swipe Left</option>
              <option value="right">Swipe Right</option>
            </select>
            <input
              type="text"
              value={step.actionParams?.selector || ""}
              onChange={(e) =>
                handleUpdateStepParam(step.id, "selector", e.target.value)
              }
              placeholder="Element selector (optional)"
              className={inputClass}
            />
          </div>
        );

      case "wait":
        return (
          <input
            type="text"
            value={step.actionParams?.timeout || ""}
            onChange={(e) =>
              handleUpdateStepParam(step.id, "timeout", e.target.value)
            }
            placeholder="Duration in ms (e.g., 3000)"
            className={`w-full ${inputClass}`}
          />
        );

      case "waitForElement":
        return (
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={step.actionParams?.selector || ""}
              onChange={(e) =>
                handleUpdateStepParam(step.id, "selector", e.target.value)
              }
              placeholder="Selector (e.g., .loading-complete)"
              className={inputClass}
            />
            <input
              type="text"
              value={step.actionParams?.timeout || ""}
              onChange={(e) =>
                handleUpdateStepParam(step.id, "timeout", e.target.value)
              }
              placeholder="Timeout ms (e.g., 10000)"
              className={inputClass}
            />
          </div>
        );

      case "pressKey":
        return (
          <select
            value={step.actionParams?.key || "Enter"}
            onChange={(e) =>
              handleUpdateStepParam(step.id, "key", e.target.value)
            }
            className={`w-full ${inputClass}`}
          >
            {keyOptions.map((keyOption) => (
              <option key={keyOption.value} value={keyOption.value}>
                {keyOption.label}
              </option>
            ))}
          </select>
        );

      case "dragDrop":
        return (
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={step.actionParams?.selector || ""}
              onChange={(e) =>
                handleUpdateStepParam(step.id, "selector", e.target.value)
              }
              placeholder="Source selector"
              className={inputClass}
            />
            <input
              type="text"
              value={step.actionParams?.targetSelector || ""}
              onChange={(e) =>
                handleUpdateStepParam(step.id, "targetSelector", e.target.value)
              }
              placeholder="Target selector"
              className={inputClass}
            />
          </div>
        );

      case "back":
      case "refresh":
        return (
          <p className="text-xs text-slate-500 italic">
            No additional parameters needed
          </p>
        );

      default:
        return null;
    }
  };

  const renderAssertionFields = (
    step: TestStepWithoutOrder,
    assertion: Assertion
  ) => {
    const assertionDef = assertionDefinitions.find(
      (a) => a.value === assertion.assertionType
    );
    if (!assertionDef) return null;

    return (
      <div className="flex items-center gap-2 flex-1 flex-wrap">
        {assertionDef.needsSelector && (
          <input
            type="text"
            value={assertion.selector || ""}
            onChange={(e) =>
              handleUpdateAssertion(step.id, assertion.id || "", {
                selector: e.target.value,
              })
            }
            placeholder="Selector"
            className={`flex-1 min-w-[150px] ${inputClass} text-sm`}
          />
        )}
        {assertionDef.needsValue && (
          <input
            type="text"
            value={assertion.expectedValue || ""}
            onChange={(e) =>
              handleUpdateAssertion(step.id, assertion.id || "", {
                expectedValue: e.target.value,
              })
            }
            placeholder="Expected value"
            className={`flex-1 min-w-[150px] ${inputClass} text-sm`}
          />
        )}
        {assertionDef.needsAttribute && (
          <>
            <input
              type="text"
              value={assertion.attributeName || ""}
              onChange={(e) =>
                handleUpdateAssertion(step.id, assertion.id || "", {
                  attributeName: e.target.value,
                })
              }
              placeholder="Attr name"
              className={`flex-1 min-w-[120px] ${inputClass} text-sm`}
            />
            <input
              type="text"
              value={assertion.attributeValue || ""}
              onChange={(e) =>
                handleUpdateAssertion(step.id, assertion.id || "", {
                  attributeValue: e.target.value,
                })
              }
              placeholder="Attr value"
              className={`flex-1 min-w-[120px] ${inputClass} text-sm`}
            />
          </>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
      <div className="mb-6">
        <h2 className="mb-1">Test Steps</h2>
        <p className="text-sm text-slate-400">
          Define test steps in sequence (drag to reorder)
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={steps.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {steps.map((step, index) => (
              <SortableStepItem
                key={step.id}
                step={step}
                index={index}
                stepsLength={steps.length}
                inputClass={inputClass}
                isHighlighted={highlightedStepId === step.id}
                getStepColor={getStepColor}
                getStepLabel={getStepLabel}
                actionDefinitions={actionDefinitions}
                assertionsByAction={assertionsByAction}
                assertionDefinitions={assertionDefinitions}
                handleUpdateStep={handleUpdateStep}
                handleRemoveStep={handleRemoveStep}
                handleDuplicateStep={handleDuplicateStep}
                handleInsertStepBelow={handleInsertStepBelow}
                handleAddAssertion={handleAddAssertion}
                handleUpdateAssertion={handleUpdateAssertion}
                handleRemoveAssertion={handleRemoveAssertion}
                renderStepFields={renderStepFields}
                renderAssertionFields={renderAssertionFields}
                allowAddSharedStep={allowAddSharedStep}
                handleInsertSharedStepBelow={handleInsertSharedStepBelow}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        onClick={handleAddStep}
        variant="outline"
        className="w-full mt-4 border-slate-600 border-dashed bg-transparent text-slate-400 hover:bg-slate-800 hover:text-white hover:border-slate-500"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Step
      </Button>

      {allowAddSharedStep && (
        <>
          <Button
            onClick={() => setIsAddSharedStepDialogOpen(true)}
            variant="outline"
            className="w-full mt-2 border-purple-600 border-dashed bg-transparent text-purple-400 hover:bg-purple-900/20 hover:text-purple-300 hover:border-purple-500"
          >
            <PackagePlus className="w-4 h-4 mr-2" />
            Add Shared Step
          </Button>

          <AddSharedStepDialog
            isOpen={isAddSharedStepDialogOpen}
            onClose={() => {
              setIsAddSharedStepDialogOpen(false);
              setInsertSharedStepIndex(null); // Reset the index when dialog is closed
            }}
            onAdd={handleAddSharedStep}
            sharedStepsOptions={sharedStepsOptions}
          />
        </>
      )}

      <ConfirmDialog
        isOpen={!!stepToDelete}
        title="Delete Test Step?"
        message="Are you sure you want to delete this test step? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmRemoveStep}
        onCancel={() => setStepToDelete(null)}
      />
    </div>
  );
}
