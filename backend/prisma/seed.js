import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smarthelmet.com' },
    update: {},
    create: {
      email: 'admin@smarthelmet.com',
      passwordHash: adminPassword,
      fullName: 'System Admin',
      phone: '+250780000000',
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin created:', admin.email);

  // 2. Create owner
  const ownerPassword = await bcrypt.hash('owner123', 10);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@smarthelmet.com' },
    update: {},
    create: {
      email: 'owner@smarthelmet.com',
      passwordHash: ownerPassword,
      fullName: 'Bike Owner',
      phone: '+250780000001',
      role: 'OWNER',
    },
  });
  console.log('✅ Owner created:', owner.email);

  // 3. Create rider
  const riderPassword = await bcrypt.hash('rider123', 10);
  const rider = await prisma.user.upsert({
    where: { email: 'rider@smarthelmet.com' },
    update: {},
    create: {
      email: 'rider@smarthelmet.com',
      passwordHash: riderPassword,
      fullName: 'John Rider',
      phone: '+250780000002',
      role: 'RIDER',
    },
  });
  console.log('✅ Rider created:', rider.email);

  // 4. Create helmet
  const helmet = await prisma.helmet.upsert({
    where: { helmetCode: 'H001' },
    update: {},
    create: {
      helmetCode: 'H001',
      ownerId: rider.id,
      batteryLevel: 100,
      status: 'OFFLINE',
      firmwareVer: '1.0.0',
    },
  });
  console.log('✅ Helmet created:', helmet.helmetCode);

  // 5. Create bike
  const bike = await prisma.bike.upsert({
    where: { bikeCode: 'B001' },
    update: {},
    create: {
      bikeCode: 'B001',
      ownerId: owner.id,
      helmetId: helmet.id,
      plateNumber: 'RAB 123 A',
      status: 'OFFLINE',
      firmwareVer: '1.0.0',
    },
  });
  console.log('✅ Bike created:', bike.bikeCode);

  // 6. Create device API keys
  const helmetKey = crypto.randomBytes(32).toString('hex');
  const bikeKey = crypto.randomBytes(32).toString('hex');

  await prisma.deviceKey.upsert({
    where: { deviceCode: 'H001' },
    update: {},
    create: {
      deviceCode: 'H001',
      apiKey: helmetKey,
      deviceType: 'HELMET',
    },
  });

  await prisma.deviceKey.upsert({
    where: { deviceCode: 'B001' },
    update: {},
    create: {
      deviceCode: 'B001',
      apiKey: bikeKey,
      deviceType: 'BIKE',
    },
  });

  console.log('\n🔑 DEVICE API KEYS (save these for ESP32):');
  console.log('   Helmet H001:', helmetKey);
  console.log('   Bike B001:  ', bikeKey);

  console.log('\n🔐 LOGIN CREDENTIALS:');
  console.log('   Admin:  admin@smarthelmet.com / admin123');
  console.log('   Owner:  owner@smarthelmet.com / owner123');
  console.log('   Rider:  rider@smarthelmet.com  / rider123');

  console.log('\n✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });