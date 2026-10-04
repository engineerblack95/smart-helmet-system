import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, Bike as BikeIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { Topbar } from '../components/layout/Topbar';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Spinner } from '../components/common/Spinner';
import { EmptyState } from '../components/common/EmptyState';
import { bikeService } from '../services/bikeService';
import { STATUS_COLORS } from '../utils/constants';
import { formatDate } from '../utils/formatters';

export const Bikes = () => {
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ bikeCode: '', plateNumber: '', firmwareVer: '1.0.0' });

  const fetchBikes = async () => {
    try {
      const res = await bikeService.getAll();
      setBikes(res.data);
    } catch (err) {
      toast.error('Failed to load bikes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBikes(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await bikeService.update(editing.id, form);
        toast.success('Bike updated');
      } else {
        await bikeService.create(form);
        toast.success('Bike created');
      }
      setModalOpen(false);
      setEditing(null);
      setForm({ bikeCode: '', plateNumber: '', firmwareVer: '1.0.0' });
      fetchBikes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this bike?')) return;
    try {
      await bikeService.remove(id);
      toast.success('Bike deleted');
      fetchBikes();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  return (
    <>
      <Topbar title="Bikes" subtitle="Manage all registered motorcycles" />
      <div className="p-6">
        <Card
          title={`All Bikes (${bikes.length})`}
          action={
            <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Bike
            </button>
          }
        >
          {loading ? (
            <Spinner className="py-12" />
          ) : !bikes.length ? (
            <EmptyState icon={BikeIcon} title="No bikes" description="Add your first bike" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase border-b">
                    <th className="pb-3">Code</th>
                    <th className="pb-3">Plate</th>
                    <th className="pb-3">Owner</th>
                    <th className="pb-3">Paired Helmet</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Last Seen</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bikes.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="py-3 font-medium">{b.bikeCode}</td>
                      <td className="py-3 text-sm">{b.plateNumber || '—'}</td>
                      <td className="py-3 text-sm text-gray-600">{b.owner?.fullName || '—'}</td>
                      <td className="py-3 text-sm">{b.helmet?.helmetCode || '—'}</td>
                      <td className="py-3">
                        <Badge className={STATUS_COLORS[b.status]}>{b.status}</Badge>
                      </td>
                      <td className="py-3 text-sm text-gray-500">{formatDate(b.lastSeenAt)}</td>
                      <td className="py-3 text-right">
                        <button onClick={() => { setEditing(b); setForm({ bikeCode: b.bikeCode, plateNumber: b.plateNumber || '', firmwareVer: b.firmwareVer || '1.0.0' }); setModalOpen(true); }} className="p-2 hover:bg-gray-100 rounded-lg">
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button onClick={() => handleDelete(b.id)} className="p-2 hover:bg-red-50 rounded-lg">
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

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit Bike' : 'Add Bike'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Bike Code" value={form.bikeCode} onChange={(e) => setForm({ ...form, bikeCode: e.target.value })} placeholder="B001" required />
          <Input label="Plate Number" value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} placeholder="RAB 123 A" />
          <div className="flex gap-3 justify-end pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
};