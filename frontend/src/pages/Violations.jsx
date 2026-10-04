import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Topbar } from '../components/layout/Topbar';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';
import { EmptyState } from '../components/common/EmptyState';
import { violationService } from '../services/violationService';
import { SEVERITY_COLORS, VIOLATION_TYPES } from '../utils/constants';
import { formatDate } from '../utils/formatters';

export const Violations = () => {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchViolations = async () => {
    try {
      const params = filter === 'unresolved' ? { isResolved: false } : {};
      const res = await violationService.getAll(params);
      setViolations(res.data);
    } catch (err) {
      toast.error('Failed to load violations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchViolations(); }, [filter]);

  const handleResolve = async (id) => {
    try {
      await violationService.resolve(id);
      toast.success('Violation resolved');
      fetchViolations();
    } catch (err) {
      toast.error('Failed to resolve');
    }
  };

  return (
    <>
      <Topbar title="Violations" subtitle="All safety violations" />
      <div className="p-6">
        <Card
          title={`Violations (${violations.length})`}
          action={
            <div className="flex gap-2">
              {['all', 'unresolved'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {f === 'all' ? 'All' : 'Unresolved'}
                </button>
              ))}
            </div>
          }
        >
          {loading ? (
            <Spinner className="py-12" />
          ) : !violations.length ? (
            <EmptyState icon={AlertTriangle} title="No violations" description="Everything is clear" />
          ) : (
            <div className="space-y-3">
              {violations.map((v) => (
                <div key={v.id} className="flex items-start gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    v.isResolved ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {v.isResolved ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium">{VIOLATION_TYPES[v.type] || v.type}</span>
                      <Badge className={SEVERITY_COLORS[v.severity]}>{v.severity}</Badge>
                      <Badge className="bg-gray-100 text-gray-700">{v.helmet?.helmetCode}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{v.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(v.timestamp)}</p>
                  </div>
                  {!v.isResolved && (
                    <button onClick={() => handleResolve(v.id)} className="btn-secondary text-sm">
                      Resolve
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
};