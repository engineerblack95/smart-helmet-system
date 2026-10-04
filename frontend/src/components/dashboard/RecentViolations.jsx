import { AlertTriangle } from 'lucide-react';
import { Badge } from '../common/Badge';
import { SEVERITY_COLORS, VIOLATION_TYPES } from '../../utils/constants';
import { timeAgo } from '../../utils/formatters';
import { EmptyState } from '../common/EmptyState';

export const RecentViolations = ({ violations = [] }) => {
  if (!violations.length) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No violations"
        description="All clear — no violations recorded"
      />
    );
  }

  return (
    <div className="space-y-3">
      {violations.slice(0, 5).map((v) => (
        <div key={v.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-900">
                {VIOLATION_TYPES[v.type] || v.type}
              </span>
              <Badge className={SEVERITY_COLORS[v.severity]}>{v.severity}</Badge>
            </div>
            <p className="text-xs text-gray-500 truncate">{v.description}</p>
            <p className="text-xs text-gray-400 mt-1">{timeAgo(v.timestamp)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};