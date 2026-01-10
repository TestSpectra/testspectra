import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Share2,
  Trash2,
  User
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getTimeAgo } from "../lib/utils";
import { SharedStep, sharedStepService } from "../services/shared-step-service";
import { ConfirmDialog } from "./SimpleDialog";
import { Button } from "./ui/button";

interface SharedStepsListProps {
  onCreateSharedStep: () => void;
  onEditSharedStep: (sharedStepId: string) => void;
  onViewDetail: (sharedStepId: string) => void;
}

export function SharedStepsList({
  onCreateSharedStep,
  onEditSharedStep,
  onViewDetail,
}: SharedStepsListProps) {
  // State for shared steps data
  const [sharedStepsList, setSharedStepsList] = useState<SharedStep[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination and search state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sharedStepToDelete, setSharedStepToDelete] = useState<SharedStep | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch shared steps
  const fetchSharedSteps = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await sharedStepService.getSharedSteps({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch || undefined,
      });

      setSharedStepsList(response.sharedSteps);
      setTotalCount(response.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch shared steps");
      setSharedStepsList([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch]);

  // Initial load and when dependencies change
  useEffect(() => {
    fetchSharedSteps();
  }, [fetchSharedSteps]);

  // Handle delete
  const handleDeleteClick = (sharedStep: SharedStep) => {
    setSharedStepToDelete(sharedStep);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sharedStepToDelete) return;

    setIsDeleting(true);
    try {
      await sharedStepService.deleteSharedStep(sharedStepToDelete.id);
      setDeleteDialogOpen(false);
      setSharedStepToDelete(null);
      await fetchSharedSteps(); // Refresh list
    } catch (err) {
      console.error("Failed to delete shared step:", err);
      // You might want to show a toast notification here
    } finally {
      setIsDeleting(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(totalCount / pageSize);
  const canGoBack = currentPage > 1;
  const canGoForward = currentPage < totalPages;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-white">Shared Steps</h1>
          <p className="text-slate-400">Create and manage reusable test step sequences</p>
        </div>
        <Button
          onClick={onCreateSharedStep}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Shared Step
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search shared steps by name or description"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {error && (
        <div className="bg-red-950/50 border border-red-800/50 rounded-xl p-4 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={fetchSharedSteps}
            className="mt-2 text-blue-400 hover:text-blue-300 text-sm underline"
          >
            Try again
          </button>
        </div>
      )}

      {isLoading && sharedStepsList.length === 0 ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading shared steps...</p>
        </div>
      ) : sharedStepsList.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No shared steps found</h3>
          <p className="text-slate-400 mb-4">
            {debouncedSearch ? "Try adjusting your search terms" : "Get started by creating your first shared step"}
          </p>
          {!debouncedSearch && (
            <Button
              onClick={onCreateSharedStep}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Shared Step
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sharedStepsList.map((sharedStep) => (
            <div
              key={sharedStep.id}
              className="bg-slate-900 rounded-xl border border-slate-800 p-6 hover:border-slate-700 transition-colors cursor-pointer"
              onDoubleClick={() => onViewDetail(sharedStep.id)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center shrink-0">
                    <Share2 className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-1">{sharedStep.name}</h3>
                    {sharedStep.description && (
                      <p className="text-slate-400 text-sm line-clamp-2">{sharedStep.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e: MouseEvent) => {
                      e.stopPropagation();
                      onViewDetail(sharedStep.id);
                    }}
                    className="text-slate-400 hover:text-white hover:bg-slate-700"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e: MouseEvent) => {
                      e.stopPropagation();
                      onEditSharedStep(sharedStep.id);
                    }}
                    className="text-slate-400 hover:text-white hover:bg-slate-700"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e: MouseEvent) => {
                      e.stopPropagation();
                      handleDeleteClick(sharedStep);
                    }}
                    className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <span>{sharedStep.stepCount} steps</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{sharedStep.createdBy}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>{getTimeAgo(sharedStep.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="text-sm text-slate-400">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} shared steps
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(1)}
              disabled={!canGoBack}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={!canGoBack}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 px-3">
              <span className="text-sm text-slate-300">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={!canGoForward}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(totalPages)}
              disabled={!canGoForward}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Shared Step"
        message={`Are you sure you want to delete "${sharedStepToDelete?.name}"? This action cannot be undone and will remove the shared step from all test cases that reference it.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
}
