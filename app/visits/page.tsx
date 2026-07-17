'use client';

import React, { useState } from 'react';
import PhoneLayout from '@/components/ui/PhoneLayout';
import { QRCodeSVG } from 'qrcode.react';
import BottomNav from '@/components/ui/BottomNav';
import { AnimatePresence, motion } from 'framer-motion';
import PageTransition from '@/components/ui/PageTransition';
import { useMember } from '@/context/MemberContext';
import { useRouter } from 'next/navigation';
type Entry = {
  id: string;
  type: 'visit' | 'earned' | 'redeemed';
  date: string;
  time?: string;
  outlet?: string;
  visitNo?: string;
  reward?: string;
  earnedVia?: string;
  status?: 'ready' | 'redeemed';
  ref?: string;
};

const MEMBERSHIP_TIERS = [
  {
    id: 'insider',
    name: 'Insider',
    emoji: '🥐',
    minSpend: 0,
    maxSpend: 999999,
    description: 'Your first step into the Roemah.',
    birthdayReward: { title: 'Birthday Treat', desc: 'A little something to mark your day.', tag: 'Your first' },
    newPerks: [
      { name: 'Welcome Treat — free Americano', tag: 'New · one-time' },
      { name: 'Visit Reward Access', tag: 'New' },
      { name: 'Member-only updates', tag: 'New' }
    ]
  },
  {
    id: 'familiar',
    name: 'Familiar',
    emoji: '☕',
    minSpend: 1000000,
    maxSpend: 1999999,
    description: "You're becoming part of our morning routine.",
    birthdayReward: { title: 'Birthday Celebration', desc: 'Replaces your Birthday Treat with something a little bigger.', tag: 'Replaces earlier' },
    newPerks: [
      { name: 'Early Menu Drop Access', tag: 'New' },
      { name: 'Special Reward & Promo Access', tag: 'New' }
    ],
    carriedPerks: [
      { name: 'Visit Reward Access', tag: 'Carried over' },
      { name: 'Member-only updates', tag: 'Carried over' }
    ]
  },
  {
    id: 'neighbor',
    name: 'Neighbor',
    emoji: '🏡',
    minSpend: 2000000,
    maxSpend: 4999999,
    description: "You're our neighbor.",
    birthdayReward: { title: 'Birthday Surprise', desc: 'Carried from Familiar — your birthday reward stays enhanced.', tag: 'Same as Familiar' },
    newPerks: [
      { name: 'First Batch Alert', tag: 'New' },
      { name: 'Neighbor Day', tag: 'New' },
      { name: 'Menu Testing Access', tag: 'New' },
      { name: 'Mystery Reward Unlock', tag: 'New' }
    ],
    carriedPerks: [
      { name: 'Visit Reward Access', tag: 'Carried over' },
      { name: 'Member-only updates', tag: 'Carried over' },
      { name: 'Early Menu Drop Access', tag: 'Carried over' },
      { name: 'Special Reward & Promo Access', tag: 'Carried over' }
    ]
  },
  {
    id: 'inner_circle',
    name: 'Inner Circle',
    emoji: '🤍',
    minSpend: 5000000,
    maxSpend: Infinity,
    description: "You're part of the Roemah.",
    birthdayReward: { title: 'Curated Birthday Box', desc: 'Replaces every earlier birthday reward — the full box.', tag: 'Replaces all' },
    newPerks: [
      { name: 'Private First Taste', tag: 'New' },
      { name: 'Monthly Treat', tag: 'New' },
      { name: 'Invite-only Experiences', tag: 'New' },
      { name: 'Anniversary Gift', tag: 'New' },
      { name: 'Secret Menu Access', tag: 'New' }
    ],
    carriedPerks: [
      { name: 'Visit Reward Access', tag: 'Carried over' },
      { name: 'Member-only updates', tag: 'Carried over' },
      { name: 'Early Menu Drop Access', tag: 'Carried over' },
      { name: 'Special Reward & Promo Access', tag: 'Carried over' },
      { name: 'First Batch Alert', tag: 'Carried over' },
      { name: 'Neighbor Day', tag: 'Carried over' },
      { name: 'Menu Testing Access', tag: 'Carried over' },
      { name: 'Mystery Reward Unlock', tag: 'Carried over' }
    ]
  }
];

const slideVariants = {
  initial: (d: number) => ({
    x: d > 0 ? 300 : d < 0 ? -300 : 0,
    opacity: 0
  }),
  animate: {
    x: 0,
    opacity: 1
  },
  exit: (d: number) => ({
    x: d > 0 ? -300 : d < 0 ? 300 : 0,
    opacity: 0
  })
};

// We now use member.activities instead of rawEntries
export default function VisitsPage() {
  const router = useRouter();
  const { member } = useMember();
  const [view, _setView] = useState<'dashboard' | 'history' | 'detail' | 'roadmap' | 'tier_detail'>('dashboard');
  const [direction, setDirection] = useState(0);

  const setView = (newView: 'dashboard' | 'history' | 'detail' | 'roadmap' | 'tier_detail') => {
    const viewDepth: Record<string, number> = { dashboard: 0, history: 0, roadmap: 1, detail: 1, tier_detail: 2 };
    const currentDepth = viewDepth[view] || 0;
    const newDepth = viewDepth[newView] || 0;
    setDirection(newDepth > currentDepth ? 1 : newDepth < currentDepth ? -1 : 0);
    _setView(newView);
    if (typeof window !== 'undefined') sessionStorage.setItem('visits_view', newView);
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedView = sessionStorage.getItem('visits_view');
      if (savedView) _setView(savedView as any);

      const savedSelId = sessionStorage.getItem('visits_selId');
      if (savedSelId) setSelId(savedSelId);

      const savedTierId = sessionStorage.getItem('visits_tierId');
      if (savedTierId) setSelectedTierId(savedTierId);
    }
  }, []);

  const [selId, _setSelId] = useState<string | null>(null);
  const setSelId = (id: string | null) => {
    _setSelId(id);
    if (typeof window !== 'undefined') {
      if (id) sessionStorage.setItem('visits_selId', id);
      else sessionStorage.removeItem('visits_selId');
    }
  };

  const [selectedTierId, _setSelectedTierId] = useState<string | null>(null);
  const setSelectedTierId = (id: string | null) => {
    _setSelectedTierId(id);
    if (typeof window !== 'undefined') {
      if (id) sessionStorage.setItem('visits_tierId', id);
      else sessionStorage.removeItem('visits_tierId');
    }
  };
  const [goal, setGoal] = useState(10);
  const [rewardName, setRewardName] = useState('Loading...');
  const [rewardImageUrl, setRewardImageUrl] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('Good morning,');
  const [showQrModal, setShowQrModal] = useState(false);

  React.useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 17) setGreeting('Good afternoon,');
    else if (hour >= 17) setGreeting('Good evening,');
  }, []);

  React.useEffect(() => {
    async function loadNextReward() {
      if (!member) return;
      try {
        const res = await fetch('/api/rewards/templates');
        if (!res.ok) return;
        const templates = await res.json();

        const redeemedIds = new Set(
          (member.rewards || [])
            .filter((r: any) => r.redeemedAt !== null)
            .map((r: any) => r.sourceTemplateId || (r.rewardType && r.rewardType.split('_')[0]))
        );

        const available = templates.filter((t: any) => !t.id.startsWith('SYSTEM_') && !redeemedIds.has(t.id));
        const next = available.find((t: any) => t.visitsRequired > member.totalVisits);

        if (next) {
          setGoal(next.visitsRequired);
          setRewardName(next.name || next.menuItem?.name || 'Loading...');
          setRewardImageUrl(next.imageUrl || next.menuItem?.imageUrl || null);
        } else {
          setGoal(member.totalVisits || 1);
          setRewardName('Semua reward telah tercapai!');
          setRewardImageUrl(null);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadNextReward();
  }, [member]);

  const enrich = (e: Entry) => {
    const monthDay = e.date.slice(0, e.date.length - 6);
    const year = e.date.slice(-4);
    const common = {
      ...e,
      dateMonth: monthDay,
      dateYear: year,
      dateFull: e.date,
      open: () => { setSelId(e.id); setView('detail'); }
    };
    if (e.type === 'visit') {
      return { ...common, title: e.visitNo, meta: e.outlet, dot: '#A08A7B', tag: 'Visit Recorded', tagBg: '#F1EBE1', tagColor: '#A08A7B' };
    }
    if (e.type === 'earned') {
      return {
        ...common,
        title: e.reward + ' — Unlocked', meta: e.earnedVia, dot: '#5C7B5A', tag: 'Reward Earned', tagBg: 'rgba(122,150,116,.14)', tagColor: '#5C7B5A',
        statusLine: e.status === 'ready' ? 'Ready to Redeem' : 'Already Redeemed',
        statusBg: e.status === 'ready' ? 'rgba(122,150,116,.12)' : 'rgba(166,124,82,.10)',
        statusDot: e.status === 'ready' ? '#5C7B5A' : '#A67C52',
        statusColor: e.status === 'ready' ? '#5C7B5A' : '#A67C52'
      };
    }
    // redeemed
    return { ...common, title: e.reward + ' — Redeemed', meta: e.outlet, dot: '#A67C52', tag: 'Redeemed', tagBg: 'rgba(166,124,82,.14)', tagColor: '#A67C52' };
  };

  const entries = (member?.activities || []).map((e: any) => enrich(e));
  const sel = entries.find(e => e.id === selId) || entries[0];
  const entriesEmpty = entries.length === 0;

  const isDashboard = view === 'dashboard';
  const isHistory = view === 'history';
  const isVisitDetail = view === 'detail' && sel?.type === 'visit';
  const isEarnedDetail = view === 'detail' && sel?.type === 'earned';
  const isRedeemedDetail = view === 'detail' && sel?.type === 'redeemed';
  const isRoadmap = view === 'roadmap';
  const isTierDetail = view === 'tier_detail';
  const showNav = true;

  const lifetimeSpend = member?.lifetimeSpend || 0;
  let currentTier = 'Insider';
  let nextTier = 'Familiar';
  let nextTierThreshold = 1000000;

  if (lifetimeSpend >= 5000000) {
    currentTier = 'Inner Circle';
    nextTier = 'Inner Circle';
    nextTierThreshold = 5000000;
  } else if (lifetimeSpend >= 2000000) {
    currentTier = 'Neighbor';
    nextTier = 'Inner Circle';
    nextTierThreshold = 5000000;
  } else if (lifetimeSpend >= 1000000) {
    currentTier = 'Familiar';
    nextTier = 'Neighbor';
    nextTierThreshold = 2000000;
  }

  const remainingToNext = Math.max(0, nextTierThreshold - lifetimeSpend);
  const formatCurrency = (val: number) => 'Rp' + val.toLocaleString('id-ID');

  const viewKey = view + (view === 'detail' ? (selId || '') : '');

  return (
    <PhoneLayout>
      <PageTransition>
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            className="v-scroll"
            key={viewKey}
            custom={direction}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: 'spring', stiffness: 350, damping: 35, mass: 0.8 }}
            style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto', color: '#3B2A22' }}
          >

            {/* DASHBOARD */}
            {isDashboard && (
              <div style={{ padding: '8px 20px 120px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '6px 2px 18px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#A08A7B' }}>{greeting}</div>
                    <div style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-.02em', marginTop: '1px' }}>{member?.firstName || 'User'}</div>
                  </div>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: '#A67C52' }}>{member?.initials || 'U'}</div>
                </div>



                <div style={{ position: 'relative', borderRadius: '24px', background: '#3B2A22', color: '#F8F4EE', padding: '20px', overflow: 'hidden', boxShadow: '0 18px 40px -18px rgba(59,42,34,.55)' }}>
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.05) 1px,transparent 1px)', backgroundSize: '11px 11px', opacity: .6 }}></div>
                  <div style={{ position: 'absolute', top: '-60px', right: '-50px', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(166,124,82,.35),transparent 68%)', pointerEvents: 'none' }}></div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.28em', color: 'rgba(248,244,238,.72)' }}>ROEMAH ROTI</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(166,124,82,.9)', color: '#2A1E18', fontSize: '11px', fontWeight: 600, padding: '5px 11px', borderRadius: '999px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2A1E18', opacity: .65 }}></span>{currentTier}</div>
                  </div>

                  <div style={{ position: 'relative', marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '21px', fontWeight: 600, letterSpacing: '-.02em' }}>{member?.firstName || 'User'}</div>
                      <div style={{ marginTop: '4px', fontSize: '12.5px', color: 'rgba(248,244,238,.6)', fontVariantNumeric: 'tabular-nums' }}>{member?.id || 'RR-00000'}</div>
                      <div style={{ marginTop: '2px', fontSize: '12px', color: 'rgba(248,244,238,.5)' }}>Member since {member?.since || 'Unknown'}</div>
                    </div>

                    <div
                      onClick={() => setShowQrModal(true)}
                      style={{ padding: '8px', background: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <QRCodeSVG
                        value={member?.id || ''}
                        size={72}
                        bgColor={"#ffffff"}
                        fgColor={"#3B2A22"}
                        level={"L"}
                        includeMargin={false}
                      />
                    </div>
                  </div>

                  {/* Referral Code sub-section inside Membership Card */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '22px', paddingTop: '18px', borderTop: '1px solid rgba(248,244,238,.12)' }}>
                    <div>
                      <div style={{ fontSize: '9.5px', fontWeight: 600, letterSpacing: '.14em', color: 'rgba(248,244,238,.5)' }}>REFERRAL CODE</div>
                      <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px', letterSpacing: '.06em', color: '#E9C9A6', fontVariantNumeric: 'tabular-nums' }}>{member?.referralCode || 'S04217-RR'}</div>
                    </div>
                    <div onClick={() => router.push('/referral')} style={{ cursor: 'pointer', background: 'rgba(166,124,82,.9)', color: '#2A1E18', fontSize: '12px', fontWeight: 600, padding: '9px 14px', borderRadius: '12px' }}>Invite Friends</div>
                  </div>
                </div>

                {/* LIFETIME SPEND CARD */}
                <div onClick={() => setView('roadmap')} style={{ cursor: 'pointer', marginTop: '16px', background: '#fff', border: '1px solid #EFE8DE', borderRadius: '24px', padding: '20px 20px 22px', boxShadow: '0 10px 26px -20px rgba(59,42,34,.35)', transition: 'transform .14s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.12em', color: '#A08A7B' }}>LIFETIME SPEND</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#B98A5E', color: '#2A1E18', fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '999px' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#2A1E18', opacity: .7 }}></span>{currentTier}
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', fontSize: '32px', fontWeight: 600, color: '#3B2A22', letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(lifetimeSpend)}
                  </div>

                  <div style={{ position: 'relative', marginTop: '14px', height: '8px', borderRadius: '4px', background: '#F1EBE1', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(90deg,transparent 0,transparent calc(${100 / 8}% - 1.5px),#fff calc(${100 / 8}% - 1.5px),#fff ${100 / 8}%)`, zIndex: 2 }}></div>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(100, (lifetimeSpend / nextTierThreshold) * 100)}%`, background: '#B98A5E', borderRadius: '4px', zIndex: 1 }}></div>
                  </div>

                  <div style={{ marginTop: '18px', background: '#F8F4EE', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 600, color: '#3B2A22', letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums', flex: 'none' }}>
                      {currentTier === 'Inner Circle' ? 'Max' : formatCurrency(remainingToNext)}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#7A6A5F', lineHeight: 1.4 }}>
                      {currentTier === 'Inner Circle'
                        ? 'You have reached the highest tier!'
                        : <><span style={{ color: '#3B2A22' }}>more in lifetime spend until <span style={{ fontWeight: 600 }}>{nextTier}</span>.</span> No rush &mdash; it adds up over time.</>}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '16px', background: '#fff', border: '1px solid #EFE8DE', borderRadius: '20px', padding: '18px 18px 20px', boxShadow: '0 10px 26px -20px rgba(59,42,34,.35)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F3E9E4', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {rewardImageUrl ? (
                        <img src={rewardImageUrl} alt={rewardName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>Visit Progress</div>
                        <div style={{ fontSize: '12px', color: '#A08A7B' }}><span style={{ color: '#A67C52', fontWeight: 600 }}>{member?.totalVisits || 0}</span> / {goal} visits</div>
                      </div>
                      <div style={{ position: 'relative', marginTop: '12px', height: '10px', borderRadius: '999px', background: '#F1EBE1', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(90deg,transparent 0,transparent calc(${100 / goal}% - 1.5px),rgba(255,255,255,.9) calc(${100 / goal}% - 1.5px),rgba(255,255,255,.9) ${100 / goal}%)`, zIndex: 2 }}></div>
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(100, ((member?.totalVisits || 0) / (goal || 1)) * 100)}%`, background: 'linear-gradient(90deg,#B98A5E,#A67C52)', borderRadius: '999px', zIndex: 1 }}></div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px' }}>
                    <div style={{ fontSize: '12.5px', color: '#7A6A5F' }}><span style={{ fontWeight: 600, color: '#3B2A22' }}>{Math.max(0, goal - (member?.totalVisits || 0))} more visits</span> until your next reward: <span style={{ fontWeight: 600, color: '#3B2A22' }}>{rewardName}</span>.</div>
                    <div onClick={() => setView('history')} style={{ fontSize: '12px', fontWeight: 600, color: '#A67C52', cursor: 'pointer', flex: 'none', paddingLeft: '10px' }}>View History</div>
                  </div>
                </div>

                {/* Updates CTA Card */}
                <div onClick={() => router.push('/updates')} style={{ marginTop: '16px', background: '#fff', border: '1px solid #EFE8DE', borderRadius: '18px', padding: '17px 18px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', boxShadow: '0 10px 26px -22px rgba(59,42,34,.35)', transition: 'transform .14s ease' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '13px', background: '#F1EBE1', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A67C52" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 3.5 1 5.5 2 7H4c1-1.5 2-3.5 2-7z"></path><path d="M10 19a2 2 0 0 0 4 0"></path></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 600 }}>Updates</div>
                    <div style={{ fontSize: '12px', color: '#8A7A6E', marginTop: '2px' }}>New menu, promos, and announcements.</div>
                  </div>
                  <div style={{ color: '#C4B6A9', display: 'flex' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg></div>
                </div>

                {/* Refer a Friend CTA Card */}
                <div onClick={() => router.push('/referral')} style={{ marginTop: '16px', background: '#fff', border: '1px solid #EFE8DE', borderRadius: '18px', padding: '17px 18px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', boxShadow: '0 10px 26px -22px rgba(59,42,34,.35)', transition: 'transform .14s ease' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '13px', background: '#F1EBE1', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A67C52" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M3 20a6 6 0 0 1 12 0"></path><path d="M17 6a3 3 0 0 1 0 6 M21 20a6 6 0 0 0-4-5.6"></path></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 600 }}>Refer a Friend</div>
                    <div style={{ fontSize: '12px', color: '#8A7A6E', marginTop: '2px' }}>Share something you trust.</div>
                  </div>
                  <div style={{ color: '#C4B6A9', display: 'flex' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg></div>
                </div>
              </div>
            )}

            {/* ROADMAP VIEW */}
            {isRoadmap && (
              <div style={{ padding: '24px 20px 120px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div onClick={() => setView('dashboard')} style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none', color: '#3B2A22' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg></div>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.12em', color: '#A08A7B' }}>ROEMAH ROTI · MEMBERSHIP</div>
                    <div style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-.02em', marginTop: '2px' }}>Your journey</div>
                  </div>
                </div>
                <div style={{ fontSize: '14px', lineHeight: 1.5, color: '#7A6A5F', marginTop: '14px' }}>Four tiers, one step at a time. Everything you've reached stays yours.</div>

                <div style={{ position: 'relative', marginTop: '30px', paddingLeft: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {MEMBERSHIP_TIERS.map((tier, index) => {
                      const currentTierIndex = MEMBERSHIP_TIERS.findIndex(t => t.id === currentTier.toLowerCase().replace(' ', '_'));
                      const status = index < currentTierIndex ? 'reached' : index === currentTierIndex ? 'current' : index === currentTierIndex + 1 ? 'next' : 'unreached';
                      const nextTierObj = MEMBERSHIP_TIERS[currentTierIndex + 1];

                      return (
                        <React.Fragment key={tier.id}>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: index < MEMBERSHIP_TIERS.length - 1 ? '16px' : '0' }}>
                            {/* Line from previous node (top half) */}
                            {index > 0 && (
                              <div style={{ position: 'absolute', top: '-16px', bottom: '50%', left: '11.5px', width: '1px', background: index <= currentTierIndex ? '#B98A5E' : '#EFE8DE', zIndex: 1 }}></div>
                            )}
                            {/* Line to next node (bottom half) */}
                            {index < MEMBERSHIP_TIERS.length - 1 && (
                              <div style={{ position: 'absolute', top: '50%', bottom: '-16px', left: '11.5px', width: '1px', background: index < currentTierIndex ? '#B98A5E' : '#EFE8DE', zIndex: 1 }}></div>
                            )}

                            {/* Node icon */}
                            <div style={{ flex: 'none', width: '24px', height: '24px', borderRadius: '50%', background: status === 'reached' ? '#B98A5E' : '#fff', border: status === 'reached' ? 'none' : status === 'current' ? '2px solid #B98A5E' : '2px solid #EFE8DE', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                              {status === 'reached' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                              {status === 'current' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#B98A5E' }}></div>}
                            </div>

                            {/* Card */}
                            <div style={{ flex: 1 }}>
                              <div onClick={() => { setSelectedTierId(tier.id); setView('tier_detail'); }} style={{ background: '#fff', border: `1px solid ${status === 'current' ? '#B98A5E' : '#EFE8DE'}`, borderRadius: '24px', padding: '18px 20px', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#3B2A22' }}>{tier.name} <span style={{ fontSize: '16px' }}>{tier.emoji}</span></div>
                                  {status === 'reached' && <div style={{ fontSize: '11px', fontWeight: 600, background: '#F1EBE1', color: '#7A6A5F', padding: '4px 10px', borderRadius: '999px' }}>Reached</div>}
                                  {status === 'current' && <div style={{ fontSize: '11px', fontWeight: 600, background: '#F8F4EE', color: '#A67C52', padding: '4px 10px', borderRadius: '999px' }}>You're here</div>}
                                  {(status === 'unreached' || status === 'next') && <div style={{ fontSize: '11px', fontWeight: 600, background: '#F3F4F6', color: '#6B7280', padding: '4px 10px', borderRadius: '999px' }}>Locked</div>}
                                </div>
                                <div style={{ fontSize: '13px', color: '#A08A7B', marginTop: '4px' }}>Rp{tier.minSpend.toLocaleString('id-ID')} – {tier.maxSpend === Infinity ? 'and beyond' : 'Rp' + tier.maxSpend.toLocaleString('id-ID')}</div>
                                <div style={{ fontSize: '14px', color: '#7A6A5F', marginTop: '10px' }}>{tier.description}</div>
                              </div>
                            </div>
                          </div>

                          {/* Progress Card inserted seamlessly after current tier */}
                          {status === 'current' && nextTierObj && (
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: index < MEMBERSHIP_TIERS.length - 1 ? '16px' : '0' }}>
                              <div style={{ position: 'absolute', top: '-16px', bottom: '-16px', left: '11.5px', width: '1px', background: '#EFE8DE', zIndex: 1 }}></div>
                              <div style={{ flex: 'none', width: '24px' }}></div>
                              <div onClick={() => { setSelectedTierId(nextTierObj.id); setView('tier_detail'); }} style={{ flex: 1, background: '#F1EBE1', border: '1px solid #E5DCD0', borderRadius: '24px', padding: '18px 20px', cursor: 'pointer', zIndex: 2 }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#3B2A22' }}>
                                  Rp{lifetimeSpend.toLocaleString('id-ID')} / Rp{nextTierObj.minSpend.toLocaleString('id-ID')}
                                </div>
                                <div style={{ position: 'relative', marginTop: '12px', height: '6px', borderRadius: '3px', background: '#EFE8DE', overflow: 'hidden' }}>
                                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(100, (lifetimeSpend / nextTierObj.minSpend) * 100)}%`, background: '#B98A5E', borderRadius: '3px' }}></div>
                                </div>
                                <div style={{ fontSize: '13px', color: '#7A6A5F', marginTop: '14px', lineHeight: 1.4 }}>
                                  Only Rp{(nextTierObj.minSpend - lifetimeSpend).toLocaleString('id-ID')} more to unlock {nextTierObj.name}
                                </div>
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Learn More Text */}
                <div style={{ marginTop: '56px', display: 'flex', justifyContent: 'center' }}>
                  <div onClick={() => router.push('/membership')} style={{ color: '#000000', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                    Learn More
                  </div>
                </div>
              </div>
            )}

            {/* TIER DETAIL VIEW */}
            {isTierDetail && (
              <div style={{ padding: '24px 20px 120px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div onClick={() => setView('roadmap')} style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none', color: '#3B2A22' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg></div>
                  <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.12em', color: '#A08A7B' }}>TIER DETAIL</div>
                </div>

                {(() => {
                  const tier = MEMBERSHIP_TIERS.find(t => t.id === selectedTierId);
                  if (!tier) return null;
                  return (
                    <div style={{ marginTop: '20px', animation: 'vfade .28s cubic-bezier(.22,1,.36,1)' }}>
                      <div style={{ fontSize: '32px', fontWeight: 600, letterSpacing: '-.02em', color: '#3B2A22' }}>{tier.name} <span style={{ fontSize: '26px' }}>{tier.emoji}</span></div>
                      <div style={{ fontSize: '14px', color: '#A08A7B', marginTop: '6px' }}>Rp{tier.minSpend.toLocaleString('id-ID')} – {tier.maxSpend === Infinity ? 'and beyond' : 'Rp' + tier.maxSpend.toLocaleString('id-ID')}</div>
                      <div style={{ fontSize: '15px', color: '#3B2A22', marginTop: '12px' }}>{tier.description}</div>

                      {/* BIRTHDAY REWARD */}
                      <div style={{ marginTop: '24px', background: '#fff', border: '1px solid #EFE8DE', borderRadius: '24px', padding: '20px', boxShadow: '0 8px 20px -12px rgba(59,42,34,.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.12em', color: '#A08A7B' }}>BIRTHDAY REWARD</div>
                          <div style={{ fontSize: '11px', fontWeight: 600, background: '#F8F4EE', color: '#A67C52', padding: '4px 10px', borderRadius: '999px' }}>{tier.birthdayReward.tag}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginTop: '16px' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#F1EBE1', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A67C52" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M12 11v-4a2 2 0 0 0-4 0v4" /><path d="M12 11v-4a2 2 0 0 1 4 0v4" /></svg>
                          </div>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#3B2A22' }}>{tier.birthdayReward.title}</div>
                            <div style={{ fontSize: '13px', color: '#7A6A5F', marginTop: '4px', lineHeight: 1.4 }}>{tier.birthdayReward.desc}</div>
                          </div>
                        </div>
                        <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #EFE8DE', fontSize: '12px', color: '#A08A7B', lineHeight: 1.5 }}>
                          Only one birthday reward applies — always the one from your highest tier. It replaces the earlier one, it doesn't stack.
                        </div>
                      </div>

                      {/* NEW AT TIER */}
                      <div style={{ marginTop: '16px', background: '#fff', border: '1px solid #EFE8DE', borderRadius: '24px', padding: '20px', boxShadow: '0 8px 20px -12px rgba(59,42,34,.1)' }}>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#3B2A22' }}>New at {tier.name}</div>
                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column' }}>
                          {tier.newPerks.map((p, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < tier.newPerks.length - 1 ? '1px solid #EFE8DE' : 'none' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#A67C52', flex: 'none' }}></span>
                                <span style={{ fontSize: '14px', color: '#3B2A22' }}>{p.name}</span>
                              </div>
                              <div style={{ fontSize: '10px', fontWeight: 600, background: '#F8F4EE', color: '#A67C52', padding: '4px 8px', borderRadius: '999px', flex: 'none', whiteSpace: 'nowrap' }}>{p.tag}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* CARRIED PERKS */}
                      {tier.carriedPerks && (
                        <div style={{ marginTop: '16px', background: '#fff', border: '1px solid #EFE8DE', borderRadius: '24px', padding: '20px', boxShadow: '0 8px 20px -12px rgba(59,42,34,.1)' }}>
                          <div style={{ fontSize: '15px', fontWeight: 600, color: '#3B2A22' }}>Carried from earlier tiers</div>
                          <div style={{ fontSize: '13px', color: '#7A6A5F', marginTop: '4px' }}>You keep all of these too.</div>
                          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column' }}>
                            {tier.carriedPerks.map((p, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < tier.carriedPerks.length - 1 ? '1px solid #EFE8DE' : 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#A08A7B', flex: 'none' }}></span>
                                  <span style={{ fontSize: '14px', color: '#3B2A22' }}>{p.name}</span>
                                </div>
                                <div style={{ fontSize: '10px', fontWeight: 600, background: '#F1EBE1', color: '#A08A7B', padding: '4px 8px', borderRadius: '999px', flex: 'none', whiteSpace: 'nowrap' }}>{p.tag}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Welcome Treat Note (only for Insider) */}
                      {tier.id === 'insider' && (
                        <div style={{ marginTop: '16px', background: '#F5F7F5', border: '1px solid #E5EBE5', borderRadius: '16px', padding: '16px', display: 'flex', gap: '12px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#647D61', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M12 11v-4" /></svg>
                          </div>
                          <div style={{ fontSize: '12.5px', color: '#3B4D39', lineHeight: 1.5 }}>
                            Your Welcome Treat is a one-time hello — enjoy it once when you join. Everything else stays with you.
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* VISIT HISTORY LIST */}
            {isHistory && (
              <div style={{ padding: '8px 20px 110px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div onClick={() => setView('dashboard')} style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none', color: '#3B2A22' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg></div>
                  <div style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-.02em' }}>Visit History</div>
                </div>
                <div style={{ fontSize: '13.5px', color: '#8A7A6E', marginTop: '8px', marginLeft: '2px' }}>A record of your visits and rewards.</div>

                <div style={{ marginTop: '20px', animation: 'vfade .28s cubic-bezier(.22,1,.36,1)' }}>
                  {entries.map((e, i) => (
                    <div key={i} onClick={e.open} style={{ marginTop: '10px', background: '#fff', border: '1px solid #EFE8DE', borderRadius: '16px', padding: '14px 15px', display: 'flex', alignItems: 'center', gap: '13px', cursor: 'pointer', boxShadow: '0 6px 18px -18px rgba(59,42,34,.4)', transition: 'transform .14s ease' }}>
                      <div style={{ flex: 'none', width: '44px', textAlign: 'center' }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#3B2A22', fontVariantNumeric: 'tabular-nums' }}>{e.dateMonth}</div>
                        <div style={{ fontSize: '10.5px', color: '#A08A7B', fontVariantNumeric: 'tabular-nums', marginTop: '1px' }}>{e.dateYear}</div>
                      </div>
                      <div style={{ width: '1px', alignSelf: 'stretch', background: '#F2ECE3', flex: 'none' }}></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: e.dot, flex: 'none' }}></span>
                          <div style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '-.005em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#A08A7B', marginTop: '4px', marginLeft: '13px' }}>{e.meta}</div>
                      </div>
                      <span style={{ fontSize: '9.5px', fontWeight: 600, letterSpacing: '.04em', padding: '4px 9px', borderRadius: '999px', background: e.tagBg, color: e.tagColor, flex: 'none', whiteSpace: 'nowrap' }}>{e.tag}</span>
                    </div>
                  ))}

                  {entriesEmpty && (
                    <div style={{ marginTop: '60px', textAlign: 'center', padding: '0 30px' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#F1EBE1', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', color: '#C4B6A9' }}>◷</div>
                      <div style={{ fontSize: '16px', fontWeight: 600, marginTop: '18px' }}>No visits recorded yet</div>
                      <div style={{ fontSize: '13px', lineHeight: 1.55, color: '#8A7A6E', marginTop: '6px' }}>Your first visit will show up here.</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VISIT DETAIL */}
            {isVisitDetail && sel && (
              <div style={{ padding: '8px 22px 110px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div onClick={() => setView('history')} style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#3B2A22' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg></div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>Visit Record</div>
                </div>

                <div style={{ marginTop: '22px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '15px', background: '#F1EBE1', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '20px', height: '15px', border: '1.8px solid #A67C52', borderRadius: '3px 3px 5px 5px', position: 'relative' }}><div style={{ position: 'absolute', top: '-4px', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '5px', border: '1.8px solid #A67C52', borderBottom: 'none', borderRadius: '6px 6px 0 0' }}></div></div>
                  </div>
                  <div>
                    <div style={{ fontSize: '19px', fontWeight: 600, letterSpacing: '-.02em' }}>{sel.outlet}</div>
                    <div style={{ fontSize: '12.5px', color: '#A08A7B', marginTop: '3px' }}>{sel.dateFull}</div>
                  </div>
                </div>

                <div style={{ marginTop: '22px', background: '#F8F4EE', borderRadius: '18px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#A08A7B' }}>Visit number</span><span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{sel.visitNo}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#A08A7B' }}>Time</span><span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{sel.time}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#A08A7B' }}>Outlet</span><span style={{ fontWeight: 600 }}>{sel.outlet}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#A08A7B' }}>Date</span><span style={{ fontWeight: 600 }}>{sel.dateFull}</span></div>
                </div>

                <div style={{ marginTop: '20px', fontSize: '13.5px', lineHeight: 1.6, color: '#7A6A5F' }}>Counted toward your Visit Progress.</div>
              </div>
            )}

            {/* EARNED DETAIL */}
            {isEarnedDetail && sel && (
              <div style={{ padding: '8px 22px 60px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div onClick={() => setView('history')} style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#3B2A22' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg></div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>Reward Earned</div>
                </div>

                <div style={{ marginTop: '22px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-.02em' }}>{sel.reward}</div>
                  <div style={{ fontSize: '12.5px', color: '#A08A7B', marginTop: '5px' }}>Earned {sel.dateFull}</div>
                </div>

                <div style={{ marginTop: '22px', background: '#F8F4EE', borderRadius: '18px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#A08A7B' }}>Reward</span><span style={{ fontWeight: 600 }}>{sel.reward}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#A08A7B' }}>Earned via</span><span style={{ fontWeight: 600 }}>{sel.earnedVia}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#A08A7B' }}>Date earned</span><span style={{ fontWeight: 600 }}>{sel.dateFull}</span></div>
                </div>

                <div style={{ marginTop: '18px', background: (sel as any).statusBg, borderRadius: '14px', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: (sel as any).statusDot, flex: 'none' }}></span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: (sel as any).statusColor }}>{(sel as any).statusLine}</span>
                </div>

              </div>
            )}

            {/* REDEEMED DETAIL */}
            {isRedeemedDetail && sel && (
              <div style={{ padding: '8px 22px 60px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div onClick={() => setView('history')} style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#3B2A22' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg></div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>Redemption Record</div>
                </div>

                <div style={{ marginTop: '22px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-.02em' }}>{sel.reward}</div>
                  <div style={{ fontSize: '12.5px', color: '#A08A7B', marginTop: '5px' }}>Redeemed {sel.dateFull}</div>
                </div>

                <div style={{ marginTop: '22px', background: '#F8F4EE', borderRadius: '18px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#A08A7B' }}>Reward</span><span style={{ fontWeight: 600 }}>{sel.reward}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#A08A7B' }}>Outlet</span><span style={{ fontWeight: 600 }}>{sel.outlet}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#A08A7B' }}>Reference No.</span><span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{sel.ref}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#A08A7B' }}>Date redeemed</span><span style={{ fontWeight: 600 }}>{sel.dateFull}</span></div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </PageTransition>

      {showNav && <BottomNav />}

      {/* Barcode Expand Modal */}
      <AnimatePresence>
        {showQrModal && (
          <motion.div
            key="qr-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowQrModal(false)}
            style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(26,19,15,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <motion.div
              key="qr-sheet"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: '32px', padding: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 24px 60px -20px rgba(0,0,0,0.6)' }}
            >
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#A08A7B', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '24px' }}>Member Barcode</div>
              <QRCodeSVG
                value={member?.id || ''}
                size={220}
                bgColor={"#ffffff"}
                fgColor={"#3B2A22"}
                level={"Q"}
                includeMargin={false}
              />
              <div style={{ marginTop: '24px', fontSize: '18px', fontWeight: 600, color: '#3B2A22', letterSpacing: '.04em' }}>{member?.id || 'RR-00000'}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PhoneLayout>
  );
}
