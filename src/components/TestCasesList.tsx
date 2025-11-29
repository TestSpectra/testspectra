import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  RefreshCw,
  Search,
  Filter,
  Play,
  Edit,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  User,
  History,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  Save,
  X,
  FileEdit,
  Trash2,
  Eye,
  ClipboardCheck,
  Loader2,
  FolderPlus,
  Copy,
  GripVertical,
} from "lucide-react";
import { authService } from "../services/auth-service";
import { getApiUrl } from "../lib/config";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ConfirmDialog } from "./SimpleDialog";
import {
  testCaseService,
  TestCaseSummary,
} from "../services/test-case-service";

interface TestCasesListProps {
  onCreateTestCase: () => void;
  onEditTestCase: (testCaseId: string) => void;
  onViewReport: (report: any) => void;
  onViewHistory: (testCaseId: string) => void;
  onViewDetail: (testCaseId: string) => void;
  onRecordManualResult: (testCaseId: string) => void;
}

export function TestCasesList({
  onCreateTestCase,
  onEditTestCase,
  onViewReport,
  onViewHistory,
  onViewDetail,
  onRecordManualResult,
}: TestCasesListProps) {
  // State for test cases data
  const [testCasesList, setTestCasesList] = useState<TestCaseSummary[]>([]);
  const [availableSuites, setAvailableSuites] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterAutomation, setFilterAutomation] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterSuite, setFilterSuite] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreateData, setQuickCreateData] = useState({
    title: "",
    suite: "",
    priority: "Medium",
    caseType: "Positive",
    automation: "Automated",
  });

  // Quick Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<any>(null);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<"single" | "bulk">("single");
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);

  const [reorderSelectedIds, setReorderSelectedIds] = useState<string[]>([]);
  const [reorderAnchorId, setReorderAnchorId] = useState<string | null>(null);

  // Suite Management State
  const [allSuites, setAllSuites] = useState<{ id: string; name: string }[]>(
    []
  );
  const [isLoadingSuites, setIsLoadingSuites] = useState(false);
  const [isCreatingNewSuite, setIsCreatingNewSuite] = useState(false);
  const [newSuiteName, setNewSuiteName] = useState("");
  const [isCreatingSuite, setIsCreatingSuite] = useState(false);
  // For quick edit row
  const [isCreatingNewSuiteEdit, setIsCreatingNewSuiteEdit] = useState(false);
  const [newSuiteNameEdit, setNewSuiteNameEdit] = useState("");

  // Drag and Drop State
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<"above" | "below" | null>(
    null
  );
  const dragPreviewRef = useRef<HTMLDivElement | null>(null);

  // Fetch test cases from API
  const fetchTestCases = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await testCaseService.listTestCases({
        searchQuery: searchQuery || undefined,
        suiteFilter: filterSuite !== "all" ? filterSuite : undefined,
        priorityFilter: filterPriority !== "all" ? filterPriority : undefined,
        automationFilter:
          filterAutomation !== "all" ? filterAutomation : undefined,
        page: currentPage,
        pageSize: itemsPerPage,
      });
      setTestCasesList(response.testCases);
      setTotalCount(response.total);
      setAvailableSuites(response.availableSuites);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch test cases"
      );
      console.error("Failed to fetch test cases:", err);
    } finally {
      setIsLoading(false);
    }
  }, [
    searchQuery,
    filterSuite,
    filterPriority,
    filterAutomation,
    currentPage,
    itemsPerPage,
  ]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchTestCases();
  }, [fetchTestCases]);

  // Fetch all suites from API
  const fetchSuites = useCallback(async () => {
    setIsLoadingSuites(true);
    try {
      const apiUrl = await getApiUrl();
      const token = authService.getAccessToken();
      const response = await fetch(`${apiUrl}/test-suites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAllSuites(data.suites || []);
      }
    } catch (err) {
      console.error("Failed to fetch suites:", err);
    } finally {
      setIsLoadingSuites(false);
    }
  }, []);

  // Fetch suites on mount
  useEffect(() => {
    fetchSuites();
  }, [fetchSuites]);

  // Create new suite handler
  const handleCreateSuite = async (forEdit = false) => {
    const suiteName = forEdit ? newSuiteNameEdit : newSuiteName;
    if (!suiteName.trim()) return;

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
        body: JSON.stringify({ name: suiteName.trim() }),
      });

      if (response.ok) {
        const newSuite = await response.json();
        setAllSuites((prev) =>
          [...prev, newSuite].sort((a, b) => a.name.localeCompare(b.name))
        );

        if (forEdit) {
          setEditingData({ ...editingData, suite: newSuite.name });
          setIsCreatingNewSuiteEdit(false);
          setNewSuiteNameEdit("");
        } else {
          setQuickCreateData({ ...quickCreateData, suite: newSuite.name });
          setIsCreatingNewSuite(false);
          setNewSuiteName("");
        }
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create suite");
      }
    } catch (err) {
      console.error("Failed to create suite:", err);
    } finally {
      setIsCreatingSuite(false);
    }
  };

  const handleRowClick = (
    e: React.MouseEvent<HTMLTableRowElement>,
    id: string
  ) => {
    if (bulkMode) {
      // Bulk delete selection is handled via checkboxes
      return;
    }

    // Meta/Ctrl + Click: toggle selection like file manager
    if (e.metaKey || e.ctrlKey) {
      const alreadySelected = reorderSelectedIds.includes(id);
      if (alreadySelected) {
        const next = reorderSelectedIds.filter((x) => x !== id);
        setReorderSelectedIds(next);
        setReorderAnchorId(next.length ? next[next.length - 1] : null);
      } else {
        const next = [...reorderSelectedIds, id];
        setReorderSelectedIds(next);
        setReorderAnchorId(id);
      }
      return;
    }

    // Shift + Click: select block from last anchor to this row
    if (e.shiftKey) {
      const orderedIds = currentItems.map((tc) => tc.id);
      const anchorId = reorderAnchorId ?? id;
      const anchorIndex = orderedIds.indexOf(anchorId);
      const targetIndex = orderedIds.indexOf(id);

      if (anchorIndex === -1 || targetIndex === -1) {
        setReorderSelectedIds([id]);
        setReorderAnchorId(id);
        return;
      }

      const start = Math.min(anchorIndex, targetIndex);
      const end = Math.max(anchorIndex, targetIndex);
      const rangeIds = orderedIds.slice(start, end + 1);
      setReorderSelectedIds(rangeIds);
      setReorderAnchorId(anchorId);
      return;
    }
    // Regular click (without modifiers): if there is an active selection, reset it
    if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
      if (reorderSelectedIds.length > 0) {
        setReorderSelectedIds([]);
        setReorderAnchorId(null);
      }
    }
    return;
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterSuite, filterPriority, filterAutomation]);

  // Use API response directly - no client-side filtering needed for data
  const currentItems = testCasesList;
  const suites = availableSuites.length > 0 ? availableSuites : [];
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // When dragging, determine which IDs are part of the moved block
  const isDragging = !!draggedId;
  let dragMovedIds: string[] = [];
  if (isDragging && draggedId) {
    const orderedIds = currentItems.map((tc) => tc.id);
    const selectedSet = new Set(reorderSelectedIds);
    const isMultiMove =
      reorderSelectedIds.length > 1 && selectedSet.has(draggedId);
    dragMovedIds = isMultiMove
      ? orderedIds.filter((id) => selectedSet.has(id))
      : [draggedId];
  }
  const dragMovedSet = new Set(dragMovedIds);

  const getPriorityColor = (priority: string) => {
    const colors: any = {
      Critical: "bg-red-500/20 text-red-400 border-red-500/30",
      High: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      Medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      Low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    };
    return colors[priority] || colors["Medium"];
  };

  const getCaseTypeColor = (caseType: string) => {
    const colors: any = {
      Positive: "bg-green-500/20 text-green-400 border-green-500/30",
      Negative: "bg-red-500/20 text-red-400 border-red-500/30",
      Edge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    };
    return colors[caseType] || colors["Positive"];
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleQuickSave = async (saveAndEdit = false) => {
    if (!quickCreateData.title.trim() || !quickCreateData.suite) {
      return;
    }

    try {
      const newTestCase = await testCaseService.createTestCase({
        title: quickCreateData.title.trim(),
        suite: quickCreateData.suite,
        priority: quickCreateData.priority,
        caseType: quickCreateData.caseType,
        automation: quickCreateData.automation,
      });

      setShowQuickCreate(false);
      setQuickCreateData({
        title: "",
        suite: "",
        priority: "Medium",
        caseType: "Positive",
        automation: "Automated",
      });

      // Refresh list
      await fetchTestCases();

      if (saveAndEdit) {
        onEditTestCase(newTestCase.id);
      }
    } catch (err) {
      console.error("Failed to create test case:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create test case"
      );
    }
  };

  const handleCancelQuickCreate = () => {
    setShowQuickCreate(false);
    setQuickCreateData({
      title: "",
      suite: "",
      priority: "Medium",
      caseType: "Positive",
      automation: "Automated",
    });
  };

  const handleStartEdit = (testCase: any) => {
    setEditingId(testCase.id);
    setEditingData({ ...testCase });
  };

  const handleSaveEdit = async () => {
    if (!editingData.title.trim() || !editingData.suite) {
      return;
    }

    try {
      await testCaseService.updateTestCase(editingId!, {
        title: editingData.title,
        suite: editingData.suite,
        priority: editingData.priority,
        caseType: editingData.caseType,
        automation: editingData.automation,
      });
      setEditingId(null);
      setEditingData(null);
      // Refresh list
      await fetchTestCases();
    } catch (err) {
      console.error("Failed to update test case:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update test case"
      );
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  // Bulk Selection Handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === currentItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentItems.map((tc) => tc.id));
    }
  };

  const handleDeleteSingle = (id: string) => {
    setSingleDeleteId(id);
    setDeleteTarget("single");
    setShowDeleteConfirm(true);
  };

  const handleBulkDelete = () => {
    setDeleteTarget("bulk");
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      if (deleteTarget === "single" && singleDeleteId) {
        await testCaseService.deleteTestCase(singleDeleteId);
        setSingleDeleteId(null);
      } else if (deleteTarget === "bulk") {
        await testCaseService.bulkDeleteTestCases(selectedIds);
        setSelectedIds([]);
      }
      // Refresh list
      await fetchTestCases();
    } catch (err) {
      console.error("Failed to delete test case(s):", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete test case(s)"
      );
    }
    setShowDeleteConfirm(false);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setSingleDeleteId(null);
  };

  // Duplicate Test Case Handler
  const handleDuplicate = async (testCaseId: string) => {
    try {
      await testCaseService.duplicateTestCase(testCaseId);
      await fetchTestCases();
    } catch (err) {
      console.error("Failed to duplicate test case:", err);
      setError(
        err instanceof Error ? err.message : "Failed to duplicate test case"
      );
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (
    e: React.DragEvent<HTMLTableRowElement>,
    id: string
  ) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    if (e.currentTarget) {
      e.currentTarget.style.opacity = "0.5";
      e.currentTarget.classList.add("opacity-50", "bg-blue-950/40");
    }

    if (dragPreviewRef.current) {
      const preview = dragPreviewRef.current;
      preview.innerHTML = "";

      const orderedIds = currentItems.map((tc) => tc.id);
      const selectedSet = new Set(reorderSelectedIds);
      const isMultiMove = reorderSelectedIds.length > 1 && selectedSet.has(id);
      const movedIds = isMultiMove
        ? orderedIds.filter((x) => selectedSet.has(x))
        : [id];

      movedIds.forEach((movedId) => {
        const sourceRow = document.querySelector<HTMLTableRowElement>(
          `tr[data-case-id="${movedId}"]`
        );
        if (!sourceRow) return;
        const clone = sourceRow.cloneNode(true) as HTMLTableRowElement;
        // Remove draggable attributes and inline opacity from clone
        clone.draggable = false;
        (clone.style as any).opacity = "1";
        preview.appendChild(clone);
      });

      if (preview.childElementCount > 0) {
        preview.style.display = "block";
        const rect = e.currentTarget.getBoundingClientRect();
        preview.style.width = `${rect.width}px`;
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        e.dataTransfer.setDragImage(preview, offsetX, offsetY);
      }
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLTableRowElement>) => {
    setDraggedId(null);
    setDragOverId(null);
    if (e.currentTarget) {
      e.currentTarget.style.opacity = "1";
    }
    if (dragPreviewRef.current) {
      dragPreviewRef.current.style.display = "none";
      dragPreviewRef.current.innerHTML = "";
    }
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLTableRowElement>,
    id: string
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedId && !dragMovedSet.has(id)) {
      setDragOverId(id);
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      setDropPosition(offsetY < rect.height / 2 ? "above" : "below");
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
    setDropPosition(null);
  };

  const handleDrop = async (
    e: React.DragEvent<HTMLTableRowElement>,
    targetId: string
  ) => {
    e.preventDefault();
    setDragOverId(null);

    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    // Build the full order of IDs on the current page (backend order)
    const orderedIds = currentItems.map((tc) => tc.id);

    const targetIndex = orderedIds.indexOf(targetId);

    if (targetIndex === -1) {
      setDraggedId(null);
      return;
    }

    // Determine which IDs are part of the moved block (separate from bulk delete selection)
    const selectedSet = new Set(reorderSelectedIds);
    const isMultiMove =
      reorderSelectedIds.length > 1 && selectedSet.has(draggedId);

    // Preserve relative order of moved items as they appear in the current list
    const movedIds = isMultiMove
      ? orderedIds.filter((id) => selectedSet.has(id))
      : [draggedId];

    // Remove moved IDs from the ordered list, then insert the block before target row
    const withoutMoved = orderedIds.filter((id) => !movedIds.includes(id));
    let insertIndex = withoutMoved.indexOf(targetId);

    if (insertIndex === -1) {
      setDraggedId(null);
      return;
    }

    // Adjust insert index based on whether we drop above or below the target row
    if (dropPosition === "below") {
      insertIndex += 1;
    }

    const finalOrder = [...withoutMoved];
    finalOrder.splice(insertIndex, 0, ...movedIds);

    // Compute prev/next around the whole block in the new order
    const firstIndex = finalOrder.indexOf(movedIds[0]);
    const lastIndex = firstIndex + movedIds.length - 1;

    const prevId = firstIndex > 0 ? finalOrder[firstIndex - 1] : null;
    const nextId =
      lastIndex < finalOrder.length - 1 ? finalOrder[lastIndex + 1] : null;

    try {
      await testCaseService.reorderTestCases({
        movedIds,
        prevId,
        nextId,
      });
      await fetchTestCases();
    } catch (err) {
      console.error("Failed to reorder test case:", err);
      setError(
        err instanceof Error ? err.message : "Failed to reorder test case"
      );
    }

    setDraggedId(null);
    setDropPosition(null);
  };

  // Combine API suites with any from test cases that might not be in the suites table
  const combinedSuites = [
    ...new Set([...allSuites.map((s) => s.name), ...availableSuites]),
  ].sort();

  return (
    <div className="p-8 bg-slate-950">
      <div
        ref={dragPreviewRef}
        className="fixed z-50 pointer-events-none opacity-80"
        style={{ display: "none", top: -9999, left: -9999 }}
      />
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="mb-2">All Test Cases</h1>
          <p className="text-slate-400">Kelola dan jalankan semua test case</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="bg-transparent border-slate-600 text-slate-100 hover:bg-slate-800 hover:text-white hover:text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Codebase
          </Button>
          <Button
            onClick={() => {
              if (!bulkMode) {
                setBulkMode(true);
              } else {
                setBulkMode(false);
                setSelectedIds([]);
              }
            }}
            variant="outline"
            className={
              bulkMode
                ? "bg-orange-600/20 border-orange-500 text-orange-300 hover:bg-orange-600/30 hover:text-orange-200"
                : "bg-transparent border-slate-600 text-slate-100 hover:bg-slate-800 hover:text-white"
            }
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {bulkMode ? "Cancel" : "Bulk Delete"}
          </Button>
          <Button
            onClick={() => setShowQuickCreate(true)}
            variant="outline"
            className="bg-transparent border-teal-500 text-teal-300 hover:bg-teal-500/10 hover:border-teal-400 hover:text-teal-200"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Quick Create
          </Button>
          <Button
            onClick={onCreateTestCase}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Test Case
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
        <div className="grid grid-cols-5 gap-4">
          {/* Search */}
          <div className="col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari test case berdasarkan ID atau title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Automation Filter */}
          <div>
            <select
              value={filterAutomation}
              onChange={(e) => setFilterAutomation(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Status</option>
              <option value="automated">Automated</option>
              <option value="manual">Manual</option>
            </select>
          </div>

          {/* Suite Filter */}
          <div>
            <select
              value={filterSuite}
              onChange={(e) => setFilterSuite(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Suite</option>
              {combinedSuites.map((suite) => (
                <option key={suite} value={suite}>
                  {suite}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Prioritas</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-red-950/50 border border-red-800/50 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-200">
              {selectedIds.length} test case terpilih
            </span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-400 hover:text-slate-200 underline"
            >
              Clear selection
            </button>
          </div>
          <Button
            onClick={handleBulkDelete}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Selected ({selectedIds.length})
          </Button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-950/50 border border-red-800/50 rounded-xl p-4 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchTestCases();
            }}
            className="text-xs text-red-300 hover:text-red-200 underline mt-2"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 mb-6 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          <span className="ml-3 text-slate-400">Memuat test cases...</span>
        </div>
      )}

      {/* Table */}
      {!isLoading && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50">
                  {bulkMode && (
                    <th className="text-center px-4 py-4 w-12">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.length === currentItems.length &&
                          currentItems.length > 0
                        }
                        onChange={handleSelectAll}
                        className="w-4 h-4 bg-slate-700 border-slate-600 rounded text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="text-center px-4 py-4 text-sm text-slate-400 whitespace-nowrap w-16">
                    #
                  </th>
                  <th className="text-left px-6 py-4 text-sm text-slate-400 whitespace-nowrap">
                    ID
                  </th>
                  <th
                    className="text-left px-6 py-4 text-sm text-slate-400"
                    style={{ minWidth: "250px" }}
                  >
                    Title
                  </th>
                  <th className="text-left px-6 py-4 text-sm text-slate-400 whitespace-nowrap">
                    Suite/Module
                  </th>
                  <th className="text-left px-6 py-4 text-sm text-slate-400 whitespace-nowrap">
                    Prioritas
                  </th>
                  <th className="text-left px-6 py-4 text-sm text-slate-400 whitespace-nowrap">
                    Case Type
                  </th>
                  <th className="text-center px-6 py-4 text-sm text-slate-400 whitespace-nowrap">
                    Status Otomasi
                  </th>
                  <th className="text-center px-6 py-4 text-sm text-slate-400">
                    Last Execution
                  </th>
                  <th className="text-center px-6 py-4 text-sm text-slate-400">
                    Page Load Avg.
                  </th>
                  <th className="text-center px-6 py-4 text-sm text-slate-400 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Quick Create Row */}
                {showQuickCreate && (
                  <tr className="border-b-2 border-teal-500/50 bg-teal-950/30">
                    {bulkMode && (
                      <td className="px-6 py-4">
                        <span className="text-xs text-teal-400">NEW</span>
                      </td>
                    )}
                    <td className="px-4 py-4 text-center">
                      <span className="text-xs text-teal-400">-</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-teal-400">AUTO</span>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={quickCreateData.title}
                        onChange={(e) =>
                          setQuickCreateData({
                            ...quickCreateData,
                            title: e.target.value,
                          })
                        }
                        placeholder="Masukkan judul test case..."
                        autoFocus
                        className="w-full bg-slate-800 border border-teal-500/50 rounded px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      {isCreatingNewSuite ? (
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={newSuiteName}
                            onChange={(e) => setNewSuiteName(e.target.value)}
                            placeholder="Nama suite..."
                            className="flex-1 bg-slate-800 border border-teal-500/50 rounded px-2 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            autoFocus
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleCreateSuite(false)
                            }
                          />
                          <button
                            type="button"
                            onClick={() => handleCreateSuite(false)}
                            disabled={isCreatingSuite}
                            className="px-2 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs disabled:opacity-50"
                          >
                            {isCreatingSuite ? (
                              <Loader2 size={12} className="animate-spin" />
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
                            className="px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <select
                          value={quickCreateData.suite}
                          onChange={(e) => {
                            if (e.target.value === "__new__") {
                              setIsCreatingNewSuite(true);
                            } else {
                              setQuickCreateData({
                                ...quickCreateData,
                                suite: e.target.value,
                              });
                            }
                          }}
                          disabled={isLoadingSuites}
                          className="w-full bg-slate-800 border border-teal-500/50 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                        >
                          <option value="">
                            {isLoadingSuites ? "Loading..." : "Pilih Suite"}
                          </option>
                          {combinedSuites.map((suite) => (
                            <option key={suite} value={suite}>
                              {suite}
                            </option>
                          ))}
                          <option value="__new__">+ Buat Suite Baru</option>
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={quickCreateData.priority}
                        onChange={(e) =>
                          setQuickCreateData({
                            ...quickCreateData,
                            priority: e.target.value,
                          })
                        }
                        className="w-full bg-slate-800 border border-teal-500/50 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={quickCreateData.caseType}
                        onChange={(e) =>
                          setQuickCreateData({
                            ...quickCreateData,
                            caseType: e.target.value,
                          })
                        }
                        className="w-full bg-slate-800 border border-teal-500/50 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="Positive">Positive</option>
                        <option value="Negative">Negative</option>
                        <option value="Edge">Edge</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <select
                        value={quickCreateData.automation}
                        onChange={(e) =>
                          setQuickCreateData({
                            ...quickCreateData,
                            automation: e.target.value,
                          })
                        }
                        className="w-full bg-slate-800 border border-teal-500/50 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="Automated">Automated</option>
                        <option value="Manual">Manual</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs text-slate-500">-</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs text-slate-500">-</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleQuickSave(false)}
                          disabled={
                            !quickCreateData.title.trim() ||
                            !quickCreateData.suite
                          }
                          className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Save"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleQuickSave(true)}
                          disabled={
                            !quickCreateData.title.trim() ||
                            !quickCreateData.suite
                          }
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Save & Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelQuickCreate}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {currentItems.map((tc, index) => {
                  const isMoved = dragMovedSet.has(tc.id);
                  const isSelectedForReorder = reorderSelectedIds.includes(
                    tc.id
                  );

                  const baseCursorClass =
                    editingId === tc.id
                      ? "cursor-default"
                      : "cursor-grab active:cursor-grabbing";

                  const rowStateClass =
                    editingId === tc.id
                      ? "border-b-2 border-blue-500/50 bg-blue-950/30"
                      : isMoved && isSelectedForReorder
                      ? "opacity-50 bg-blue-950/40 border-blue-500/40"
                      : isMoved
                      ? "opacity-50 bg-blue-950/40"
                      : isSelectedForReorder
                      ? "bg-blue-950/40 border-blue-500/40"
                      : "hover:bg-slate-800/50 hover:text-slate-100";

                  return (
                    <tr
                      key={tc.id}
                      data-case-id={tc.id}
                      draggable={editingId !== tc.id}
                      onClick={(e) => handleRowClick(e, tc.id)}
                      onDragStart={(e) => handleDragStart(e, tc.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, tc.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, tc.id)}
                      onDoubleClick={() =>
                        editingId !== tc.id && onViewDetail(tc.id)
                      }
                      className={`border-b border-slate-800 transition-colors ${baseCursorClass} ${rowStateClass}`}
                    >
                      {bulkMode && (
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(tc.id)}
                            onChange={() => handleToggleSelect(tc.id)}
                            className="w-4 h-4 bg-slate-700 border-slate-600 rounded text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <GripVertical className="w-3 h-3 text-slate-500" />
                          <span className="text-xs text-slate-500 font-mono">
                            {index + 1 + (currentPage - 1) * itemsPerPage}
                          </span>
                        </div>
                      </td>
                      <td className="relative px-6 py-4">
                        {dragOverId === tc.id && dropPosition && (
                          <div
                            className={`drop-indicator ${
                              dropPosition === "above"
                                ? "drop-indicator--top"
                                : "drop-indicator--bottom"
                            }`}
                          />
                        )}
                        <span className="text-sm text-blue-400">{tc.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        {editingId === tc.id ? (
                          <input
                            type="text"
                            value={editingData.title}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                title: e.target.value,
                              })
                            }
                            className="w-full bg-slate-800 border border-blue-500/50 rounded px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <>
                            <p className="text-sm text-slate-200">{tc.title}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {tc.lastRun}
                            </p>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === tc.id ? (
                          isCreatingNewSuiteEdit ? (
                            <div className="flex gap-1">
                              <input
                                type="text"
                                value={newSuiteNameEdit}
                                onChange={(e) =>
                                  setNewSuiteNameEdit(e.target.value)
                                }
                                placeholder="Nama suite..."
                                className="flex-1 bg-slate-800 border border-blue-500/50 rounded px-2 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                                onKeyDown={(e) =>
                                  e.key === "Enter" && handleCreateSuite(true)
                                }
                              />
                              <button
                                type="button"
                                onClick={() => handleCreateSuite(true)}
                                disabled={isCreatingSuite}
                                className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs disabled:opacity-50"
                              >
                                {isCreatingSuite ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  "OK"
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsCreatingNewSuiteEdit(false);
                                  setNewSuiteNameEdit("");
                                }}
                                className="px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <select
                              value={editingData.suite}
                              onChange={(e) => {
                                if (e.target.value === "__new__") {
                                  setIsCreatingNewSuiteEdit(true);
                                } else {
                                  setEditingData({
                                    ...editingData,
                                    suite: e.target.value,
                                  });
                                }
                              }}
                              className="w-full bg-slate-800 border border-blue-500/50 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {combinedSuites.map((suite) => (
                                <option key={suite} value={suite}>
                                  {suite}
                                </option>
                              ))}
                              <option value="__new__">+ Buat Suite Baru</option>
                            </select>
                          )
                        ) : (
                          <span className="text-sm text-slate-300">
                            {tc.suite}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === tc.id ? (
                          <select
                            value={editingData.priority}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                priority: e.target.value,
                              })
                            }
                            className="w-full bg-slate-800 border border-blue-500/50 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                        ) : (
                          <Badge
                            variant="outline"
                            className={`${getPriorityColor(
                              tc.priority
                            )} border`}
                          >
                            {tc.priority}
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === tc.id ? (
                          <select
                            value={editingData.caseType}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                caseType: e.target.value,
                              })
                            }
                            className="w-full bg-slate-800 border border-blue-500/50 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Positive">Positive</option>
                            <option value="Negative">Negative</option>
                            <option value="Edge">Edge</option>
                          </select>
                        ) : (
                          <Badge
                            variant="outline"
                            className={`${getCaseTypeColor(
                              tc.caseType
                            )} border`}
                          >
                            {tc.caseType}
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {editingId === tc.id ? (
                          <select
                            value={editingData.automation}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                automation: e.target.value,
                              })
                            }
                            className="w-full bg-slate-800 border border-blue-500/50 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Automated">Automated</option>
                            <option value="Manual">Manual</option>
                          </select>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            {tc.automation === "Automated" ? (
                              <>
                                <Zap className="w-4 h-4 text-purple-400" />
                                <span className="text-sm text-purple-400">
                                  Auto
                                </span>
                              </>
                            ) : (
                              <>
                                <User className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-400">
                                  Manual
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {tc.lastStatus === "passed" && (
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-green-400">
                              Passed
                            </span>
                          </div>
                        )}
                        {tc.lastStatus === "failed" && (
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-lg">
                            <XCircle className="w-4 h-4 text-red-400" />
                            <span className="text-sm text-red-400">Failed</span>
                          </div>
                        )}
                        {tc.lastStatus === "pending" && (
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-500/20 rounded-lg">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-400">
                              Pending
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`text-sm ${
                            tc.pageLoadAvg === "-"
                              ? "text-slate-500"
                              : "text-slate-300"
                          }`}
                        >
                          {tc.pageLoadAvg}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {editingId === tc.id ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={handleSaveEdit}
                              disabled={
                                !editingData.title.trim() || !editingData.suite
                              }
                              className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Save"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleStartEdit(tc)}
                              className="p-2 text-slate-400 hover:text-orange-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Quick Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onEditTestCase(tc.id)}
                              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Full Edit"
                            >
                              <FileEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDuplicate(tc.id)}
                              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Duplicate"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSingle(tc.id)}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onViewHistory(tc.id)}
                              className="p-2 text-slate-400 hover:text-purple-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="View History"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            {tc.automation === "Automated" ? (
                              <button
                                onClick={() =>
                                  onViewReport({
                                    id: "RUN-" + tc.id.split("-")[1],
                                    suite: tc.suite,
                                    testCase: tc.title,
                                    status: tc.lastStatus,
                                    duration: "45s",
                                    timestamp: tc.lastRun,
                                  })
                                }
                                className="p-2 text-slate-400 hover:text-green-400 hover:bg-slate-800 rounded-lg transition-colors"
                                title="Run Test"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => onRecordManualResult(tc.id)}
                                className="p-2 text-slate-400 hover:text-teal-400 hover:bg-slate-800 rounded-lg transition-colors"
                                title="Record Manual Result"
                              >
                                <ClipboardCheck className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => onViewDetail(tc.id)}
                              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="View Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalCount > 0 && (
        <div className="flex items-center justify-between mt-6 bg-slate-900 rounded-xl border border-slate-800 p-4">
          {/* Items per page */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">Tampilkan</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-slate-400">entri per halaman</span>
          </div>

          {/* Page info */}
          <div className="text-sm text-slate-400">
            Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, totalCount)} dari {totalCount}{" "}
            test cases
          </div>

          {/* Page navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-400 disabled:hover:bg-transparent"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-400 disabled:hover:bg-transparent"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`min-w-[36px] px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      currentPage === pageNum
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-blue-400 hover:bg-slate-800"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-400 disabled:hover:bg-transparent"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-400 disabled:hover:bg-transparent"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && totalCount === 0 && (
        <div className="p-12 text-center">
          <p className="text-slate-400 py-4">Tidak ada test case ditemukan</p>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Konfirmasi Hapus"
        message={
          deleteTarget === "single"
            ? "Apakah Anda yakin ingin menghapus test case ini?"
            : `Apakah Anda yakin ingin menghapus ${selectedIds.length} test case?`
        }
        confirmLabel={
          selectedIds.length > 1 && deleteTarget !== "single"
            ? `Hapus (${selectedIds.length})`
            : "Hapus"
        }
        cancelLabel="Batal"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
