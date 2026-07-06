"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Cake, Check } from "lucide-react";
import { getCurrentMember } from "@/services/member.service";
import { getBirthdayReward, redeemReward } from "@/services/reward.service";
import type { Member } from "@/types/member";
import type { Reward } from "@/types/reward";

export function RewardRedemption() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const [reward, setReward] = useState<Reward | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadReward() {
      const loadedMember = await getCurrentMember();
      const loadedReward = loadedMember ? await getBirthdayReward(loadedMember.phoneToken) : null;

      if (mounted) {
        setMember(loadedMember);
        setReward(loadedReward);
      }
    }

    void loadReward();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleRedeem() {
    if (!reward || !member) {
      return;
    }

    setIsRedeeming(true);
    const result = await redeemReward(reward.id, member.phoneToken);
    setReward((currentReward) => currentReward ? ({
      ...currentReward,
      isAvailable: false,
      redeemedAt: result.redeemedAt,
    }) : currentReward);
    setIsRedeeming(false);
    setShowSuccess(true);
  }

  return (
    <>
      <div className="rdm-root">
        <div className="rdm-shell">
          <div className="rdm-header">
            <Link className="rdm-back" href="/member">
              <ArrowLeft size={16} />
            </Link>
            <div className="rdm-page-title">Redeem reward</div>
          </div>
          <div className="rdm-hero">
            <div className="rdm-reward-icon-wrap">
              <Cake size={36} />
            </div>
            <div className="rdm-tag">{reward?.redeemedAt ? "Redeemed" : reward ? "Available now" : "No reward"}</div>
            <h1>{reward?.title ?? "No reward available"}</h1>
            <p>{reward?.description ?? "No reward document is available in Firestore for this member yet."}</p>
          </div>
          {reward ? <div className="rdm-detail-card">
            <RewardRow label="Reward type" value={reward.type} />
            <RewardRow label="Redeemable at" value={reward.location} />
            <RewardRow label="Value" value={reward.value} />
            <RewardRow label="Expires" value={reward.expiresAtLabel} expire />
            <RewardRow label="One-time use" value={reward.isOneTimeUse ? "Yes" : "No"} />
          </div> : null}
          <div className="rdm-instructions">
            <p>
              Show this screen to our team at the counter and tap <strong>Redeem now</strong>. They&apos;ll mark it as used in the
              system.
            </p>
          </div>
          <button className="rdm-btn-redeem" disabled={isRedeeming || !reward || Boolean(reward.redeemedAt)} onClick={handleRedeem}>
            {isRedeeming ? "Redeeming..." : reward?.redeemedAt ? "Already redeemed" : "Redeem now"}
          </button>
          <Link className="rdm-btn-cancel" href="/member">Maybe later</Link>
        </div>
      </div>
      <div className={`rdm-success-overlay ${showSuccess ? "show" : ""}`}>
        <div className="rdm-success-card">
          <div className="rdm-success-anim">
            <Check size={32} />
          </div>
          <h2>Enjoy your treat!</h2>
          <p>Your birthday reward has been redeemed. Thank you for being part of Roemah Roti Insider, {member?.firstName}.</p>
          <Link className="rdm-success-btn" href="/member">Back to dashboard</Link>
        </div>
      </div>
    </>
  );
}

function RewardRow({ label, value, expire = false }: { label: string; value: string; expire?: boolean }) {
  return (
    <div className="rdm-detail-row">
      <span className="rdm-detail-label">{label}</span>
      <span className={`rdm-detail-value ${expire ? "expire" : ""}`}>{value}</span>
    </div>
  );
}
