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
    <div className="flex h-screen bg-slate-950 text-slate-100">
      <Sidebar 
        currentView={currentView} 
        onViewChange={onViewChange} 
        onLogout={onLogout} 
        currentUser={currentUser} 
      />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
