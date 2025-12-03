import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
  currentUser: any;
  onCheckForUpdates?: () => void;
}

export function Layout({ currentView, onViewChange, onLogout, currentUser, onCheckForUpdates }: LayoutProps) {
  return (
    <div className="flex flex-1 overflow-hidden bg-slate-950 text-slate-100">
      <Sidebar
        currentView={currentView}
        onViewChange={onViewChange}
        onLogout={onLogout}
        currentUser={currentUser}
        onCheckForUpdates={onCheckForUpdates}
      />
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
