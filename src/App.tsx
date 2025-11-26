import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { TestCasesList } from './components/TestCasesList';
import { TestCaseForm } from './components/TestCaseForm';
import { TestCaseDetail } from './components/TestCaseDetail';
import { TestReport } from './components/TestReport';
import { Configuration } from './components/Configuration';
import { Tools } from './components/Tools';
import { RunsHistory } from './components/RunsHistory';
import { ManualTestResultForm } from './components/ManualTestResultForm';
import { UserManagement } from './components/UserManagement';
import { LoginPage } from './components/LoginPage';
import { AccountPage } from './components/AccountPage';
import { authService } from './services/auth-service';
import { Layout } from './components/Layout';
import { userServiceClient } from './services/api-client';
import { testCaseService } from './services/test-case-service';

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [historyFilter, setHistoryFilter] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Determine current view for Sidebar highlighting
  const getCurrentView = () => {
     const path = location.pathname;
     if (path === '/' || path === '/dashboard') return 'dashboard';
     if (path.startsWith('/test-cases')) return 'test-cases';
     if (path.startsWith('/runs-history')) return 'runs-history';
     if (path.startsWith('/configuration')) return 'configuration';
     if (path.startsWith('/tools')) return 'tools';
     if (path.startsWith('/users')) return 'user-management';
     if (path.startsWith('/account')) return 'account';
     return 'dashboard';
  };

  const currentView = getCurrentView();

  // Function to load current user data from API
  const loadCurrentUser = async () => {
    try {
      const token = authService.getAccessToken();
      if (!token) return false;
      
      const user = await userServiceClient.getCurrentUser(token);
      setCurrentUser(user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Failed to load current user:', error);
      return false;
    }
  };
  
  // Check auth on load
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        // Try to load fresh data from API first
        const success = await loadCurrentUser();
        
        // If API call fails, use cached data
        if (!success) {
          const user = authService.getCurrentUser();
          if (user) {
            setCurrentUser(user);
            setIsAuthenticated(true);
          }
        }
        
        // If we're at login page but authenticated, go to dashboard
        if (location.pathname === '/login') {
          navigate('/');
        }
      } else if (location.pathname !== '/login') {
        // Redirect to login if not authenticated
        navigate('/login');
      }
    };
    
    checkAuth();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      setCurrentUser(response.user);
      setIsAuthenticated(true);
      navigate('/');
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
    navigate('/login');
  };

  const handleUpdateProfile = async (data: any) => {
    try {
      const token = authService.getAccessToken();
      if (!token || !currentUser) {
        throw new Error('Not authenticated');
      }
      
      // Call API to update profile (only name, email cannot be changed)
      const updatedUser = await userServiceClient.updateMyProfile({
        token,
        name: data.name
      });
      
      // Update local storage
      authService.updateUserData({ name: data.name });
      
      // Reload user data from API to ensure we have the latest
      await loadCurrentUser();
      
      return updatedUser;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  const handleViewChange = (view: string) => {
      switch(view) {
          case 'dashboard': navigate('/'); break;
          case 'test-cases': navigate('/test-cases'); break;
          case 'runs-history': navigate('/runs-history'); break;
          case 'configuration': navigate('/configuration'); break;
          case 'tools': navigate('/tools'); break;
          case 'user-management': navigate('/users'); break;
          case 'account': navigate('/account'); break;
      }
  };

  // Navigation Handlers
  const handleCreateTestCase = () => {
    setSelectedTestCaseId(null);
    navigate('/test-cases/new');
  };

  const handleEditTestCase = (testCaseId: string) => {
    setSelectedTestCaseId(testCaseId);
    navigate('/test-cases/edit');
  };

  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    navigate('/reports/view');
  };

  const handleViewHistory = (testCaseId?: string) => {
    setHistoryFilter(testCaseId || null);
    navigate('/runs-history');
  };

  const handleViewDetail = (testCaseId: string) => {
    // Only store ID, let detail page fetch the data
    setSelectedTestCaseId(testCaseId);
    navigate('/test-cases/detail');
  };

  const handleDeleteFromDetail = (testCaseId: string) => {
    navigate('/test-cases');
  };

  const handleSaveTestCase = () => {
    navigate(-1); // Go back
  };

  const handleRecordManualResult = (testCaseId: string) => {
    setSelectedTestCaseId(testCaseId);
    navigate('/test-cases/manual-result');
  };

  const handleSaveManualResult = (result: any) => {
    console.log('Manual test result saved:', result);
    navigate(-1); // Go back
  };

  if (!isAuthenticated) {
      return <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>;
  }

  return (
    <Routes>
        <Route element={<Layout currentView={currentView} onViewChange={handleViewChange} onLogout={handleLogout} currentUser={currentUser} />}>
            <Route path="/" element={<Dashboard 
                onNavigateToTestCases={() => navigate('/test-cases')}
                onViewReport={handleViewReport}
                onNavigateToRunsHistory={() => navigate('/runs-history')}
                onViewTestCaseDetail={handleViewDetail}
            />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            
            <Route path="/test-cases" element={<TestCasesList 
                onCreateTestCase={handleCreateTestCase}
                onEditTestCase={handleEditTestCase}
                onViewReport={handleViewReport}
                onViewHistory={handleViewHistory}
                onViewDetail={handleViewDetail}
                onRecordManualResult={handleRecordManualResult}
            />} />
            
            <Route path="/test-cases/new" element={<TestCaseForm 
                testCase={null}
                onSave={handleSaveTestCase}
                onCancel={() => navigate(-1)}
            />} />
            
            <Route path="/test-cases/edit" element={<TestCaseForm 
                testCaseId={selectedTestCaseId}
                onSave={handleSaveTestCase}
                onCancel={() => navigate(-1)}
            />} />
            
            <Route path="/test-cases/detail" element={selectedTestCaseId ? <TestCaseDetail 
                testCaseId={selectedTestCaseId} 
                onBack={() => navigate(-1)}
                onEdit={handleEditTestCase}
                onDelete={handleDeleteFromDetail}
                onRunTest={handleViewReport}
                onRecordManualResult={handleRecordManualResult}
            /> : <Navigate to="/test-cases" />} />

            <Route path="/test-cases/manual-result" element={selectedTestCaseId ? <ManualTestResultForm
                testCaseId={selectedTestCaseId}
                onSave={handleSaveManualResult}
                onCancel={() => navigate(-1)}
            /> : <Navigate to="/test-cases" />} />
            
            <Route path="/runs-history" element={<RunsHistory 
                onViewReport={handleViewReport}
                filterTestCaseId={historyFilter}
            />} />
            
            <Route path="/reports/view" element={selectedReport ? <TestReport 
                report={selectedReport} 
                onBack={() => navigate(-1)} 
            /> : <Navigate to="/runs-history" />} />
            
            <Route path="/configuration" element={<Configuration />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/account" element={<AccountPage
                currentUser={currentUser}
                onUpdateProfile={handleUpdateProfile}
            />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
