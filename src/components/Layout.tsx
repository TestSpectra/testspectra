import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
  currentUser: any;
}

export function Layout({ currentView, onViewChange, onLogout, currentUser }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      <Sidebar 
        currentView={currentView} 
        onViewChange={onViewChange} 
        onLogout={onLogout} 
        currentUser={currentUser} 
      />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
