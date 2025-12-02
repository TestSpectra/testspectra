import { X } from 'lucide-react';
import { Button } from './ui/button';
import { ReactNode } from 'react';

interface SimpleDialogProps {
  isOpen: boolean;
  title: string | ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function SimpleDialog({ isOpen, title, onClose, children, footer }: SimpleDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg">{title}</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          {children}
        </div>

        {footer && (
          <div className="flex items-center gap-3 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmClass?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  confirmClass = 'bg-red-600 hover:bg-red-700 text-white',
  isLoading = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg">{title}</h2>
          <button onClick={onCancel} className="p-1 text-slate-400 hover:text-slate-200 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-slate-300 mb-6">
          {message}
        </div>

        <div className="flex items-center gap-3 justify-end">
          <Button 
            onClick={onCancel} 
            variant="outline" 
            className="border-slate-600 bg-transparent text-slate-100 hover:bg-slate-800 hover:text-white"
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button 
            onClick={onConfirm}
            className={confirmClass}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
