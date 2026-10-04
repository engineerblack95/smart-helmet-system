import http from 'http';
import app from './app.js';
import { config } from './config/env.js';
import { initSocket } from './sockets/socketHandler.js';
import logger from './utils/logger.js';
import prisma from './config/database.js';

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Start server
const PORT = config.port;
server.listen(PORT, async () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📊 Environment: ${config.nodeEnv}`);
  logger.info(`🔌 Socket.IO ready`);

  // Test database connection
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
  }
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);