const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Emptying database...");
  await prisma.activity.deleteMany({});
  await prisma.referredFriend.deleteMany({});
  await prisma.memberReward.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.adminSession.deleteMany({});
  await prisma.adminUser.deleteMany({});
  await prisma.cashierPermission.deleteMany({});
  await prisma.otpSession.deleteMany({});
  await prisma.referral.deleteMany({});
  await prisma.member.deleteMany({});
  await prisma.rewardTemplate.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.storeMapping.deleteMany({});
  await prisma.newMenu.deleteMany({});
  await prisma.promo.deleteMany({});
  await prisma.systemSetting.deleteMany({});
  await prisma.messageTemplate.deleteMany({});
  await prisma.uiTextOverride.deleteMany({});
  await prisma.syncLog.deleteMany({});
  console.log("Database successfully emptied.");
}

main()
  .catch(e => {
    console.error("Error emptying DB:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
