import { useState } from 'react';
import { Plus, RefreshCw, Search, Filter, Play, Edit, CheckCircle2, XCircle, Clock, Zap, User, History, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Sparkles, Save, X, FileEdit, Trash2, Eye, ClipboardCheck } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { TEST_CASES_LIST, enrichTestCase } from '../data/mockTestCases';

interface TestCasesListProps {
  onCreateTestCase: () => void;
  onEditTestCase: (testCase: any) => void;
  onViewReport: (report: any) => void;
  onViewHistory: (testCaseId?: string) => void;
  onViewDetail: (testCase: any) => void;
  onRecordManualResult: (testCase: any) => void;
}

export function TestCasesList({ onCreateTestCase, onEditTestCase, onViewReport, onViewHistory, onViewDetail, onRecordManualResult }: TestCasesListProps) {
  // Use centralized mock data
  const initialTestCases = TEST_CASES_LIST;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterAutomation, setFilterAutomation] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterSuite, setFilterSuite] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [testCasesList, setTestCasesList] = useState(initialTestCases);
  const [quickCreateData, setQuickCreateData] = useState({
    title: '',
    suite: '',
    priority: 'Medium',
    caseType: 'Positive',
    automation: 'Automated'
  });
  
  // Quick Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<any>(null);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<'single' | 'bulk'>('single');
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);

  const filteredTestCases = testCasesList.filter(tc => {
    const matchesSearch = tc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tc.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAutomation = filterAutomation === 'all' || tc.automation.toLowerCase() === filterAutomation;
    const matchesPriority = filterPriority === 'all' || tc.priority.toLowerCase() === filterPriority;
    const matchesSuite = filterSuite === 'all' || tc.suite === filterSuite;
    
    return matchesSearch && matchesAutomation && matchesPriority && matchesSuite;
  });

  const suites = Array.from(new Set(testCasesList.map(tc => tc.suite)));

  const getPriorityColor = (priority: string) => {
    const colors: any = {
      'Critical': 'bg-red-500/20 text-red-400 border-red-500/30',
      'High': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'Medium': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Low': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    };
    return colors[priority] || colors['Medium'];
  };

  const getCaseTypeColor = (caseType: string) => {
    const colors: any = {
      'Positive': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Negative': 'bg-red-500/20 text-red-400 border-red-500/30',
      'Edge': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    };
    return colors[caseType] || colors['Positive'];
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTestCases.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredTestCases.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleQuickSave = (saveAndEdit = false) => {
    if (!quickCreateData.title.trim() || !quickCreateData.suite) {
      return;
    }

    const newTestCase = {
      id: `TC-${Math.floor(Math.random() * 9000) + 1000}`,
      title: quickCreateData.title.trim(),
      suite: quickCreateData.suite,
      priority: quickCreateData.priority,
      caseType: quickCreateData.caseType,
      automation: quickCreateData.automation,
      lastStatus: 'pending' as const,
      pageLoadAvg: '-',
      lastRun: 'Belum dijalankan',
      steps: [],
      expectedOutcome: ''
    };

    setTestCasesList([newTestCase, ...testCasesList]);
    setShowQuickCreate(false);
    setQuickCreateData({
      title: '',
      suite: '',
      priority: 'Medium',
      caseType: 'Positive',
      automation: 'Automated'
    });

    if (saveAndEdit) {
      onEditTestCase(newTestCase);
    }
  };

  const handleCancelQuickCreate = () => {
    setShowQuickCreate(false);
    setQuickCreateData({
      title: '',
      suite: '',
      priority: 'Medium',
      caseType: 'Positive',
      automation: 'Automated'
    });
  };

  const handleStartEdit = (testCase: any) => {
    setEditingId(testCase.id);
    setEditingData({ ...testCase });
  };

  const handleSaveEdit = () => {
    if (!editingData.title.trim() || !editingData.suite) {
      return;
    }

    setTestCasesList(testCasesList.map(tc => 
      tc.id === editingId ? editingData : tc
    ));
    setEditingId(null);
    setEditingData(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  // Bulk Selection Handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === currentItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentItems.map(tc => tc.id));
    }
  };

  const handleDeleteSingle = (id: string) => {
    setSingleDeleteId(id);
    setDeleteTarget('single');
    setShowDeleteConfirm(true);
  };

  const handleBulkDelete = () => {
    setDeleteTarget('bulk');
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deleteTarget === 'single' && singleDeleteId) {
      setTestCasesList(testCasesList.filter(tc => tc.id !== singleDeleteId));
      setSingleDeleteId(null);
    } else if (deleteTarget === 'bulk') {
      setTestCasesList(testCasesList.filter(tc => !selectedIds.includes(tc.id)));
      setSelectedIds([]);
    }
    setShowDeleteConfirm(false);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setSingleDeleteId(null);
  };

  const allSuites = [
    'Authentication',
    'E-Commerce',
    'Payment',
    'Product Catalog',
    'User Profile',
    'Shopping Cart',
    'Order Management',
    'Reporting'
  ];

  return (
    <div className="p-8 bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="mb-2">All Test Cases</h1>
          <p className="text-slate-400">Kelola dan jalankan semua test case</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-transparent border-slate-600 bg-transparent text-slate-100 hover:bg-slate-800 hover:text-white hover:text-white">
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
            className={bulkMode ? "bg-orange-600/20 border-orange-500 text-orange-300 hover:bg-orange-600/30 hover:text-orange-200" : "bg-transparent border-slate-600 bg-transparent text-slate-100 hover:bg-slate-800 hover:text-white hover:text-white"}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {bulkMode ? 'Cancel' : 'Bulk Delete'}
          </Button>
          <Button 
            onClick={() => setShowQuickCreate(true)} 
            variant="outline" 
            className="bg-transparent border-teal-500 text-teal-300 hover:bg-teal-500/10 hover:border-teal-400 hover:text-teal-200"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Quick Create
          </Button>
          <Button onClick={onCreateTestCase} className="bg-green-600 hover:bg-green-700 text-white">
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
              {suites.map(suite => (
                <option key={suite} value={suite}>{suite}</option>
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

      {/* Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                {bulkMode && (
                  <th className="text-center px-4 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === currentItems.length && currentItems.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 bg-slate-700 border-slate-600 rounded text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                )}
                <th className="text-left px-6 py-4 text-sm text-slate-400">ID</th>
                <th className="text-left px-6 py-4 text-sm text-slate-400">Title</th>
                <th className="text-left px-6 py-4 text-sm text-slate-400">Suite/Module</th>
                <th className="text-left px-6 py-4 text-sm text-slate-400">Prioritas</th>
                <th className="text-left px-6 py-4 text-sm text-slate-400">Case Type</th>
                <th className="text-center px-6 py-4 text-sm text-slate-400">Status Otomasi</th>
                <th className="text-center px-6 py-4 text-sm text-slate-400">Last Execution</th>
                <th className="text-center px-6 py-4 text-sm text-slate-400">Page Load Avg.</th>
                <th className="text-center px-6 py-4 text-sm text-slate-400">Actions</th>
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
                  <td className="px-6 py-4">
                    <span className="text-xs text-teal-400">AUTO</span>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={quickCreateData.title}
                      onChange={(e) => setQuickCreateData({ ...quickCreateData, title: e.target.value })}
                      placeholder="Masukkan judul test case..."
                      autoFocus
                      className="w-full bg-slate-800 border border-teal-500/50 rounded px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={quickCreateData.suite}
                      onChange={(e) => setQuickCreateData({ ...quickCreateData, suite: e.target.value })}
                      className="w-full bg-slate-800 border border-teal-500/50 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Pilih Suite</option>
                      {allSuites.map(suite => (
                        <option key={suite} value={suite}>{suite}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={quickCreateData.priority}
                      onChange={(e) => setQuickCreateData({ ...quickCreateData, priority: e.target.value })}
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
                      onChange={(e) => setQuickCreateData({ ...quickCreateData, caseType: e.target.value })}
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
                      onChange={(e) => setQuickCreateData({ ...quickCreateData, automation: e.target.value })}
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
                        disabled={!quickCreateData.title.trim() || !quickCreateData.suite}
                        className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Save"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleQuickSave(true)}
                        disabled={!quickCreateData.title.trim() || !quickCreateData.suite}
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

              {currentItems.map((tc) => (
                <tr 
                  key={tc.id} 
                  onDoubleClick={() => editingId !== tc.id && onViewDetail(tc)}
                  className={`border-b border-slate-800 transition-colors cursor-pointer ${editingId === tc.id ? 'border-b-2 border-blue-500/50 bg-blue-950/30' : 'hover:bg-slate-800/50 hover:text-slate-100'}`}
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
                  <td className="px-6 py-4">
                    <span className="text-sm text-blue-400">{tc.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === tc.id ? (
                      <input
                        type="text"
                        value={editingData.title}
                        onChange={(e) => setEditingData({ ...editingData, title: e.target.value })}
                        className="w-full bg-slate-800 border border-blue-500/50 rounded px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <>
                        <p className="text-sm text-slate-200">{tc.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{tc.lastRun}</p>
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === tc.id ? (
                      <select
                        value={editingData.suite}
                        onChange={(e) => setEditingData({ ...editingData, suite: e.target.value })}
                        className="w-full bg-slate-800 border border-blue-500/50 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {allSuites.map(suite => (
                          <option key={suite} value={suite}>{suite}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm text-slate-300">{tc.suite}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === tc.id ? (
                      <select
                        value={editingData.priority}
                        onChange={(e) => setEditingData({ ...editingData, priority: e.target.value })}
                        className="w-full bg-slate-800 border border-blue-500/50 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    ) : (
                      <Badge variant="outline" className={`${getPriorityColor(tc.priority)} border`}>
                        {tc.priority}
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === tc.id ? (
                      <select
                        value={editingData.caseType}
                        onChange={(e) => setEditingData({ ...editingData, caseType: e.target.value })}
                        className="w-full bg-slate-800 border border-blue-500/50 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Positive">Positive</option>
                        <option value="Negative">Negative</option>
                        <option value="Edge">Edge</option>
                      </select>
                    ) : (
                      <Badge variant="outline" className={`${getCaseTypeColor(tc.caseType)} border`}>
                        {tc.caseType}
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {editingId === tc.id ? (
                      <select
                        value={editingData.automation}
                        onChange={(e) => setEditingData({ ...editingData, automation: e.target.value })}
                        className="w-full bg-slate-800 border border-blue-500/50 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Automated">Automated</option>
                        <option value="Manual">Manual</option>
                      </select>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        {tc.automation === 'Automated' ? (
                          <>
                            <Zap className="w-4 h-4 text-purple-400" />
                            <span className="text-sm text-purple-400">Auto</span>
                          </>
                        ) : (
                          <>
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-400">Manual</span>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {tc.lastStatus === 'passed' && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-400">Passed</span>
                      </div>
                    )}
                    {tc.lastStatus === 'failed' && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-lg">
                        <XCircle className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-red-400">Failed</span>
                      </div>
                    )}
                    {tc.lastStatus === 'pending' && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-500/20 rounded-lg">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-400">Pending</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-sm ${tc.pageLoadAvg === '-' ? 'text-slate-500' : 'text-slate-300'}`}>
                      {tc.pageLoadAvg}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === tc.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={handleSaveEdit}
                          disabled={!editingData.title.trim() || !editingData.suite}
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
                          onClick={() => onEditTestCase(tc)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Full Edit"
                        >
                          <FileEdit className="w-4 h-4" />
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
                        {tc.automation === 'Automated' ? (
                          <button 
                            onClick={() => onViewReport({
                              id: 'RUN-' + tc.id.split('-')[1],
                              suite: tc.suite,
                              testCase: tc.title,
                              status: tc.lastStatus,
                              duration: '45s',
                              timestamp: tc.lastRun
                            })}
                            className="p-2 text-slate-400 hover:text-green-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Run Test"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => onRecordManualResult(tc)}
                            className="p-2 text-slate-400 hover:text-teal-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Record Manual Result"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => onViewDetail(tc)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="View Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
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
          <span className="text-sm text-slate-400">
            entri per halaman
          </span>
        </div>

        {/* Page info */}
        <div className="text-sm text-slate-400">
          Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredTestCases.length)} dari {filteredTestCases.length} test cases
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
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-blue-400 hover:bg-slate-800'
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

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        count={deleteTarget === 'single' ? 1 : selectedIds.length}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}