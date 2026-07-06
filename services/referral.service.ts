import { getStoredMemberPhoneToken } from "@/lib/member-session";
import type { ReferralProgress } from "@/types/referral";

// ─── Get referral progress for a member ──────────────────────────────────────
// If no referral record exists yet, the API will create a default one (upsert).
export async function getReferralProgress(
  memberId = getStoredMemberPhoneToken(),
): Promise<ReferralProgress> {
  if (!memberId) {
    return emptyReferralProgress();
  }

  const response = await fetch(`/api/referrals?memberId=${encodeURIComponent(memberId)}`);
  if (!response.ok) {
    return emptyReferralProgress(memberId);
  }

  return response.json() as Promise<ReferralProgress>;
}

function emptyReferralProgress(memberId?: string): ReferralProgress {
  return {
    memberId,
    code: "",
    joinedFriends: 0,
    requiredFriends: 3,
  };
}
