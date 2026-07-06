'use client';

import React, { useState } from 'react';
import PhoneLayout from '@/components/ui/PhoneLayout';
import BottomNav from '@/components/ui/BottomNav';
import { useMember } from '@/context/MemberContext';

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
// We now use member.activities instead of rawEntries
export default function VisitsPage() {
  const { member } = useMember();
  const [view, setView] = useState<'dashboard' | 'history' | 'detail'>('dashboard');
  const [selId, setSelId] = useState<string | null>(null);

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
  const showNav = view === 'dashboard' || view === 'history';

  const viewKey = view + (view === 'detail' ? (selId || '') : '');

  return (
    <PhoneLayout>
      <div key={viewKey} className="v-scroll" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflowY: 'auto', animation: 'vslide .3s cubic-bezier(.22,1,.36,1)', color: '#3B2A22' }}>
        
        {/* DASHBOARD */}
        {isDashboard && (
          <div style={{ padding: '8px 20px 96px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '6px 2px 18px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#A08A7B' }}>Good morning,</div>
                <div style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-.02em', marginTop: '1px' }}>{member?.firstName || 'User'}</div>
              </div>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: '#A67C52' }}>{member?.initials || 'U'}</div>
            </div>

            <div style={{ position: 'relative', borderRadius: '24px', background: '#3B2A22', color: '#F8F4EE', padding: '20px', overflow: 'hidden', boxShadow: '0 18px 40px -18px rgba(59,42,34,.55)' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.05) 1px,transparent 1px)', backgroundSize: '11px 11px', opacity: .6 }}></div>
              <div style={{ position: 'absolute', top: '-60px', right: '-50px', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(166,124,82,.35),transparent 68%)', pointerEvents: 'none' }}></div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.28em', color: 'rgba(248,244,238,.72)' }}>ROEMAH ROTI</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(166,124,82,.9)', color: '#2A1E18', fontSize: '11px', fontWeight: 600, padding: '5px 11px', borderRadius: '999px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2A1E18', opacity: .65 }}></span>Insider</div>
              </div>
              <div style={{ position: 'relative', marginTop: '20px', fontSize: '21px', fontWeight: 600, letterSpacing: '-.02em' }}>{member?.firstName || 'User'}</div>
              <div style={{ position: 'relative', marginTop: '4px', fontSize: '12.5px', color: 'rgba(248,244,238,.6)', fontVariantNumeric: 'tabular-nums' }}>{member?.id || 'RR-00000'} · Member since {member?.since || 'Unknown'}</div>
            </div>

            <div style={{ marginTop: '16px', background: '#fff', border: '1px solid #EFE8DE', borderRadius: '20px', padding: '18px 18px 20px', boxShadow: '0 10px 26px -20px rgba(59,42,34,.35)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Visit Progress</div>
                <div style={{ fontSize: '12px', color: '#A08A7B' }}><span style={{ color: '#A67C52', fontWeight: 600 }}>{member?.totalVisits || 0}</span> / 10 visits</div>
              </div>
              <div style={{ position: 'relative', marginTop: '14px', height: '12px', borderRadius: '999px', background: '#F1EBE1', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(90deg,transparent 0,transparent calc(10% - 1.5px),rgba(255,255,255,.9) calc(10% - 1.5px),rgba(255,255,255,.9) 10%)', zIndex: 2 }}></div>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${((member?.totalVisits || 0) % 10) * 10}%`, background: 'linear-gradient(90deg,#B98A5E,#A67C52)', borderRadius: '999px', zIndex: 1 }}></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px' }}>
                <div style={{ fontSize: '12.5px', color: '#7A6A5F' }}><span style={{ fontWeight: 600, color: '#3B2A22' }}>{10 - ((member?.totalVisits || 0) % 10)} more visits</span> until your next reward.</div>
                <div onClick={() => setView('history')} style={{ fontSize: '12px', fontWeight: 600, color: '#A67C52', cursor: 'pointer', flex: 'none', paddingLeft: '10px' }}>View History</div>
              </div>
            </div>
          </div>
        )}

        {/* VISIT HISTORY LIST */}
        {isHistory && (
          <div style={{ padding: '8px 20px 40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div onClick={() => setView('dashboard')} style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px', flex: 'none' }}>←</div>
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
          <div style={{ padding: '8px 22px 60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div onClick={() => setView('history')} style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px' }}>←</div>
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
              <div onClick={() => setView('history')} style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px' }}>←</div>
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
              <div onClick={() => setView('history')} style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px' }}>←</div>
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

      </div>

      {showNav && <BottomNav />}
    </PhoneLayout>
  );
}
