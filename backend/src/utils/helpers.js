import crypto from 'crypto';

export const generateApiKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const calculateDuration = (startTime, endTime) => {
  return Math.floor((new Date(endTime) - new Date(startTime)) / 1000);
};

export const formatDate = (date) => {
  return new Date(date).toISOString();
};

export const parsePagination = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};