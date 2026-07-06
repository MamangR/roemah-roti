const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const member = await prisma.member.findFirst();
  if (!member) {
    console.log("No member found. Please register first.");
    return;
  }
  
  console.log("Seeding data for member:", member.name);

  // Clear existing to avoid duplicates if run multiple times
  await prisma.activity.deleteMany({ where: { memberId: member.id } });
  await prisma.referredFriend.deleteMany({ where: { referrerId: member.id } });
  await prisma.memberReward.deleteMany({ where: { memberId: member.id, rewardType: 'birthday_treat' } });

  // 1. Visits
  await prisma.activity.createMany({
    data: [
      { memberId: member.id, type: 'visit', date: 'Jul 4, 2026', time: '8:12 AM', outlet: 'Greenville Outlet', visitNo: 'Visit #1' },
      { memberId: member.id, type: 'visit', date: 'Jul 5, 2026', time: '8:05 AM', outlet: 'Greenville Outlet', visitNo: 'Visit #2' }
    ]
  });

  // 2. Birthday Reward
  await prisma.memberReward.create({
    data: {
      memberId: member.id,
      rewardType: 'birthday_treat',
      title: 'Birthday Treat Box',
      type: 'Gift',
      description: 'A curated box of four seasonal pastries.',
      expiresAtLabel: 'Jul 31, 2026',
      isAvailable: true
    }
  });

  // 3. Referred Friend
  await prisma.referredFriend.create({
    data: {
      referrerId: member.id,
      friendName: 'Rangga Saputra',
      date: 'Jul 6, 2026',
      status: 'First visit completed',
      contribution: 'Counted toward your next reward.'
    }
  });

  await prisma.member.update({
    where: { id: member.id },
    data: { totalVisits: 2 }
  });

  console.log("Seeding complete!");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
