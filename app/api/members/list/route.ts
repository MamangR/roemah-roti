import { prisma } from "@/lib/prisma";

// ─── GET /api/members/list ───────────────────────────────────────────────────
// Returns all members ordered by updatedAt desc, projected for admin table display.
export async function GET() {
  const members = await prisma.member.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      totalVisits: true,
      rewardsEarned: true,
      updatedAt: true,
    },
  });

  const rows = members.map((member) => ({
    id: member.id,
    name: member.name,
    phone: member.phone,
    visits: member.totalVisits,
    lastVisit: member.totalVisits > 0 ? "Recently" : "Not yet",
    rewardLabel: member.rewardsEarned > 0 ? "Redeemed" : "None yet",
    rewardStatus: member.rewardsEarned > 0 ? "redeemed" : "none",
  }));

  return Response.json(rows);
}
