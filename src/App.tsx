import { useState, useRef, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { TestCasesList } from './components/TestCasesList';
import { TestCaseForm } from './components/TestCaseForm';
import { TestCaseDetail } from './components/TestCaseDetail';
import { TestReport } from './components/TestReport';
import { Configuration } from './components/Configuration';
import { Tools } from './components/Tools';
import { Sidebar } from './components/Sidebar';
import { RunsHistory } from './components/RunsHistory';
import { ManualTestResultForm } from './components/ManualTestResultForm';
import { UserManagement } from './components/UserManagement';
import { LoginPage } from './components/LoginPage';
import { AccountPage } from './components/AccountPage';
import { getTestCaseDetail, enrichTestCase } from './data/mockTestCases';
import { authService } from './services/auth-service';

type View = 'dashboard' | 'test-cases' | 'test-case-form' | 'test-case-detail' | 'runs-history' | 'configuration' | 'tools' | 'test-report' | 'manual-test-result' | 'user-management' | 'account';

// Mock users database
const MOCK_USERS = [
  {
    id: '1',
    name: 'Ahmad Rizki',
    email: 'ahmad.rizki@company.com',
    role: 'admin' as const,
    status: 'active' as const,
    joinedDate: '2024-01-15',
    lastActive: '2 hours ago',
    gitUsername: 'ahmad.rizki',
    gitEmail: 'ahmad.rizki@company.com',
    basePermissions: [
      'Manage users and roles',
      'Full access to all test cases',
      'Execute all tests',
      'View and export all reports',
      'Manage configurations',
      'Manage integrations (Git, Jira, etc)',
    ],
    specialPermissions: [],
  },
  {
    id: '2',
    name: 'Siti Nurhaliza',
    email: 'siti.nurhaliza@company.com',
    role: 'qa_lead' as const,
    status: 'active' as const,
    joinedDate: '2024-02-01',
    lastActive: '1 day ago',
    gitUsername: 'siti.nurhaliza',
    gitEmail: 'siti.nurhaliza@company.com',
    basePermissions: [
      'Manage QA team members',
      'Full access to test cases',
      'Execute all tests',
      'View and export all reports',
      'Manage test configurations',
      'Review and approve test cases',
    ],
    specialPermissions: [],
  },
  {
    id: '3',
    name: 'Budi Santoso',
    email: 'budi.santoso@company.com',
    role: 'qa_engineer' as const,
    status: 'active' as const,
    joinedDate: '2024-03-10',
    lastActive: '3 hours ago',
    gitUsername: 'budi.santoso',
    gitEmail: 'budi.santoso@company.com',
    basePermissions: [
      'Create and edit test cases',
      'Execute manual and automated tests',
      'Record test results',
      'View test reports',
      'Access test configurations',
    ],
    specialPermissions: [],
  },
  {
    id: '5',
    name: 'Eko Prasetyo',
    email: 'eko.prasetyo@company.com',
    role: 'developer' as const,
    status: 'active' as const,
    joinedDate: '2024-02-20',
    lastActive: '1 hour ago',
    gitUsername: 'eko.prasetyo',
    gitEmail: 'eko.prasetyo@company.com',
    basePermissions: [
      'View test cases',
      'Execute automated tests',
      'View test results and reports',
      'Access API test configurations',
    ],
    specialPermissions: [
      'Manage QA team members',
      'Review and approve test cases',
      'Manage test configurations',
    ],
  },
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedTestCase, setSelectedTestCase] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [historyFilter, setHistoryFilter] = useState<string | null>(null);
  const [previousView, setPreviousView] = useState<View>('test-cases'); // Track where user came from
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top when view changes
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentView]);

  // Check if user is already authenticated on app load
  useEffect(() => {
    if (authService.isAuthenticated()) {
      const user = authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
      }
    }
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      setCurrentUser(response.user);
      setIsAuthenticated(true);
      setCurrentView('dashboard');
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  const handleUpdateProfile = (data: any) => {
    setCurrentUser({ ...currentUser, ...data });
  };

  const handleViewChange = (view: View) => {
    setCurrentView(view);
    // Don't clear selectedTestCase if going back to detail view or manual test result
    if (view !== 'test-case-form' && view !== 'test-case-detail' && view !== 'manual-test-result') {
      setSelectedTestCase(null);
    }
    if (view !== 'test-report') {
      setSelectedReport(null);
    }
  };

  const handleCreateTestCase = () => {
    setSelectedTestCase(null);
    setPreviousView('test-cases'); // Always from list when creating
    setCurrentView('test-case-form');
  };

  const handleEditTestCase = (testCase: any) => {
    setSelectedTestCase(testCase);
    setPreviousView(currentView); // Remember current view (could be 'test-cases' or 'test-case-detail')
    setCurrentView('test-case-form');
  };

  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setPreviousView(currentView); // Remember where we came from
    setCurrentView('test-report');
  };

  const handleViewHistory = (testCaseId?: string) => {
    setHistoryFilter(testCaseId || null);
    setCurrentView('runs-history');
  };

  const handleViewDetail = (testCaseIdOrObject: any) => {
    // If called from Dashboard with just ID string, fetch full data
    let testCaseData;
    if (typeof testCaseIdOrObject === 'string') {
      testCaseData = getTestCaseDetail(testCaseIdOrObject);
      if (!testCaseData) {
        console.error('Test case not found:', testCaseIdOrObject);
        return;
      }
    } else {
      // If called from TestCasesList with full object
      testCaseData = testCaseIdOrObject;
    }
    
    setSelectedTestCase(testCaseData);
    setPreviousView(currentView); // Remember where we came from
    setCurrentView('test-case-detail');
  };

  const handleDeleteFromDetail = (testCaseId: string) => {
    // In real app, this would delete from database
    // For now, just navigate back to list
    setCurrentView('test-cases');
  };

  const handleSaveTestCase = () => {
    setCurrentView(previousView); // Return to where user came from
  };

  const handleRecordManualResult = (testCase: any) => {
    setSelectedTestCase(testCase);
    setPreviousView(currentView); // Remember where we came from
    setCurrentView('manual-test-result');
  };

  const handleSaveManualResult = (result: any) => {
    // In real app, save to database
    console.log('Manual test result saved:', result);
    setCurrentView(previousView); // Return to previous view
  };

  return (
    <>
      {!isAuthenticated ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <div className="flex h-screen bg-slate-950 text-slate-100">
          <Sidebar currentView={currentView} onViewChange={handleViewChange} onLogout={handleLogout} />
          
          <div className="flex-1 overflow-auto" ref={mainContentRef}>
            {currentView === 'dashboard' && (
              <Dashboard 
                onNavigateToTestCases={() => handleViewChange('test-cases')}
                onViewReport={handleViewReport}
                onNavigateToRunsHistory={() => handleViewChange('runs-history')}
                onViewTestCaseDetail={handleViewDetail}
              />
            )}
            {currentView === 'test-cases' && (
              <TestCasesList 
                onCreateTestCase={handleCreateTestCase}
                onEditTestCase={handleEditTestCase}
                onViewReport={handleViewReport}
                onViewHistory={handleViewHistory}
                onViewDetail={handleViewDetail}
                onRecordManualResult={handleRecordManualResult}
              />
            )}
            {currentView === 'test-case-form' && (
              <TestCaseForm 
                testCase={selectedTestCase}
                onSave={handleSaveTestCase}
                onCancel={() => handleViewChange(previousView)}
              />
            )}
            {currentView === 'test-case-detail' && selectedTestCase && (
              <TestCaseDetail 
                testCase={selectedTestCase} 
                onBack={() => handleViewChange(previousView)}
                onEdit={handleEditTestCase}
                onDelete={handleDeleteFromDetail}
                onRunTest={handleViewReport}
                onRecordManualResult={handleRecordManualResult}
              />
            )}
            {currentView === 'test-report' && selectedReport && (
              <TestReport report={selectedReport} onBack={() => handleViewChange(previousView)} />
            )}
            {currentView === 'runs-history' && (
              <RunsHistory 
                onViewReport={handleViewReport}
                filterTestCaseId={historyFilter}
              />
            )}
            {currentView === 'configuration' && (
              <Configuration />
            )}
            {currentView === 'tools' && (
              <Tools />
            )}
            {currentView === 'manual-test-result' && selectedTestCase && (
              <ManualTestResultForm
                testCase={selectedTestCase}
                onSave={handleSaveManualResult}
                onCancel={() => handleViewChange(previousView)}
              />
            )}
            {currentView === 'user-management' && (
              <UserManagement />
            )}
            {currentView === 'account' && currentUser && (
              <AccountPage
                currentUser={currentUser}
                onUpdateProfile={handleUpdateProfile}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}