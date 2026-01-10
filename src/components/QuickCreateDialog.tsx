import { useState, useEffect } from 'react';
import { X, Zap, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { authService } from '../services/auth-service';
import { getApiUrl } from '../lib/config';

interface TestSuite {
  id: string;
  name: string;
  description?: string;
}

interface QuickCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (testCase: any) => void;
  onSaveAndEdit: (testCase: any) => void;
}

export function QuickCreateDialog({ isOpen, onClose, onSave, onSaveAndEdit }: QuickCreateDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    priority: 'Medium',
    suite: '',
    caseType: 'Positive',
    automation: 'Automated'
  });

  const [errors, setErrors] = useState<any>({});
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [isLoadingSuites, setIsLoadingSuites] = useState(false);
  const [isCreatingNewSuite, setIsCreatingNewSuite] = useState(false);
  const [newSuiteName, setNewSuiteName] = useState('');
  const [isCreatingSuite, setIsCreatingSuite] = useState(false);

  // Fetch suites when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchSuites();
    }
  }, [isOpen]);

  const fetchSuites = async () => {
    setIsLoadingSuites(true);
    try {
      const apiUrl = await getApiUrl();
      const token = authService.getAccessToken();
      const response = await fetch(`${apiUrl}/test-suites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSuites(data.suites || []);
      }
    } catch (error) {
      console.error('Failed to fetch suites:', error);
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
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newSuiteName.trim() })
      });
      
      if (response.ok) {
        const newSuite = await response.json();
        setSuites(prev => [...prev, newSuite].sort((a, b) => a.name.localeCompare(b.name)));
        setFormData({ ...formData, suite: newSuite.name });
        setIsCreatingNewSuite(false);
        setNewSuiteName('');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create suite');
      }
    } catch (error) {
      console.error('Failed to create suite:', error);
    } finally {
      setIsCreatingSuite(false);
    }
  };

  const validate = () => {
    const newErrors: any = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title wajib diisi';
    }
    
    if (!formData.suite) {
      newErrors.suite = 'Suite wajib dipilih';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (shouldEdit: boolean) => {
    if (!validate()) return;

    const newTestCase = {
      id: `TC-${Math.floor(Math.random() * 9000) + 1000}`,
      title: formData.title.trim(),
      suite: formData.suite,
      priority: formData.priority,
      caseType: formData.caseType,
      automation: formData.automation,
      lastStatus: 'pending',
      pageLoadAvg: '-',
      lastRun: 'Belum dijalankan',
      steps: [], // Empty steps - harus diisi via edit
    };

    if (shouldEdit) {
      onSaveAndEdit(newTestCase);
    } else {
      onSave(newTestCase);
    }

    // Reset form
    setFormData({
      title: '',
      priority: 'Medium',
      suite: '',
      caseType: 'Positive',
      automation: 'Automated'
    });
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-slate-900 rounded-xl border border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600/20 rounded-lg">
              <Zap className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl text-slate-200">Quick Create Test Case</h2>
              <p className="text-sm text-slate-400 mt-0.5">Buat test case dengan cepat, detail nanti via Edit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Info Alert */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-300">
                Quick create hanya untuk informasi dasar. Detail implementasi (steps, expected outcome) harus diisi melalui halaman <strong>Edit Test Case</strong>.
              </p>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Test Case Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Contoh: Login dengan kredensial valid"
              className={`w-full bg-slate-800 border ${errors.title ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-2.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            {errors.title && (
              <p className="text-xs text-red-400 mt-1.5">{errors.title}</p>
            )}
          </div>

          {/* Suite and Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Suite */}
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Suite/Module <span className="text-red-400">*</span>
              </label>
              {isCreatingNewSuite ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSuiteName}
                    onChange={(e) => setNewSuiteName(e.target.value)}
                    placeholder="Nama suite baru..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateSuite()}
                  />
                  <button
                    type="button"
                    onClick={handleCreateSuite}
                    disabled={isCreatingSuite}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50"
                  >
                    {isCreatingSuite ? <Loader2 className="w-4 h-4 animate-spin" /> : 'OK'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNewSuite(false);
                      setNewSuiteName('');
                    }}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <select
                  value={formData.suite}
                  onChange={(e) => {
                    if (e.target.value === '__new__') {
                      setIsCreatingNewSuite(true);
                    } else {
                      setFormData({ ...formData, suite: e.target.value });
                    }
                  }}
                  disabled={isLoadingSuites}
                  className={`w-full bg-slate-800 border ${errors.suite ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50`}
                >
                  <option value="">{isLoadingSuites ? 'Loading...' : 'Pilih Suite'}</option>
                  {suites.map(suite => (
                    <option key={suite.id} value={suite.name}>{suite.name}</option>
                  ))}
                  <option value="__new__">+ Buat Suite Baru</option>
                </select>
              )}
              {errors.suite && (
                <p className="text-xs text-red-400 mt-1.5">{errors.suite}</p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Prioritas
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Case Type and Automation Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Case Type */}
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Case Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, caseType: 'Positive' })}
                  className={`px-3 py-2 rounded-lg border transition-all ${
                    formData.caseType === 'Positive'
                      ? 'bg-green-500/20 border-green-500/50 text-green-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  Positive
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, caseType: 'Negative' })}
                  className={`px-3 py-2 rounded-lg border transition-all ${
                    formData.caseType === 'Negative'
                      ? 'bg-red-500/20 border-red-500/50 text-red-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  Negative
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, caseType: 'Edge' })}
                  className={`px-3 py-2 rounded-lg border transition-all ${
                    formData.caseType === 'Edge'
                      ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  Edge
                </button>
              </div>
            </div>

            {/* Automation Status */}
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Status Otomasi
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, automation: 'Automated' })}
                  className={`px-3 py-2 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                    formData.automation === 'Automated'
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  Auto
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, automation: 'Manual' })}
                  className={`px-3 py-2 rounded-lg border transition-all ${
                    formData.automation === 'Manual'
                      ? 'bg-slate-600/20 border-slate-500/50 text-slate-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  Manual
                </button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-3">Preview:</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                {formData.priority}
              </Badge>
              <Badge variant="outline" className={
                formData.caseType === 'Positive' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                formData.caseType === 'Negative' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
              }>
                {formData.caseType}
              </Badge>
              <Badge variant="outline" className={
                formData.automation === 'Automated' 
                  ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                  : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
              }>
                {formData.automation}
              </Badge>
              {formData.suite && (
                <span className="text-xs text-slate-400">• {formData.suite}</span>
              )}
            </div>
            {formData.title && (
              <p className="text-sm text-slate-300 mt-2">{formData.title}</p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 px-6 py-4 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </Button>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={() => handleSubmit(false)}
              variant="outline"
              className="border-green-600/50 text-green-400 hover:bg-green-600/20"
            >
              Save
            </Button>
            <Button
              onClick={() => handleSubmit(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Save & Edit Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
