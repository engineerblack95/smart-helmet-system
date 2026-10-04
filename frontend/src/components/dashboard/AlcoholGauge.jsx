import { getAlcoholStatus } from '../../utils/formatters';

export const AlcoholGauge = ({ level = 0, threshold = 300 }) => {
  const percentage = Math.min((level / 1023) * 100, 100);
  const thresholdPct = (threshold / 1023) * 100;
  const status = getAlcoholStatus(level);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Alcohol Level</span>
        <span className={`text-sm font-bold ${status.color}`}>{status.label}</span>
      </div>
      <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            level >= threshold ? 'bg-red-500' : level >= 150 ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gray-900"
          style={{ left: `${thresholdPct}%` }}
          title="Threshold"
        />
      </div>
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
        <span>0</span>
        <span>Value: {level}</span>
        <span>1023</span>
      </div>
    </div>
  );
};