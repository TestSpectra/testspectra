import { useState } from 'react';
import { Save, X, CheckCircle2, XCircle, Clock, AlertCircle, User, Calendar, Monitor, Package, FileText, Bug, MinusCircle } from 'lucide-react';
import { Button } from './ui/button';
import { DateTimePicker } from './DateTimePicker';

interface ManualTestResultFormProps {
  testCase: any;
  onSave: (result: any) => void;
  onCancel: () => void;
}

type TestResultStatus = 'passed' | 'failed' | 'blocked' | 'skipped';

interface StepResult {
  stepNumber: number;
  stepDescription: string;
  status: TestResultStatus;
  notes?: string;
}

export function ManualTestResultForm({ testCase, onSave, onCancel }: ManualTestResultFormProps) {
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    testCaseId: testCase.id,
    testCaseTitle: testCase.title,
    status: 'passed' as TestResultStatus,
    executionDate: getCurrentDateTime(),
    executedBy: 'Ahmad Rizki', // Auto-detect from Git profile in real app
    duration: '',
    environment: {
      browser: '',
      os: '',
      buildVersion: '',
    },
    testDataUsed: '',
    defectsFound: '',
    notes: '',
  });

  // Initialize step results from test case steps
  const [stepResults, setStepResults] = useState<StepResult[]>(
    testCase.actions?.map((action: any, index: number) => ({
      stepNumber: index + 1,
      stepDescription: getActionDescription(action),
      status: 'passed' as TestResultStatus,
      notes: '',
    })) || []
  );

  function getActionDescription(action: any): string {
    switch (action.type) {
      case 'navigate':
        return `Navigate to ${action.url || '[URL]'}`;
      case 'click':
        return `Click ${action.selector || action.text || '[Element]'}`;
      case 'type':
        return `Type "${action.value || '[Text]'}" into ${action.selector || '[Field]'}`;
      case 'select':
        return `Select "${action.value || '[Option]'}" from ${action.selector || '[Dropdown]'}`;
      case 'wait':
        return `Wait for ${action.selector || '[Element]'} (${action.timeout || '5000'}ms)`;
      case 'assert_visible':
        return `Assert ${action.selector || '[Element]'} is visible`;
      default:
        return action.type;
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = {
      ...formData,
      stepResults,
      timestamp: new Date().toISOString(),
    };

    onSave(result);
  };

  const updateStepResult = (index: number, field: keyof StepResult, value: any) => {
    const updated = [...stepResults];
    updated[index] = { ...updated[index], [field]: value };
    setStepResults(updated);
  };

  const getStatusIcon = (status: TestResultStatus) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'blocked':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'skipped':
        return <MinusCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: TestResultStatus) => {
    switch (status) {
      case 'passed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'blocked':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'skipped':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2">Record Manual Test Result</h1>
        <p className="text-slate-400">
          Test Case: <span className="text-blue-400">{testCase.id}</span> - {testCase.title}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Main Form */}
          <div className="col-span-2 space-y-6">
            {/* Overall Result */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <h2 className="mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Overall Test Result
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {/* Test Result Status */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Test Result *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['passed', 'failed', 'blocked', 'skipped'] as TestResultStatus[]).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setFormData({ ...formData, status })}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                          formData.status === status
                            ? getStatusColor(status)
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        {getStatusIcon(status)}
                        <span className="capitalize">{status}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Actual Duration
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 5m 30s or 330s"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Step-by-Step Results */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <h2 className="mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                Step-by-Step Results
              </h2>

              <div className="space-y-3">
                {stepResults.map((step, index) => (
                  <div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-start gap-4">
                      {/* Step Number */}
                      <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-sm text-blue-400">{step.stepNumber}</span>
                      </div>

                      <div className="flex-1 space-y-3">
                        {/* Step Description */}
                        <p className="text-sm text-slate-300">{step.stepDescription}</p>

                        <div className="grid grid-cols-3 gap-3">
                          {/* Status Buttons */}
                          <div className="col-span-2 flex gap-2">
                            {(['passed', 'failed', 'blocked', 'skipped'] as TestResultStatus[]).map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => updateStepResult(index, 'status', status)}
                                className={`flex items-center gap-1 px-3 py-1 rounded text-xs border transition-all ${
                                  step.status === status
                                    ? getStatusColor(status)
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                }`}
                              >
                                {getStatusIcon(status)}
                                <span className="capitalize">{status}</span>
                              </button>
                            ))}
                          </div>

                          {/* Notes */}
                          <input
                            type="text"
                            value={step.notes || ''}
                            onChange={(e) => updateStepResult(index, 'notes', e.target.value)}
                            placeholder="Notes (optional)"
                            className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Defects & Notes */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <h2 className="mb-4 flex items-center gap-2">
                <Bug className="w-5 h-5 text-red-400" />
                Defects & Observations
              </h2>

              <div className="space-y-4">
                {/* Defects Found */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Defects Found (Bug IDs or Description)
                  </label>
                  <input
                    type="text"
                    value={formData.defectsFound}
                    onChange={(e) => setFormData({ ...formData, defectsFound: e.target.value })}
                    placeholder="e.g., BUG-1234, BUG-5678 or describe issues found"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Notes/Observations */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Notes / Observations
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional notes, observations, or comments during test execution..."
                    rows={4}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Metadata */}
          <div className="space-y-6">
            {/* Execution Info */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <h2 className="mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                Execution Info
              </h2>

              <div className="space-y-4">
                {/* Execution Date & Time */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Execution Date & Time *
                  </label>
                  <DateTimePicker
                    value={formData.executionDate}
                    onChange={(date) => setFormData({ ...formData, executionDate: date })}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Executed By */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Executed By
                  </label>
                  <input
                    type="text"
                    value={formData.executedBy}
                    onChange={(e) => setFormData({ ...formData, executedBy: e.target.value })}
                    placeholder="Tester name"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-slate-500 mt-1">Auto-detected from Git profile</p>
                </div>
              </div>
            </div>

            {/* Environment Details */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <h2 className="mb-4 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-cyan-400" />
                Environment
              </h2>

              <div className="space-y-4">
                {/* Browser/Application */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Browser/Application
                  </label>
                  <input
                    type="text"
                    value={formData.environment.browser}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      environment: { ...formData.environment, browser: e.target.value } 
                    })}
                    placeholder="e.g., Chrome 120, Safari iOS 17"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* OS/Platform */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    OS/Platform
                  </label>
                  <input
                    type="text"
                    value={formData.environment.os}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      environment: { ...formData.environment, os: e.target.value } 
                    })}
                    placeholder="e.g., Windows 11, macOS 14, Android 13"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Build/Version */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    <Package className="w-4 h-4 inline mr-1" />
                    Build/Version
                  </label>
                  <input
                    type="text"
                    value={formData.environment.buildVersion}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      environment: { ...formData.environment, buildVersion: e.target.value } 
                    })}
                    placeholder="e.g., v2.5.1, Build #1234"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Test Data */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <h2 className="mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-400" />
                Test Data
              </h2>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Test Data Used
                </label>
                <textarea
                  value={formData.testDataUsed}
                  onChange={(e) => setFormData({ ...formData, testDataUsed: e.target.value })}
                  placeholder="e.g., user@example.com, Test123!, Product ID: 12345"
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-800">
          <Button 
            type="button"
            variant="outline" 
            onClick={onCancel} 
            className="bg-transparent border-slate-600 text-slate-100 hover:bg-slate-800 hover:border-slate-500 hover:text-white"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Test Result
          </Button>
        </div>
      </form>
    </div>
  );
}