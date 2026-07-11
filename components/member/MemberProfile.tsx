"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Copy, Gift, Link as LinkIcon, User } from "lucide-react";
import { getCurrentMember } from "@/services/member.service";
import { getReferralProgress } from "@/services/referral.service";
import type { Member } from "@/types/member";
import type { ReferralProgress } from "@/types/referral";
import { MemberUpdates } from "./MemberUpdates";

const emptyReferral: ReferralProgress = {
  code: "",
  joinedFriends: 0,
  requiredFriends: 3,
};

export function MemberProfile() {
  const [tab, setTab] = useState<"referral" | "updates" | "profile">("referral");
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const [referral, setReferral] = useState<ReferralProgress>(emptyReferral);

  // Dynamically generate the referral code based on the member's name
  const displayCode = member ? `${member.name.replace(/\s+/g, "")}-insider` : "No member";

  useEffect(() => {
    let mounted = true;

    async function loadMember() {
      const loadedMember = await getCurrentMember();
      const loadedReferral = loadedMember ? await getReferralProgress(loadedMember.phoneToken) : emptyReferral;

      if (mounted) {
        setMember(loadedMember);
        setReferral(loadedReferral);
      }
    }

    void loadMember();

    return () => {
      mounted = false;
    };
  }, []);

  async function copyCode() {
    if (!member) return;
    await navigator.clipboard?.writeText(displayCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${displayCode}`
    : `https://roemahroti.id/join/${displayCode}`;

  async function copyLink() {
    if (!member) return;
    await navigator.clipboard?.writeText(referralLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  function shareWhatsapp() {
    if (!member) return;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Join Roemah Roti Insider and use my referral code to earn rewards: ${referralLink}`)}`, '_blank');
  }

  return (
    <div className="rp-root">
      <div className="rp-shell">
        <div className="rp-tabs">
          <button className={`rp-tab ${tab === "referral" ? "active" : ""}`} onClick={() => setTab("referral")}>
            Referral
          </button>
          <button className={`rp-tab ${tab === "updates" ? "active" : ""}`} onClick={() => setTab("updates")}>
            Updates
          </button>
          <button className={`rp-tab ${tab === "profile" ? "active" : ""}`} onClick={() => setTab("profile")}>
            My profile
          </button>
        </div>

        {tab === "updates" && <MemberUpdates />}

        {tab === "referral" && (
          <div className="rp-screen active">
            <div className="rp-header">
              <div className="rp-section-label">Refer a friend</div>
              <h2>
                Invite friends,
                <br />
                earn a free loaf
              </h2>
              <p>Share your code. When 3 friends join and visit, you get a free Saltbread Original.</p>
            </div>
            <div className="rp-code-block">
              <div className="rp-code-label">Your referral code</div>
              <div className="rp-code">{displayCode}</div>
              <button className="rp-copy-btn" onClick={copyCode}>
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied!" : "Copy code"}
              </button>
            </div>
            <div className="rp-progress-bar-wrap">
              <div className="rp-progress-label">
                <span>{referral.joinedFriends} of {referral.requiredFriends} friends joined & visited</span>
                <span className="rp-progress-accent">{referral.requiredFriends - referral.joinedFriends} more to go</span>
              </div>
              <div className="rp-bar">
                <div
                  className="rp-bar-fill"
                  style={{ width: `${(referral.joinedFriends / referral.requiredFriends) * 100}%` }}
                />
              </div>
            </div>
             <div className="rp-share-row">
              <button className="rp-share-btn" onClick={shareWhatsapp}>WhatsApp</button>
              <button className="rp-share-btn" onClick={copyLink}>
                <LinkIcon size={14} /> {linkCopied ? "Link copied!" : "Copy link"}
              </button>
            </div>
            <div className="rp-card-heading">How it works</div>
            {member ? <div className="rp-steps-card">
              <ReferStep num="1">Share your code <strong>{displayCode}</strong> with a friend who hasn&apos;t joined yet.</ReferStep>
              <ReferStep num="2">They sign up and make their <strong>first visit</strong> to Roemah Roti.</ReferStep>
              <ReferStep num="3">After <strong>3 friends join</strong>, you unlock a free Saltbread Original. No expiry.</ReferStep>
            </div> : <p className="rp-card-heading">No registered member found in this browser.</p>}
          </div>
        )}
        
        {tab === "profile" && (
          <div className="rp-screen active">
            {member ? <><div className="rp-profile-top">
              <div className="rp-profile-avatar">{member.initials}</div>
              <div>
                <div className="rp-profile-name">{member.name}</div>
                <div className="rp-profile-since">Insider Member - Since {member.since}</div>
              </div>
            </div>
              <div className="rp-stat-grid">
                <ProfileStat num={String(member.totalVisits)} label="Total visits" />
                <ProfileStat num={String(member.rewardsEarned)} label="Rewards earned" />
                <ProfileStat num={member.memberDurationLabel} label="Member" />
              </div>
              <div className="rp-info-card">
                <InfoRow icon={<User size={15} />} label="Name" value={member.name} />
                <InfoRow label="WhatsApp" value={member.phone} />
                <InfoRow icon={<Gift size={15} />} label="Birthday" value={member.birthday} />
              </div>
              <div className="rp-fav-title">Favorite products</div>
              <div className="rp-fav-chips">
                {member.favorites.map((favorite) => (
                  <div className="rp-fav-chip" key={favorite}>{favorite}</div>
                ))}
              </div>
              <div className="rp-member-actions">
                <Link className="rr-btn-primary" href="/reward">Redeem reward</Link>
              </div>
            </> : <div className="rp-header"><h2>No profile found</h2><p>Register first so this browser can remember your phone number.</p></div>}
          </div>
        )}
      </div>
    </div>
  );
}

function ReferStep({ num, children }: { num: string; children: React.ReactNode }) {
  return (
    <div className="rp-refer-step">
      <div className="rp-refer-step-num">{num}</div>
      <p>{children}</p>
    </div>
  );
}

function ProfileStat({ num, label }: { num: string; label: string }) {
  return (
    <div className="rp-stat-card">
      <div className="rp-stat-num">{num}</div>
      <div className="rp-stat-label">{label}</div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rp-info-row">
      <span className="rp-info-label">
        {icon}
        {label}
      </span>
      <span className="rp-info-value">{value}</span>
    </div>
  );
}