import { User, Zap, Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { Badge } from './ui/badge';

interface TestCaseHeaderProps {
  testCase: {
    id: string;
    title: string;
    suite: string;
    priority: string;
    caseType: string;
    automation: string;
    reviewStatus?: 'pending' | 'pending_revision' | 'approved' | 'needs_revision';
  };
}

const getPriorityColor = (priority: string) => {
  const colors: any = {
    'Critical': 'bg-red-500/20 text-red-400 border-red-500/30',
    'High': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'Medium': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Low': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };
  return colors[priority] || colors['Medium'];
};

const getCaseTypeColor = (caseType: string) => {
  const colors: any = {
    'Positive': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Negative': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Edge': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  };
  return colors[caseType] || colors['Positive'];
};

const getReviewStatusBadge = (status?: string) => {
  if (!status) return null;
  
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 border">
          <Clock className="w-3 h-3 mr-1" />
          New Review
        </Badge>
      );
    case 'pending_revision':
      return (
        <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30 border">
          <MessageSquare className="w-3 h-3 mr-1" />
          Revised
        </Badge>
      );
    case 'approved':
      return (
        <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 border">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    case 'needs_revision':
      return (
        <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30 border">
          <XCircle className="w-3 h-3 mr-1" />
          Needs Revision
        </Badge>
      );
    default:
      return null;
  }
};

export function TestCaseHeader({ testCase }: TestCaseHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="mb-0">{testCase.title}</h1>
          <Badge variant="outline" className={`${getPriorityColor(testCase.priority)} border`}>
            {testCase.priority}
          </Badge>
          <Badge variant="outline" className={`${getCaseTypeColor(testCase.caseType)} border`}>
            {testCase.caseType}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span className="text-blue-400">{testCase.id}</span>
          <span>•</span>
          <span>{testCase.suite}</span>
          <span>•</span>
          <div className="flex items-center gap-1">
            {testCase.automation === 'Automated' ? (
              <>
                <Zap className="w-3 h-3 text-purple-400" />
                <span className="text-purple-400">Automated</span>
              </>
            ) : (
              <>
                <User className="w-3 h-3" />
                <span>Manual</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Review Status Badge - Right Side */}
      {testCase.reviewStatus && (
        <div className="shrink-0">
          {getReviewStatusBadge(testCase.reviewStatus)}
        </div>
      )}
    </div>
  );
}
