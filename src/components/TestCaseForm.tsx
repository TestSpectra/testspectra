import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Code, Save, X } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface TestCaseFormProps {
  testCase?: any;
  onSave: () => void;
  onCancel: () => void;
}

type ActionType =
  | "navigate"
  | "click"
  | "type"
  | "select"
  | "wait"
  | "assert_visible";

interface TestAction {
  id: string;
  type: ActionType;
  selector?: string;
  value?: string;
  text?: string;
  url?: string;
  timeout?: string;
}

export function TestCaseForm({
  testCase,
  onSave,
  onCancel,
}: TestCaseFormProps) {
  const [formData, setFormData] = useState({
    id: testCase?.id || "",
    title: testCase?.title || "",
    suite: testCase?.suite || "",
    priority: testCase?.priority || "Medium",
    expectedOutcome: testCase?.expectedOutcome || "",
    automationStatus:
      testCase?.automation === "Automated" ? "automated" : "manual",
    filePath: testCase?.filePath || "",
    caseType: testCase?.caseType || "Positive",
  });

  const [actions, setActions] = useState<TestAction[]>(
    testCase?.actions || [{ id: "1", type: "navigate", url: "" }]
  );

  const isEditing = !!testCase;

  const actionTypes = [
    { value: "navigate", label: "Navigate To (URL)" },
    { value: "click", label: "Click (Selector or Text)" },
    { value: "type", label: "Type Text (Selector, Value)" },
    { value: "select", label: "Select Option (Selector, Value)" },
    { value: "wait", label: "Wait For Element (Selector, Timeout)" },
    { value: "assert_visible", label: "Assert Visibility (Selector)" },
  ];

  const handleAddAction = () => {
    const newAction: TestAction = {
      id: Date.now().toString(),
      type: "click",
    };
    setActions([...actions, newAction]);
  };

  const handleRemoveAction = (id: string) => {
    if (actions.length > 1) {
      setActions(actions.filter((action) => action.id !== id));
    }
  };

  const handleUpdateAction = (id: string, updates: Partial<TestAction>) => {
    setActions(
      actions.map((action) =>
        action.id === id ? { ...action, ...updates } : action
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

  const renderActionFields = (action: TestAction) => {
    switch (action.type) {
      case "navigate":
        return (
          <input
            type="text"
            value={action.url || ""}
            onChange={(e) =>
              handleUpdateAction(action.id, { url: e.target.value })
            }
            placeholder="https://example.com"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      case "click":
        return (
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={action.selector || ""}
              onChange={(e) =>
                handleUpdateAction(action.id, { selector: e.target.value })
              }
              placeholder="Selector (e.g., #submit-btn)"
              className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              value={action.text || ""}
              onChange={(e) =>
                handleUpdateAction(action.id, { text: e.target.value })
              }
              placeholder="Or Text (e.g., 'Submit')"
              className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );

      case "type":
        return (
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={action.selector || ""}
              onChange={(e) =>
                handleUpdateAction(action.id, { selector: e.target.value })
              }
              placeholder="Selector (e.g., #email)"
              className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              value={action.value || ""}
              onChange={(e) =>
                handleUpdateAction(action.id, { value: e.target.value })
              }
              placeholder="Text to type"
              className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );

      case "select":
        return (
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={action.selector || ""}
              onChange={(e) =>
                handleUpdateAction(action.id, { selector: e.target.value })
              }
              placeholder="Selector (e.g., #country)"
              className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              value={action.value || ""}
              onChange={(e) =>
                handleUpdateAction(action.id, { value: e.target.value })
              }
              placeholder="Option value"
              className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );

      case "wait":
        return (
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={action.selector || ""}
              onChange={(e) =>
                handleUpdateAction(action.id, { selector: e.target.value })
              }
              placeholder="Selector (e.g., .loading)"
              className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              value={action.timeout || ""}
              onChange={(e) =>
                handleUpdateAction(action.id, { timeout: e.target.value })
              }
              placeholder="Timeout (ms, e.g., 5000)"
              className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );

      case "assert_visible":
        return (
          <input
            type="text"
            value={action.selector || ""}
            onChange={(e) =>
              handleUpdateAction(action.id, { selector: e.target.value })
            }
            placeholder="Selector to assert (e.g., .success-message)"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      default:
        return null;
    }
  };

  const getActionColor = (type: ActionType) => {
    const colors: Record<ActionType, string> = {
      navigate: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      click: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      type: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      select: "bg-teal-500/20 text-teal-400 border-teal-500/30",
      wait: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      assert_visible: "bg-green-500/20 text-green-400 border-green-500/30",
    };
    return colors[type];
  };

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
                ? `Mengedit ${testCase.id}`
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
            onClick={onSave}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Test Case
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h2 className="mb-6">Informasi Dasar</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
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
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Test Suite/Module
                </label>
                <input
                  type="text"
                  value={formData.suite}
                  onChange={(e) =>
                    setFormData({ ...formData, suite: e.target.value })
                  }
                  placeholder="Authentication"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Login dengan kredensial valid"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">
                Prioritas
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
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
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Expected Outcome / Final Assertion *
              </label>
              <textarea
                value={formData.expectedOutcome}
                onChange={(e) =>
                  setFormData({ ...formData, expectedOutcome: e.target.value })
                }
                placeholder="Describe the expected final state or condition for test to pass (e.g., 'User should be redirected to dashboard and welcome message is visible')"
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-slate-500 mt-2">
                This field captures the pass condition for this test case
              </p>
            </div>
          </div>

          {/* Action Steps */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="mb-1">Action Steps</h2>
                <p className="text-sm text-slate-400">
                  Define test actions in sequence
                </p>
              </div>
              <Button
                onClick={handleAddAction}
                variant="outline"
                className="border-slate-600 bg-transparent text-slate-100 hover:bg-slate-800 hover:text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Action
              </Button>
            </div>

            <div className="space-y-4">
              {actions.map((action, index) => (
                <div
                  key={action.id}
                  className="flex items-start gap-3 bg-slate-800/50 p-4 rounded-lg"
                >
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-sm text-slate-500 w-6">
                      {index + 1}.
                    </span>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <select
                        value={action.type}
                        onChange={(e) =>
                          handleUpdateAction(action.id, {
                            type: e.target.value as ActionType,
                          })
                        }
                        className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {actionTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <Badge
                        variant="outline"
                        className={`${getActionColor(
                          action.type
                        )} border shrink-0`}
                      >
                        {action.type}
                      </Badge>
                    </div>
                    {renderActionFields(action)}
                  </div>
                  <button
                    onClick={() => handleRemoveAction(action.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors mt-1"
                    disabled={actions.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
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
                className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
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

          {/* Quick Info */}
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
              {isEditing && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Last Modified:</span>
                  <span className="text-slate-200">24 Nov 2025</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
