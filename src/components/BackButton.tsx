import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

interface BackButtonProps {
  onClick: () => void;
  className?: string;
}

export function BackButton({ onClick, className = "" }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-800 ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Back</span>
    </button>
  );
}
