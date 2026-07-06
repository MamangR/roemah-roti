'use client';

import React, { useState, useEffect } from 'react';
import PhoneLayout from '@/components/ui/PhoneLayout';
import BottomNav from '@/components/ui/BottomNav';
import { useRouter } from 'next/navigation';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDateDisplay(iso: string) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function derivePromoStatus(promoStatus: string): 'active' | 'ending' | 'ended' {
  if (promoStatus === 'Aktif') return 'active';
  if (promoStatus === 'Segera Berakhir') return 'ending';
  return 'ended';
}

function promoValidity(startDate: string, endDate: string, promoStatus: string): string {
  const status = derivePromoStatus(promoStatus);
  if (status === 'ended') return `Ended ${fmtDateDisplay(endDate)}`;
  return `Valid until ${fmtDateDisplay(endDate)}`;
}

// ─── Icon helper ─────────────────────────────────────────────────────────────
const tileBg = (cat: string) => ({ Bread: '#F1EADD', Pastry: '#F0EAE0', Coffee: '#ECEEE6', Cake: '#F4EEE5', Beverage: '#E8EDF0' }[cat] || '#F1EADD');

function iconEl(cat: string, size = 34) {
  const col = '#A67C52', sw = 1.6;
  const paths: Record<string, string> = {
    Bread: 'M4 13c0-3 3.2-5 8-5s8 2 8 5v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z M9 12v4 M13 12.5v3.5 M17 12v4',
    Pastry: 'M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 8.7l5.4-.8z',
    Coffee: 'M5 9h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z M16 10h1.5a2.5 2.5 0 0 1 0 5H16 M8 4c0 1-1.2 1.2-1.2 2.3S8 8 8 8 M12 4c0 1-1.2 1.2-1.2 2.3S12 8 12 8',
    Cake: 'M12 2v3 M8 5h8 M5 8h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z M12 11v6',
    Beverage: 'M8 2h8l-1 6H9z M9 8v10h6V8 M6 12h12',
  };
  const d = paths[cat] || paths.Bread;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {d.split(' M').map((seg, i) => <path key={i} d={(i ? 'M' : '') + seg} />)}
    </svg>
  );
}

const badgeMap: Record<string, { text: string; bg: string; color: string }> = {
  active: { text: 'Active', bg: 'rgba(122,150,116,.14)', color: '#5C7B5A' },
  ending: { text: 'Ending soon', bg: '#F5EFE6', color: '#A08A7B' },
  ended: { text: 'Ended', bg: '#F1EBE1', color: '#B0A290' },
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UpdatesPage() {
  const router = useRouter();
  const [view, setView] = useState<'updates' | 'newMenuDetail' | 'promoDetail' | 'announcementDetail'>('updates');
  const [tab, setTab] = useState<'newMenu' | 'promo' | 'announcements'>('newMenu');
  const [selNewMenuId, setSelNewMenuId] = useState<string | null>(null);
  const [selPromoId, setSelPromoId] = useState<string | null>(null);
  const [selAnnouncementId, setSelAnnouncementId] = useState<string | null>(null);

  // ─── DB State ──────────────────────────────────────────────────────────────
  const [rawNewMenu, setRawNewMenu] = useState<any[]>([]);
  const [rawPromos, setRawPromos] = useState<any[]>([]);
  const [rawAnnouncements, setRawAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const [nm, pr, an] = await Promise.all([
          fetch('/api/updates?type=newMenu').then(r => r.json()),
          fetch('/api/updates?type=promo').then(r => r.json()),
          fetch('/api/updates?type=announcement').then(r => r.json()),
        ]);
        setRawNewMenu(Array.isArray(nm) ? nm : []);
        setRawPromos(Array.isArray(pr) ? pr : []);
        setRawAnnouncements(Array.isArray(an) ? an : []);
      } catch (err) {
        console.error('Failed to load updates', err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  // ─── Derived display data ──────────────────────────────────────────────────
  // Only Published items visible to members
  const newMenu = rawNewMenu
    .filter(it => it.status === 'Published')
    .map(it => ({
      ...it,
      date: fmtDateDisplay(it.dateAdded),
      desc: it.shortDesc,
      long: it.longDesc,
      category: it.category,
      categoryUpper: (it.category || '').toUpperCase(),
      tileBg: tileBg(it.category),
      iconSmall: iconEl(it.category, 34),
      iconLarge: iconEl(it.category, 64),
      open: () => { setSelNewMenuId(it.id); setView('newMenuDetail'); },
    }));

  const promos = rawPromos.map(p => {
    const statusKey = derivePromoStatus(p.promoStatus);
    const b = badgeMap[statusKey];
    return {
      ...p,
      long: p.longDesc,
      desc: p.shortDesc,
      validity: promoValidity(p.startDate, p.endDate, p.promoStatus),
      badgeText: b.text, badgeBg: b.bg, badgeColor: b.color,
      open: () => { setSelPromoId(p.id); setView('promoDetail'); },
    };
  });

  // Pinned first (API already sorts, but ensure client-side too)
  const announcements = rawAnnouncements
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
    .map(a => ({
      ...a,
      date: fmtDateDisplay(a.datePosted),
      long: a.content,
      open: () => { setSelAnnouncementId(a.id); setView('announcementDetail'); },
    }));

  const selItem = newMenu.find(i => i.id === selNewMenuId) || newMenu[0];
  const selPromo = promos.find(p => p.id === selPromoId) || promos[0];
  const selAnnouncement = announcements.find(a => a.id === selAnnouncementId) || announcements[0];

  const tabIndex = { newMenu: 0, promo: 1, announcements: 2 }[tab];
  const tabActive = '#3B2A22', tabIdle = '#A08A7B';

  // ─── Skeleton loader ───────────────────────────────────────────────────────
  const Skeleton = () => (
    <div style={{ marginTop: '14px', background: '#fff', border: '1px solid #EFE8DE', borderRadius: '20px', overflow: 'hidden', display: 'flex', gap: 0 }}>
      <div style={{ width: '92px', height: '92px', flex: 'none', background: '#F1EBE1', animation: 'skpulse 1.4s ease-in-out infinite' }} />
      <div style={{ flex: 1, padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ height: '14px', width: '60%', background: '#F1EBE1', borderRadius: '8px', animation: 'skpulse 1.4s ease-in-out infinite' }} />
        <div style={{ height: '11px', width: '80%', background: '#F1EBE1', borderRadius: '8px', animation: 'skpulse 1.4s ease-in-out infinite' }} />
      </div>
    </div>
  );

  return (
    <PhoneLayout>
      <style>{`@keyframes skpulse { 0%,100%{opacity:1} 50%{opacity:.45} } @keyframes uslide { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} } @keyframes ufade { from{opacity:0} to{opacity:1} }`}</style>
      <div className="u-scroll" key={view} style={{ position: 'absolute', top: 46, left: 0, right: 0, bottom: 0, overflowY: 'auto', animation: 'uslide .3s cubic-bezier(.22,1,.36,1)' }}>

        {view === 'updates' && (
          <div style={{ padding: '8px 20px 40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div onClick={() => router.push('/')} style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px', flex: 'none' }}>←</div>
              <div style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-.02em' }}>Updates</div>
            </div>
            <div style={{ fontSize: '13.5px', color: '#8A7A6E', marginTop: '8px', marginLeft: '2px' }}>Things worth knowing at Roemah Roti.</div>

            {/* segmented toggle */}
            <div style={{ position: 'relative', marginTop: '20px', background: '#F1EBE1', borderRadius: '14px', padding: '4px', display: 'flex' }}>
              <div style={{ position: 'absolute', top: '4px', bottom: '4px', left: '4px', width: 'calc(33.333% - 4px)', background: '#fff', borderRadius: '11px', boxShadow: '0 4px 12px -4px rgba(59,42,34,.25)', transform: `translateX(${tabIndex * 100}%)`, transition: 'transform .32s cubic-bezier(.22,1,.36,1)' }}></div>
              <div onClick={() => setTab('newMenu')} style={{ position: 'relative', flex: 1, textAlign: 'center', padding: '10px 4px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', color: tab === 'newMenu' ? tabActive : tabIdle, zIndex: 1, transition: 'color .2s ease' }}>New Menu</div>
              <div onClick={() => setTab('promo')} style={{ position: 'relative', flex: 1, textAlign: 'center', padding: '10px 4px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', color: tab === 'promo' ? tabActive : tabIdle, zIndex: 1, transition: 'color .2s ease' }}>Promo</div>
              <div onClick={() => setTab('announcements')} style={{ position: 'relative', flex: 1, textAlign: 'center', padding: '10px 4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: tab === 'announcements' ? tabActive : tabIdle, zIndex: 1, transition: 'color .2s ease' }}>Announcements</div>
            </div>

            {/* New Menu tab */}
            {tab === 'newMenu' && (
              <div style={{ marginTop: '18px', animation: 'ufade .28s cubic-bezier(.22,1,.36,1)' }}>
                {loading && [0, 1, 2].map(i => <Skeleton key={i} />)}
                {!loading && newMenu.map((item, i) => (
                  <div key={i} onClick={item.open} style={{ marginTop: '14px', background: '#fff', border: '1px solid #EFE8DE', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer', display: 'flex', gap: 0, boxShadow: '0 8px 22px -20px rgba(59,42,34,.4)', transition: 'transform .14s ease' }}>
                    <div style={{ width: '92px', height: '92px', flex: 'none', background: item.tileBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.iconSmall}</div>
                    <div style={{ flex: 1, minWidth: 0, padding: '13px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ fontSize: '14.5px', fontWeight: 600, letterSpacing: '-.005em' }}>{item.name}</div>
                        <span style={{ fontSize: '9.5px', fontWeight: 600, letterSpacing: '.06em', color: '#5C7B5A', background: 'rgba(122,150,116,.14)', padding: '2px 8px', borderRadius: '999px', flex: 'none' }}>NEW</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#8A7A6E', marginTop: '4px', lineHeight: 1.4 }}>{item.desc}</div>
                      <div style={{ fontSize: '11px', color: '#A08A7B', marginTop: '6px' }}>Added {item.date}</div>
                    </div>
                  </div>
                ))}
                {!loading && newMenu.length === 0 && (
                  <div style={{ marginTop: '20px', textAlign: 'center', padding: '30px 20px', background: '#fff', border: '1px solid #EFE8DE', borderRadius: '20px' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#F1EBE1', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: '#C4B6A9' }}>◷</div>
                    <div style={{ fontSize: '14.5px', fontWeight: 600, marginTop: '14px' }}>No new items yet</div>
                    <div style={{ fontSize: '12.5px', lineHeight: 1.5, color: '#8A7A6E', marginTop: '5px' }}>Check back soon.</div>
                  </div>
                )}
              </div>
            )}

            {/* Promo tab */}
            {tab === 'promo' && (
              <div style={{ marginTop: '18px', animation: 'ufade .28s cubic-bezier(.22,1,.36,1)' }}>
                {loading && [0, 1].map(i => (
                  <div key={i} style={{ marginTop: '14px', background: '#fff', border: '1px solid #EFE8DE', borderRadius: '20px', padding: '16px' }}>
                    <div style={{ height: '16px', width: '55%', background: '#F1EBE1', borderRadius: '8px', animation: 'skpulse 1.4s ease-in-out infinite' }} />
                    <div style={{ height: '11px', width: '75%', background: '#F1EBE1', borderRadius: '8px', marginTop: '10px', animation: 'skpulse 1.4s ease-in-out infinite' }} />
                  </div>
                ))}
                {!loading && promos.map((item, i) => (
                  <div key={i} onClick={item.open} style={{ marginTop: '14px', background: '#fff', border: '1px solid #EFE8DE', borderRadius: '20px', padding: '16px', cursor: 'pointer', boxShadow: '0 8px 22px -20px rgba(59,42,34,.4)', transition: 'transform .14s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ fontSize: '15.5px', fontWeight: 600, letterSpacing: '-.01em' }}>{item.name}</div>
                      <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.02em', padding: '4px 10px', borderRadius: '999px', background: item.badgeBg, color: item.badgeColor, flex: 'none' }}>{item.badgeText}</span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#8A7A6E', marginTop: '6px', lineHeight: 1.5 }}>{item.desc}</div>
                    <div style={{ fontSize: '11.5px', color: '#A08A7B', marginTop: '9px' }}>{item.validity}</div>
                  </div>
                ))}
                {!loading && promos.length === 0 && (
                  <div style={{ marginTop: '20px', textAlign: 'center', padding: '30px 20px', background: '#fff', border: '1px solid #EFE8DE', borderRadius: '20px' }}>
                    <div style={{ fontSize: '14.5px', fontWeight: 600 }}>No promos right now</div>
                    <div style={{ fontSize: '12.5px', lineHeight: 1.5, color: '#8A7A6E', marginTop: '5px' }}>Check back soon.</div>
                  </div>
                )}
              </div>
            )}

            {/* Announcements tab */}
            {tab === 'announcements' && (
              <div style={{ marginTop: '18px', animation: 'ufade .28s cubic-bezier(.22,1,.36,1)' }}>
                {loading && [0, 1].map(i => (
                  <div key={i} style={{ marginTop: '14px', background: '#fff', border: '1px solid #EFE8DE', borderRadius: '20px', padding: '16px' }}>
                    <div style={{ height: '14px', width: '65%', background: '#F1EBE1', borderRadius: '8px', animation: 'skpulse 1.4s ease-in-out infinite' }} />
                    <div style={{ height: '11px', width: '80%', background: '#F1EBE1', borderRadius: '8px', marginTop: '10px', animation: 'skpulse 1.4s ease-in-out infinite' }} />
                  </div>
                ))}
                {!loading && announcements.map((item, i) => (
                  <div key={i} onClick={item.open} style={{ marginTop: '14px', background: '#fff', border: '1px solid #EFE8DE', borderRadius: '20px', padding: '16px', cursor: 'pointer', boxShadow: '0 8px 22px -20px rgba(59,42,34,.4)', transition: 'transform .14s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {item.pinned && (
                        <span style={{ fontSize: '9.5px', fontWeight: 600, letterSpacing: '.06em', color: '#A67C52', background: 'rgba(166,124,82,.14)', padding: '2px 8px', borderRadius: '999px', flex: 'none' }}>PINNED</span>
                      )}
                      <div style={{ fontSize: '14.5px', fontWeight: 600, letterSpacing: '-.005em' }}>{item.title}</div>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#8A7A6E', marginTop: '6px', lineHeight: 1.5 }}>{item.summary}</div>
                    <div style={{ fontSize: '11.5px', color: '#A08A7B', marginTop: '9px' }}>Posted {item.date}</div>
                  </div>
                ))}
                {!loading && announcements.length === 0 && (
                  <div style={{ marginTop: '20px', textAlign: 'center', padding: '30px 20px', background: '#fff', border: '1px solid #EFE8DE', borderRadius: '20px' }}>
                    <div style={{ fontSize: '14.5px', fontWeight: 600 }}>No announcements</div>
                    <div style={{ fontSize: '12.5px', lineHeight: 1.5, color: '#8A7A6E', marginTop: '5px' }}>Nothing to share right now.</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============ NEW MENU DETAIL ============ */}
        {view === 'newMenuDetail' && selItem && (
          <div style={{ paddingBottom: '60px' }}>
            <div style={{ position: 'relative', height: '230px', overflow: 'hidden' }}>
              <div style={{ width: '100%', height: '100%', background: selItem.tileBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{selItem.iconLarge}</div>
              <div onClick={() => setView('updates')} style={{ position: 'absolute', top: '14px', left: '16px', width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(252,251,248,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,42,34,.12)', fontSize: '18px' }}>←</div>
            </div>
            <div style={{ padding: '22px 22px 0' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.12em', color: '#A67C52' }}>{selItem.categoryUpper}</div>
              <div style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-.02em', marginTop: '8px' }}>{selItem.name}</div>
              <div style={{ fontSize: '12px', color: '#A08A7B', marginTop: '8px' }}>Added {selItem.date}</div>
              <div style={{ fontSize: '14px', lineHeight: 1.6, color: '#7A6A5F', marginTop: '14px' }}>{selItem.long}</div>
            </div>
          </div>
        )}

        {/* ============ PROMO DETAIL ============ */}
        {view === 'promoDetail' && selPromo && (
          <div style={{ padding: '8px 22px 60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div onClick={() => setView('updates')} style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px' }}>←</div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>Promo</div>
            </div>
            <div style={{ marginTop: '22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-.02em' }}>{selPromo.name}</div>
              <span style={{ fontSize: '10.5px', fontWeight: 600, padding: '5px 11px', borderRadius: '999px', background: selPromo.badgeBg, color: selPromo.badgeColor, flex: 'none' }}>{selPromo.badgeText}</span>
            </div>
            <div style={{ fontSize: '14px', lineHeight: 1.6, color: '#7A6A5F', marginTop: '12px' }}>{selPromo.long}</div>

            <div style={{ marginTop: '18px', background: '#F8F4EE', borderRadius: '14px', padding: '13px 15px', fontSize: '13px', fontWeight: 600, color: '#4A3830' }}>{selPromo.validity}</div>

            {selPromo.terms && selPromo.terms.filter((t: string) => t).length > 0 && (
              <div style={{ marginTop: '22px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.12em', color: '#A08A7B' }}>TERMS</div>
                {selPromo.terms.filter((t: string) => t).map((t: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '9px', marginTop: '9px' }}>
                    <span style={{ color: '#C4A57E', fontSize: '12.5px', lineHeight: 1.5 }}>•</span>
                    <span style={{ fontSize: '12.5px', lineHeight: 1.55, color: '#6A584E' }}>{t}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============ ANNOUNCEMENT DETAIL ============ */}
        {view === 'announcementDetail' && selAnnouncement && (
          <div style={{ padding: '8px 22px 60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div onClick={() => setView('updates')} style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px' }}>←</div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>Announcement</div>
            </div>
            {selAnnouncement.pinned && (
              <div style={{ marginTop: '20px', display: 'inline-block', fontSize: '9.5px', fontWeight: 600, letterSpacing: '.06em', color: '#A67C52', background: 'rgba(166,124,82,.14)', padding: '3px 9px', borderRadius: '999px' }}>PINNED</div>
            )}
            <div style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-.02em', marginTop: '12px' }}>{selAnnouncement.title}</div>
            <div style={{ fontSize: '12px', color: '#A08A7B', marginTop: '8px' }}>Posted {selAnnouncement.date} · {selAnnouncement.outlet}</div>
            <div style={{ fontSize: '14px', lineHeight: 1.65, color: '#7A6A5F', marginTop: '16px' }}>{selAnnouncement.long}</div>
          </div>
        )}
      </div>

      {view === 'updates' && <BottomNav />}
    </PhoneLayout>
  );
}
