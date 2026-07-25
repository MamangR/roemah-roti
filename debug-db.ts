import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const deleted = await prisma.activity.deleteMany({
    where: { memberId: "6289616375544" }
  });

  console.log("Deleted stuck activities:", deleted.count);
}

run().catch(console.error).finally(() => prisma.$disconnect());
