import { Calendar } from 'lucide-react';
import { Badge } from './ui/badge';
import { formatDateTime } from '../utils/date';

interface TestCaseMetadataProps {
  testCase: {
    createdByName?: string;
    createdAt?: string;
    updatedAt?: string;
    tags?: string[];
  };
}

export function TestCaseMetadata({ testCase }: TestCaseMetadataProps) {
  return (
    <>
      {/* Metadata */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h3 className="text-sm text-slate-400 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Metadata
        </h3>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-slate-500 mb-1">Created By</p>
            <p className="text-slate-300">{testCase.createdByName || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Created At</p>
            <p className="text-slate-300">{testCase.createdAt ? formatDateTime(testCase.createdAt) : '-'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Last Modified</p>
            <p className="text-slate-300">{testCase.updatedAt ? formatDateTime(testCase.updatedAt) : '-'}</p>
          </div>
        </div>
      </div>

      {/* Tags */}
      {testCase.tags && testCase.tags.length > 0 && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h3 className="text-sm text-slate-400 mb-4">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {testCase.tags.map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="bg-slate-800 text-slate-300 border-slate-700"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
