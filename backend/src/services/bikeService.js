import prisma from '../config/database.js';

export const bikeService = {
  async getAll(filters = {}) {
    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.ownerId) where.ownerId = filters.ownerId;

    return prisma.bike.findMany({
      where,
      include: {
        owner: { select: { id: true, fullName: true, email: true } },
        helmet: { select: { id: true, helmetCode: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getById(id) {
    const bike = await prisma.bike.findUnique({
      where: { id },
      include: { owner: true, helmet: true },
    });
    if (!bike) throw new Error('Bike not found');
    return bike;
  },

  async create(data) {
    return prisma.bike.create({
      data: {
        bikeCode: data.bikeCode,
        ownerId: data.ownerId || null,
        helmetId: data.helmetId || null,
        plateNumber: data.plateNumber || null,
        firmwareVer: data.firmwareVer || '1.0.0',
      },
    });
  },

  async update(id, data) {
    return prisma.bike.update({ where: { id }, data });
  },

  async delete(id) {
    return prisma.bike.delete({ where: { id } });
  },

  async updateStatus(id, status) {
    return prisma.bike.update({
      where: { id },
      data: { status, lastSeenAt: new Date() },
    });
  },

  async getStats() {
    const [total, online, offline] = await Promise.all([
      prisma.bike.count(),
      prisma.bike.count({ where: { status: 'ONLINE' } }),
      prisma.bike.count({ where: { status: 'OFFLINE' } }),
    ]);
    return { total, online, offline };
  },
};