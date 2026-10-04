import prisma from '../config/database.js';

export const dashboardController = {
  async getOverview(req, res, next) {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [
        totalHelmets,
        onlineHelmets,
        totalBikes,
        onlineBikes,
        activeRides,
        totalViolations24h,
        unresolvedViolations,
        recentViolations,
      ] = await Promise.all([
        prisma.helmet.count(),
        prisma.helmet.count({ where: { status: 'ONLINE' } }),
        prisma.bike.count(),
        prisma.bike.count({ where: { status: 'ONLINE' } }),
        prisma.ride.count({ where: { status: 'ACTIVE' } }),
        prisma.violation.count({ where: { timestamp: { gte: oneDayAgo } } }),
        prisma.violation.count({ where: { isResolved: false } }),
        prisma.violation.findMany({
          take: 10,
          orderBy: { timestamp: 'desc' },
          include: { helmet: { select: { helmetCode: true } } },
        }),
      ]);

      res.json({
        success: true,
        data: {
          helmets: { total: totalHelmets, online: onlineHelmets },
          bikes: { total: totalBikes, online: onlineBikes },
          rides: { active: activeRides },
          violations: {
            last24h: totalViolations24h,
            unresolved: unresolvedViolations,
            recent: recentViolations,
          },
        },
      });
    } catch (error) { next(error); }
  },

  async getViolationTrends(req, res, next) {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const violations = await prisma.violation.findMany({
        where: { timestamp: { gte: sevenDaysAgo } },
        select: { timestamp: true, type: true, severity: true },
        orderBy: { timestamp: 'asc' },
      });

      // Group by day
      const trends = {};
      violations.forEach((v) => {
        const day = v.timestamp.toISOString().split('T')[0];
        if (!trends[day]) trends[day] = { date: day, total: 0, byType: {} };
        trends[day].total++;
        trends[day].byType[v.type] = (trends[day].byType[v.type] || 0) + 1;
      });

      res.json({ success: true, data: Object.values(trends) });
    } catch (error) { next(error); }
  },
};