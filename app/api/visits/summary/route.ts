import { prisma } from "@/lib/prisma";

// ─── GET /api/visits/summary ──────────────────────────────────────────────────
// Returns aggregated visit/member stats for the admin dashboard.
export async function GET() {
  const [totalMembers, redeemedRewards, allMembers] = await Promise.all([
    prisma.member.count(),
    prisma.memberReward.count({
      where: { redeemedAt: { not: null } },
    }),
    prisma.member.findMany({
      select: { birthdayInput: true },
    }),
  ]);

  const currentMonth = new Date().getMonth();
  const birthdaysThisMonth = allMembers.filter((member) => {
    const birthday = new Date(`${member.birthdayInput}T00:00:00`);
    return !Number.isNaN(birthday.getTime()) && birthday.getMonth() === currentMonth;
  }).length;

  return Response.json({
    totalMembers: totalMembers.toLocaleString("en-US"),
    activeMembers: totalMembers.toLocaleString("en-US"),
    rewardsRedeemed: redeemedRewards.toLocaleString("en-US"),
    birthdaysThisMonth: birthdaysThisMonth.toLocaleString("en-US"),
  });
}
