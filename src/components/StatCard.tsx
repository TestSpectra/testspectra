import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: 'blue' | 'purple' | 'cyan' | 'green' | 'orange' | 'red';
  trend?: string;
  onClick?: () => void;
}

export function StatCard({ title, value, icon: Icon, color, trend, onClick }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-600/20 text-blue-400',
    purple: 'bg-purple-600/20 text-purple-400',
    cyan: 'bg-cyan-600/20 text-cyan-400',
    green: 'bg-green-600/20 text-green-400',
    orange: 'bg-orange-600/20 text-orange-400',
    red: 'bg-red-600/20 text-red-400',
  };

  return (
    <div 
      className={`bg-slate-900 rounded-xl border border-slate-800 p-6 ${onClick ? 'cursor-pointer hover:border-slate-700 transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div>
        <p className="text-sm text-slate-400 mb-1">{title}</p>
        <h2 className="mb-2">{value}</h2>
        {trend && <p className="text-xs text-slate-500">{trend}</p>}
      </div>
    </div>
  );
}
