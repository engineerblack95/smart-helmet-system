import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import prisma from '../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token or user disabled' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }
    next();
  };
};

// Device authentication (for ESP32/Arduino)
export const authenticateDevice = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({ 
        success: false, 
        message: 'No API key provided' 
      });
    }

    const deviceKey = await prisma.deviceKey.findUnique({
      where: { apiKey },
    });

    if (!deviceKey || !deviceKey.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or inactive API key' 
      });
    }

    // Update last used
    await prisma.deviceKey.update({
      where: { id: deviceKey.id },
      data: { lastUsedAt: new Date() },
    });

    req.device = deviceKey;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Device authentication failed' 
    });
  }
};