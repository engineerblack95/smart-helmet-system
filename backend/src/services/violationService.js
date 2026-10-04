import prisma from '../config/database.js';

export const violationService = {
  async getAll(filters = {}) {
    const where = {};
    if (filters.type) where.type = filters.type;
    if (filters.severity) where.severity = filters.severity;
    if (filters.isResolved !== undefined) where.isResolved = filters.isResolved === 'true';
    if (filters.helmetId) where.helmetId = filters.helmetId;

    return prisma.violation.findMany({
      where,
      include: {
        helmet: { select: { helmetCode: true } },
        rider: { select: { fullName: true, email: true } },
      },
      orderBy: { timestamp: 'desc' },
      take: parseInt(filters.limit) || 100,
    });
  },

  async getById(id) {
    const v = await prisma.violation.findUnique({
      where: { id },
      include: { helmet: true, rider: true, ride: true, alerts: true },
    });
    if (!v) throw new Error('Violation not found');
    return v;
  },

  async resolve(id, userId) {
    return prisma.violation.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: userId,
      },
    });
  },

  async getStats() {
    const [total, unresolved, byType, bySeverity] = await Promise.all([
      prisma.violation.count(),
      prisma.violation.count({ where: { isResolved: false } }),
      prisma.violation.groupBy({ by: ['type'], _count: true }),
      prisma.violation.groupBy({ by: ['severity'], _count: true }),
    ]);

    return { total, unresolved, byType, bySeverity };
  },
};