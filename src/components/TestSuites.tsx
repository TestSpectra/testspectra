import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, FileCheck, Folder } from 'lucide-react';
import { Button } from './ui/button';
import { testSuiteService, TestSuite } from '../services/test-suite-service';
import { getTimeAgo } from '../lib/utils';
import { ConfirmDialog } from './SimpleDialog';

interface TestSuitesProps {
    onCreateSuite?: () => void;
}

export function TestSuites({ onCreateSuite }: TestSuitesProps) {
    const navigate = useNavigate();
    const [suites, setSuites] = useState<TestSuite[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newSuiteName, setNewSuiteName] = useState('');
    const [newSuiteDescription, setNewSuiteDescription] = useState('');
    const [editingSuite, setEditingSuite] = useState<TestSuite | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    
    // Delete confirmation state
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [suiteToDelete, setSuiteToDelete] = useState<TestSuite | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        loadSuites();
    }, []);

    const loadSuites = async () => {
        try {
            setIsLoading(true);
            const data = await testSuiteService.getAllTestSuites();
            setSuites(data);
            setError(null);
        } catch (err: any) {
            console.error('Failed to load test suites:', err);
            setError(err.message || 'Failed to load test suites');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredSuites = suites.filter(suite =>
        suite.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (suite.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateSuite = async () => {
        if (newSuiteName.trim()) {
            try {
                setFormError(null);
                await testSuiteService.createTestSuite({
                    name: newSuiteName.trim(),
                    description: newSuiteDescription.trim() || undefined
                });
                setShowCreateDialog(false);
                setNewSuiteName('');
                setNewSuiteDescription('');
                loadSuites();
            } catch (err: any) {
                setFormError(err.message || 'Failed to create suite');
            }
        }
    };

    const handleUpdateSuite = async () => {
        if (editingSuite && newSuiteName.trim()) {
            try {
                setFormError(null);
                await testSuiteService.updateTestSuite(editingSuite.id, {
                    name: newSuiteName.trim(),
                    description: newSuiteDescription.trim() || undefined
                });
                setEditingSuite(null);
                setNewSuiteName('');
                setNewSuiteDescription('');
                setShowCreateDialog(false);
                loadSuites();
            } catch (err: any) {
                setFormError(err.message || 'Failed to update suite');
            }
        }
    };

    const handleDeleteClick = (suite: TestSuite) => {
        setSuiteToDelete(suite);
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!suiteToDelete) return;
        
        try {
            setIsDeleting(true);
            await testSuiteService.deleteTestSuite(suiteToDelete.id);
            setShowDeleteDialog(false);
            setSuiteToDelete(null);
            loadSuites();
        } catch (err: any) {
            alert(err.message || 'Failed to delete suite');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditClick = (suite: TestSuite) => {
        setEditingSuite(suite);
        setNewSuiteName(suite.name);
        setNewSuiteDescription(suite.description || '');
        setShowCreateDialog(true);
    };

    const handleCancelDialog = () => {
        setShowCreateDialog(false);
        setEditingSuite(null);
        setNewSuiteName('');
        setNewSuiteDescription('');
        setFormError(null);
    };

    const getPassRateColor = (rate: number) => {
        if (rate >= 95) return 'text-green-400';
        if (rate >= 80) return 'text-yellow-400';
        return 'text-red-400';
    };

    if (isLoading) {
        return <div className="p-8 text-slate-400">Loading test suites...</div>;
    }

    if (error) {
        return <div className="p-8 text-red-400">Error: {error}</div>;
    }

    return (
        <div className="p-8 bg-slate-950 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="mb-2">Test Suites</h1>
                    <p className="text-slate-400">Kelola test suites dan modules</p>
                </div>
                <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Suite
                </Button>
            </div>

            {/* Search */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari test suite berdasarkan nama atau deskripsi..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Results Count */}
            <div className="mb-4">
                <p className="text-sm text-slate-400">
                    Menampilkan {filteredSuites.length} dari {suites.length} test suites
                </p>
            </div>

            {/* Suites Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSuites.map((suite) => (
                    <div
                        key={suite.id}
                        className="bg-slate-900 rounded-xl border border-slate-800 p-6 hover:border-slate-700 transition-colors cursor-pointer"
                        onClick={() => navigate(`/test-cases?suite=${encodeURIComponent(suite.name)}`)}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center shrink-0">
                                    <Folder className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-slate-200 mb-1">{suite.name}</h3>
                                    <p className="text-xs text-slate-500 truncate w-32" title={suite.id}>ID: {suite.id.split('-')[0]}</p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-slate-400 mb-4 line-clamp-2 min-h-10">
                            {suite.description || 'No description'}
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-slate-800/50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <FileCheck className="w-4 h-4 text-blue-400" />
                                    <p className="text-xs text-slate-400">Test Cases</p>
                                </div>
                                <p className="text-slate-200">{suite.testCaseCount}</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-xs text-slate-400">Automated</p>
                                </div>
                                <p className="text-slate-200">
                                    {suite.automatedCount}/{suite.testCaseCount}
                                </p>
                            </div>
                        </div>

                        {/* Pass Rate */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-400">Pass Rate</span>
                                <span className={`text-sm ${getPassRateColor(suite.passRate)}`}>
                                    {suite.passRate.toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all ${suite.passRate >= 95 ? 'bg-green-500' :
                                        suite.passRate >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                    style={{ width: `${suite.passRate}%` }}
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                            <div>
                                <p className="text-xs text-slate-500">Last run: {getTimeAgo(suite.lastRun === 'Belum dijalankan' ? undefined : suite.lastRun, 'Belum dijalankan')}</p>
                                <p className="text-xs text-slate-500">by {suite.createdBy}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditClick(suite);
                                    }}
                                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteClick(suite);
                                    }}
                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create/Edit Dialog */}
            {showCreateDialog && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 w-full max-w-md">
                        <h2 className="mb-6">
                            {editingSuite ? 'Edit Test Suite' : 'Create New Test Suite'}
                        </h2>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            editingSuite ? handleUpdateSuite() : handleCreateSuite();
                        }}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Suite Name *</label>
                                    <input
                                        type="text"
                                        value={newSuiteName}
                                        onChange={(e) => {
                                            setNewSuiteName(e.target.value);
                                            setFormError(null);
                                        }}
                                        placeholder="e.g., Authentication"
                                        className={`w-full bg-slate-800 border rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:border-transparent ${
                                            formError ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-blue-500'
                                        }`}
                                        autoFocus
                                        required
                                    />
                                    {formError && (
                                        <p className="mt-2 text-sm text-red-400">{formError}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Description</label>
                                    <textarea
                                        value={newSuiteDescription}
                                        onChange={(e) => setNewSuiteDescription(e.target.value)}
                                        placeholder="Describe the purpose of this test suite..."
                                        rows={3}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mt-6">
                                <Button
                                    type="button"
                                    onClick={handleCancelDialog}
                                    variant="outline"
                                    className="flex-1 bg-transparent border-slate-600 text-slate-100 hover:bg-slate-800 hover:text-white"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!newSuiteName.trim()}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {editingSuite ? 'Update' : 'Create'} Suite
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={showDeleteDialog}
                title="Delete Test Suite"
                message={
                    <div className="space-y-2">
                        <p>Apakah Anda yakin ingin menghapus test suite <span className="font-semibold text-white">{suiteToDelete?.name}</span>?</p>
                        <p className="text-sm text-red-400 bg-red-900/20 p-3 rounded-lg border border-red-900/50">
                            Peringatan: Tindakan ini juga akan menghapus semua test case ({suiteToDelete?.testCaseCount || 0}) yang ada di dalam suite ini.
                        </p>
                    </div>
                }
                confirmLabel="Delete Suite"
                cancelLabel="Cancel"
                isLoading={isDeleting}
                onConfirm={handleConfirmDelete}
                onCancel={() => {
                    if (!isDeleting) {
                        setShowDeleteDialog(false);
                        setSuiteToDelete(null);
                    }
                }}
            />
        </div>
    );
}
