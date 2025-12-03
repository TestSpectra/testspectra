import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Code,
  Save,
  X,
  Loader2,
  GripVertical,
  Copy,
  PlusCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ConfirmDialog } from "./SimpleDialog";
import { RichTextEditor } from "./ui/rich-text-editor";
import { authService } from "../services/auth-service";
import { TestCase, testCaseService } from "../services/test-case-service";
import { getApiUrl } from "../lib/config";
import "../styles/drag-handle.css";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TestSuite {
  id: string;
  name: string;
  description?: string;
}

interface TestCaseFormProps {
  testCaseId?: string | null; // For edit mode (ID to fetch)
  onSave: () => void;
  onCancel: () => void;
}

// Action Types
type ActionType =
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

// Assertion Types
type AssertionType =
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

interface Assertion {
  id?: string; // Frontend only, for React keys
  assertionType: AssertionType;
  selector?: string;
  expectedValue?: string;
  attributeName?: string;
  attributeValue?: string;
}

interface ActionParams {
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

interface TestStep {
  id: string;
  actionType: ActionType;
  actionParams: ActionParams;
  assertions: Assertion[];
  customExpectedResult?: string;
}

// Action definitions with labels
const ACTION_DEFINITIONS: {
  value: ActionType;
  label: string;
  platform: "both" | "web" | "mobile";
}[] = [
    { value: "navigate", label: "Navigate to URL", platform: "both" },
    { value: "click", label: "Click / Tap", platform: "both" },
    { value: "type", label: "Type Text", platform: "both" },
    { value: "clear", label: "Clear Input", platform: "both" },
    { value: "select", label: "Select Option", platform: "both" },
    { value: "scroll", label: "Scroll", platform: "both" },
    { value: "swipe", label: "Swipe", platform: "mobile" },
    { value: "wait", label: "Wait (Duration)", platform: "both" },
    { value: "waitForElement", label: "Wait for Element", platform: "both" },
    { value: "pressKey", label: "Press Key", platform: "both" },
    { value: "longPress", label: "Long Press / Hold", platform: "both" },
    { value: "doubleClick", label: "Double Click / Tap", platform: "both" },
    { value: "hover", label: "Hover", platform: "web" },
    { value: "dragDrop", label: "Drag and Drop", platform: "both" },
    { value: "back", label: "Go Back", platform: "both" },
    { value: "refresh", label: "Refresh Page", platform: "web" },
  ];

// Assertion definitions with labels
const ASSERTION_DEFINITIONS: {
  value: AssertionType;
  label: string;
  needsSelector: boolean;
  needsValue: boolean;
  needsAttribute: boolean;
}[] = [
    {
      value: "elementDisplayed",
      label: "Element is Visible",
      needsSelector: true,
      needsValue: false,
      needsAttribute: false,
    },
    {
      value: "elementNotDisplayed",
      label: "Element is Hidden",
      needsSelector: true,
      needsValue: false,
      needsAttribute: false,
    },
    {
      value: "elementExists",
      label: "Element Exists",
      needsSelector: true,
      needsValue: false,
      needsAttribute: false,
    },
    {
      value: "elementClickable",
      label: "Element is Clickable",
      needsSelector: true,
      needsValue: false,
      needsAttribute: false,
    },
    {
      value: "elementInViewport",
      label: "Element in Viewport",
      needsSelector: true,
      needsValue: false,
      needsAttribute: false,
    },
    {
      value: "textEquals",
      label: "Text Equals",
      needsSelector: true,
      needsValue: true,
      needsAttribute: false,
    },
    {
      value: "textContains",
      label: "Text Contains",
      needsSelector: true,
      needsValue: true,
      needsAttribute: false,
    },
    {
      value: "valueEquals",
      label: "Value Equals",
      needsSelector: true,
      needsValue: true,
      needsAttribute: false,
    },
    {
      value: "valueContains",
      label: "Value Contains",
      needsSelector: true,
      needsValue: true,
      needsAttribute: false,
    },
    {
      value: "urlEquals",
      label: "URL Equals",
      needsSelector: false,
      needsValue: true,
      needsAttribute: false,
    },
    {
      value: "urlContains",
      label: "URL Contains",
      needsSelector: false,
      needsValue: true,
      needsAttribute: false,
    },
    {
      value: "titleEquals",
      label: "Title Equals",
      needsSelector: false,
      needsValue: true,
      needsAttribute: false,
    },
    {
      value: "titleContains",
      label: "Title Contains",
      needsSelector: false,
      needsValue: true,
      needsAttribute: false,
    },
    {
      value: "hasClass",
      label: "Has CSS Class",
      needsSelector: true,
      needsValue: true,
      needsAttribute: false,
    },
    {
      value: "hasAttribute",
      label: "Has Attribute",
      needsSelector: true,
      needsValue: false,
      needsAttribute: true,
    },
    {
      value: "isEnabled",
      label: "Is Enabled",
      needsSelector: true,
      needsValue: false,
      needsAttribute: false,
    },
    {
      value: "isDisabled",
      label: "Is Disabled",
      needsSelector: true,
      needsValue: false,
      needsAttribute: false,
    },
    {
      value: "isSelected",
      label: "Is Selected / Checked",
      needsSelector: true,
      needsValue: false,
      needsAttribute: false,
    },
  ];

// Assertions available per action type
const ASSERTIONS_BY_ACTION: Record<ActionType, AssertionType[]> = {
  navigate: [
    "urlContains",
    "urlEquals",
    "titleContains",
    "titleEquals",
    "elementDisplayed",
    "elementExists",
  ],
  click: [
    "elementDisplayed",
    "elementNotDisplayed",
    "elementExists",
    "textContains",
    "textEquals",
    "urlContains",
    "hasClass",
    "isEnabled",
    "isDisabled",
  ],
  type: [
    "valueEquals",
    "valueContains",
    "elementDisplayed",
    "hasClass",
    "isEnabled",
    "textContains",
  ],
  clear: ["valueEquals", "elementDisplayed"],
  select: ["valueEquals", "isSelected", "textEquals", "elementDisplayed"],
  scroll: ["elementDisplayed", "elementInViewport", "elementExists"],
  swipe: ["elementDisplayed", "elementNotDisplayed", "elementExists"],
  wait: ["elementDisplayed", "elementExists", "elementClickable"],
  waitForElement: ["elementDisplayed", "elementExists", "elementClickable"],
  pressKey: [
    "elementDisplayed",
    "valueContains",
    "textContains",
    "urlContains",
  ],
  longPress: ["elementDisplayed", "textContains", "hasClass", "elementExists"],
  doubleClick: [
    "elementDisplayed",
    "textContains",
    "hasClass",
    "elementExists",
  ],
  hover: ["elementDisplayed", "hasClass", "hasAttribute", "textContains"],
  dragDrop: ["elementDisplayed", "hasClass", "elementExists"],
  back: ["urlContains", "elementDisplayed", "titleContains"],
  refresh: ["elementDisplayed", "elementExists"],
};

// Key options for pressKey action
const KEY_OPTIONS = [
  { value: "Enter", label: "Enter" },
  { value: "Tab", label: "Tab" },
  { value: "Escape", label: "Escape" },
  { value: "Backspace", label: "Backspace" },
  { value: "Delete", label: "Delete" },
  { value: "ArrowUp", label: "Arrow Up" },
  { value: "ArrowDown", label: "Arrow Down" },
  { value: "ArrowLeft", label: "Arrow Left" },
  { value: "ArrowRight", label: "Arrow Right" },
  { value: "Space", label: "Space" },
];

// Sortable Action Item Component
interface SortableStepItemProps {
  step: TestStep;
  index: number;
  stepsLength: number;
  inputClass: string;
  isHighlighted: boolean;
  getStepColor: (type: ActionType) => string;
  getStepLabel: (type: ActionType) => string;
  handleUpdateStep: (id: string, updates: Partial<TestStep>) => void;
  handleRemoveStep: (id: string) => void;
  handleDuplicateStep: (id: string) => void;
  handleInsertStepBelow: (id: string) => void;
  handleAddAssertion: (stepId: string) => void;
  handleUpdateAssertion: (
    stepId: string,
    assertionId: string,
    updates: Partial<Assertion>
  ) => void;
  handleRemoveAssertion: (stepId: string, assertionId: string) => void;
  renderStepFields: (step: TestStep) => React.ReactNode;
  renderAssertionFields: (
    step: TestStep,
    assertion: Assertion
  ) => React.ReactNode;
}

function SortableStepItem({
  step,
  index,
  stepsLength,
  inputClass,
  isHighlighted,
  getStepColor,
  getStepLabel,
  handleUpdateStep,
  handleRemoveStep,
  handleDuplicateStep,
  handleInsertStepBelow,
  handleAddAssertion,
  handleUpdateAssertion,
  handleRemoveAssertion,
  renderStepFields,
  renderAssertionFields,
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-step-id={step.id}
      className={`bg-slate-800/50 p-4 rounded-lg transition-colors ${
        isDragging ? "ring-2 ring-blue-500" : ""
      } ${isHighlighted ? "step-card-highlighted" : ""}`}
    >
      {/* Step Header */}
      <div className="flex items-start gap-3">
        {/* Number with Drag Handle on Hover */}
        <div className="drag-handle-container" {...attributes} {...listeners}>
          <span className="step-number">{index + 1}.</span>
          <div className="drag-icon">
            <GripVertical size={18} />
          </div>
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <select
              value={step.actionType}
              onChange={(e) => {
                const newType = e.target.value as ActionType;
                const defaultAssertionType = ASSERTIONS_BY_ACTION[newType][0];

                // Reset all step-specific fields when changing type
                handleUpdateStep(step.id, {
                  actionType: newType,
                  // Reset actionParams
                  actionParams: {},
                  // Keep assertions but reset to default for new type
                  assertions: [
                    {
                      id: Date.now().toString(),
                      assertionType: defaultAssertionType,
                    },
                  ],
                  // Keep custom expected result
                  customExpectedResult: step.customExpectedResult,
                });
              }}
              className={inputClass}
            >
              {ACTION_DEFINITIONS.map((actionDef) => (
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

      {/* Expected Result - Assertions */}
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

        {/* Assertions List */}
        {(step.assertions || []).length > 0 && (
          <div className="space-y-2 mb-3">
            {(step.assertions || []).map((assertion) => {
              const availableAssertions = ASSERTIONS_BY_ACTION[step.actionType];
              const filteredDefs = ASSERTION_DEFINITIONS.filter((a) =>
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

        {/* Custom Assertion (for edge cases) */}
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
    </div>
  );
}

export function TestCaseForm({
  testCaseId,
  onSave,
  onCancel,
}: TestCaseFormProps) {
  const [loadedTestCase, setLoadedTestCase] = useState<TestCase | null>(null);
  const [isLoadingTestCase, setIsLoadingTestCase] = useState(false);

  // Fetch test case if testCaseId is provided (edit mode)
  useEffect(() => {
    const fetchTestCase = async () => {
      if (testCaseId) {
        try {
          setIsLoadingTestCase(true);
          const data = await testCaseService.getTestCase(testCaseId);
          setLoadedTestCase(data);
        } catch (error) {
          console.error("Failed to load test case:", error);
        } finally {
          setIsLoadingTestCase(false);
        }
      }
    };

    fetchTestCase();
  }, [testCaseId]);

  // Convert backend steps to frontend actions format
  const convertStepsFromBackend = (steps: any[]): TestStep[] => {
    if (!steps || steps.length === 0) {
      return [];
    }

    return steps.map((step, index) => ({
      id: step.id || `step-${index}`,
      actionType: step.actionType as ActionType,
      actionParams: step.actionParams || {},
      customExpectedResult: step.customExpectedResult || "",
      assertions: (step.assertions || []).map(
        (assertion: any, idx: number) => ({
          ...assertion,
          id: assertion.id || `assertion-${index}-${idx}`, // Add id for React keys
        })
      ),
    }));
  };

  const [formData, setFormData] = useState({
    id: "",
    title: "",
    suite: "",
    priority: "Medium",
    caseType: "Positive",
    preCondition: "",
    postCondition: "",
    automationStatus: "manual",
    filePath: "",
  });

  const [steps, setSteps] = useState<TestStep[]>([]);

  // Update form when loadedTestCase changes (loaded from API)
  useEffect(() => {
    if (loadedTestCase) {
      setFormData({
        id: loadedTestCase.id || "",
        title: loadedTestCase.title || "",
        suite: loadedTestCase.suite || "",
        priority: loadedTestCase.priority || "Medium",
        caseType: loadedTestCase.caseType || "Positive",
        preCondition: loadedTestCase.preCondition || "",
        postCondition: loadedTestCase.postCondition || "",
        automationStatus:
          loadedTestCase.automation === "Automated" ? "automated" : "manual",
        filePath: "",
      });
      setSteps(convertStepsFromBackend(loadedTestCase.steps || []));
    }
  }, [loadedTestCase]);

  const [isCreatingNewSuite, setIsCreatingNewSuite] = useState(false);
  const [newSuiteName, setNewSuiteName] = useState("");
  const [existingSuites, setExistingSuites] = useState<TestSuite[]>([]);
  const [isLoadingSuites, setIsLoadingSuites] = useState(false);
  const [isCreatingSuite, setIsCreatingSuite] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isMessageInView, setIsMessageInView] = useState(true);
  const messageAreaRef = useRef<HTMLDivElement>(null);

  // Track if message area is in viewport
  useEffect(() => {
    const element = messageAreaRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsMessageInView(entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "0px" }
    );

    observer.observe(element);

    return () => observer.disconnect();
  });

  const isEditing = !!testCaseId;

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (!isSaving) {
          handleSave();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, formData, steps]);

  // Fetch suites on mount
  useEffect(() => {
    fetchSuites();
  }, []);

  const fetchSuites = async () => {
    setIsLoadingSuites(true);
    try {
      const apiUrl = await getApiUrl();
      const token = authService.getAccessToken();
      const response = await fetch(`${apiUrl}/test-suites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setExistingSuites(data.suites || []);
      }
    } catch (error) {
      console.error("Failed to fetch suites:", error);
    } finally {
      setIsLoadingSuites(false);
    }
  };

  const handleCreateSuite = async () => {
    if (!newSuiteName.trim()) return;

    setIsCreatingSuite(true);
    try {
      const apiUrl = await getApiUrl();
      const token = authService.getAccessToken();
      const response = await fetch(`${apiUrl}/test-suites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newSuiteName.trim() }),
      });

      if (response.ok) {
        const newSuite = await response.json();
        setExistingSuites((prev) =>
          [...prev, newSuite].sort((a, b) => a.name.localeCompare(b.name))
        );
        setFormData({ ...formData, suite: newSuite.name });
        setIsCreatingNewSuite(false);
        setNewSuiteName("");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create suite");
      }
    } catch (error) {
      console.error("Failed to create suite:", error);
    } finally {
      setIsCreatingSuite(false);
    }
  };

  // Convert steps to API format (remove frontend-only fields)
  const convertStepsForBackend = () => {
    return steps.map((step, index) => ({
      stepOrder: index + 1,
      actionType: step.actionType,
      actionParams: step.actionParams || {},
      assertions: (step.assertions || []).map(({ id, ...assertion }) => assertion), // Remove id field
      customExpectedResult: step.customExpectedResult || null,
    }));
  };

  // Handle save test case
  const handleSave = async () => {
    // Validate required fields
    if (!formData.title.trim()) {
      setSaveError("Title is required");
      return;
    }
    if (!formData.suite) {
      setSaveError("Suite is required");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const apiUrl = await getApiUrl();
      const stepsForBackend = convertStepsForBackend();

      if (isEditing && testCaseId) {
        // Update existing test case
        await testCaseService.updateTestCase(testCaseId, {
          title: formData.title,
          suite: formData.suite,
          priority: formData.priority,
          caseType: formData.caseType,
          automation:
            formData.automationStatus === "automated" ? "Automated" : "Manual",
          preCondition: formData.preCondition,
          postCondition: formData.postCondition,
        });

        // Update steps separately using the new format
        await testCaseService.updateTestSteps(testCaseId, stepsForBackend);
      } else {
        // Create new test case
        const token = authService.getAccessToken();
        const response = await fetch(`${apiUrl}/test-cases`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: formData.title,
            suite: formData.suite,
            priority: formData.priority,
            caseType: formData.caseType,
            automation:
              formData.automationStatus === "automated"
                ? "Automated"
                : "Manual",
            preCondition: formData.preCondition || null,
            postCondition: formData.postCondition || null,
            steps,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create test case");
        }
      }

      // Success - show success message
      setSaveError(null);
      setSaveSuccess(true);

      if (!isEditing) {
        // CREATE mode: scroll to top, show message, then navigate back
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => {
          setSaveSuccess(false);
          onSave(); // Navigate back to list
        }, 1000);
      } else {
        // EDIT mode: just show message, stay on form
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save test case:", error);
      setSaveError(
        error instanceof Error ? error.message : "Failed to save test case"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Ref to track newly added action for auto-scroll and focus
  const newStepIdRef = useRef<string | null>(null);

  // State to track highlighted step (for temporary glow effect)
  const [highlightedStepId, setHighlightedStepId] = useState<string | null>(
    null
  );

  const highlightTimeoutRef = useRef<number | null>(null);

  // Auto-scroll, highlight, and focus on newly added action
  useEffect(() => {
    if (newStepIdRef.current) {
      const stepId = newStepIdRef.current;
      newStepIdRef.current = null;

      // Set highlight immediately
      setHighlightedStepId(stepId);

      // Small delay to ensure DOM is updated
      setTimeout(() => {
        const stepElement = document.querySelector(
          `[data-step-id="${stepId}"]`
        );
        if (stepElement) {
          stepElement.scrollIntoView({ behavior: "smooth", block: "center" });

          // Focus on the first input field in the step
          const firstInput = stepElement.querySelector(
            "input, select"
          ) as HTMLElement;
          if (firstInput) {
            setTimeout(() => firstInput.focus(), 300);
          }
        }
      }, 50);

      // Remove highlight after animation completes
      if (highlightTimeoutRef.current !== null) {
        window.clearTimeout(highlightTimeoutRef.current);
      }

      highlightTimeoutRef.current = window.setTimeout(() => {
        setHighlightedStepId(null);
        highlightTimeoutRef.current = null;
      }, 1000);
    }
  }, [steps]);

  const handleAddStep = () => {
    const actionType: ActionType = "click";
    const defaultAssertionType = ASSERTIONS_BY_ACTION[actionType][0];
    const newStepId = Date.now().toString();
    const newAction: TestStep = {
      id: newStepId,
      actionType: actionType,
      actionParams: {},
      assertions: [
        { id: newStepId + "_a", assertionType: defaultAssertionType },
      ],
    };
    newStepIdRef.current = newStepId;
    setSteps([...steps, newAction]);
  };

  const handleAddAssertion = (stepId: string) => {
    const step = steps.find((s) => s.id === stepId);
    if (!step) return;

    const availableAssertions = ASSERTIONS_BY_ACTION[step.actionType];
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

  // State for delete confirmation dialog
  const [stepToDelete, setStepToDelete] = useState<string | null>(null);

  // Check if step has any filled data (besides id and type)
  const stepHasData = (step: TestStep): boolean => {
    // Check actionParams
    if (step.actionParams && Object.keys(step.actionParams).length > 0) {
      const hasFilledParam = Object.values(step.actionParams).some(
        (val) => val !== undefined && val !== null && val !== ""
      );
      if (hasFilledParam) return true;
    }

    if (step.customExpectedResult) return true;

    // Check if any assertion has filled data
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

    // If step has no data, delete immediately
    if (!stepHasData(step)) {
      setSteps(steps.filter((s) => s.id !== id));
      return;
    }

    // Otherwise show confirmation dialog
    setStepToDelete(id);
  };

  const confirmRemoveStep = () => {
    if (stepToDelete) {
      setSteps(steps.filter((step) => step.id !== stepToDelete));
      setStepToDelete(null);
    }
  };

  const handleDuplicateStep = (id: string) => {
    const stepIndex = steps.findIndex((s) => s.id === id);
    if (stepIndex === -1) return;

    const stepToDuplicate = steps[stepIndex];
    const newStepId = Date.now().toString();
    const duplicatedStep: TestStep = {
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
    setSteps(newSteps);
  };

  const handleInsertStepBelow = (id: string) => {
    const stepIndex = steps.findIndex((s) => s.id === id);
    if (stepIndex === -1) return;

    const actionType: ActionType = "click";
    const defaultAssertionType = ASSERTIONS_BY_ACTION[actionType][0];
    const newStepId = Date.now().toString();
    const newStep: TestStep = {
      id: newStepId,
      actionType: actionType,
      actionParams: {},
      assertions: [
        { id: newStepId + "_a", assertionType: defaultAssertionType },
      ],
    };

    const newSteps = [...steps];
    newSteps.splice(stepIndex + 1, 0, newStep);
    newStepIdRef.current = newStepId;
    setSteps(newSteps);
  };

  // Drag and drop sensors
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((s) => s.id === active.id);
      const newIndex = steps.findIndex((s) => s.id === over.id);
      setSteps(arrayMove(steps, oldIndex, newIndex));
    }
  };

  const handleUpdateStep = (id: string, updates: Partial<TestStep>) => {
    setSteps(
      steps.map((step) => (step.id === id ? { ...step, ...updates } : step))
    );
  };

  const handleUpdateStepParam = (
    id: string,
    paramKey: keyof ActionParams,
    value: any
  ) => {
    setSteps(
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

  const handleGenerateScript = () => {
    alert(
      "Script skeleton akan dibuat di working directory:\n\n/tests/" +
      formData.suite.toLowerCase().replace(/\s+/g, "-") +
      "/" +
      formData.id.toLowerCase() +
      ".test.ts"
    );
  };

  const inputClass =
    "bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 input-field-focus transition-colors duration-150";

  const renderStepFields = (step: TestStep) => {
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
            {KEY_OPTIONS.map((key) => (
              <option key={key.value} value={key.value}>
                {key.label}
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
                handleUpdateStepParam(
                  step.id,
                  "targetSelector",
                  e.target.value
                )
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

  const renderAssertionFields = (step: TestStep, assertion: Assertion) => {
    const assertionDef = ASSERTION_DEFINITIONS.find(
      (a) => a.value === assertion.assertionType
    );
    if (!assertionDef) return null;

    return (
      <div className="flex items-center gap-2 flex-1">
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
            className={`flex-1 ${inputClass} text-sm`}
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
            className={`flex-1 ${inputClass} text-sm`}
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
              className={`flex-1 ${inputClass} text-sm`}
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
              className={`flex-1 ${inputClass} text-sm`}
            />
          </>
        )}
      </div>
    );
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
    return ACTION_DEFINITIONS.find((a) => a.value === type)?.label || type;
  };

  // Show loading state when fetching test case
  if (isLoadingTestCase) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading test case...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="mb-2">
              {isEditing ? "Edit Test Case" : "Create New Test Case"}
            </h1>
            <p className="text-slate-400">
              {isEditing
                ? `Mengedit ${formData.title || testCaseId}`
                : "Tambahkan test case baru dengan action-based steps"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-slate-600 bg-transparent text-slate-100 hover:bg-slate-800 hover:text-white"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? "Menyimpan..." : "Save Test Case"}
          </Button>
        </div>
      </div>

      {/* Message Area Anchor (for intersection observer) */}
      <div ref={messageAreaRef} className="h-px" />

      {/* Save Error Message */}
      {saveError && (
        <div
          className={
            !isMessageInView
              ? "fixed top-4 left-1/2 -translate-x-1/2 z-40 w-max rounded-lg flex justify-center bg-slate-950/95"
              : ""
          }
        >
          <div
            className={`p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm ${!isMessageInView ? "max-w-md shadow-lg" : "mx-0 mt-4 mb-4"
              }`}
          >
            {saveError}
          </div>
        </div>
      )}

      {/* Save Success Message */}
      {saveSuccess && (
        <div
          className={
            !isMessageInView
              ? "fixed top-4 left-1/2 -translate-x-1/2 z-40 w-max rounded-lg flex justify-center bg-slate-950/95"
              : ""
          }
        >
          <div
            className={`p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm flex items-center gap-2 ${!isMessageInView ? "max-w-md shadow-lg" : "mx-0 mt-4 mb-4"
              }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Test case berhasil disimpan!
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h2 className="mb-6">Informasi Dasar</h2>

            {/* <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Test Case ID
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) =>
                    setFormData({ ...formData, id: e.target.value })
                  }
                  placeholder="TC-1001"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isEditing}
                />
              </div>
            </div> */}

            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Login dengan kredensial valid"
                className={`w-full ${inputClass}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Test Suite/Module
                </label>
                {isCreatingNewSuite ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSuiteName}
                      onChange={(e) => setNewSuiteName(e.target.value)}
                      placeholder="Nama suite baru..."
                      className={`flex-1 ${inputClass}`}
                      autoFocus
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleCreateSuite()
                      }
                    />
                    <button
                      type="button"
                      onClick={handleCreateSuite}
                      disabled={isCreatingSuite}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50"
                    >
                      {isCreatingSuite ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        "OK"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNewSuite(false);
                        setNewSuiteName("");
                      }}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <select
                    value={formData.suite}
                    onChange={(e) => {
                      if (e.target.value === "__new__") {
                        setIsCreatingNewSuite(true);
                      } else {
                        setFormData({ ...formData, suite: e.target.value });
                      }
                    }}
                    disabled={isLoadingSuites}
                    className={`w-full ${inputClass} disabled:opacity-50`}
                  >
                    <option value="">
                      {isLoadingSuites ? "Loading..." : "Pilih Test Suite..."}
                    </option>
                    {existingSuites.map((suite) => (
                      <option key={suite.id} value={suite.name}>
                        {suite.name}
                      </option>
                    ))}
                    <option value="__new__">+ Buat Suite Baru</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Prioritas
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                  className={`w-full ${inputClass}`}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">
                Tipe Test Case
              </label>
              <select
                value={formData.caseType}
                onChange={(e) =>
                  setFormData({ ...formData, caseType: e.target.value })
                }
                className={`w-full ${inputClass}`}
              >
                <option value="Positive">Positive Case</option>
                <option value="Negative">Negative Case</option>
                <option value="Edge">Edge Case</option>
              </select>
              <p className="text-xs text-slate-500 mt-2">
                Positive: Skenario normal/happy path | Negative: Skenario error
                handling | Edge: Corner case/boundary conditions
              </p>
            </div>

            {/* Pre-Condition */}
            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">
                Pre-Condition
              </label>
              <RichTextEditor
                value={formData.preCondition}
                onChange={(value) =>
                  setFormData({ ...formData, preCondition: value })
                }
                placeholder="Kondisi awal yang harus dipenuhi sebelum test dijalankan (e.g., User sudah login, data X sudah tersedia...)"
              />
              <p className="text-xs text-slate-500 mt-2">
                Kondisi yang harus dipenuhi sebelum menjalankan test case ini
              </p>
            </div>

            {/* Post-Condition */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Post-Condition
              </label>
              <RichTextEditor
                value={formData.postCondition}
                onChange={(value) =>
                  setFormData({ ...formData, postCondition: value })
                }
                placeholder="Kondisi akhir setelah test selesai (e.g., Data tersimpan di database, Session ter-invalidate...)"
              />
              <p className="text-xs text-slate-500 mt-2">
                Kondisi yang diharapkan setelah test case selesai dijalankan
              </p>
            </div>
          </div>

          {/* Action Steps */}
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
                      handleUpdateStep={handleUpdateStep}
                      handleRemoveStep={handleRemoveStep}
                      handleDuplicateStep={handleDuplicateStep}
                      handleInsertStepBelow={handleInsertStepBelow}
                      handleAddAssertion={handleAddAssertion}
                      handleUpdateAssertion={handleUpdateAssertion}
                      handleRemoveAssertion={handleRemoveAssertion}
                      renderStepFields={renderStepFields}
                      renderAssertionFields={renderAssertionFields}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Add Step Button - at bottom for easy access */}
            <Button
              onClick={handleAddStep}
              variant="outline"
              className="w-full mt-4 border-slate-600 border-dashed bg-transparent text-slate-400 hover:bg-slate-800 hover:text-white hover:border-slate-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Otomasi */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h2 className="mb-4">Automation Status</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                <input
                  type="radio"
                  name="automation"
                  value="manual"
                  checked={formData.automationStatus === "manual"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      automationStatus: e.target.value,
                    })
                  }
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
                />
                <div>
                  <p className="text-sm text-slate-200">Manual</p>
                  <p className="text-xs text-slate-500">
                    Dijalankan oleh QA manual
                  </p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                <input
                  type="radio"
                  name="automation"
                  value="automated"
                  checked={formData.automationStatus === "automated"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      automationStatus: e.target.value,
                    })
                  }
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
                />
                <div>
                  <p className="text-sm text-slate-200">Automated</p>
                  <p className="text-xs text-slate-500">
                    Dijalankan oleh automation script
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Automation Details */}
          {formData.automationStatus === "automated" && (
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <h2 className="mb-4">Script Generation</h2>

              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">
                  File Path
                </label>
                <input
                  type="text"
                  value={formData.filePath}
                  readOnly
                  placeholder="/tests/authentication/tc-1001.test.ts"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-400 focus:outline-none cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Path diisi otomatis dari sinkronisasi kode
                </p>
              </div>

              <Button
                onClick={handleGenerateScript}
                className="w-full bg-linear-to-r from-orange-600 to-orange-500 cursor-pointer text-white"
              >
                <Code className="w-4 h-4 mr-2" />
                Generate Script Skeleton
              </Button>
              <p className="text-xs text-slate-500 mt-3">
                Akan membuat file .test.ts kosong di working directory dengan
                struktur dasar berdasarkan actions yang didefinisikan
              </p>
            </div>
          )}

          {/* Quick Info - Only show in edit mode */}
          {isEditing && (
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <h3 className="text-sm mb-4">Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Created By:</span>
                  <span className="text-slate-200">Ahmad R.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Created At:</span>
                  <span className="text-slate-200">24 Nov 2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Last Modified:</span>
                  <span className="text-slate-200">24 Nov 2025</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Action Confirmation Dialog */}
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
