// Seed script for admin users and default cashier permissions
// Run with: npx tsx prisma/seed-admin.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_CASHIER_PERMISSIONS: Record<string, boolean> = {
  view_dashboard: false,
  manage_members: false,
  add_visits: true,
  redeem_rewards: true,
  manage_rewards: false,
  manage_referral: false,
  manage_updates: false,
  manage_settings: false,
  manage_admins: false,
  manage_pos: false,
  manage_whatsapp: false,
  search_members: true,
  scan_qr: true,
  view_member_info: true,
  delete_member_data: false,
};

async function main() {
  console.log('Seeding admin users...');

  // Upsert admin user
  await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: 'admin',
      role: 'admin',
    },
  });
  console.log('  ✓ Admin user created (admin/admin)');

  // Upsert cashier user
  await prisma.adminUser.upsert({
    where: { username: 'cashier' },
    update: {},
    create: {
      username: 'cashier',
      password: 'cashier',
      role: 'cashier',
    },
  });
  console.log('  ✓ Cashier user created (cashier/cashier)');

  // Upsert default cashier permissions
  await prisma.cashierPermission.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      permissions: DEFAULT_CASHIER_PERMISSIONS,
    },
  });
  console.log('  ✓ Default cashier permissions created');

  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
