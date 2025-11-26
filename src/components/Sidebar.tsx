import { LayoutDashboard, FileCheck, History, Settings, Globe, CheckCircle2, XCircle, Clock, Wrench, GitBranch, Users, ChevronDown, UserCircle, LogOut } from 'lucide-react';
import { useState } from 'react';

type View = 'dashboard' | 'test-cases' | 'runs-history' | 'configuration' | 'tools' | 'user-management' | 'account';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: View) => void;
  onLogout?: () => void;
}

export function Sidebar({ currentView, onViewChange, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'test-cases', label: 'Test Cases', icon: FileCheck },
    { id: 'runs-history', label: 'Runs History', icon: History },
    { id: 'configuration', label: 'Configuration', icon: Settings },
    { id: 'tools', label: 'Tools', icon: Wrench },
    { id: 'user-management', label: 'User Management', icon: Users },
  ];

  // Mock Git user data - in real app, this would be fetched from local Git config
  const gitUser = {
    name: 'Ahmad Rahman',
    email: 'ahmad.rahman@company.com',
    avatar: 'AR'
  };

  const [isAccountMenuOpen, setAccountMenuOpen] = useState(false);

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
      {/* Logo & Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <FileCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white">TestSpectra</h1>
            <p className="text-xs text-slate-400">Automation Lifecycle</p>
          </div>
        </div>
      </div>

      {/* Sync Status Indicator */}
      <div className="px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-slate-300">Synced</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Last sync: 2 minutes ago</p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id || 
                           (currentView === 'test-case-form' && item.id === 'test-cases') ||
                           (currentView === 'test-report' && item.id === 'dashboard');
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id as View)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Quick Stats */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-slate-400">Passed</span>
          </div>
          <span className="text-green-500">847</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-slate-400">Failed</span>
          </div>
          <span className="text-red-500">23</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <span className="text-slate-400">Running</span>
          </div>
          <span className="text-orange-500">5</span>
        </div>
      </div>

      {/* Git User Profile */}
      <div className="p-4 border-t border-slate-800 bg-slate-800/30">
        <div 
          onClick={() => setAccountMenuOpen(!isAccountMenuOpen)}
          className="flex items-center gap-3 cursor-pointer hover:bg-slate-800 rounded-lg p-2 transition-colors"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm">{gitUser.avatar}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <GitBranch className="w-3 h-3 text-slate-400" />
              <p className="text-sm text-slate-200 truncate">{gitUser.name}</p>
            </div>
            <p className="text-xs text-slate-500 truncate">{gitUser.email}</p>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
        </div>
        
        {isAccountMenuOpen && (
          <div className="mt-2 pt-2 border-t border-slate-700 space-y-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewChange('account');
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
  );
}