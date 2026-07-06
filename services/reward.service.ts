import { getStoredMemberPhoneToken } from "@/lib/member-session";
import type { Reward, RewardRedemptionResult } from "@/types/reward";

// ─── Get a member's birthday reward ──────────────────────────────────────────
export async function getBirthdayReward(memberId = getStoredMemberPhoneToken()): Promise<Reward | null> {
  if (!memberId) {
    return null;
  }

  const response = await fetch(
    `/api/rewards?memberId=${encodeURIComponent(memberId)}&rewardType=birthday_treat`,
  );

  if (!response.ok) {
    return null;
  }

  return response.json() as Promise<Reward | null>;
}

// ─── Redeem a reward ─────────────────────────────────────────────────────────
// The API route handles this atomically in a Prisma transaction.
export async function redeemReward(
  rewardId: string,
  memberId = getStoredMemberPhoneToken(),
): Promise<RewardRedemptionResult> {
  const redeemedAt = new Date().toISOString();

  if (!memberId) {
    return { rewardId, redeemedAt };
  }

  const response = await fetch("/api/rewards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rewardId, memberId }),
  });

  if (!response.ok) {
    return { rewardId, memberId, redeemedAt };
  }

  const result = (await response.json()) as { rewardId: string; memberId: string; redeemedAt: string };
  return result;
}
