import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

// ─── GET /api/rewards?memberId=...&rewardType=... ─────────────────────────────
// Fetch a specific reward for a member by type (e.g. "birthday_treat").
export async function GET(request: NextRequest) {
  const memberId = request.nextUrl.searchParams.get("memberId");
  const rewardType = request.nextUrl.searchParams.get("rewardType");

  if (!memberId || !rewardType) {
    return Response.json({ error: "memberId and rewardType query params are required" }, { status: 400 });
  }

  const reward = await prisma.memberReward.findUnique({
    where: {
      memberId_rewardType: { memberId, rewardType },
    },
  });

  if (!reward) {
    return Response.json(null, { status: 200 });
  }

  // Map Prisma row to the Reward type shape expected by client components
  return Response.json({
    id: reward.rewardType,
    memberId: reward.memberId,
    title: reward.title,
    type: reward.type,
    description: reward.description,
    location: reward.location,
    value: reward.value,
    expiresAtLabel: reward.expiresAtLabel,
    isAvailable: reward.isAvailable,
    isOneTimeUse: reward.isOneTimeUse,
    redeemedAt: reward.redeemedAt?.toISOString() ?? null,
  });
}

// ─── POST /api/rewards ────────────────────────────────────────────────────────
// Atomically mark a reward as redeemed. Handles:
//   1. Birthday treat (upsert — row may not exist until first redemption)
//   2. Pre-existing MemberReward rows (e.g. visit milestone)
//   3. Dynamic RewardTemplate milestones
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { rewardId: string; memberId: string };
    const { rewardId, memberId } = body;

    if (!rewardId || !memberId) {
      return Response.json({ error: "rewardId and memberId are required" }, { status: 400 });
    }

    const redeemedAt = new Date();

    // ─── 0. Birthday treat special case ──────────────────────────────────────
    // rewardId will be 'birthday' (no DB row yet) or the actual MemberReward id
    // when the row already exists. We normalise both to 'birthday_treat'.
    const isBirthdayReward = rewardId === 'birthday' || rewardId === 'birthday_treat';
    if (isBirthdayReward) {
      // Validate the member is in their birth month
      const member = await prisma.member.findUnique({ where: { id: memberId } });
      if (!member) {
        return Response.json({ error: "Member not found" }, { status: 404 });
      }

      if (member.birthdayInput) {
        const birthMonth = parseInt(member.birthdayInput.split('-')[1], 10) - 1; // 0-indexed
        const currentMonth = new Date().getMonth();
        if (birthMonth !== currentMonth) {
          return Response.json({ error: "Birthday reward only redeemable during your birthday month" }, { status: 400 });
        }
      }

      // Check if already redeemed
      const existing = await prisma.memberReward.findUnique({
        where: { memberId_rewardType: { memberId, rewardType: 'birthday_treat' } },
      });

      if (existing?.redeemedAt) {
        return Response.json({ error: "Birthday reward already redeemed" }, { status: 400 });
      }

      const birthMonthIdx = member.birthdayInput ? parseInt(member.birthdayInput.split('-')[1], 10) - 1 : new Date().getMonth();
      const now = new Date();
      const lastDayOfMonth = new Date(now.getFullYear(), birthMonthIdx + 1, 0);
      const expiresAtLabel = lastDayOfMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });


      // Fetch SYSTEM_BIRTHDAY config if available
      const bdayConfig = await prisma.rewardTemplate.findUnique({ where: { id: 'SYSTEM_BIRTHDAY' }, include: { menuItem: true } });
      const bdayName = bdayConfig?.menuItem?.name || bdayConfig?.name || 'Birthday Treat Box';
      const bdayDesc = bdayConfig?.menuItem?.shortDesc || bdayConfig?.desc || 'A curated box of four seasonal pastries, our gift to you this birthday month.';

      // Upsert: create the row on first redemption, or update if it exists but was not yet redeemed
      await prisma.$transaction(async (tx) => {
        const reward = await tx.memberReward.upsert({
          where: { memberId_rewardType: { memberId, rewardType: 'birthday_treat' } },
          create: {
            memberId,
            sourceTemplateId: 'SYSTEM_BIRTHDAY',
            rewardType: 'birthday_treat',
            title: bdayName,
            type: 'Birthday Reward',
            description: bdayDesc,
            location: 'Roemah Roti',
            expiresAtLabel,
            isAvailable: false,
            isOneTimeUse: true,
            redeemedAt,
          },
          update: {
            redeemedAt,
            isAvailable: false,
          },
        });

        await tx.member.update({
          where: { id: memberId },
          data: { rewardsEarned: { increment: 1 } },
        });

        await tx.activity.create({
          data: {
            memberId,
            memberRewardId: reward.id,
            type: 'redeemed',
            date: redeemedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: redeemedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            outlet: 'Roemah Roti',
            reward: bdayName,
            ref: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
          },
        });
      });

      return Response.json({
        rewardId: 'birthday_treat',
        memberId,
        redeemedAt: redeemedAt.toISOString(),
        isAvailable: false,
      });
    }

    // ─── 1. Check if it's an existing MemberReward voucher ──
    const existingReward = await prisma.memberReward.findUnique({
      where: { id: rewardId }
    });

    if (existingReward) {
      if (existingReward.memberId !== memberId) {
        return Response.json({ error: "Unauthorized reward redemption" }, { status: 403 });
      }

      if (!existingReward.isAvailable || existingReward.redeemedAt) {
        return Response.json({ error: "Reward already redeemed or unavailable" }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        const updatedReward = await tx.memberReward.update({
          where: { id: existingReward.id },
          data: {
            redeemedAt,
            isAvailable: false,
          },
        });

        await tx.member.update({
          where: { id: memberId },
          data: { rewardsEarned: { increment: 1 } },
        });

        await tx.activity.create({
          data: {
            memberId: existingReward.memberId,
            memberRewardId: updatedReward.id,
            type: 'redeemed',
            date: redeemedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: redeemedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            outlet: existingReward.location || 'Roemah Roti',
            reward: existingReward.title,
            ref: `REF-${Math.floor(100000 + Math.random() * 900000)}`
          }
        });
      });

      return Response.json({
        rewardId,
        memberId,
        redeemedAt: redeemedAt.toISOString(),
        isAvailable: false,
      });
    }

    // ─── 2. Check if it matches a RewardTemplate milestone (dynamic redemption) ──
    const template = await prisma.rewardTemplate.findUnique({
      where: { id: rewardId },
      include: { menuItem: true }
    });

    if (!template) {
      return Response.json({ error: "Reward not found" }, { status: 404 });
    }

    const rewardName = template.menuItem?.name || template.name || 'Reward';
    const rewardDesc = template.menuItem?.shortDesc || template.desc || '';

    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return Response.json({ error: "Member not found" }, { status: 404 });
    }

    if (member.totalVisits < template.visitsRequired) {
      return Response.json({ error: "Not enough visits to unlock this reward" }, { status: 400 });
    }

    // Process dynamic redemption
    await prisma.$transaction(async (tx) => {
      await tx.member.update({
        where: { id: memberId },
        data: {
          totalVisits: member.totalVisits - template.visitsRequired,
          rewardsEarned: { increment: 1 }
        }
      });
      
      const newReward = await tx.memberReward.create({
        data: {
          memberId: member.id,
          sourceTemplateId: template.id,
          rewardType: template.id + '_' + Date.now(), // unique type so multiple can be issued
          title: rewardName,
          type: 'Visit Reward',
          description: rewardDesc,
          redeemedAt,
          isAvailable: false
        }
      });
      
      await tx.activity.create({
        data: {
          memberId: member.id,
          memberRewardId: newReward.id,
          type: 'redeemed',
          date: redeemedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: redeemedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          outlet: 'Roemah Roti',
          reward: rewardName,
          ref: `REF-${Math.floor(100000 + Math.random() * 900000)}`
        }
      });
    });

    return Response.json({
      rewardId,
      memberId,
      redeemedAt: redeemedAt.toISOString(),
      isAvailable: false,
    });
  } catch (error) {
    console.error("Redemption API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

