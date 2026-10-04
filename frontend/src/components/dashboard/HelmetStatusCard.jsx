import { HardHat, Battery, Wifi } from 'lucide-react';
import { Badge } from '../common/Badge';
import { STATUS_COLORS } from '../../utils/constants';
import { timeAgo } from '../../utils/formatters';

export const HelmetStatusCard = ({ helmet, liveData }) => {
  const isOnline = helmet?.status === 'ONLINE';
  const worn = liveData?.latest?.worn;
  const engineAllowed = liveData?.latest?.engineAllowed;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HardHat className="w-5 h-5 text-primary-600" />
          <span className="font-semibold">{helmet?.helmetCode}</span>
        </div>
        <Badge className={STATUS_COLORS[helmet?.status] || STATUS_COLORS.OFFLINE}>
          {helmet?.status || 'UNKNOWN'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${worn ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className="text-gray-600">{worn ? 'Worn' : 'Not worn'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${engineAllowed ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-gray-600">{engineAllowed ? 'Engine OK' : 'Blocked'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Battery className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">{helmet?.batteryLevel || 0}%</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Wifi className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">{timeAgo(helmet?.lastSeenAt)}</span>
        </div>
      </div>
    </div>
  );
};