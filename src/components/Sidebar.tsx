import {
  LayoutDashboard,
  FileCheck,
  FolderTree,
  History,
  Settings,
  CheckCircle2,
  XCircle,
  Clock,
  Wrench,
  GitBranch,
  Users,
  ChevronDown,
  UserCircle,
  LogOut,
  Info,
} from "lucide-react";
import { useState, useEffect } from "react";
import { TestSpectraLogo } from "./TestSpectraLogo";

type View =
  | "dashboard"
  | "test-cases"
  | "test-suites"
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

  // Check screen width and auto-collapse
  useEffect(() => {
    const checkWidth = () => {
      setIsCollapsed(window.innerWidth < COLLAPSE_BREAKPOINT);
    };

    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "test-cases", label: "Test Cases", icon: FileCheck },
    { id: "test-suites", label: "Test Suites", icon: FolderTree },
    { id: "runs-history", label: "Runs History", icon: History },
    { id: "configuration", label: "Configuration", icon: Settings },
    { id: "tools", label: "Tools", icon: Wrench },
    { id: "user-management", label: "User Management", icon: Users },
  ];

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
          transition-all duration-300 ease-in-out
          ${isCollapsed && isHovered ? "shadow-2xl shadow-black/50" : ""}
        `}
      >
        {/* Logo & Header - Sticky */}
        <div className="sticky top-0 z-10 bg-slate-900 shrink-0">
          <div
            className={`${
              isExpanded ? "p-6" : "p-4"
            } border-b border-slate-800`}
          >
            <div className="flex items-center gap-3">
              <TestSpectraLogo
                size={isExpanded ? 40 : 32}
                className="shrink-0"
              />
              {isExpanded && (
                <div className="overflow-hidden">
                  <h1 className="text-white whitespace-nowrap">TestSpectra</h1>
                  <p className="text-xs text-slate-400 whitespace-nowrap">
                    Automation Lifecycle
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sync Status Indicator */}
          <div
            className={`${
              isExpanded ? "px-6" : "px-2"
            } py-4 border-b border-slate-800`}
          >
            <div
              className={
                isExpanded
                  ? "flex items-center gap-2 text-sm"
                  : "flex items-center gap-2 text-sm justify-center"
              }
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0"></div>
              {isExpanded && (
                <span className="text-slate-300 whitespace-nowrap">Synced</span>
              )}
            </div>
            {isExpanded && (
              <p className="text-xs text-slate-500 mt-1">
                Last sync: 2 minutes ago
              </p>
            )}
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
                <li key={item.id}>
                  <button
                    onClick={() => onViewChange(item.id as View)}
                    title={!isExpanded ? item.label : undefined}
                    className={`w-full flex items-center gap-3 ${
                      isExpanded ? "px-4" : "px-3 justify-center"
                    } py-3 rounded-lg transition-all ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {isExpanded && (
                      <span className="whitespace-nowrap">{item.label}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Section - Sticky */}
        <div className="sticky bottom-0 z-10 bg-slate-900 shrink-0">
          {/* Quick Stats */}
          <div
            className={`${
              isExpanded ? "p-4" : "p-2"
            } border-t border-slate-800 space-y-3`}
          >
            <div
              className={`flex items-center ${
                isExpanded ? "justify-between" : "justify-center"
              } text-sm`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                {isExpanded && <span className="text-slate-400">Passed</span>}
              </div>
              {isExpanded && <span className="text-green-500">847</span>}
            </div>
            <div
              className={`flex items-center ${
                isExpanded ? "justify-between" : "justify-center"
              } text-sm`}
            >
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                {isExpanded && <span className="text-slate-400">Failed</span>}
              </div>
              {isExpanded && <span className="text-red-500">23</span>}
            </div>
            <div
              className={`flex items-center ${
                isExpanded ? "justify-between" : "justify-center"
              } text-sm`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500 shrink-0" />
                {isExpanded && <span className="text-slate-400">Running</span>}
              </div>
              {isExpanded && <span className="text-orange-500">5</span>}
            </div>
          </div>

          {/* User Profile */}
          <div
            className={`${
              isExpanded ? "p-4" : "p-2"
            } border-t border-slate-800 bg-slate-800/30`}
          >
            <div
              onClick={() =>
                isExpanded && setAccountMenuOpen(!isAccountMenuOpen)
              }
              className={`flex items-center gap-3 cursor-pointer hover:bg-slate-800 rounded-lg ${
                isExpanded ? "p-2" : "p-1 justify-center"
              } transition-colors`}
            >
              <div
                className={`${
                  isExpanded ? "w-10 h-10" : "w-8 h-8"
                } bg-linear-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center shrink-0`}
              >
                <span
                  className={`text-white ${
                    isExpanded ? "text-sm" : "text-xs"
                  } font-semibold`}
                >
                  {displayUser.avatar}
                </span>
              </div>
              {isExpanded && (
                <>
                  <div className="flex-1 min-w-0 overflow-hidden">
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
                    className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${
                      isAccountMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </>
              )}
            </div>

            {isExpanded && isAccountMenuOpen && (
              <div className="mt-2 pt-2 border-t border-slate-700 space-y-1">
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
            )}
          </div>
        </div>
      </div>
    </>
  );
}
