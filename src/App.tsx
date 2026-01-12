import { useEffect, useState } from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { AccountPage } from "./components/AccountPage";
import { Configuration } from "./components/Configuration";
import { Dashboard } from "./components/Dashboard";
import { Layout } from "./components/Layout";
import { LoginPage } from "./components/LoginPage";
import { ManualTestResultForm } from "./components/ManualTestResultForm";
import { RunsHistory } from "./components/RunsHistory";
import { SharedStepDetail } from "./components/SharedStepDetail";
import { SharedStepsList } from "./components/SharedStepsList";
import { SharedStepForm } from "./components/SharedStepForm";
import { TestCaseDetail } from "./components/TestCaseDetail";
import { TestCaseForm } from "./components/TestCaseForm";
import { TestCaseReview } from "./components/TestCaseReview";
import { TestCaseReviewQueue } from "./components/TestCaseReviewQueue";
import { TestCasesList } from "./components/TestCasesList";
import { TestReport } from "./components/TestReport";
import { TestSuites } from "./components/TestSuites";
import { TitleBar } from "./components/TitleBar";
import { Tools } from "./components/Tools";
import { UpdateNotification } from "./components/UpdateNotification";
import { UserManagement } from "./components/UserManagement";
import { VersionGuard } from "./components/VersionGuard";
import { Toaster } from "./components/ui/sonner";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { useUpdateManager } from "./hooks/useUpdateManager";
import { getUserServiceClient } from "./services/api-client";
import { authService } from "./services/auth-service";

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(
    null
  );
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [historyFilter, setHistoryFilter] = useState<string | null>(null);
  const [selectedSharedStepId, setSelectedSharedStepId] = useState<
    string | null
  >(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Update manager for patch updates
  const { updateInfo, isChecking, checkForUpdates } = useUpdateManager();
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);

  // Trigger notification check from menu
  const handleCheckForUpdates = async () => {
    setShowUpdateNotification(true);
    await checkForUpdates();
  };

  // Determine current view for Sidebar highlighting
  const getCurrentView = () => {
    const path = location.pathname;
    if (path === "/" || path === "/dashboard") return "dashboard";
    if (path.startsWith("/test-cases")) return "test-cases";
    if (path.startsWith("/test-suites")) return "test-suites";
    if (path.startsWith("/shared-steps")) return "shared-steps";
    if (path.startsWith("/review-queue")) return "review-queue";
    if (path.startsWith("/runs-history")) return "runs-history";
    if (path.startsWith("/configuration")) return "configuration";
    if (path.startsWith("/tools")) return "tools";
    if (path.startsWith("/users")) return "user-management";
    if (path.startsWith("/account")) return "account";
    return "dashboard";
  };

  const currentView = getCurrentView();

  // Function to load current user data from API
  const loadCurrentUser = async () => {
    try {
      const token = authService.getAccessToken();
      if (!token) return false;

      const client = await getUserServiceClient();
      const user = await client.getCurrentUser(token);
      setCurrentUser(user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error("Failed to load current user:", error);
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
        if (location.pathname === "/login") {
          navigate("/");
        }
      } else if (location.pathname !== "/login") {
        // Redirect to login if not authenticated
        navigate("/login");
      }
    };

    checkAuth();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      setCurrentUser(response.user);
      setIsAuthenticated(true);
      navigate("/");
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    navigate("/login");
  };

  const handleUpdateProfile = async (data: any) => {
    try {
      const token = authService.getAccessToken();
      if (!token || !currentUser) {
        throw new Error("Not authenticated");
      }

      // Call API to update profile (only name, email cannot be changed)
      const client = await getUserServiceClient();
      const updatedUser = await client.updateMyProfile({
        token,
        name: data.name,
      });

      // Update local storage
      authService.updateUserData({ name: data.name });

      // Reload user data from API to ensure we have the latest
      await loadCurrentUser();

      return updatedUser;
    } catch (error) {
      console.error("Failed to update profile:", error);
      throw error;
    }
  };

  const handleViewChange = (view: string) => {
    switch (view) {
      case "dashboard":
        navigate("/");
        break;
      case "test-cases":
        navigate("/test-cases");
        break;
      case "test-suites":
        navigate("/test-suites");
        break;
      case "shared-steps":
        navigate("/shared-steps");
        break;
      case "review-queue":
        navigate("/review-queue");
        break;
      case "runs-history":
        navigate("/runs-history");
        break;
      case "configuration":
        navigate("/configuration");
        break;
      case "tools":
        navigate("/tools");
        break;
      case "user-management":
        navigate("/users");
        break;
      case "account":
        navigate("/account");
        break;
    }
  };

  // Navigation Handlers
  const handleCreateTestCase = () => {
    setSelectedTestCaseId(null);
    navigate("/test-cases/new");
  };

  const handleEditTestCase = (testCaseId: string) => {
    setSelectedTestCaseId(testCaseId);
    navigate("/test-cases/edit");
  };

  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    navigate("/reports/view");
  };

  const handleViewHistory = (testCaseId?: string) => {
    setHistoryFilter(testCaseId || null);
    navigate("/runs-history");
  };

  const handleViewDetail = (testCaseId: string) => {
    // Only store ID, let detail page fetch the data
    setSelectedTestCaseId(testCaseId);
    navigate("/test-cases/detail");
  };

  const handleReviewTestCase = (testCaseId: string) => {
    navigate(`/review-queue/review/${testCaseId}`);
  };

  const handleReReviewTestCase = (testCaseId: string) => {
    navigate(`/review-queue/re-review/${testCaseId}`);
  };

  const handleDeleteFromDetail = (testCaseId: string) => {
    navigate("/test-cases");
  };

  const handleSaveTestCase = () => {
    navigate(-1); // Go back
  };

  // Shared Steps Navigation Handlers
  const handleCreateSharedStep = () => {
    setSelectedSharedStepId(null);
    navigate("/shared-steps/new");
  };

  const handleEditSharedStep = (sharedStepId: string) => {
    setSelectedSharedStepId(sharedStepId);
    navigate("/shared-steps/edit");
  };

  const handleViewSharedStepDetail = (sharedStepId: string) => {
    setSelectedSharedStepId(sharedStepId);
    navigate("/shared-steps/detail");
  };

  const handleDeleteSharedStep = (sharedStepId: string) => {
    navigate("/shared-steps");
  };

  const handleSaveSharedStep = () => {
    navigate(-1); // Go back
  };

  const handleRecordManualResult = (testCaseId: string) => {
    setSelectedTestCaseId(testCaseId);
    navigate("/test-cases/manual-result");
  };

  const handleSaveManualResult = (result: any) => {
    console.log("Manual test result saved:", result);
    navigate(-1); // Go back
  };

  // Wrapper component to extract testCaseId from URL params
  const TestCaseDetailWrapper = (props: any) => {
    const { testCaseId } = useParams<{ testCaseId: string }>();

    if (!testCaseId) {
      return <Navigate to="/test-cases" />;
    }

    return <TestCaseDetail testCaseId={testCaseId} {...props} />;
  };

  // Wrapper component to extract sharedStepId from URL params
  const SharedStepDetailWrapper = (props: any) => {
    const { sharedStepId } = useParams<{ sharedStepId: string }>();

    if (!sharedStepId) {
      return <Navigate to="/shared-steps" />;
    }

    return <SharedStepDetail sharedStepId={sharedStepId} {...props} />;
  };

  if (!isAuthenticated) {
    return (
      <>
        <TitleBar currentUser={null} />
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </>
    );
  }

  return (
    <>
      <TitleBar currentUser={currentUser} />
      <Routes>
        <Route
          element={
            <Layout
              currentView={currentView}
              onViewChange={handleViewChange}
              onLogout={handleLogout}
              currentUser={currentUser}
              onCheckForUpdates={handleCheckForUpdates}
            />
          }
        >
          <Route
            path="/"
            element={
              <Dashboard
                onNavigateToTestCases={() => navigate("/test-cases")}
                onViewReport={handleViewReport}
                onNavigateToRunsHistory={() => navigate("/runs-history")}
                onViewTestCaseDetail={handleViewDetail}
              />
            }
          />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />

          <Route
            path="/test-cases"
            element={
              <TestCasesList
                onCreateTestCase={handleCreateTestCase}
                onEditTestCase={handleEditTestCase}
                onViewReport={handleViewReport}
                onViewHistory={handleViewHistory}
                onViewDetail={handleViewDetail}
                onRecordManualResult={handleRecordManualResult}
              />
            }
          />

          <Route path="/test-suites" element={<TestSuites />} />

          <Route
            path="/review-queue"
            element={
              <TestCaseReviewQueue
                onViewDetail={handleViewDetail}
                onReviewTestCase={handleReviewTestCase}
                onReReviewTestCase={handleReReviewTestCase}
              />
            }
          />

          <Route
            path="/review-queue/review/:testCaseId"
            element={
              <TestCaseReview onBack={() => navigate("/review-queue")} />
            }
          />

          <Route
            path="/review-queue/review"
            element={
              selectedTestCaseId ? (
                <TestCaseReview
                  testCaseId={selectedTestCaseId}
                  onBack={() => navigate("/review-queue")}
                />
              ) : (
                <Navigate to="/review-queue" />
              )
            }
          />

          {/* Re-review route for revised test cases */}
          <Route
            path="/review-queue/re-review/:testCaseId"
            element={
              <TestCaseReview
                onBack={() => navigate("/review-queue")}
                isReReview={true}
              />
            }
          />

          <Route
            path="/test-cases/new"
            element={
              <TestCaseForm
                onSave={handleSaveTestCase}
                onCancel={() => navigate(-1)}
              />
            }
          />

          <Route
            path="/test-cases/edit"
            element={
              <TestCaseForm
                testCaseId={selectedTestCaseId}
                onSave={handleSaveTestCase}
                onCancel={() => navigate(-1)}
              />
            }
          />

          <Route
            path="/test-cases/detail"
            element={
              selectedTestCaseId ? (
                <TestCaseDetail
                  testCaseId={selectedTestCaseId}
                  onBack={() => navigate(-1)}
                  onEdit={handleEditTestCase}
                  onDelete={handleDeleteFromDetail}
                  onRunTest={handleViewReport}
                  onRecordManualResult={handleRecordManualResult}
                />
              ) : (
                <Navigate to="/test-cases" />
              )
            }
          />

          {/* Route with param for direct access (e.g., from notifications) */}
          <Route
            path="/test-cases/:testCaseId"
            element={
              <TestCaseDetailWrapper
                onBack={() => navigate(-1)}
                onEdit={handleEditTestCase}
                onDelete={handleDeleteFromDetail}
                onRunTest={handleViewReport}
                onRecordManualResult={handleRecordManualResult}
              />
            }
          />

          <Route
            path="/test-cases/manual-result"
            element={
              selectedTestCaseId ? (
                <ManualTestResultForm
                  testCaseId={selectedTestCaseId}
                  onSave={handleSaveManualResult}
                  onCancel={() => navigate(-1)}
                />
              ) : (
                <Navigate to="/test-cases" />
              )
            }
          />

          {/* Shared Steps Routes */}
          <Route
            path="/shared-steps"
            element={
              <SharedStepsList
                onCreateSharedStep={handleCreateSharedStep}
                onEditSharedStep={handleEditSharedStep}
                onViewDetail={handleViewSharedStepDetail}
              />
            }
          />

          <Route
            path="/shared-steps/new"
            element={
              <SharedStepForm
                onSave={handleSaveSharedStep}
                onCancel={() => navigate(-1)}
              />
            }
          />

          <Route
            path="/shared-steps/edit"
            element={
              <SharedStepForm
                sharedStepId={selectedSharedStepId}
                onSave={handleSaveSharedStep}
                onCancel={() => navigate(-1)}
              />
            }
          />

          <Route
            path="/shared-steps/detail"
            element={
              selectedSharedStepId ? (
                <SharedStepDetail
                  sharedStepId={selectedSharedStepId}
                  onBack={() => navigate(-1)}
                  onEdit={handleEditSharedStep}
                  onDelete={handleDeleteSharedStep}
                />
              ) : (
                <Navigate to="/shared-steps" />
              )
            }
          />

          {/* Route with param for direct access */}
          <Route
            path="/shared-steps/:sharedStepId"
            element={
              <SharedStepDetailWrapper
                onBack={() => navigate(-1)}
                onEdit={handleEditSharedStep}
                onDelete={handleDeleteSharedStep}
              />
            }
          />

          <Route
            path="/runs-history"
            element={
              <RunsHistory
                onViewReport={handleViewReport}
                filterTestCaseId={historyFilter}
              />
            }
          />

          <Route
            path="/reports/view"
            element={
              selectedReport ? (
                <TestReport
                  report={selectedReport}
                  onBack={() => navigate(-1)}
                />
              ) : (
                <Navigate to="/runs-history" />
              )
            }
          />

          <Route path="/configuration" element={<Configuration />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/users" element={<UserManagement />} />
          <Route
            path="/account"
            element={
              <AccountPage
                currentUser={currentUser}
                onUpdateProfile={handleUpdateProfile}
              />
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>

      {/* Update notification - show when triggered or patch update available */}
      {(showUpdateNotification || updateInfo?.isPatchUpdate) && (
        <UpdateNotification
          forceShow={showUpdateNotification}
          isChecking={isChecking}
          onDismiss={() => setShowUpdateNotification(false)}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <VersionGuard>
      <Router>
        <WebSocketProvider>
          <div className="h-screen flex flex-col overflow-hidden">
            <AppContent />
          </div>
          <Toaster />
        </WebSocketProvider>
      </Router>
    </VersionGuard>
  );
}
