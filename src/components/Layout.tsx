import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
  onCheckForUpdates?: () => void;
}

export function Layout({
  currentView,
  onViewChange,
  onLogout,
  onCheckForUpdates,
}: LayoutProps) {
  return (
    <div className="flex flex-1 overflow-hidden bg-slate-950 text-slate-100">
      <Sidebar
        currentView={currentView}
        onViewChange={onViewChange}
        onLogout={onLogout}
        onCheckForUpdates={onCheckForUpdates}
      />
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
