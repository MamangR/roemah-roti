import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

// ─── GET /api/referrals?memberId=... ─────────────────────────────────────────
// Fetch referral progress for a member, creating a default record if none exists.
export async function GET(request: NextRequest) {
  const memberId = request.nextUrl.searchParams.get("memberId");

  if (!memberId) {
    return Response.json({ error: "memberId query param is required" }, { status: 400 });
  }

  const referral = await prisma.referral.upsert({
    where: { memberId },
    create: {
      memberId,
      code: `${memberId}-INSIDER`,
      joinedFriends: 0,
      requiredFriends: 3,
    },
    update: {}, // no-op update — just return existing row
  });

  return Response.json({
    memberId: referral.memberId,
    code: referral.code,
    joinedFriends: referral.joinedFriends,
    requiredFriends: referral.requiredFriends,
  });
}
