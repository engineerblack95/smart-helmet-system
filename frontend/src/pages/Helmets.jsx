import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { Topbar } from '../components/layout/Topbar';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Spinner } from '../components/common/Spinner';
import { EmptyState } from '../components/common/EmptyState';
import { HardHat } from 'lucide-react';
import { helmetService } from '../services/helmetService';
import { STATUS_COLORS } from '../utils/constants';
import { formatDate } from '../utils/formatters';

export const Helmets = () => {
  const [helmets, setHelmets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ helmetCode: '', firmwareVer: '1.0.0' });

  const fetchHelmets = async () => {
    try {
      const res = await helmetService.getAll();
      setHelmets(res.data);
    } catch (err) {
      toast.error('Failed to load helmets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHelmets(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await helmetService.update(editing.id, form);
        toast.success('Helmet updated');
      } else {
        await helmetService.create(form);
        toast.success('Helmet created');
      }
      setModalOpen(false);
      setEditing(null);
      setForm({ helmetCode: '', firmwareVer: '1.0.0' });
      fetchHelmets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this helmet?')) return;
    try {
      await helmetService.remove(id);
      toast.success('Helmet deleted');
      fetchHelmets();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const openEdit = (helmet) => {
    setEditing(helmet);
    setForm({ helmetCode: helmet.helmetCode, firmwareVer: helmet.firmwareVer || '1.0.0' });
    setModalOpen(true);
  };

  return (
    <>
      <Topbar title="Helmets" subtitle="Manage all registered helmets" />
      <div className="p-6">
        <Card
          title={`All Helmets (${helmets.length})`}
          action={
            <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Helmet
            </button>
          }
        >
          {loading ? (
            <Spinner className="py-12" />
          ) : !helmets.length ? (
            <EmptyState icon={HardHat} title="No helmets" description="Add your first helmet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase border-b">
                    <th className="pb-3">Code</th>
                    <th className="pb-3">Owner</th>
                    <th className="pb-3">Battery</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Last Seen</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {helmets.map((h) => (
                    <tr key={h.id} className="hover:bg-gray-50">
                      <td className="py-3 font-medium">{h.helmetCode}</td>
                      <td className="py-3 text-sm text-gray-600">{h.owner?.fullName || '—'}</td>
                      <td className="py-3 text-sm">{h.batteryLevel}%</td>
                      <td className="py-3">
                        <Badge className={STATUS_COLORS[h.status]}>{h.status}</Badge>
                      </td>
                      <td className="py-3 text-sm text-gray-500">{formatDate(h.lastSeenAt)}</td>
                      <td className="py-3 text-right">
                        <button onClick={() => openEdit(h)} className="p-2 hover:bg-gray-100 rounded-lg">
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button onClick={() => handleDelete(h.id)} className="p-2 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? 'Edit Helmet' : 'Add Helmet'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Helmet Code"
            value={form.helmetCode}
            onChange={(e) => setForm({ ...form, helmetCode: e.target.value })}
            placeholder="H001"
            required
          />
          <Input
            label="Firmware Version"
            value={form.firmwareVer}
            onChange={(e) => setForm({ ...form, firmwareVer: e.target.value })}
          />
          <div className="flex gap-3 justify-end pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};