import { TestCase } from "@/services/test-case-service";
import { Edit, Package, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  SharedStep,
  sharedStepService,
  type SharedStepDetail,
} from "../services/shared-step-service";
import { BackButton } from "./BackButton";
import { ConfirmDialog } from "./SimpleDialog";
import { TestCaseDisplay } from "./TestCaseDisplay";
import { Button } from "./ui/button";

interface SharedStepDetailProps {
  sharedStepId: string;
  onBack: () => void;
  onEdit: (sharedStepId: string) => void;
  onDelete: (id: string) => void;
}

export function SharedStepTitle({ name, description }: Partial<SharedStep>) {
  return (
    <div className="flex flex-col gap-3 grow">
      <div className="flex items-center gap-2 pt-1.5">
        <Package className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-medium text-purple-400">
          {name}
        </span>
      </div>

      {description && (
        <div
          className="text-xs text-slate-400"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      )}
    </div>
  );
}

export function SharedStepDetail({
  sharedStepId,
  onBack,
  onEdit,
  onDelete,
}: SharedStepDetailProps) {
  const [sharedStep, setSharedStep] = useState<SharedStepDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchSharedStep = async () => {
      try {
        setIsLoading(true);
        const data = await sharedStepService.getSharedStep(sharedStepId);
        setSharedStep(data);
      } catch (err) {
        console.error("Failed to load shared step:", err);
        setError("Failed to load shared step");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedStep();
  }, [sharedStepId]);

  const handleDelete = async () => {
    if (!sharedStep) return;

    setIsDeleting(true);
    try {
      await sharedStepService.deleteSharedStep(sharedStep.id);
      toast.success("Shared step deleted successfully");
      onDelete(sharedStep.id);
      onBack();
    } catch (err: any) {
      console.error("Failed to delete shared step:", err);
      toast.error(err.message || "Failed to delete shared step");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 min-h-screen">
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading shared step...</p>
        </div>
      </div>
    );
  }

  if (error || !sharedStep) {
    return (
      <div className="p-8 min-h-screen">
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">
            {error || "Shared step not found"}
          </p>
          <BackButton onClick={onBack} />
        </div>
      </div>
    );
  }

  const displayTestCase: Partial<TestCase> = {
    description: sharedStep.description,
    preCondition: null,
    postCondition: null,
    steps: sharedStep.steps,
    tags: [],
  };

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <BackButton onClick={onBack} />
          <div>
            <h1 className="mb-2 text-2xl font-bold text-white">
              {sharedStep.name}
            </h1>
            <p className="text-slate-400">Shared Step</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(sharedStep.id)}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <TestCaseDisplay testCase={displayTestCase} />
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Hapus Shared Step"
        message={`Apakah Anda yakin ingin menghapus "${sharedStep.name}"? Tindakan ini hanya dapat dilakukan jika tidak ada test case yang saat ini menggunakan shared step ini. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
