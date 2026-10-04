import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { ALCOHOL_THRESHOLD, VIOLATION_TYPES, SEVERITY, SOCKET_EVENTS } from '../utils/constants.js';
import { getIO } from '../sockets/socketHandler.js';

export const sensorService = {
  /**
   * CORE LOGIC: Process incoming sensor data from ESP32
   * 
   * Packet format from device:
   * {
   *   helmetCode: "H001",
   *   bikeCode: "B001",
   *   worn: 1,              // 0 or 1
   *   alcoholLevel: 250,    // 0-1023
   *   batteryLevel: 85,     // optional
   *   apiKey: "..."         // device auth
   * }
   * 
   * AND Gate Logic:
   * Engine Allowed = (ID Match) AND (Worn) AND (No Alcohol)
   */
  async processSensorData(data) {
    const { helmetCode, bikeCode, worn, alcoholLevel, batteryLevel } = data;

    // 1. Validate helmet exists
    const helmet = await prisma.helmet.findUnique({
      where: { helmetCode },
      include: { bike: true, owner: true },
    });

    if (!helmet) {
      throw new Error(`Helmet ${helmetCode} not registered`);
    }

    // 2. Validate bike exists
    const bike = await prisma.bike.findUnique({
      where: { bikeCode },
      include: { helmet: true },
    });

    if (!bike) {
      throw new Error(`Bike ${bikeCode} not registered`);
    }

    // 3. CHECK 1: Helmet ID matches bike's paired helmet
    const idMatch = bike.helmetId === helmet.id;

    // 4. CHECK 2: Helmet is worn
    const isWorn = worn === 1 || worn === true;

    // 5. CHECK 3: No alcohol detected
    const alcoholDetected = alcoholLevel >= ALCOHOL_THRESHOLD;
    const isSober = !alcoholDetected;

    // 6. AND GATE LOGIC — all three must be TRUE
    const engineAllowed = idMatch && isWorn && isSober;

    // 7. Find active ride for this helmet
    let activeRide = await prisma.ride.findFirst({
      where: { helmetId: helmet.id, status: 'ACTIVE' },
    });

    // 8. Auto-start a ride if engine allowed and no active ride
    if (engineAllowed && !activeRide) {
      activeRide = await prisma.ride.create({
        data: {
          riderId: helmet.ownerId,
          helmetId: helmet.id,
          bikeId: bike.id,
          status: 'ACTIVE',
        },
      });
      logger.info(`Ride started: ${activeRide.id} for helmet ${helmetCode}`);
      
      // Emit ride start
      getIO().emit(SOCKET_EVENTS.RIDE_START, activeRide);
    }

    // 9. Save sensor log
    const sensorLog = await prisma.sensorLog.create({
      data: {
        helmetId: helmet.id,
        rideId: activeRide?.id || null,
        worn: isWorn,
        alcoholDetected,
        alcoholLevel,
        batteryLevel: batteryLevel || null,
        engineAllowed,
        relayState: engineAllowed,
      },
    });

    // 10. Update helmet status
    await prisma.helmet.update({
      where: { id: helmet.id },
      data: {
        status: 'ONLINE',
        lastSeenAt: new Date(),
        batteryLevel: batteryLevel || helmet.batteryLevel,
      },
    });

    // 11. Update bike status
    await prisma.bike.update({
      where: { id: bike.id },
      data: { status: 'ONLINE', lastSeenAt: new Date() },
    });

    // 12. Detect and record violations
    const violations = [];
    if (!idMatch) {
      violations.push({
        type: VIOLATION_TYPES.WRONG_HELMET,
        severity: SEVERITY.HIGH,
        description: `Helmet ${helmetCode} is not paired with bike ${bikeCode}`,
      });
    }
    if (!isWorn) {
      violations.push({
        type: VIOLATION_TYPES.NO_HELMET,
        severity: SEVERITY.HIGH,
        description: 'Helmet removed while engine is active',
      });
    }
    if (alcoholDetected) {
      violations.push({
        type: VIOLATION_TYPES.ALCOHOL_DETECTED,
        severity: SEVERITY.CRITICAL,
        description: `Alcohol level ${alcoholLevel} exceeds threshold ${ALCOHOL_THRESHOLD}`,
        alcoholLevel,
      });
    }

    // 13. Save violations and create alerts
    for (const v of violations) {
      const violation = await prisma.violation.create({
        data: {
          helmetId: helmet.id,
          riderId: helmet.ownerId,
          rideId: activeRide?.id || null,
          type: v.type,
          severity: v.severity,
          description: v.description,
          alcoholLevel: v.alcoholLevel || null,
        },
      });

      await prisma.alert.create({
        data: {
          violationId: violation.id,
          message: `[${v.severity}] ${v.description}`,
          status: 'PENDING',
        },
      });

      // Emit violation in real-time
      getIO().emit(SOCKET_EVENTS.VIOLATION_NEW, violation);
    }

    // 14. Update ride violation count
    if (activeRide && violations.length > 0) {
      await prisma.ride.update({
        where: { id: activeRide.id },
        data: { totalViolations: { increment: violations.length } },
      });
    }

    // 15. Emit real-time sensor update
    const payload = {
      helmetCode,
      bikeCode,
      worn: isWorn,
      alcoholLevel,
      alcoholDetected,
      engineAllowed,
      relayState: engineAllowed,
      batteryLevel: batteryLevel || null,
      idMatch,
      timestamp: sensorLog.timestamp,
      violations: violations.map((v) => v.type),
    };

    getIO().emit(SOCKET_EVENTS.SENSOR_UPDATE, payload);

    return {
      engineAllowed,
      relayState: engineAllowed,
      idMatch,
      isWorn,
      isSober,
      violations: violations.map((v) => v.type),
      rideId: activeRide?.id || null,
      timestamp: sensorLog.timestamp,
    };
  },

  async getLiveData(helmetCode) {
    const helmet = await prisma.helmet.findUnique({
      where: { helmetCode },
    });
    if (!helmet) throw new Error('Helmet not found');

    const latest = await prisma.sensorLog.findFirst({
      where: { helmetId: helmet.id },
      orderBy: { timestamp: 'desc' },
    });

    return {
      helmet: {
        code: helmet.helmetCode,
        status: helmet.status,
        batteryLevel: helmet.batteryLevel,
        lastSeenAt: helmet.lastSeenAt,
      },
      latest,
    };
  },

  async getHistory(helmetCode, limit = 100) {
    const helmet = await prisma.helmet.findUnique({
      where: { helmetCode },
    });
    if (!helmet) throw new Error('Helmet not found');

    return prisma.sensorLog.findMany({
      where: { helmetId: helmet.id },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  },

  async getStats(helmetCode) {
    const helmet = await prisma.helmet.findUnique({
      where: { helmetCode },
    });
    if (!helmet) throw new Error('Helmet not found');

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [total, violations, avgAlcohol, wornCount] = await Promise.all([
      prisma.sensorLog.count({ where: { helmetId: helmet.id } }),
      prisma.violation.count({ where: { helmetId: helmet.id } }),
      prisma.sensorLog.aggregate({
        where: { helmetId: helmet.id, timestamp: { gte: oneDayAgo } },
        _avg: { alcoholLevel: true },
      }),
      prisma.sensorLog.count({
        where: { helmetId: helmet.id, worn: true, timestamp: { gte: oneDayAgo } },
      }),
    ]);

    return {
      totalReadings: total,
      totalViolations: violations,
      avgAlcoholLevel: avgAlcohol._avg.alcoholLevel || 0,
      wornCount24h: wornCount,
    };
  },
};