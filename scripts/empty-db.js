const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Emptying database...");
  await prisma.activity.deleteMany({});
  await prisma.referredFriend.deleteMany({});
  await prisma.memberReward.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.otpSession.deleteMany({});
  await prisma.referral.deleteMany({});
  await prisma.member.deleteMany({});
  console.log("Database successfully emptied.");
}

main()
  .catch(e => {
    console.error("Error emptying DB:");
    console.error(e);
  })
  .finally(async () => await prisma.$disconnect());
