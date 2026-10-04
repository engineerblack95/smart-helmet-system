import { Server } from 'socket.io';
import { config } from '../config/env.js';
import logger from '../utils/logger.js';

let io = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Client can join rooms for specific helmets
    socket.on('join:helmet', (helmetCode) => {
      socket.join(`helmet:${helmetCode}`);
      logger.info(`Socket ${socket.id} joined helmet:${helmetCode}`);
    });

    socket.on('leave:helmet', (helmetCode) => {
      socket.leave(`helmet:${helmetCode}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};