import { format, formatDistanceToNow } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
};

export const formatTime = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'HH:mm:ss');
};

export const timeAgo = (date) => {
  if (!date) return '—';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const formatDuration = (seconds) => {
  if (!seconds) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
};

export const getAlcoholStatus = (level) => {
  if (level >= 300) return { label: 'DRUNK', color: 'text-red-600', bg: 'bg-red-100' };
  if (level >= 150) return { label: 'WARNING', color: 'text-yellow-600', bg: 'bg-yellow-100' };
  return { label: 'SOBER', color: 'text-green-600', bg: 'bg-green-100' };
};