import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { Topbar } from '../components/layout/Topbar';
import { Card } from '../components/common/Card';
import { AlcoholGauge } from '../components/dashboard/AlcoholGauge';
import { HelmetStatusCard } from '../components/dashboard/HelmetStatusCard';
import { Spinner } from '../components/common/Spinner';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import { helmetService } from '../services/helmetService';
import { sensorService } from '../services/sensorService';
import { useSocket } from '../contexts/SocketContext';
import { SOCKET_EVENTS } from '../utils/constants';
import { timeAgo } from '../utils/formatters';

export const LiveMonitor = () => {
  const [helmets, setHelmets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await helmetService.getAll();
        setHelmets(res.data);
        if (res.data.length) setSelected(res.data[0]);
      } catch (err) {
        toast.error('Failed to load helmets');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    if (!selected) return;
    const fetchLive = async () => {
      try {
        const res = await sensorService.getLive(selected.helmetCode);
        setLiveData(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchLive();
  }, [selected]);

  useEffect(() => {
    if (!socket || !selected) return;

    socket.emit('join:helmet', selected.helmetCode);

    const handleUpdate = (data) => {
      if (data.helmetCode === selected.helmetCode) {
        setLiveData((prev) => ({ ...prev, latest: data }));
      }
    };

    socket.on(SOCKET_EVENTS.SENSOR_UPDATE, handleUpdate);

    return () => {
      socket.off(SOCKET_EVENTS.SENSOR_UPDATE, handleUpdate);
      socket.emit('leave:helmet', selected.helmetCode);
    };
  }, [socket, selected]);

  if (loading) {
    return (
      <>
        <Topbar title="Live Monitor" />
        <div className="p-6"><Spinner className="py-20" /></div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Live Monitor" subtitle="Real-time helmet monitoring" />
      <div className="p-6 space-y-6">
        {/* Helmet Selector */}
        <div className="flex gap-2 flex-wrap">
          {helmets.map((h) => (
            <button
              key={h.id}
              onClick={() => setSelected(h)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selected?.id === h.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {h.helmetCode}
            </button>
          ))}
        </div>

        {!selected ? (
          <EmptyState icon={Activity} title="No helmets" description="Register a helmet first" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <HelmetStatusCard helmet={selected} liveData={liveData} />
            </div>

            <Card title="Alcohol Level" className="lg:col-span-2">
              <AlcoholGauge level={liveData?.latest?.alcoholLevel || 0} />
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="text-sm font-medium mt-1">
                    {liveData?.latest?.worn ? '✅ Worn' : '❌ Not worn'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Engine</p>
                  <p className="text-sm font-medium mt-1">
                    {liveData?.latest?.engineAllowed ? '✅ Allowed' : '🚫 Blocked'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">ID Match</p>
                  <p className="text-sm font-medium mt-1">
                    {liveData?.latest?.idMatch ? '✅ Yes' : '❌ No'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last Update</p>
                  <p className="text-sm font-medium mt-1">{timeAgo(liveData?.latest?.timestamp)}</p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  );
};