import prisma from '../config/database.js';

export const helmetService = {
  async getAll(filters = {}) {
    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.ownerId) where.ownerId = filters.ownerId;

    return prisma.helmet.findMany({
      where,
      include: {
        owner: { select: { id: true, fullName: true, email: true } },
        bike: { select: { id: true, bikeCode: true, plateNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getById(id) {
    const helmet = await prisma.helmet.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, fullName: true, email: true } },
        bike: true,
      },
    });
    if (!helmet) throw new Error('Helmet not found');
    return helmet;
  },

  async getByCode(code) {
    return prisma.helmet.findUnique({
      where: { helmetCode: code },
      include: { owner: true, bike: true },
    });
  },

  async create(data) {
    return prisma.helmet.create({
      data: {
        helmetCode: data.helmetCode,
        ownerId: data.ownerId || null,
        firmwareVer: data.firmwareVer || '1.0.0',
      },
    });
  },

  async update(id, data) {
    return prisma.helmet.update({
      where: { id },
      data,
    });
  },

  async delete(id) {
    return prisma.helmet.delete({ where: { id } });
  },

  async updateStatus(id, status) {
    return prisma.helmet.update({
      where: { id },
      data: { status, lastSeenAt: new Date() },
    });
  },

  async getStats() {
    const [total, online, offline, maintenance] = await Promise.all([
      prisma.helmet.count(),
      prisma.helmet.count({ where: { status: 'ONLINE' } }),
      prisma.helmet.count({ where: { status: 'OFFLINE' } }),
      prisma.helmet.count({ where: { status: 'MAINTENANCE' } }),
    ]);
    return { total, online, offline, maintenance };
  },
};