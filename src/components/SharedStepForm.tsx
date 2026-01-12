import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Save, X } from "lucide-react";
import { Button } from "./ui/button";
import { RichTextEditor } from "./ui/rich-text-editor";
import { TestStepsEditor } from "./TestStepsEditor";
import {
  sharedStepService,
  SharedStepDetail,
} from "../services/shared-step-service";
import {
  TestStep,
  TestStepMetadataResponse,
  testCaseService,
} from "../services/test-case-service";
import { convertStepsForBackend, convertStepsFromBackend } from "@/utils/testCaseUtils";

interface SharedStepFormProps {
  sharedStepId?: string | null;
  onSave: () => void;
  onCancel: () => void;
}

export function SharedStepForm({
  sharedStepId,
  onSave,
  onCancel,
}: SharedStepFormProps) {
  const [loadedSharedStep, setLoadedSharedStep] = useState<SharedStepDetail | null>(null);
  const [isLoadingSharedStep, setIsLoadingSharedStep] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const [steps, setSteps] = useState<TestStep[]>([]);
  const [stepMetadata, setStepMetadata] =
    useState<TestStepMetadataResponse | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [isMessageInView, setIsMessageInView] = useState(true);
  const messageAreaRef = useRef<HTMLDivElement | null>(null);

  const isEditing = !!sharedStepId;

  const inputClass =
    "bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 input-field-focus transition-colors duration-150";

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

  useEffect(() => {
    const fetchSharedStep = async () => {
      if (!sharedStepId) return;

      try {
        setIsLoadingSharedStep(true);
        const data = await sharedStepService.getSharedStep(sharedStepId);
        setLoadedSharedStep(data);
        setFormData({
          name: data.name || "",
          description: data.description || "",
        });
        setSteps(convertStepsFromBackend(data.steps || []));
      } catch (error) {
        console.error("Failed to load shared step:", error);
      } finally {
        setIsLoadingSharedStep(false);
      }
    };

    fetchSharedStep();
  }, [sharedStepId]);

  // Keyboard shortcut: Ctrl+S / Cmd+S to save
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

  // Track if message area is in viewport (for sticky messages)
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

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setSaveError("Name is required");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const stepsForBackend = convertStepsForBackend(steps);

    try {
      if (isEditing && sharedStepId) {
        await sharedStepService.updateSharedStep(sharedStepId, {
          name: formData.name.trim(),
          description: formData.description || undefined,
          steps: stepsForBackend,
        });
      } else {
        await sharedStepService.createSharedStep({
          name: formData.name.trim(),
          description: formData.description || undefined,
          steps: stepsForBackend,
        });
      }

      setSaveError(null);
      setSaveSuccess(true);

      if (!isEditing) {
        // CREATE mode: show message sebentar lalu navigate back via onSave
        setTimeout(() => {
          setSaveSuccess(false);
          onSave();
        }, 800);
      } else {
        // EDIT mode: hanya tampilkan pesan sukses, tetap di halaman
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save shared step:", error);
      setSaveError(
        error instanceof Error ? error.message : "Failed to save shared step"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingSharedStep || !stepMetadata) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading shared step...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950">
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
              {isEditing ? "Edit Shared Step" : "Create Shared Step"}
            </h1>
            <p className="text-slate-400">
              Shared steps dapat digunakan ulang di beberapa test case.
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
            {isSaving ? "Menyimpan..." : "Save Shared Step"}
          </Button>
        </div>
      </div>
      <div ref={messageAreaRef} className="h-px" />

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

      {saveSuccess && (
        <div
          className={
            !isMessageInView
              ? "fixed top-12 left-1/2 -translate-x-1/2 z-40 w-max rounded-lg flex justify-center bg-slate-950/95"
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
            Shared step berhasil disimpan!
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h2 className="mb-6">Basic Information</h2>

            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Isi nama shared step, misalnya: Login successful"
                className={`w-full ${inputClass}`}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Description
              </label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) =>
                  setFormData({ ...formData, description: value })
                }
                placeholder="Deskripsi singkat shared step (opsional)"
              />
            </div>
          </div>

          <TestStepsEditor
            steps={steps}
            onStepsChange={setSteps}
            stepMetadata={stepMetadata as TestStepMetadataResponse}
          />
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h2 className="mb-4">Tips Penggunaan</h2>
            <p className="text-sm text-slate-400 mb-2">
              Shared steps cocok untuk urutan aksi yang sering dipakai ulang
              seperti login, setup data, atau navigasi awal.
            </p>
            <p className="text-sm text-slate-500">
              Setelah dibuat, shared step bisa direferensikan dari beberapa test
              case sehingga kalau ada perubahan cukup diupdate di satu tempat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
