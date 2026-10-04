export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const ALCOHOL_THRESHOLD = 300;

export const VIOLATION_TYPES = {
  NO_HELMET: 'No Helmet',
  ALCOHOL_DETECTED: 'Alcohol Detected',
  WRONG_HELMET: 'Wrong Helmet',
  SENSOR_MALFUNCTION: 'Sensor Malfunction',
  DEVICE_OFFLINE: 'Device Offline',
};

export const SEVERITY_COLORS = {
  LOW: 'bg-blue-100 text-blue-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

export const STATUS_COLORS = {
  ONLINE: 'bg-green-100 text-green-800',
  OFFLINE: 'bg-gray-100 text-gray-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
};

export const SOCKET_EVENTS = {
  SENSOR_UPDATE: 'sensor:update',
  VIOLATION_NEW: 'violation:new',
  RIDE_START: 'ride:start',
  RIDE_END: 'ride:end',
  DEVICE_STATUS: 'device:status',
  ALERT_NEW: 'alert:new',
};