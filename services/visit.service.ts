import type { VisitSummary } from "@/types/visit";

const emptyVisitSummary: VisitSummary = {
  totalMembers: "0",
  activeMembers: "0",
  rewardsRedeemed: "0",
  birthdaysThisMonth: "0",
};

// ─── Get aggregated stats for the admin dashboard ────────────────────────────
export async function getVisitSummary(): Promise<VisitSummary> {
  const response = await fetch("/api/visits/summary");
  if (!response.ok) {
    return emptyVisitSummary;
  }

  return response.json() as Promise<VisitSummary>;
}
