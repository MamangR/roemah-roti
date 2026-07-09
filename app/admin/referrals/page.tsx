'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function fmtDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
function statusPill(status: string) {
  if (status === 'Approved') return { bg: 'rgba(122, 150, 116, 0.18)', color: '#5A6A54', label: 'Approved' };
  if (status === 'Rejected') return { bg: '#F1EBE1', color: '#7A6A5F', label: 'Rejected' };
  return { bg: 'rgba(166,124,82,.16)', color: '#A67C52', label: 'Pending' };
}
function statusDescription(status: string) {
  if (status === 'Approved') return 'Referral ini sudah disetujui. Reward sudah diberikan ke referrer.';
  if (status === 'Rejected') return 'Referral ini sudah ditolak. Tidak ada reward yang diberikan.';
  return 'Referral ini menunggu persetujuan staff sebelum reward dapat diberikan ke referrer.';
}

import { getReferralsAdmin, approveReferralAdmin, rejectReferralAdmin } from '../actions';

const Button = ({ variant, onClick, children, style }: any) => {
  const isPri = variant === 'primary';
  return (
    <div onClick={onClick} style={{ padding: '10px 16px', borderRadius: '14px', fontSize: '13px', fontWeight: 600, textAlign: 'center', cursor: 'pointer', background: isPri ? '#A67C52' : 'transparent', color: isPri ? '#fff' : '#3B2A22', border: isPri ? 'none' : '1px solid #E0D5C6', boxShadow: isPri ? '0 14px 26px -14px rgba(166, 124, 82, 0.9)' : 'none', ...style }}>
      {children}
    </div>
  );
};

const Input = ({ label, placeholder, value, onChange }: any) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    {label && <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: '#A08A7B', textTransform: 'uppercase' }}>{label}</div>}
    <input value={value} onChange={onChange} placeholder={placeholder} style={{ background: '#FFFFFF', border: '1px solid #E6DDD0', borderRadius: '14px', padding: '12px 14px', fontSize: '15px', color: '#3B2A22', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
  </div>
);

const SegmentedToggle = ({ options, value, onChange }: any) => (
  <div style={{ display: 'flex', background: '#F1EBE1', borderRadius: '14px', padding: '4px' }}>
    {options.map((o: any) => (
      <div key={o.value} onClick={() => onChange(o.value)} style={{ flex: 1, textAlign: 'center', padding: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: value === o.value ? '#fff' : 'transparent', borderRadius: '11px', color: value === o.value ? '#3B2A22' : '#A08A7B', boxShadow: value === o.value ? '0 4px 12px -4px rgba(59,42,34,.25)' : 'none' }}>
        {o.label}
      </div>
    ))}
  </div>
);

export default function ReferralManagementPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<'list' | 'detail' | 'history'>('list');
  const [referrals, setReferrals] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const refs = await getReferralsAdmin();
        setReferrals(refs);
        setHistory(refs.filter(r => r.status !== 'Pending').map(r => ({
          id: r.id + '_h',
          referralId: r.id,
          action: r.status,
          date: r.date,
          by: 'Admin',
          rewardName: r.rewardName,
          referrerName: r.referrerName,
          referredName: r.referredName
        })));
      } catch (err) { console.error(err); }
    }
    load();
  }, [screen]);
  
  const [listQuery, setListQuery] = useState('');
  const [listFilter, setListFilter] = useState('all');
  
  const [selectedReferralId, setSelectedReferralId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('referrer');
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  
  const [historyQuery, setHistoryQuery] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all');

  const enrich = (r: any) => {
    const p = statusPill(r.status);
    return {
      ...r,
      dateLabel: fmtDate(r.date),
      pillBg: p.bg, pillColor: p.color, statusLabel: p.label,
      statusDescription: statusDescription(r.status),
      referrer: { name: r.referrerName, memberId: r.referrerMemberId, wa: r.referrerWa, totalSuccess: '-', joinDateLabel: fmtDate(r.referrerJoinDate) },
      referred: {
        name: r.referredName,
        memberId: r.referredMemberId,
        registerDateLabel: fmtDate(r.referredRegisterDate),
        visitLabel: r.referredVisitDone ? 'Sudah visit pertama' : 'Belum visit pertama',
        visitPillBg: r.referredVisitDone ? 'rgba(122, 150, 116, 0.18)' : '#F1EBE1',
        visitPillColor: r.referredVisitDone ? '#5A6A54' : '#7A6A5F',
      }
    };
  };

  const qList = listQuery.trim().toLowerCase();
  const filteredReferrals = referrals
    .filter(r => listFilter === 'all' || r.status === listFilter)
    .map(enrich)
    .filter(r => !qList || r.referrerName.toLowerCase().includes(qList) || r.referredName.toLowerCase().includes(qList));

  const activeReferral = selectedReferralId ? enrich(referrals.find(r => r.id === selectedReferralId) || referrals[0]) : null;

  const hq = historyQuery.trim().toLowerCase();
  const filteredHistory = history
    .filter(h => historyFilter === 'all' || h.action === historyFilter)
    .map(h => {
      const p = statusPill(h.action);
      return { ...h, dateLabel: fmtDate(h.date), actionLabel: h.action, pillBg: p.bg, pillColor: p.color };
    })
    .filter(h => !hq || h.referrerName.toLowerCase().includes(hq) || h.referredName.toLowerCase().includes(hq));

  const navItemStyle = (isActive: boolean) => ({
    display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 12px', borderRadius: '12px', cursor: 'pointer',
    background: isActive ? 'rgba(166,124,82,.9)' : 'transparent', color: isActive ? '#2A1E18' : 'rgba(248, 244, 238, 0.72)'
  });

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#FCFBF8', fontFamily: "'Inter', sans-serif", color: '#3B2A22', boxSizing: 'border-box', overflow: 'hidden' }}>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(26,19,15,0.55)', backdropFilter: 'blur(2px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '260px', background: '#3B2A22', display: 'flex', flexDirection: 'column', padding: '26px 18px', boxSizing: 'border-box', boxShadow: '4px 0 40px rgba(0,0,0,0.4)' }}>
            <div onClick={() => router.push('/admin')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '11px', padding: '0 8px 26px', borderBottom: '1px solid rgba(248, 244, 238, 0.12)' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><span style={{ fontSize: '15px', fontWeight: 700, color: '#E9C9A6', letterSpacing: '-.02em' }}>RR</span></div>
              <div><div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.22em', color: 'rgba(248, 244, 238, 0.72)' }}>ROEMAH ROTI</div><div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(248, 244, 238, 0.92)', marginTop: '2px' }}>Dashboard</div></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '22px' }}>
              <div onClick={() => { setScreen('list'); setSidebarOpen(false); }} style={navItemStyle(screen === 'list')}><div style={{ width: '16px', height: '12px', flex: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}><span style={{ height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></span><span style={{ height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></span><span style={{ height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></span></div><span style={{ fontSize: '14px', fontWeight: 600 }}>Daftar Referral</span></div>
              <div onClick={() => { setScreen('history'); setSidebarOpen(false); }} style={navItemStyle(screen === 'history')}><div style={{ width: '16px', height: '16px', border: '1.6px solid currentColor', borderRadius: '50%', flex: 'none', position: 'relative' }}><div style={{ position: 'absolute', left: '7px', top: '3px', width: '1.4px', height: '5px', background: 'currentColor' }}></div><div style={{ position: 'absolute', left: '7px', top: '7.4px', width: '4px', height: '1.4px', background: 'currentColor' }}></div></div><span style={{ fontSize: '14px', fontWeight: 600 }}>Riwayat Referral</span></div>
            </div>
            <div style={{ flex: 1 }}></div>
            <div style={{ padding: '12px', fontSize: '11px', lineHeight: 1.5, color: 'rgba(248, 244, 238, 0.5)' }}>Alat Staf · Penggunaan Internal<br/>{referrals.length} referral tersimpan</div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar — hidden on mobile */}
      <div style={{ width: '250px', flex: 'none', background: '#3B2A22', display: 'flex', flexDirection: 'column', padding: '26px 18px', boxSizing: 'border-box' }} className="hidden md:flex">
        <div onClick={() => router.push('/admin')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '11px', padding: '0 8px 26px', borderBottom: '1px solid rgba(248, 244, 238, 0.12)' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#E9C9A6', letterSpacing: '-.02em' }}>RR</span>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.22em', color: 'rgba(248, 244, 238, 0.72)' }}>ROEMAH ROTI</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(248, 244, 238, 0.92)', marginTop: '2px' }}>Dashboard</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '22px' }}>
          <div onClick={() => setScreen('list')} style={navItemStyle(screen === 'list')}>
            <div style={{ width: '16px', height: '12px', flex: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span style={{ height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></span>
              <span style={{ height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></span>
              <span style={{ height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></span>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Daftar Referral</span>
          </div>
          
          {screen === 'detail' && (
            <>
              <div onClick={() => setActiveTab('referrer')} style={navItemStyle(activeTab === 'referrer')}>
                <div style={{ width: '16px', height: '16px', border: '1.6px solid currentColor', borderRadius: '50%', flex: 'none', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '3.2px', top: '8px', width: '9.6px', height: '5px', borderRadius: '5px 5px 0 0', border: '1.6px solid currentColor', borderBottom: 'none' }}></div>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Anggota Referrer</span>
              </div>
              <div onClick={() => setActiveTab('referred')} style={navItemStyle(activeTab === 'referred')}>
                <div style={{ width: '16px', height: '16px', border: '1.6px solid currentColor', borderRadius: '50%', flex: 'none', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '3.2px', top: '8px', width: '9.6px', height: '5px', borderRadius: '5px 5px 0 0', border: '1.6px solid currentColor', borderBottom: 'none' }}></div>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Anggota Direferensikan</span>
              </div>
              <div onClick={() => setActiveTab('status')} style={navItemStyle(activeTab === 'status')}>
                <div style={{ width: '16px', height: '16px', border: '1.6px solid currentColor', borderRadius: '4px', flex: 'none', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '4.5px', top: '4.5px', width: '7px', height: '7px', borderRadius: '50%', background: 'currentColor', opacity: 0.8 }}></div>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Status Referral</span>
              </div>
              <div onClick={() => setActiveTab('approve')} style={navItemStyle(activeTab === 'approve')}>
                <div style={{ width: '16px', height: '16px', border: '1.6px solid currentColor', borderRadius: '4px', flex: 'none', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '3.4px', top: '5.5px', width: '9px', height: '5px', borderLeft: '1.6px solid currentColor', borderBottom: '1.6px solid currentColor', transform: 'rotate(-45deg)' }}></div>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Setujui Reward</span>
              </div>
            </>
          )}

          <div onClick={() => setScreen('history')} style={navItemStyle(screen === 'history')}>
            <div style={{ width: '16px', height: '16px', border: '1.6px solid currentColor', borderRadius: '50%', flex: 'none', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '7px', top: '3px', width: '1.4px', height: '5px', background: 'currentColor' }}></div>
              <div style={{ position: 'absolute', left: '7px', top: '7.4px', width: '4px', height: '1.4px', background: 'currentColor' }}></div>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Riwayat Referral</span>
          </div>
        </div>

        <div style={{ flex: 1 }}></div>
        <div style={{ padding: '12px', fontSize: '11px', lineHeight: 1.5, color: 'rgba(248, 244, 238, 0.5)' }}>Alat Staf · Penggunaan Internal<br/>{referrals.length} referral tersimpan</div>
      </div>

      {/* Main content with mobile top bar */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="flex md:hidden" style={{ background: '#3B2A22', padding: '14px 16px', alignItems: 'center', gap: '12px', flex: 'none' }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'rgba(255,255,255,.08)', border: 'none', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer', flex: 'none' }}>
            <span style={{ width: '14px', height: '1.6px', background: '#E9C9A6', borderRadius: '1px', display: 'block' }} />
            <span style={{ width: '14px', height: '1.6px', background: '#E9C9A6', borderRadius: '1px', display: 'block' }} />
            <span style={{ width: '14px', height: '1.6px', background: '#E9C9A6', borderRadius: '1px', display: 'block' }} />
          </button>
          <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '.22em', color: 'rgba(248,244,238,.55)', textTransform: 'uppercase' }}>ROEMAH ROTI</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(248,244,238,.92)', marginLeft: '2px' }}>Manajemen Referral</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', boxSizing: 'border-box' }}>
        
        {screen === 'list' && (
          <div style={{ padding: '52px 40px 60px' }}>
            <div style={{ fontSize: '27px', fontWeight: 600, letterSpacing: '-0.03em', color: '#3B2A22' }}>Daftar Referral</div>
            <div style={{ fontSize: '15px', color: '#7A6A5F', marginTop: '6px' }}>{filteredReferrals.length} dari {referrals.length} referral</div>

            <div style={{ marginTop: '22px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ width: '320px' }}>
                <Input label="CARI" placeholder="Cari nama referrer atau referred" value={listQuery} onChange={(e: any) => setListQuery(e.target.value)} />
              </div>
              <div style={{ width: '360px' }}>
                <SegmentedToggle options={[{ value: 'all', label: 'Semua' }, { value: 'Pending', label: 'Menunggu' }, { value: 'Approved', label: 'Disetujui' }, { value: 'Rejected', label: 'Ditolak' }]} value={listFilter} onChange={setListFilter} />
              </div>
            </div>

            <div style={{ marginTop: '22px', background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)', overflow: 'hidden' }}>
              <div className="text-responsive-heading" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.3fr .9fr .8fr 1.2fr', gap: '10px', padding: '14px 20px', background: '#F8F4EE', fontWeight: 600, letterSpacing: '.08em', color: '#A08A7B', textTransform: 'uppercase' }}>
                <div>Referrer</div><div>Referred</div><div>Tanggal</div><div>Status</div><div>Reward</div>
              </div>
              {filteredReferrals.map((r: any) => (
                <div key={r.id} className="text-responsive-row" onClick={() => { setSelectedReferralId(r.id); setActiveTab('referrer'); setScreen('detail'); }} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.3fr .9fr .8fr 1.2fr', gap: '10px', padding: '15px 20px', cursor: 'pointer', borderTop: '1px solid #EAE1D5', alignItems: 'center', color: '#4A3830' }}>
                  <div style={{ fontWeight: 600, color: '#3B2A22' }}>{r.referrerName}</div>
                  <div>{r.referredName}</div>
                  <div style={{ color: '#7A6A5F', fontVariantNumeric: 'tabular-nums' }}>{r.dateLabel}</div>
                  <div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: r.pillBg, color: r.pillColor, fontSize: '11px', fontWeight: 600, padding: '4px 9px', borderRadius: '999px' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: r.pillColor }}></span>{r.statusLabel}
                    </span>
                  </div>
                  <div style={{ color: '#7A6A5F' }}>{r.rewardName}</div>
                </div>
              ))}
              {filteredReferrals.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#7A6A5F', fontSize: '14px', borderTop: '1px solid #EAE1D5' }}>Tidak ada referral yang cocok.</div>}
            </div>
          </div>
        )}

        {screen === 'detail' && activeReferral && (
          <div style={{ maxWidth: '760px', margin: '0 auto', padding: '52px 40px 60px' }}>
            <div onClick={() => setScreen('list')} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', cursor: 'pointer', color: '#7A6A5F', fontSize: '13px', fontWeight: 600, marginBottom: '20px' }}>
              <span style={{ fontSize: '15px' }}>←</span>Kembali ke Daftar Referral
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '27px', fontWeight: 600, letterSpacing: '-0.03em', color: '#3B2A22' }}>{activeReferral.referrerName} → {activeReferral.referredName}</div>
                <div style={{ fontSize: '15px', color: '#7A6A5F', marginTop: '6px' }}>Referral tanggal {activeReferral.dateLabel} · {activeReferral.rewardName}</div>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: activeReferral.pillBg, color: activeReferral.pillColor, fontSize: '12px', fontWeight: 600, padding: '6px 12px', borderRadius: '999px', flex: 'none' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: activeReferral.pillColor }}></span>{activeReferral.statusLabel}
              </span>
            </div>

            <div style={{ marginTop: '24px', maxWidth: '520px' }}>
              <SegmentedToggle options={[
                { value: 'referrer', label: 'Referrer' },
                { value: 'referred', label: 'Direferensikan' },
                { value: 'status', label: 'Status' },
                { value: 'approve', label: 'Persetujuan' }
              ]} value={activeTab} onChange={setActiveTab} />
            </div>

            {activeTab === 'referrer' && (
              <div style={{ marginTop: '22px', background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', padding: '22px', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)' }}>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#3B2A22' }}>{activeReferral.referrer.name}</div>
                <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                  <div><div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', textTransform: 'uppercase' }}>MEMBER ID</div><div style={{ fontSize: '14px', color: '#4A3830', marginTop: '5px', fontVariantNumeric: 'tabular-nums' }}>{activeReferral.referrer.memberId}</div></div>
                  <div><div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', textTransform: 'uppercase' }}>NOMOR WHATSAPP</div><div style={{ fontSize: '14px', color: '#4A3830', marginTop: '5px', fontVariantNumeric: 'tabular-nums' }}>{activeReferral.referrer.wa}</div></div>
                  <div><div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', textTransform: 'uppercase' }}>TOTAL REFERRAL SUKSES</div><div style={{ fontSize: '14px', color: '#4A3830', marginTop: '5px', fontVariantNumeric: 'tabular-nums' }}>{activeReferral.referrer.totalSuccess}</div></div>
                  <div><div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', textTransform: 'uppercase' }}>TANGGAL JOIN</div><div style={{ fontSize: '14px', color: '#4A3830', marginTop: '5px', fontVariantNumeric: 'tabular-nums' }}>{activeReferral.referrer.joinDateLabel}</div></div>
                </div>
              </div>
            )}

            {activeTab === 'referred' && (
              <div style={{ marginTop: '22px', background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', padding: '22px', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)' }}>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#3B2A22' }}>{activeReferral.referred.name}</div>
                <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                  <div><div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', textTransform: 'uppercase' }}>MEMBER ID</div><div style={{ fontSize: '14px', color: '#4A3830', marginTop: '5px', fontVariantNumeric: 'tabular-nums' }}>{activeReferral.referred.memberId}</div></div>
                  <div><div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', textTransform: 'uppercase' }}>TANGGAL DAFTAR</div><div style={{ fontSize: '14px', color: '#4A3830', marginTop: '5px', fontVariantNumeric: 'tabular-nums' }}>{activeReferral.referred.registerDateLabel}</div></div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', textTransform: 'uppercase' }}>KUNJUNGAN PERTAMA</div>
                    <div style={{ marginTop: '6px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: activeReferral.referred.visitPillBg, color: activeReferral.referred.visitPillColor, fontSize: '11px', fontWeight: 600, padding: '4px 9px', borderRadius: '999px' }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: activeReferral.referred.visitPillColor }}></span>{activeReferral.referred.visitLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'status' && (
              <div style={{ marginTop: '22px', background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', padding: '22px', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: activeReferral.pillBg, color: activeReferral.pillColor, fontSize: '13px', fontWeight: 600, padding: '7px 14px', borderRadius: '999px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: activeReferral.pillColor }}></span>{activeReferral.statusLabel}
                  </span>
                </div>
                <div style={{ fontSize: '13.5px', lineHeight: 1.6, color: '#7A6A5F' }}>{activeReferral.statusDescription}</div>
              </div>
            )}

            {activeTab === 'approve' && (
              <div style={{ marginTop: '22px', background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', padding: '22px', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {activeReferral.status === 'Pending' && (
                  <>
                    {!approveConfirmOpen && !rejectConfirmOpen && (
                      <>
                        <div style={{ fontSize: '13.5px', lineHeight: 1.6, color: '#7A6A5F' }}>Referral ini menunggu persetujuan. Reward: {activeReferral.rewardName}, untuk {activeReferral.referrerName}.</div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ flex: 1 }}><Button variant="outline" onClick={() => setRejectConfirmOpen(true)}>Reject</Button></div>
                          <div style={{ flex: 1 }}><Button variant="primary" onClick={() => setApproveConfirmOpen(true)}>Approve</Button></div>
                        </div>
                      </>
                    )}
                    {approveConfirmOpen && (
                      <>
                        <div style={{ fontSize: '14.5px', lineHeight: 1.6, color: '#3B2A22' }}>Reward “{activeReferral.rewardName}” akan diberikan ke {activeReferral.referrerName}. Lanjutkan?</div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ flex: 1 }}><Button variant="outline" onClick={() => setApproveConfirmOpen(false)}>Batal</Button></div>
                          <div style={{ flex: 1 }}><Button variant="primary" onClick={async () => {
                            await approveReferralAdmin(activeReferral.id);
                            setScreen('list');
                            setApproveConfirmOpen(false);
                          }}>Konfirmasi Approve</Button></div>
                        </div>
                      </>
                    )}
                    {rejectConfirmOpen && (
                      <>
                        <div style={{ fontSize: '14.5px', lineHeight: 1.6, color: '#3B2A22' }}>Referral dari {activeReferral.referrerName} akan ditolak, reward tidak diberikan. Lanjutkan?</div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ flex: 1 }}><Button variant="outline" onClick={() => setRejectConfirmOpen(false)}>Batal</Button></div>
                          <div style={{ flex: 1 }}><Button variant="primary" onClick={async () => {
                            await rejectReferralAdmin(activeReferral.id);
                            setScreen('list');
                            setRejectConfirmOpen(false);
                          }}>Konfirmasi Tolak</Button></div>
                        </div>
                      </>
                    )}
                  </>
                )}
                {activeReferral.status === 'Approved' && (
                  <div style={{ padding: '16px', background: '#F8F4EE', borderRadius: '14px', border: '1px solid #EAE1D5', fontSize: '13.5px', lineHeight: 1.5, color: '#3B2A22' }}>
                    Reward “{activeReferral.rewardName}” sudah diberikan ke {activeReferral.referrerName}. Lihat detailnya di Referral History.
                  </div>
                )}
                {activeReferral.status === 'Rejected' && (
                  <div style={{ fontSize: '13.5px', lineHeight: 1.6, color: '#7A6A5F' }}>Referral ini sudah ditolak. Tidak ada reward yang diberikan.</div>
                )}
              </div>
            )}
          </div>
        )}

        {screen === 'history' && (
          <div style={{ padding: '52px 40px 60px' }}>
            <div style={{ fontSize: '27px', fontWeight: 600, letterSpacing: '-0.03em', color: '#3B2A22' }}>Referral History</div>
            <div style={{ fontSize: '15px', color: '#7A6A5F', marginTop: '6px' }}>{filteredHistory.length} riwayat ditemukan</div>

            <div style={{ marginTop: '22px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ width: '320px' }}>
                <Input label="CARI" placeholder="Cari nama referrer" value={historyQuery} onChange={(e: any) => setHistoryQuery(e.target.value)} />
              </div>
              <div style={{ width: '320px' }}>
                <SegmentedToggle options={[{ value: 'all', label: 'Semua' }, { value: 'Approved', label: 'Approved' }, { value: 'Rejected', label: 'Rejected' }]} value={historyFilter} onChange={setHistoryFilter} />
              </div>
            </div>

            <div style={{ marginTop: '22px', background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr .8fr 1.4fr 1fr 1fr', gap: '10px', padding: '14px 20px', background: '#F8F4EE', fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', color: '#A08A7B', textTransform: 'uppercase' }}>
                <div>Referral</div><div>Aksi</div><div>Reward</div><div>Tanggal</div><div>Oleh</div>
              </div>
              {filteredHistory.map((h: any) => (
                <div key={h.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr .8fr 1.4fr 1fr 1fr', gap: '10px', padding: '15px 20px', borderTop: '1px solid #EAE1D5', alignItems: 'center', fontSize: '13.5px', color: '#4A3830' }}>
                  <div style={{ fontWeight: 600, color: '#3B2A22' }}>{h.referrerName} → {h.referredName}</div>
                  <div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: h.pillBg, color: h.pillColor, fontSize: '11px', fontWeight: 600, padding: '4px 9px', borderRadius: '999px' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: h.pillColor }}></span>{h.actionLabel}
                    </span>
                  </div>
                  <div style={{ color: '#7A6A5F' }}>{h.rewardName}</div>
                  <div style={{ color: '#7A6A5F', fontVariantNumeric: 'tabular-nums' }}>{h.dateLabel}</div>
                  <div style={{ color: '#7A6A5F' }}>{h.by}</div>
                </div>
              ))}
              {filteredHistory.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#7A6A5F', fontSize: '14px', borderTop: '1px solid #EAE1D5' }}>Tidak ada riwayat yang cocok.</div>}
            </div>
          </div>
        )}

      </div>{/* close overflowY:auto */}
      </div>{/* close flex flex-col main wrapper */}
    </div>
  );
}
