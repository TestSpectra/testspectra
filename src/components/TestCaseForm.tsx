import { ArrowLeft, Code, Loader2, Save, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getApiUrl } from "../lib/config";
import { authService } from "../services/auth-service";
import {
  TestCase,
  testCaseService,
  TestStep,
  TestStepMetadataResponse
} from "../services/test-case-service";
import { convertStepsForBackend, convertStepsFromBackend } from "../utils/testCaseUtils";
import { TestCaseMetadata } from "./TestCaseMetadata";
import { TestStepsEditor } from "./TestStepsEditor";
import { Button } from "./ui/button";
import { RichTextEditor } from "./ui/rich-text-editor";
import { BackButton } from "./BackButton";

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

  // Metadata for actions, assertions, and key options provided by backend
  const [stepMetadata, setStepMetadata] =
    useState<TestStepMetadataResponse | null>(null);

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

  // Fetch test step metadata (actions/assertions/options) on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const data = await testCaseService.getTestStepMetadata();
        setStepMetadata(data);
      } catch (error) {
        console.error("Failed to load test step metadata:", error);
      }
    };

    fetchMetadata();
  }, []);

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

    const stepsForBackend = convertStepsForBackend(steps);

    try {
      const apiUrl = await getApiUrl();

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
        await testCaseService.createTestCase({
          title: formData.title,
          suite: formData.suite,
          priority: formData.priority,
          caseType: formData.caseType,
          automation:
            formData.automationStatus === "automated" ? "Automated" : "Manual",
          preCondition: formData.preCondition || undefined,
          postCondition: formData.postCondition || undefined,
          steps: stepsForBackend,
        });
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

  // Show loading state when fetching test case
  if (isLoadingTestCase || !stepMetadata) {
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
          <BackButton onClick={onCancel} />
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
              ? "fixed top-12 left-1/2 -translate-x-1/2 z-40 w-max rounded-lg flex justify-center bg-slate-950/95"
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
              ? "fixed top-12 left-1/2 -translate-x-1/2 z-40 w-max rounded-lg flex justify-center bg-slate-950/95"
              : ""
          }
        >
          <div
            className={
              `p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm flex items-center gap-2 ${!isMessageInView ? "max-w-md shadow-lg" : "mx-0 mt-4 mb-4"}`}
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
          <TestStepsEditor
            steps={steps}
            onStepsChange={setSteps}
            stepMetadata={stepMetadata as TestStepMetadataResponse}
            allowAddSharedStep={true}
          />
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
          {isEditing && loadedTestCase && (
            <TestCaseMetadata testCase={loadedTestCase} />
          )}
        </div>
      </div>
    </div>
  );
}
