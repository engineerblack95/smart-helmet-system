import { useEffect, useState } from 'react';
import { HardHat, Bike, AlertTriangle, Activity } from 'lucide-react';
import { Topbar } from '../components/layout/Topbar';
import { StatsCard } from '../components/dashboard/StatsCard';
import { RecentViolations } from '../components/dashboard/RecentViolations';
import { ViolationChart } from '../components/dashboard/ViolationChart';
import { Card } from '../components/common/Card';
import { Spinner } from '../components/common/Spinner';
import { dashboardService } from '../services/dashboardService';
import { useSocket } from '../contexts/SocketContext';
import { SOCKET_EVENTS } from '../utils/constants';
import toast from 'react-hot-toast';

export const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchData = async () => {
    try {
      const [overviewRes, trendsRes] = await Promise.all([
        dashboardService.getOverview(),
        dashboardService.getViolationTrends(),
      ]);
      setOverview(overviewRes.data);
      setTrends(trendsRes.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleViolation = (violation) => {
      toast.error(`Violation: ${violation.type}`, { duration: 5000 });
      fetchData();
    };

    socket.on(SOCKET_EVENTS.VIOLATION_NEW, handleViolation);
    socket.on(SOCKET_EVENTS.SENSOR_UPDATE, fetchData);

    return () => {
      socket.off(SOCKET_EVENTS.VIOLATION_NEW, handleViolation);
      socket.off(SOCKET_EVENTS.SENSOR_UPDATE, fetchData);
    };
  }, [socket]);

  if (loading) {
    return (
      <>
        <Topbar title="Dashboard" subtitle="Overview of your system" />
        <div className="p-6">
          <Spinner size="lg" className="py-20" />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Dashboard" subtitle="Overview of your system" />
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Helmets"
            value={overview?.helmets?.total || 0}
            subtitle={`${overview?.helmets?.online || 0} online`}
            icon={HardHat}
            color="primary"
          />
          <StatsCard
            title="Total Bikes"
            value={overview?.bikes?.total || 0}
            subtitle={`${overview?.bikes?.online || 0} online`}
            icon={Bike}
            color="purple"
          />
          <StatsCard
            title="Active Rides"
            value={overview?.rides?.active || 0}
            icon={Activity}
            color="success"
          />
          <StatsCard
            title="Violations (24h)"
            value={overview?.violations?.last24h || 0}
            subtitle={`${overview?.violations?.unresolved || 0} unresolved`}
            icon={AlertTriangle}
            color="danger"
          />
        </div>

        {/* Charts + Violations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card
            title="Violation Trends"
            subtitle="Last 7 days"
            className="lg:col-span-2"
          >
            <ViolationChart data={trends} />
          </Card>

          <Card title="Recent Violations" subtitle="Latest events">
            <RecentViolations violations={overview?.violations?.recent || []} />
          </Card>
        </div>
      </div>
    </>
  );
};