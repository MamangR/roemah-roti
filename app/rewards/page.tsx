'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import PhoneLayout from '@/components/ui/PhoneLayout';
import BottomNav from '@/components/ui/BottomNav';
import { useMember } from '@/context/MemberContext';

type RewardItem = {
  id: string;
  cat: string;
  name: string;
  desc: string;
  base: 'locked' | 'unlocked' | 'redeemed' | 'expired';
  progress?: string;
  need?: string;
  redeemedDate?: string;
  expirationDate?: string;
  imageUrl?: string | null;
};

// Rewards are mapped dynamically in the component from member.rewards

export default function RewardsPage() {
  const { member, refreshMember } = useMember();
  const [view, _setView] = useState<'list' | 'detail' | 'history'>('list');
  const setView = (newView: 'list' | 'detail' | 'history') => {
    _setView(newView);
    if (typeof window !== 'undefined') sessionStorage.setItem('rewards_view', newView);
  };

  const [sel, _setSel] = useState<string | null>(null);
  const setSel = (id: string | null) => {
    _setSel(id);
    if (typeof window !== 'undefined') {
      if (id) sessionStorage.setItem('rewards_sel', id);
      else sessionStorage.removeItem('rewards_sel');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedView = sessionStorage.getItem('rewards_view');
      if (savedView) _setView(savedView as any);
      const savedSel = sessionStorage.getItem('rewards_sel');
      if (savedSel) _setSel(savedSel);
    }
  }, []);
  const [qrOpen, setQrOpen] = useState(false);
  const [justRedeemed, setJustRedeemed] = useState(false);
  const [demoStatus, setDemoStatus] = useState<Record<string, 'locked' | 'unlocked' | 'redeemed' | 'expired'>>({});
  const [localHistory, setLocalHistory] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch('/api/rewards/templates');
        if (res.ok) {
          setTemplates(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTemplates();
  }, []);
  const dbHistory = (member?.rewards || [])
    .filter((r: any) => r.redeemedAt !== null)
    .map((r: any) => ({
      name: r.title,
      date: new Date(r.redeemedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      location: r.location || 'Roemah Roti Greenville'
    }));

  const history = [...localHistory, ...dbHistory];

  const statusOf = (id: string, base: string) => demoStatus[id] || base;

  const heroBadge = (status: string) => {
    const map: Record<string, any> = {
      locked: { background: 'rgba(248,244,238,.12)', color: 'rgba(248,244,238,.6)', fontSize: '11px', fontWeight: 600, padding: '5px 11px', borderRadius: '999px' },
      unlocked: { background: 'rgba(166,124,82,.9)', color: '#2A1E18', fontSize: '11px', fontWeight: 600, padding: '5px 11px', borderRadius: '999px' },
      redeemed: { background: 'rgba(122,150,116,.9)', color: '#1E2E1D', fontSize: '11px', fontWeight: 600, padding: '5px 11px', borderRadius: '999px' },
      expired: { background: 'rgba(248,244,238,.16)', color: 'rgba(248,244,238,.75)', fontSize: '11px', fontWeight: 600, padding: '5px 11px', borderRadius: '999px' }
    };
    return map[status] || map.locked;
  };

  const cardBadge = (status: string) => {
    const map: Record<string, any> = {
      locked: { background: '#F1EBE1', color: '#A08A7B' },
      unlocked: { background: 'rgba(166,124,82,.14)', color: '#A67C52' },
      redeemed: { background: 'rgba(122,150,116,.14)', color: '#5C7B5A' },
      expired: { background: '#F1EBE1', color: '#B08E82' }
    };
    return map[status] || map.locked;
  };

  const statusLabelText = (status: string) => ({ locked: 'Locked', unlocked: 'Unlocked', redeemed: 'Redeemed', expired: 'Expired' }[status] || 'Locked');
  const reqTone = (status: string) => ({ locked: ['#C9B7A6', '#A08A7B'], unlocked: ['#A67C52', '#A67C52'], redeemed: ['#5C7B5A', '#5C7B5A'], expired: ['#CBB0A6', '#B08E82'] }[status] as [string, string]);

  const enrich = (r: RewardItem) => {
    const status = statusOf(r.id, r.base);
    const isUnlocked = status === 'unlocked', isLocked = status === 'locked', isRedeemed = status === 'redeemed', isExpired = status === 'expired';
    const tone = reqTone(status);
    const reqText = isLocked ? r.need : (isRedeemed ? ('Redeemed on ' + (r.redeemedDate || 'Jun 2, 2026')) : (isExpired ? 'No longer available' : (r.progress || 'Ready to redeem')));
    const footerLabel = isLocked ? 'PROGRESS' : (isRedeemed ? 'REDEEMED' : (isExpired ? 'EXPIRED' : 'EXPIRATION DATE'));
    const footerValue = isLocked ? (r.progress || '') : (isRedeemed ? (r.redeemedDate || '') : (r.expirationDate || 'Dec 31, 2026'));

    return {
      ...r,
      catLabelUpper: r.cat.toUpperCase(),
      long: r.desc,
      status, isUnlocked, isLocked, isRedeemed, isExpired,
      statusLabel: statusLabelText(status),
      heroBadgeStyle: heroBadge(status),
      cardBadgeStyle: cardBadge(status),
      reqDot: tone[0], reqColor: tone[1], reqText,
      cardOpacity: isLocked ? '.62' : '1',
      cursor: (isLocked || isRedeemed) ? 'default' : 'pointer',
      activeStyle: (isLocked || isRedeemed) ? {} : { transform: 'scale(.985)' },
      footerLabel, footerValue,
      qrOpacity: isUnlocked ? '1' : '.5',
      qrCursor: isUnlocked ? 'pointer' : 'not-allowed',
      qrActiveStyle: isUnlocked ? { transform: 'scale(.96)' } : {},
      qrTileLabel: isUnlocked ? 'TAP TO SCAN' : (isRedeemed ? 'USED' : (isExpired ? 'EXPIRED' : 'LOCKED')),
      lockedLine: r.need ? (r.need + '. See you soon.') : 'Keep visiting to unlock this reward.',
      redeemedLine: 'Already used on ' + (r.redeemedDate || footerValue),
      footerNote: isUnlocked ? 'Show this code to our cashier before payment.' : (isRedeemed ? 'Enjoy your treat. See you again soon.' : (isExpired ? 'This offer has ended.' : 'This reward will unlock automatically as you visit.')),
      openQr: () => { if (isUnlocked) { setQrOpen(true); setJustRedeemed(false); } },
      open: () => { if (!isLocked && !isRedeemed) { setView('detail'); setSel(r.id); } }
    };
  };

  const dbRewards = member?.rewards || [];

  // Visit logic
  const visits = member?.totalVisits || 0;

  // Build a set of template IDs that have already been redeemed (rewardType = templateId + '_' + timestamp)
  const redeemedTemplateIds = new Set<string>();
  dbRewards.forEach((r: any) => {
    if (r.redeemedAt) {
      // Match pattern: "<templateId>_<timestamp>"
      const underscoreIdx = r.rewardType.lastIndexOf('_');
      if (underscoreIdx !== -1) {
        const possibleTemplateId = r.rewardType.substring(0, underscoreIdx);
        if (templates.some((t: any) => t.id === possibleTemplateId)) {
          redeemedTemplateIds.add(possibleTemplateId);
        }
      }
    }
  });

  // Build visit-based reward cards, excluding already-redeemed templates entirely
  const rawRewardsList: RewardItem[] = templates
    .filter((t: any) => !redeemedTemplateIds.has(t.id) && !t.id.startsWith('SYSTEM_'))
    .map((t: any) => ({
      id: t.id,
      cat: 'Visit Reward',
      name: t.name || t.menuItem?.name || 'Reward',
      desc: t.desc || t.menuItem?.shortDesc || '',
      imageUrl: t.menuItem?.imageUrl || null,
      base: visits >= t.visitsRequired ? 'unlocked' : 'locked',
      progress: `${Math.min(visits, t.visitsRequired)} / ${t.visitsRequired} visits`,
      need: visits >= t.visitsRequired ? `Unlocked at ${t.visitsRequired} visits` : `${t.visitsRequired - visits} more visits to unlock`,
      expirationDate: t.validityDays ? `Valid for ${t.validityDays} days` : 'No expiry'
    }));

  // Merge any non-template, non-birthday DB rewards — but only if NOT already redeemed
  dbRewards.forEach((r: any) => {
    if (r.rewardType !== 'birthday_treat' && r.rewardType !== 'visit_reward') {
      // Skip template-sourced rewards (they use templateId_timestamp pattern)
      const underscoreIdx = r.rewardType.lastIndexOf('_');
      const isTemplateDerived = underscoreIdx !== -1 && templates.some((t: any) => t.id === r.rewardType.substring(0, underscoreIdx));
      if (isTemplateDerived) return; // already handled above (excluded if redeemed)

      // Only show non-redeemed generic rewards in the list
      if (!r.redeemedAt) {
        rawRewardsList.push({
          id: r.id, cat: r.type || 'Reward', name: r.title, desc: r.description,
          base: r.isAvailable ? 'unlocked' : 'expired',
          expirationDate: r.expiresAtLabel,
          imageUrl: null // Non-template generic rewards won't have an image without a join
        });
      }
    }
  });

  // ─── Birthday reward logic ────────────────────────────────────────────────
  const bdayDb = dbRewards.find((r: any) => r.rewardType === 'birthday_treat');

  // Parse birth month from "YYYY-MM-DD" (month is 1-indexed in the string)
  const birthdayInput = (member as any)?.birthdayInput as string | undefined;
  const birthMonth = birthdayInput ? parseInt(birthdayInput.split('-')[1], 10) - 1 : -1; // 0-indexed
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed
  const isTheirBirthdayMonth = birthMonth !== -1 && birthMonth === currentMonth;

  // Determine the last day of their birth month this year for the expiry label
  const lastDayOfBirthMonth = birthdayInput
    ? new Date(now.getFullYear(), birthMonth + 1, 0).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : undefined;

  // Derive the birthday card base status:
  // - If redeemed (DB row has redeemedAt): 'redeemed'
  // - If it's their birth month and not yet redeemed: 'unlocked'
  // - Otherwise: 'locked'
  let bdayBase: 'locked' | 'unlocked' | 'redeemed' | 'expired';
  let bdayNeed: string | undefined;

  if (bdayDb?.redeemedAt) {
    // Already used this period — lock it back
    bdayBase = 'redeemed';
  } else if (isTheirBirthdayMonth) {
    // It's their birthday month and not yet redeemed
    bdayBase = 'unlocked';
  } else {
    // Either wrong month, or no birthday set
    bdayBase = 'locked';
    if (!birthdayInput) {
      bdayNeed = 'Add your birthday to unlock this reward';
    } else {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      bdayNeed = `Unlocks in ${monthNames[birthMonth]}`;
    }
  }

  const sysBdayTemplate = templates.find((t: any) => t.id === 'SYSTEM_BIRTHDAY');
  const rawBirthdayItem: RewardItem = {
    id: 'birthday',
    cat: 'Birthday Reward',
    name: loading ? 'Loading...' : (bdayDb?.title ?? sysBdayTemplate?.name ?? sysBdayTemplate?.menuItem?.name ?? 'Birthday Treat Box'),
    desc: loading ? 'Loading birthday reward details...' : (bdayDb?.description ?? sysBdayTemplate?.desc ?? sysBdayTemplate?.menuItem?.shortDesc ?? 'A curated box of four seasonal pastries, our gift to you this birthday month.'),
    imageUrl: sysBdayTemplate?.menuItem?.imageUrl || null,
    base: bdayBase,
    need: bdayNeed,
    expirationDate: bdayBase === 'unlocked' ? lastDayOfBirthMonth : undefined,
    redeemedDate: bdayDb?.redeemedAt ? new Date(bdayDb.redeemedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined,
  };


  const rewards = rawRewardsList.map(r => enrich(r));
  const birthday = enrich(rawBirthdayItem);

  // Create 'all' map for fast lookup
  const all: Record<string, any> = { birthday };
  rewards.forEach(r => all[r.id] = r);

  const cur = sel ? all[sel] : rewards[0];

  const simulateScan = async () => {
    if (!sel || !all[sel]) return;
    const item = all[sel];

    if (member?.id) {
      try {
        const res = await fetch('/api/rewards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rewardId: item.id, memberId: member.id })
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to redeem');
        }
        await refreshMember();
      } catch (e: any) {
        alert(e.message);
        return;
      }
    }

    setDemoStatus(prev => ({ ...prev, [sel]: 'redeemed' }));
    setJustRedeemed(true);
    setTimeout(() => {
      setQrOpen(false);
      setJustRedeemed(false);
      setSel(null);
      setView('list');
    }, 900);

  };

  return (
    <PhoneLayout>
      <div className="rr-scroll" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto', animation: 'rrslide .3s cubic-bezier(.22,1,.36,1)', color: '#3B2A22' }}>

        {view === 'list' && (
          <div style={{ padding: '6px 20px 96px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-.03em' }}>Rewards</div>
                <div style={{ fontSize: '14px', color: '#8A7A6E', marginTop: '5px' }}>Your membership privileges.</div>
              </div>
              <div onClick={() => setView('history')} style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#F1EBE1', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginTop: '2px' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#A67C52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3.5 2"></path></svg>
              </div>
            </div>

            <div onClick={birthday.open} style={{ marginTop: '18px', position: 'relative', background: '#3B2A22', color: '#F8F4EE', borderRadius: '22px', padding: '18px 18px 19px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 14px 30px -18px rgba(59,42,34,.55)', transition: 'transform .14s ease' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.05) 1px,transparent 1px)', backgroundSize: '11px 11px', opacity: .6 }}></div>
              <div style={{ position: 'absolute', top: '-50px', right: '-40px', width: '150px', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(166,124,82,.32),transparent 68%)' }}></div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.14em', color: 'rgba(248,244,238,.72)', whiteSpace: 'nowrap' }}>BIRTHDAY REWARD</div>
                <div style={{ ...birthday.heroBadgeStyle, flex: 'none', whiteSpace: 'nowrap' }}>{birthday.statusLabel}</div>
              </div>
              <div style={{ position: 'relative', display: 'flex', gap: '14px', marginTop: '12px' }}>
                {birthday.imageUrl && (
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', flex: 'none' }}>
                    <img src={birthday.imageUrl} alt={birthday.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '17px', fontWeight: 600, letterSpacing: '-.01em' }}>{birthday.name}</div>
                  <div style={{ fontSize: '12.5px', color: 'rgba(248,244,238,.62)', marginTop: '5px', lineHeight: 1.5 }}>{birthday.desc}</div>
                </div>
              </div>
            </div>

            {rewards.map((item, i) => (
              <div key={i} onClick={item.open} style={{ marginTop: '14px', background: '#fff', border: '1px solid #EFE8DE', borderRadius: '20px', padding: '16px', cursor: item.cursor, boxShadow: '0 8px 22px -20px rgba(59,42,34,.4)', transition: 'transform .14s ease', opacity: item.cardOpacity }}>
                <div style={{ display: 'flex', gap: '14px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F3E9E4', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A67C52" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="1.5" />
                        <rect x="2" y="7" width="20" height="4" rx="1" />
                        <line x1="12" y1="7" x2="12" y2="22" />
                        <path d="M12 7 C12 7 9 5 8 3.5 S9.5 1.5 12 4" />
                        <path d="M12 7 C12 7 15 5 16 3.5 S14.5 1.5 12 4" />
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ flex: 1, minWidth: 0, fontSize: '15px', fontWeight: 600, letterSpacing: '-.01em', lineHeight: 1.35 }}>{item.name}</div>
                      <div style={{ ...item.cardBadgeStyle, fontSize: '10.5px', fontWeight: 600, padding: '4px 10px', borderRadius: '999px', flex: 'none', whiteSpace: 'nowrap' }}>{item.statusLabel}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '6px' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: item.reqDot }}></span>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: item.reqColor }}>{item.reqText}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'detail' && cur && (
          <div style={{ padding: '0 20px 40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '4px' }}>
              <div onClick={() => setView('list')} style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#3B2A22' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg></div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>{cur.name}</div>
            </div>

            <div style={{ position: 'relative', marginTop: '16px', borderRadius: '26px', background: '#3B2A22', color: '#F8F4EE', padding: '22px 22px 20px', boxShadow: '0 18px 40px -18px rgba(59,42,34,.55),0 2px 6px rgba(59,42,34,.12)', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.05) 1px,transparent 1px)', backgroundSize: '11px 11px', opacity: .6, pointerEvents: 'none' }}></div>
              <div style={{ position: 'absolute', top: '-60px', right: '-50px', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(166,124,82,.35),transparent 68%)', pointerEvents: 'none' }}></div>

              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 600, letterSpacing: '.28em', color: 'rgba(248,244,238,.72)' }}>{cur.catLabelUpper}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', ...cur.heroBadgeStyle }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', opacity: .7 }}></span>{cur.statusLabel}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '22px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '21px', fontWeight: 600, letterSpacing: '-.02em' }}>{cur.name}</div>
                    <div style={{ fontSize: '13px', lineHeight: 1.55, color: 'rgba(248,244,238,.62)', marginTop: '7px' }}>{cur.long}</div>
                  </div>
                  {cur.imageUrl ? (
                    <div style={{ width: '72px', height: '72px', borderRadius: '16px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', flex: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      <img src={cur.imageUrl} alt={cur.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ width: '72px', height: '72px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(248,244,238,.4)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="1.5" />
                        <rect x="2" y="7" width="20" height="4" rx="1" />
                        <line x1="12" y1="7" x2="12" y2="22" />
                        <path d="M12 7 C12 7 9 5 8 3.5 S9.5 1.5 12 4" />
                        <path d="M12 7 C12 7 15 5 16 3.5 S14.5 1.5 12 4" />
                      </svg>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '22px', paddingTop: '18px', borderTop: '1px solid rgba(248,244,238,.12)' }}>
                  <div>
                    <div style={{ fontSize: '9.5px', fontWeight: 600, letterSpacing: '.14em', color: 'rgba(248,244,238,.5)' }}>{cur.footerLabel}</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>{cur.footerValue}</div>
                  </div>
                  <div onClick={cur.openQr} style={{ cursor: cur.qrCursor, background: '#FCFBF8', borderRadius: '14px', padding: '9px', boxShadow: '0 3px 10px rgba(0,0,0,.18)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', opacity: cur.qrOpacity, transition: 'transform .12s ease' }}>
                    <div style={{ width: '58px', height: '58px', background: !cur.isUnlocked ? '#C9BBAD' : '#3B2A22', borderRadius: '4px' }}></div>
                    <div style={{ fontSize: '8.5px', fontWeight: 600, letterSpacing: '.06em', color: '#A67C52' }}>{cur.qrTileLabel}</div>
                  </div>
                </div>
              </div>
            </div>

            {cur.isUnlocked && (
              <div onClick={cur.openQr} style={{ marginTop: '16px', background: '#A67C52', color: '#FFFCF7', textAlign: 'center', padding: '17px', borderRadius: '16px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 14px 26px -14px rgba(166,124,82,.9)', transition: 'transform .12s ease' }}>Redeem</div>
            )}
            {cur.isLocked && (
              <div style={{ marginTop: '16px', background: '#F1EBE1', color: '#8A7A6E', textAlign: 'center', padding: '17px', borderRadius: '16px', fontSize: '13.5px', lineHeight: 1.5, fontWeight: 500 }}>{cur.lockedLine}</div>
            )}
            {cur.isRedeemed && (
              <div style={{ marginTop: '16px', background: 'rgba(122,150,116,.12)', color: '#5C7B5A', textAlign: 'center', padding: '17px', borderRadius: '16px', fontSize: '14px', fontWeight: 600 }}>{cur.redeemedLine}</div>
            )}
            {cur.isExpired && (
              <div style={{ marginTop: '16px', background: '#F1EBE1', color: '#A08A7B', textAlign: 'center', padding: '17px', borderRadius: '16px', fontSize: '14px', fontWeight: 600 }}>This reward is no longer available.</div>
            )}

            <div style={{ marginTop: '14px', textAlign: 'center', fontSize: '12.5px', lineHeight: 1.5, color: '#8A7A6E', padding: '0 6px' }}>{cur.footerNote}</div>
          </div>
        )}

        {view === 'history' && (
          <div style={{ padding: '0 20px 60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '4px' }}>
              <div onClick={() => setView('list')} style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#3B2A22' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg></div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>Redeem History</div>
            </div>

            {history.map((h, i) => (
              <div key={i} style={{ marginTop: '14px', background: '#fff', border: '1px solid #EFE8DE', borderRadius: '18px', padding: '16px', boxShadow: '0 8px 22px -20px rgba(59,42,34,.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-.01em' }}>{h.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 'none' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#5C7B5A' }}></span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#5C7B5A' }}>Redeemed</span>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#A08A7B', marginTop: '5px', fontVariantNumeric: 'tabular-nums' }}>{h.date} · {h.location}</div>
              </div>
            ))}

            {history.length === 0 && (
              <div style={{ marginTop: '70px', textAlign: 'center', padding: '0 30px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#F1EBE1', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', color: '#C4B6A9' }}>◷</div>
                <div style={{ fontSize: '16px', fontWeight: 600, marginTop: '18px' }}>No redemptions yet</div>
                <div style={{ fontSize: '13px', lineHeight: 1.55, color: '#8A7A6E', marginTop: '6px' }}>Rewards you redeem in store will appear here.</div>
              </div>
            )}
          </div>
        )}

      </div>

      {(view === 'list' || view === 'history') && <BottomNav />}

      {qrOpen && cur && (
        <div onClick={() => { setQrOpen(false); setJustRedeemed(false); }} style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(43,30,24,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '26px', animation: 'rrfade .2s ease' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#FCFBF8', borderRadius: '26px', padding: '24px 24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '13px', boxShadow: '0 30px 60px -20px rgba(0,0,0,.5)', animation: 'rrgrow .3s cubic-bezier(.22,1,.36,1)', maxWidth: '280px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.16em', color: '#A67C52' }}>REDEEM QR CODE</div>
            <div style={{ background: '#fff', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QRCodeSVG value={`REWARD:${member?.id}:${cur.id}`} size={160} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', textAlign: 'center', maxWidth: '230px' }}>
              <div style={{ fontSize: '16px', fontWeight: 600, lineHeight: 1.3 }}>{cur.name}</div>
              <div style={{ fontSize: '12px', color: '#A08A7B', fontVariantNumeric: 'tabular-nums', lineHeight: 1.3 }}>{member?.firstName || 'User'} · {cur.footerValue}</div>
            </div>
            <div style={{ fontSize: '12.5px', color: '#7A6A5F', textAlign: 'center', maxWidth: '220px', lineHeight: 1.5 }}>Show this QR to our cashier before payment.</div>

            {!justRedeemed ? (
              <div style={{ fontSize: '11px', color: '#C4B6A9', marginTop: '6px' }}>Tap outside to close</div>
            ) : (
              <div style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(122,150,116,.12)', color: '#5C7B5A', textAlign: 'center', padding: '13px', borderRadius: '14px', fontSize: '13px', fontWeight: 600 }}>Redeemed. See you soon.</div>
            )}
          </div>
        </div>
      )}
    </PhoneLayout>
  );
}
