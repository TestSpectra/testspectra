import {
  CheckCircle2,
  ChevronDown,
  Clock,
  FileCheck,
  FolderTree,
  GitBranch,
  History,
  Info,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  UserCircle,
  Users,
  Wrench,
  XCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { useWebSocket } from "../contexts/WebSocketContext";
import { TestSpectraLogo } from "./TestSpectraLogo";

type View =
  | "dashboard"
  | "test-cases"
  | "test-suites"
  | "review-queue"
  | "runs-history"
  | "configuration"
  | "tools"
  | "user-management"
  | "account";

interface SidebarProps {
  currentView: string;
  onViewChange: (view: View) => void;
  onLogout?: () => void;
  currentUser?: any;
  onCheckForUpdates?: () => void;
}

const COLLAPSE_BREAKPOINT = 1400;

export function Sidebar({
  currentView,
  onViewChange,
  onLogout,
  currentUser,
  onCheckForUpdates,
}: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAccountMenuOpen, setAccountMenuOpen] = useState(false);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const { onMessage } = useWebSocket();

  // Check screen width and auto-collapse
  useEffect(() => {
    const checkWidth = () => {
      setIsCollapsed(window.innerWidth < COLLAPSE_BREAKPOINT);
    };

    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  // Fetch pending review count using stats endpoint
  useEffect(() => {
    const fetchPendingCount = async () => {
      // Only fetch if user has review permission
      if (!currentUser) return;
      const hasPermission = currentUser.basePermissions?.includes('review_approve_test_cases') ||
        currentUser.specialPermissions?.includes('review_approve_test_cases');
      if (!hasPermission) return;

      try {
        const { reviewService } = await import('../services/review-service');
        const stats = await reviewService.getReviewStats();
        setPendingReviewCount(stats.pending);
      } catch (err) {
        console.error('Failed to fetch pending review count:', err);
      }
    };

    fetchPendingCount();
  }, [currentUser]);

  // Subscribe to realtime review stats updates via WebSocket
  useEffect(() => {
    // Only subscribe if user has review permission
    if (!currentUser) return;
    const hasPermission = currentUser.basePermissions?.includes('review_approve_test_cases') ||
      currentUser.specialPermissions?.includes('review_approve_test_cases');
    if (!hasPermission) return;

    const unsubscribe = onMessage((message) => {
      if (message.type === 'review_stats_update') {
        // Backend WsManager transforms 'data' field to 'payload'
        const stats = message.payload || message.data;
        if (stats) {
          setPendingReviewCount(stats.pending || 0);
        }
      }
    });

    return unsubscribe;
  }, [currentUser, onMessage]);

  const allMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "test-cases", label: "Test Cases", icon: FileCheck },
    { id: "test-suites", label: "Test Suites", icon: FolderTree },
    { id: "review-queue", label: "Review Queue", icon: MessageSquare, requiresPermission: "review_approve_test_cases", badge: pendingReviewCount },
    { id: "runs-history", label: "Runs History", icon: History },
    { id: "configuration", label: "Configuration", icon: Settings },
    { id: "tools", label: "Tools", icon: Wrench },
    { id: "user-management", label: "User Management", icon: Users },
  ];

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter(item => {
    if (!item.requiresPermission) return true;
    if (!currentUser) return false;
    // Check both base and special permissions
    return (
      currentUser.basePermissions?.includes(item.requiresPermission) ||
      currentUser.specialPermissions?.includes(item.requiresPermission)
    );
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const displayUser = currentUser
    ? {
      name: currentUser.name || "User",
      email: currentUser.email || "user@example.com",
      avatar: getInitials(currentUser.name || "User"),
    }
    : {
      name: "Guest",
      email: "guest@testspectra.com",
      avatar: "G",
    };

  // Determine if sidebar should show expanded
  const isExpanded = !isCollapsed || isHovered;

  return (
    <>
      {/* Sidebar placeholder for collapsed state to maintain layout */}
      {isCollapsed && <div className="w-16 shrink-0" />}

      {/* Main Sidebar */}
      <div
        onMouseEnter={() => isCollapsed && setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setAccountMenuOpen(false);
        }}
        className={`
          ${isCollapsed ? "fixed left-0 top-0 h-screen z-50" : "relative"}
          ${isExpanded ? "w-64" : "w-16"}
          bg-slate-900 border-r border-slate-800 flex flex-col h-screen
          transition-[width] duration-200 ease-out
          ${isCollapsed && isHovered ? "shadow-2xl shadow-black/50" : ""}
        `}
      >
        {/* Logo & Header - Sticky */}
        <div className="sticky top-0 z-10 bg-slate-900 shrink-0">
          <div className={`border-b border-slate-800 h-[88px] flex items-center transition-all duration-300 ${isExpanded ? 'px-4 justify-start' : 'px-0 justify-center'}`}>
            <div className="flex items-center relative">
              <TestSpectraLogo
                size={isExpanded ? 40 : 32}
                className="shrink-0 transition-all duration-300"
              />
              <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 ml-3 w-auto' : 'opacity-0 ml-0 w-0'}`}>
                <h1 className="text-white whitespace-nowrap">TestSpectra</h1>
                <p className="text-xs text-slate-400 whitespace-nowrap">
                  Automation Lifecycle
                </p>
              </div>
            </div>
          </div>

          {/* Sync Status Indicator */}
          <div className={`border-b border-slate-800 h-[68px] flex flex-col justify-center transition-[padding] duration-300 ${isExpanded ? 'px-4' : 'items-center px-0'}`}>
            <div className={`flex items-center text-sm ${isExpanded ? 'gap-2' : 'justify-center'}`}>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0"></div>
              <span className={`text-slate-300 whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
                Synced
              </span>
            </div>
            <p className={`text-xs text-slate-500 whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100 mt-1' : 'opacity-0 h-0 mt-0'}`}>
              Last sync: 2 minutes ago
            </p>
          </div>
        </div>

        {/* Navigation Menu - Scrollable */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentView === item.id ||
                (currentView === "test-case-form" &&
                  item.id === "test-cases") ||
                (currentView === "test-report" && item.id === "dashboard");

              return (
                <li key={item.id} className="relative">
                  <button
                    onClick={() => onViewChange(item.id as View)}
                    title={!isExpanded ? item.label : undefined}
                    className={`w-full flex items-center py-3 rounded-lg transition-colors ${isExpanded ? 'gap-3 px-4' : 'justify-center'
                      } ${isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className={`whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100 flex-1 text-left' : 'opacity-0 w-0'}`}>
                      {item.label}
                    </span>

                    {/* Badge when expanded - inline */}
                    {isExpanded && item.badge && item.badge > 0 && (
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>

                  {/* Badge when collapsed - absolute positioned */}
                  {!isExpanded && item.badge && item.badge > 0 && (
                    <span className={`absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-semibold rounded-full ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Section - Sticky */}
        <div className="sticky bottom-0 z-10 bg-slate-900 shrink-0">
          {/* Quick Stats */}
          <div className={`border-t border-slate-800 space-y-3 transition-[padding] duration-300 ${isExpanded ? 'p-4' : 'py-4 flex flex-col items-center'}`}>
            <div className={`flex items-center text-sm h-5 ${isExpanded ? 'justify-between w-full' : 'justify-center'}`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <span className={`text-slate-400 whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
                  Passed
                </span>
              </div>
              <span className={`text-green-500 transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
                847
              </span>
            </div>
            <div className={`flex items-center text-sm h-5 ${isExpanded ? 'justify-between w-full' : 'justify-center'}`}>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className={`text-slate-400 whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
                  Failed
                </span>
              </div>
              <span className={`text-red-500 transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
                23
              </span>
            </div>
            <div className={`flex items-center text-sm h-5 ${isExpanded ? 'justify-between w-full' : 'justify-center'}`}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500 shrink-0" />
                <span className={`text-slate-400 whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
                  Running
                </span>
              </div>
              <span className={`text-orange-500 transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
                5
              </span>
            </div>
          </div>

          {/* User Profile */}
          <div className={`border-t border-slate-800 bg-slate-800/30 transition-all duration-300 ${isExpanded ? 'p-4' : 'py-4 px-0'}`}>
            <div className={`flex items-center transition-all duration-300 ${isExpanded ? 'justify-start' : 'justify-center'}`}>
              <div
                onClick={() =>
                  isExpanded && setAccountMenuOpen(!isAccountMenuOpen)
                }
                className={`flex items-center cursor-pointer hover:bg-slate-800 rounded-lg p-2 transition-all duration-300 ${isExpanded ? 'w-full' : ''}`}
              >
                <div
                  className="w-10 h-10 bg-linear-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center shrink-0"
                >
                  <span className="text-white text-sm font-semibold">
                    {displayUser.avatar}
                  </span>
                </div>
                <div className={`flex-1 min-w-0 overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 ml-3 w-auto' : 'opacity-0 ml-0 w-0'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <GitBranch className="w-3 h-3 text-slate-400 shrink-0" />
                    <p className="text-sm text-slate-200 truncate">
                      {displayUser.name}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {displayUser.email}
                  </p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-all duration-300 shrink-0 ${isAccountMenuOpen ? "rotate-180" : ""
                    } ${isExpanded ? 'ml-1.5' : 'opacity-0 hidden'}`}
                />
              </div>
            </div>

            <div className={`overflow-hidden transition-all duration-300 ${isExpanded && isAccountMenuOpen ? 'max-h-48 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
              <div className="pt-2 border-t border-slate-700 space-y-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewChange("account");
                    setAccountMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                >
                  <UserCircle className="w-4 h-4" />
                  <span className="text-sm">View Account</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCheckForUpdates?.();
                    setAccountMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                >
                  <Info className="w-4 h-4" />
                  <span className="text-sm">Check for Updates</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onLogout) onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
