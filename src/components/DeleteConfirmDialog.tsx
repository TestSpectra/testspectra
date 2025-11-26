import { X } from 'lucide-react';
import { Button } from './ui/button';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({ isOpen, count, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg">Konfirmasi Hapus</h2>
          <button onClick={onCancel} className="p-1 text-slate-400 hover:text-slate-200 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-slate-300 mb-6">
          {count === 1 
            ? 'Apakah Anda yakin ingin menghapus test case ini?'
            : `Apakah Anda yakin ingin menghapus ${count} test case?`
          }
        </p>

        <div className="flex items-center gap-3 justify-end">
          <Button 
            onClick={onCancel} 
            variant="outline" 
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Batal
          </Button>
          <Button 
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Hapus {count > 1 && `(${count})`}
          </Button>
        </div>
      </div>
    </div>
  );
}
