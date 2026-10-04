export const VIOLATION_TYPES = {
  NO_HELMET: 'NO_HELMET',
  ALCOHOL_DETECTED: 'ALCOHOL_DETECTED',
  WRONG_HELMET: 'WRONG_HELMET',
  SENSOR_MALFUNCTION: 'SENSOR_MALFUNCTION',
  DEVICE_OFFLINE: 'DEVICE_OFFLINE',
};

export const SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

export const ALCOHOL_THRESHOLD = 300; // Raw MQ-3 value
export const DEVICE_TIMEOUT_MS = 5000; // 5 seconds
export const SENSOR_INTERVAL_MS = 500; // 500ms

export const SOCKET_EVENTS = {
  SENSOR_UPDATE: 'sensor:update',
  VIOLATION_NEW: 'violation:new',
  RIDE_START: 'ride:start',
  RIDE_END: 'ride:end',
  DEVICE_STATUS: 'device:status',
  ALERT_NEW: 'alert:new',
};