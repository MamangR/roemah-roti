"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";

export function MemberUpdates() {
  const [subTab, setSubTab] = useState<"newMenu" | "promo" | "announcements">("newMenu");
  const [loading, setLoading] = useState(true);
  const [newMenu, setNewMenu] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    async function fetchUpdates() {
      setLoading(true);
      try {
        const [nm, pr, an] = await Promise.all([
          fetch("/api/updates?type=newMenu").then((res) => res.json()),
          fetch("/api/updates?type=promo").then((res) => res.json()),
          fetch("/api/updates?type=announcement").then((res) => res.json()),
        ]);
        setNewMenu(Array.isArray(nm) ? nm.filter(m => m.status === 'Published') : []);
        setPromos(Array.isArray(pr) ? pr.filter(p => p.promoStatus !== 'Berakhir') : []);
        setAnnouncements(Array.isArray(an) ? an : []);
      } catch (err) {
        console.error("Failed to load updates", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUpdates();
  }, []);

  function fmtDate(iso: string) {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div className="rp-screen active">
      <div className="rp-header">
        <div className="rp-section-label">Updates</div>
        <h2>Things worth knowing</h2>
        <p>New menu, promos, and announcements at Roemah Roti.</p>
      </div>

      <div style={{ display: 'flex', background: '#F8F4EE', padding: '4px', borderRadius: '12px', marginBottom: '20px' }}>
        <button
          onClick={() => setSubTab('newMenu')}
          style={{ flex: 1, padding: '8px', border: 'none', background: subTab === 'newMenu' ? '#ffffff' : 'transparent', borderRadius: '8px', fontSize: '13px', fontWeight: subTab === 'newMenu' ? 600 : 500, color: subTab === 'newMenu' ? '#3B2A22' : 'rgba(59,42,34,0.6)', cursor: 'pointer', boxShadow: subTab === 'newMenu' ? '0 2px 8px rgba(59,42,34,0.08)' : 'none', transition: 'all 0.2s' }}
        >
          New Menu
        </button>
        <button
          onClick={() => setSubTab('promo')}
          style={{ flex: 1, padding: '8px', border: 'none', background: subTab === 'promo' ? '#ffffff' : 'transparent', borderRadius: '8px', fontSize: '13px', fontWeight: subTab === 'promo' ? 600 : 500, color: subTab === 'promo' ? '#3B2A22' : 'rgba(59,42,34,0.6)', cursor: 'pointer', boxShadow: subTab === 'promo' ? '0 2px 8px rgba(59,42,34,0.08)' : 'none', transition: 'all 0.2s' }}
        >
          Promo
        </button>
        <button
          onClick={() => setSubTab('announcements')}
          style={{ flex: 1, padding: '8px', border: 'none', background: subTab === 'announcements' ? '#ffffff' : 'transparent', borderRadius: '8px', fontSize: '13px', fontWeight: subTab === 'announcements' ? 600 : 500, color: subTab === 'announcements' ? '#3B2A22' : 'rgba(59,42,34,0.6)', cursor: 'pointer', boxShadow: subTab === 'announcements' ? '0 2px 8px rgba(59,42,34,0.08)' : 'none', transition: 'all 0.2s' }}
        >
          Announcements
        </button>
      </div>

      {loading ? (
        <p className="rp-card-heading">Loading updates...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {subTab === 'newMenu' && newMenu.length === 0 && <p className="rp-card-heading">No new items yet.</p>}
          {subTab === 'newMenu' && newMenu.map((item) => (
            <div key={item.id} className="rp-info-card" style={{ position: 'relative', display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '16px' }}>
              {item.imageUrl && (
                <div style={{ width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#3B2A22', marginBottom: '4px', paddingRight: '50px' }}>{item.name}</div>
                <div style={{ fontSize: '12px', color: 'rgba(59,42,34,0.6)', marginBottom: '6px', lineHeight: 1.4 }}>{item.shortDesc}</div>
                <div style={{ fontSize: '11px', color: 'rgba(59,42,34,0.4)' }}>Added {fmtDate(item.dateAdded)}</div>
              </div>
              <span style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '9px', fontWeight: 600, letterSpacing: '0.06em', color: '#5C7B5A', background: 'rgba(122,150,116,0.14)', padding: '2px 6px', borderRadius: '999px' }}>NEW</span>
            </div>
          ))}

          {subTab === 'promo' && promos.length === 0 && <p className="rp-card-heading">No active promos.</p>}
          {subTab === 'promo' && promos.map((promo) => (
            <div key={promo.id} className="rp-info-card" style={{ position: 'relative', padding: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#3B2A22', marginBottom: '8px', paddingRight: '80px' }}>{promo.name}</div>
              <div style={{ fontSize: '12px', color: 'rgba(59,42,34,0.6)', marginBottom: '8px', lineHeight: 1.4 }}>{promo.shortDesc}</div>
              <div style={{ fontSize: '11px', color: 'rgba(59,42,34,0.4)' }}>Valid until {fmtDate(promo.endDate)}</div>
              <span style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '10px', fontWeight: 600, letterSpacing: '0.02em', background: promo.promoStatus === 'Aktif' ? 'rgba(122,150,116,0.14)' : '#F5EFE6', color: promo.promoStatus === 'Aktif' ? '#5C7B5A' : '#A08A7B', padding: '3px 8px', borderRadius: '999px' }}>
                {promo.promoStatus === 'Aktif' ? 'Active' : 'Ending soon'}
              </span>
            </div>
          ))}

          {subTab === 'announcements' && announcements.length === 0 && <p className="rp-card-heading">No announcements.</p>}
          {subTab === 'announcements' && announcements.map((announcement) => (
            <div key={announcement.id} className="rp-info-card" style={{ position: 'relative', padding: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#3B2A22', marginBottom: '6px', paddingRight: '65px' }}>{announcement.title}</div>
              <div style={{ fontSize: '12px', color: 'rgba(59,42,34,0.6)', marginBottom: '8px', lineHeight: 1.4 }}>{announcement.summary}</div>
              <div style={{ fontSize: '11px', color: 'rgba(59,42,34,0.4)' }}>Posted {fmtDate(announcement.datePosted)}</div>
              {announcement.pinned && (
                <span style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '9px', fontWeight: 600, letterSpacing: '0.06em', color: '#A67C52', background: 'rgba(166,124,82,0.14)', padding: '2px 6px', borderRadius: '999px' }}>PINNED</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
