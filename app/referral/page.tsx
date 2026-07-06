'use client';

import React, { useState, useEffect } from 'react';
import PhoneLayout from '@/components/ui/PhoneLayout';
import BottomNav from '@/components/ui/BottomNav';
import { useRouter } from 'next/navigation';
import { useMember } from '@/context/MemberContext';

export default function ReferralPage() {
  const router = useRouter();
  const { member } = useMember();
  const [view, setView] = useState<'referral' | 'friend' | 'success'>('referral');
  const [selFriendId, setSelFriendId] = useState<string | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastKey, setToastKey] = useState(0);
  const [locallyClaimed, setLocallyClaimed] = useState(false);
  const [claimDate, setClaimDate] = useState('');
  const [claimRef, setClaimRef] = useState('');
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 350);
    return () => clearTimeout(t);
  }, []);

  const toast = (msg: string) => {
    setToastMsg(msg);
    setToastKey(k => k + 1);
    setTimeout(() => setToastMsg(''), 1800);
  };

  const code = member?.referralCode || 'RR-CODE';
  const link = 'roemahroti.id/join/' + code;
  const baseRewardState = locallyClaimed ? 'claimed' : 'ready'; // for demo, set to ready

  // We now use member.referredFriends instead of friendsRaw

  const goalCount = 3;
  const rawFriends = member?.referredFriends || [];
  const qualifying = rawFriends.filter((f: any) => f.status === 'First visit completed').length;
  const pct = Math.round((qualifying / goalCount) * 100);
  const remaining = Math.max(0, goalCount - qualifying);

  const friends = rawFriends.map((f: any) => {
    // Basic color mapping based on status
    const isQual = f.status === 'First visit completed';
    const color = isQual ? '#5C7B5A' : '#A08A7B';
    const dot = isQual ? '#5C7B5A' : '#C9B7A6';
    return {
      ...f,
      name: f.friendName,
      color, dot,
      initial: f.friendName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase(),
      open: () => { setSelFriendId(f.id); setView('friend'); }
    };
  });

  const selFriend = friends.find(f => f.id === selFriendId) || friends[0];

  const rewardMap: Record<string, any> = {
    locked: { line: remaining + ' more friend' + (remaining === 1 ? '' : 's') + ' to unlock', bg: '#F5EFE6', dot: '#C9B7A6', color: '#A08A7B', ready: false, disabled: remaining + ' more friend' + (remaining === 1 ? '' : 's') + ' to unlock' },
    ready: { line: 'Ready to Claim', bg: 'rgba(122,150,116,.12)', dot: '#5C7B5A', color: '#5C7B5A', ready: true, disabled: '' },
    claimed: { line: 'Claimed' + (claimDate ? ' on ' + claimDate : ''), bg: 'rgba(166,124,82,.10)', dot: '#A67C52', color: '#A67C52', ready: false, disabled: 'Already Claimed' }
  };
  const rm = rewardMap[baseRewardState];

  const progressLine = remaining > 0
    ? qualifying + ' of ' + goalCount + ' friends joined · ' + remaining + ' more to unlock your next reward.'
    : 'All set — ' + goalCount + ' of ' + goalCount + ' friends joined for this reward cycle.';

  const terms = [
    'Reward is granted after your friend completes their first qualifying visit.',
    'One reward per successfully referred friend.',
    'Referral code cannot be used by existing members.',
    'Cannot be combined with other promotions.'
  ];

  const claimReward = () => {
    const ref = 'RR-REF-' + String(1000 + Math.floor(Math.random() * 8999));
    setLocallyClaimed(true);
    setClaimDate('Jul 4, 2026');
    setClaimRef(ref);
    setView('success');
  };

  return (
    <PhoneLayout>
      <div className="rf-scroll" key={view + (selFriendId || '')} style={{ position: 'absolute', top: 46, left: 0, right: 0, bottom: 0, overflowY: 'auto', animation: 'rslide .3s cubic-bezier(.22,1,.36,1)' }}>
        
        {view === 'referral' && (
          <div style={{ padding: '8px 20px 40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div onClick={() => router.push('/')} style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px', flex: 'none' }}>←</div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-.02em' }}>Referral Program</div>
              </div>
            </div>
            <div style={{ fontSize: '13.5px', color: '#8A7A6E', marginTop: '8px', marginLeft: '2px' }}>Share Roemah Roti with someone you trust.</div>

            {/* SECTION 1: referral code */}
            <div style={{ position: 'relative', marginTop: '20px', borderRadius: '26px', background: '#3B2A22', color: '#F8F4EE', padding: '24px 22px 22px', overflow: 'hidden', boxShadow: '0 18px 40px -18px rgba(59,42,34,.55)' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.05) 1px,transparent 1px)', backgroundSize: '11px 11px', opacity: .6 }}></div>
              <div style={{ position: 'absolute', top: '-60px', right: '-50px', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(166,124,82,.35),transparent 68%)', pointerEvents: 'none' }}></div>
              <div style={{ position: 'relative', fontSize: '10px', fontWeight: 600, letterSpacing: '.24em', color: 'rgba(248,244,238,.6)' }}>YOUR REFERRAL CODE</div>
              <div style={{ position: 'relative', marginTop: '14px', fontSize: '32px', fontWeight: 600, letterSpacing: '.05em', fontVariantNumeric: 'tabular-nums', color: '#E9C9A6' }}>{code}</div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '18px', paddingTop: '16px', borderTop: '1px solid rgba(248,244,238,.12)' }}>
                <div style={{ fontSize: '12px', lineHeight: 1.5, color: 'rgba(248,244,238,.62)', maxWidth: '200px' }}>Give this code to a friend when they sign up.</div>
                <div onClick={() => toast('Code copied')} style={{ cursor: 'pointer', flex: 'none', background: 'rgba(248,244,238,.1)', color: '#F8F4EE', fontSize: '12.5px', fontWeight: 600, padding: '9px 14px', borderRadius: '12px', border: '1px solid rgba(248,244,238,.18)' }}>Copy</div>
              </div>
            </div>

            {/* SECTION 2: share link */}
            <div style={{ marginTop: '16px', background: '#fff', border: '1px solid #EFE8DE', borderRadius: '22px', padding: '20px', boxShadow: '0 10px 26px -20px rgba(59,42,34,.35)' }}>
              <div style={{ fontSize: '15px', fontWeight: 600 }}>Share Your Link</div>
              <div style={{ marginTop: '12px', background: '#F8F4EE', borderRadius: '14px', padding: '13px 14px', fontSize: '13px', fontWeight: 500, color: '#4A3830', wordBreak: 'break-all', fontVariantNumeric: 'tabular-nums' }}>{link}</div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <div onClick={() => setShareOpen(true)} style={{ flex: 1, textAlign: 'center', background: '#A67C52', color: '#FFFCF7', padding: '14px', borderRadius: '14px', fontSize: '14.5px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 14px 26px -16px rgba(166,124,82,.9)', transition: 'transform .12s ease' }}>Share</div>
                <div onClick={() => toast('Link copied')} style={{ flex: 'none', textAlign: 'center', border: '1px solid #E0D5C6', color: '#3B2A22', padding: '14px 18px', borderRadius: '14px', fontSize: '14.5px', fontWeight: 600, cursor: 'pointer' }}>Copy Link</div>
              </div>
            </div>

            {/* SECTION 3: progress */}
            <div style={{ marginTop: '16px', background: '#fff', border: '1px solid #EFE8DE', borderRadius: '22px', padding: '20px', boxShadow: '0 10px 26px -20px rgba(59,42,34,.35)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '15px', fontWeight: 600 }}>Referral Progress</div>
                <div style={{ fontSize: '12px', color: '#A08A7B' }}><span style={{ color: '#A67C52', fontWeight: 600 }}>{qualifying}</span> / {goalCount} friends</div>
              </div>
              <div style={{ position: 'relative', marginTop: '16px', height: '14px', borderRadius: '999px', background: '#F1EBE1', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(90deg,transparent 0,transparent calc(33.33% - 1.5px),rgba(255,255,255,.9) calc(33.33% - 1.5px),rgba(255,255,255,.9) 33.33%)', zIndex: 2, pointerEvents: 'none' }}></div>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: (revealed ? pct : 0) + '%', background: 'linear-gradient(90deg,#B98A5E,#A67C52)', borderRadius: '999px', zIndex: 1, transition: 'width 1s cubic-bezier(.22,1,.36,1)' }}></div>
              </div>
              <div style={{ marginTop: '14px', fontSize: '12.5px', lineHeight: 1.5, color: '#7A6A5F' }}>{progressLine}</div>
            </div>

            {/* SECTION 4: joined friends */}
            <div style={{ marginTop: '24px' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, marginLeft: '2px' }}>Friends Who Joined</div>
              {friends.map((f, i) => (
                <div key={i} onClick={f.open} style={{ marginTop: '12px', background: '#fff', border: '1px solid #EFE8DE', borderRadius: '18px', padding: '15px 16px', display: 'flex', alignItems: 'center', gap: '13px', cursor: 'pointer', boxShadow: '0 8px 22px -20px rgba(59,42,34,.4)', transition: 'transform .14s ease' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#F1EBE1', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: '#A67C52' }}>{f.initial}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14.5px', fontWeight: 600, letterSpacing: '-.005em' }}>{f.name}</div>
                    <div style={{ fontSize: '11.5px', color: '#A08A7B', marginTop: '3px' }}>Joined {f.date}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 'none' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: f.dot }}></span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: f.color }}>{f.status}</span>
                  </div>
                </div>
              ))}
              {friends.length === 0 && (
                <div style={{ marginTop: '20px', textAlign: 'center', padding: '30px 20px', background: '#fff', border: '1px solid #EFE8DE', borderRadius: '20px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#F1EBE1', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: '#C4B6A9' }}>◷</div>
                  <div style={{ fontSize: '14.5px', fontWeight: 600, marginTop: '14px' }}>No friends yet</div>
                  <div style={{ fontSize: '12.5px', lineHeight: 1.5, color: '#8A7A6E', marginTop: '5px' }}>Share your code to get started.</div>
                </div>
              )}
            </div>

            {/* SECTION 5: reward status */}
            <div style={{ marginTop: '24px' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, marginLeft: '2px' }}>Referral Reward</div>
              <div style={{ marginTop: '12px', background: '#fff', border: '1px solid #EFE8DE', borderRadius: '22px', overflow: 'hidden', boxShadow: '0 10px 26px -20px rgba(59,42,34,.35)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '15px', background: '#F3E9E4', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A67C52" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c1.8 2 2.6 3.6 2.6 5a2.6 2.6 0 1 1-5.2 0c0-1.4.8-3 2.6-5z"></path><path d="M6 13c0-1.8 2.7-3 6-3s6 1.2 6 3v4a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"></path></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-.01em' }}>Free Garlic Cream Cheese</div>
                    <div style={{ fontSize: '12px', color: '#8A7A6E', marginTop: '3px' }}>Our thanks for a friend who joined.</div>
                  </div>
                </div>
                <div style={{ margin: '0 18px', background: rm.bg, borderRadius: '14px', padding: '13px 15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: rm.dot, flex: 'none' }}></span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: rm.color }}>{rm.line}</span>
                </div>
                <div style={{ padding: '16px 18px 18px' }}>
                  {rm.ready ? (
                    <div onClick={claimReward} style={{ textAlign: 'center', background: '#A67C52', color: '#FFFCF7', padding: '15px', borderRadius: '14px', fontSize: '14.5px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 14px 26px -16px rgba(166,124,82,.9)', transition: 'transform .12s ease' }}>Claim Reward</div>
                  ) : (
                    <div style={{ textAlign: 'center', background: '#F1EBE1', color: '#A99A8C', padding: '15px', borderRadius: '14px', fontSize: '14.5px', fontWeight: 600, cursor: 'not-allowed' }}>{rm.disabled}</div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 6: terms */}
            <div style={{ marginTop: '24px', marginBottom: '20px' }}>
              <div onClick={() => setTermsOpen(!termsOpen)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '2px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#8A7A6E', letterSpacing: '.02em' }}>Referral Terms</div>
                <div style={{ fontSize: '13px', color: '#A08A7B', transform: termsOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s ease' }}>⌄</div>
              </div>
              {termsOpen && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '9px', animation: 'rfade .2s ease' }}>
                  {terms.map((t, i) => (
                    <div key={i} style={{ display: 'flex', gap: '9px' }}>
                      <span style={{ color: '#C4A57E', fontSize: '12.5px', lineHeight: 1.5 }}>•</span>
                      <span style={{ fontSize: '12.5px', lineHeight: 1.55, color: '#8A7A6E' }}>{t}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============ FRIEND DETAIL ============ */}
        {view === 'friend' && selFriend && (
          <div style={{ padding: '8px 22px 60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div onClick={() => setView('referral')} style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px' }}>←</div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>Friend Progress</div>
            </div>

            <div style={{ marginTop: '22px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#F1EBE1', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 600, color: '#A67C52' }}>{selFriend.initial}</div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-.02em' }}>{selFriend.name}</div>
                <div style={{ fontSize: '12.5px', color: '#A08A7B', marginTop: '3px' }}>Joined {selFriend.date}</div>
              </div>
            </div>

            <div style={{ marginTop: '22px', background: '#F8F4EE', borderRadius: '18px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#A08A7B' }}>Status</span><span style={{ fontWeight: 600, color: selFriend.color }}>{selFriend.status}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#A08A7B' }}>Joined via</span><span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{code}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#A08A7B' }}>Join date</span><span style={{ fontWeight: 600 }}>{selFriend.date}</span></div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.12em', color: '#A08A7B' }}>CONTRIBUTION TO YOUR PROGRESS</div>
              <div style={{ fontSize: '13.5px', lineHeight: 1.6, color: '#4A3830', marginTop: '8px' }}>{selFriend.contribution}</div>
            </div>
          </div>
        )}

        {/* ============ CLAIM SUCCESS ============ */}
        {view === 'success' && (
          <div style={{ minHeight: '766px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 30px 40px', boxSizing: 'border-box', textAlign: 'center' }}>
            <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: 'rgba(122,150,116,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'rpop .5s cubic-bezier(.22,1.4,.5,1)' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#5C7B5A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>
              </div>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-.02em', marginTop: '24px' }}>Reward Claimed</div>
            <div style={{ fontSize: '14px', color: '#8A7A6E', marginTop: '8px', maxWidth: '250px', lineHeight: 1.55 }}>Thank you for sharing Roemah Roti with someone you trust, {member?.firstName || 'User'}.</div>

            <div style={{ marginTop: '24px', width: '100%', background: '#F8F4EE', borderRadius: '18px', padding: '18px 20px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#A08A7B' }}>Reward</span><span style={{ fontWeight: 600 }}>Free Butter Croissant</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#A08A7B' }}>Date</span><span style={{ fontWeight: 600 }}>{claimDate}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#A08A7B' }}>Reference</span><span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{claimRef}</span></div>
            </div>

            <div onClick={() => setView('referral')} style={{ marginTop: '26px', width: '100%', boxSizing: 'border-box', background: '#A67C52', color: '#FFFCF7', textAlign: 'center', padding: '16px', borderRadius: '16px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 14px 26px -16px rgba(166,124,82,.9)', transition: 'transform .12s ease' }}>Back to Referral Program</div>
          </div>
        )}

      </div>

      {view === 'referral' && <BottomNav />}

      {/* SHARE SHEET OVERLAY */}
      {shareOpen && (
        <>
          <div onClick={() => setShareOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 20, background: 'rgba(43,30,24,.5)', animation: 'rfade .2s ease' }}></div>
          <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 21, background: '#FCFBF8', borderRadius: '24px 24px 0 0', padding: '10px 20px 30px', boxShadow: '0 -20px 50px -20px rgba(0,0,0,.3)', animation: 'rsheetup .32s cubic-bezier(.22,1,.36,1)' }}>
            <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#E0D5C6', margin: '6px auto 16px' }}></div>
            <div style={{ fontSize: '15px', fontWeight: 600, textAlign: 'center', marginBottom: '4px' }}>Share Referral Link</div>
            <div style={{ fontSize: '12px', color: '#8A7A6E', textAlign: 'center', marginBottom: '16px' }}>Invite a friend to Roemah Roti.</div>

            <div onClick={() => { setShareOpen(false); toast('Opening WhatsApp…'); }} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 6px', cursor: 'pointer', borderBottom: '1px solid #F2ECE3' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(122,150,116,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5C7B5A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.5L4 20l1.1-4.4A8.5 8.5 0 1 1 21 11.5z"></path><path d="M9 10.5c0 3 2.5 5 5 5"></path></svg>
              </div>
              <div style={{ flex: 1, fontSize: '14.5px', fontWeight: 600 }}>WhatsApp</div>
              <div style={{ fontSize: '16px', color: '#C4B6A9' }}>→</div>
            </div>
            <div onClick={() => { setShareOpen(false); toast('Link copied'); }} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 6px', cursor: 'pointer', borderBottom: '1px solid #F2ECE3' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A67C52" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="8" width="12" height="12" rx="3"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path></svg>
              </div>
              <div style={{ flex: 1, fontSize: '14.5px', fontWeight: 600 }}>Copy Link</div>
            </div>
            <div onClick={() => setShareOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 6px', cursor: 'pointer' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B2A22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="12" r="1.6"></circle><circle cx="12" cy="12" r="1.6"></circle><circle cx="18" cy="12" r="1.6"></circle></svg>
              </div>
              <div style={{ flex: 1, fontSize: '14.5px', fontWeight: 600 }}>More options</div>
            </div>

            <div onClick={() => setShareOpen(false)} style={{ marginTop: '18px', textAlign: 'center', padding: '14px', border: '1px solid #E0D5C6', borderRadius: '14px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancel</div>
          </div>
        </>
      )}

      {/* TOAST */}
      {toastMsg && (
        <div key={toastKey} style={{ position: 'absolute', left: '50%', bottom: '96px', zIndex: 30, background: '#3B2A22', color: '#F8F4EE', fontSize: '12.5px', fontWeight: 600, padding: '11px 18px', borderRadius: '999px', boxShadow: '0 12px 26px -12px rgba(0,0,0,.4)', animation: 'rtoast 1.8s ease forwards', whiteSpace: 'nowrap', transform: 'translateX(-50%)' }}>
          {toastMsg}
        </div>
      )}
    </PhoneLayout>
  );
}
