'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const GOAL = 10;
const REWARD = 'Free Original Saltbread';

function fmtRupiah(n: number) { return 'Rp' + n.toLocaleString('id-ID'); }
function fmtDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0].toUpperCase()).join('');
}
function pillStyle(status: string) {
  if (status === 'Active') return { bg: 'rgba(122, 150, 116, 0.18)', color: '#5A6A54' };
  if (status === 'Suspended') return { bg: 'rgba(166,124,82,.16)', color: '#3B2A22' };
  return { bg: '#F1EBE1', color: '#7A6A5F' }; // Archived
}
function normalizeDigits(s: string) { return (s || '').replace(/\D/g, ''); }

const tx = (date: string, invoice: string, total: number, visitEarned: number) => ({ date, invoice, total, visitEarned });

import { getMembers, saveMember, createMemberAdmin } from '../actions';

function StatusPill({ bg, color, label }: { bg: string, color: string, label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, padding: '5px 11px', borderRadius: '999px', background: bg, color }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }}></span>
      {label}
    </span>
  );
}

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
    <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: '#A08A7B', textTransform: 'uppercase' }}>{label}</div>
    <input value={value} onChange={onChange} placeholder={placeholder} style={{ background: '#FFFFFF', border: '1px solid #E6DDD0', borderRadius: '14px', padding: '12px 14px', fontSize: '15px', color: '#3B2A22', outline: 'none' }} />
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

const VisitProgressCard = ({ visits, goal, reward }: any) => (
  <div style={{ background: '#3B2A22', borderRadius: '22px', padding: '20px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
    <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(248, 244, 238, 0.72)', textTransform: 'uppercase' }}>Progress</div>
    <div style={{ fontSize: '27px', fontWeight: 600, letterSpacing: '-0.03em', color: 'rgba(248, 244, 238, 0.92)', marginTop: '4px' }}>{visits} / {goal}</div>
    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
      {Array.from({ length: goal }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: '8px', borderRadius: '4px', background: i < visits ? '#A67C52' : 'rgba(248, 244, 238, 0.12)' }}></div>
      ))}
    </div>
  </div>
);


export default function MemberManagementPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<'list' | 'search' | 'detail' | 'edit'>('list');
  const [members, setMembers] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function fetchM() {
      try {
        const data = await getMembers();
        setMembers(data);
      } catch(e) { console.error(e); }
    }
    fetchM();
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [listFilter, setListFilter] = useState('all');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cameFrom, setCameFrom] = useState<'list' | 'search'>('list');
  
  const [draft, setDraft] = useState<any>(null);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', wa: '' });
  const [addMemberError, setAddMemberError] = useState('');

  const buildDisplayMember = (m: any, onClick: any) => {
    const p = pillStyle(m.status);
    const statusLabel = m.status === 'Active' ? 'Aktif' : (m.status === 'Suspended' ? 'Ditangguhkan' : 'Diarsipkan');
    return {
      ...m, goal: GOAL, reward: REWARD, initials: initials(m.name), pillBg: p.bg, pillColor: p.color,
      statusLabel,
      spendingLabel: fmtRupiah(m.spending), joinDateLabel: fmtDate(m.joinDate), lastActivityLabel: fmtDate(m.lastActivity),
      rewardStatusLabel: m.visits >= GOAL ? `Siap ditukar — ${REWARD}` : `${GOAL - m.visits} kunjungan lagi menuju ${REWARD}`,
      onClick
    };
  };

  const openMemberFrom = (id: string, from: 'list' | 'search') => { setScreen('detail'); setSelectedId(id); setCameFrom(from); };
  
  const q = searchQuery.trim().toLowerCase();
  const qDigits = normalizeDigits(searchQuery);
  const searchResults = q ? members.filter(m => m.memberId.toLowerCase().includes(q) || (qDigits && normalizeDigits(m.wa).includes(qDigits)))
                                   .map(m => buildDisplayMember(m, () => openMemberFrom(m.id, 'search'))) : [];

  const filtered = members.filter(m => listFilter === 'all' || m.status === listFilter);
  const dir = sortDir === 'asc' ? 1 : -1;
  const sortedMembers = [...filtered].sort((a: any, b: any) => {
    if (sortKey === 'name') return a.name.localeCompare(b.name) * dir;
    if (typeof a[sortKey] === 'string') return a[sortKey].localeCompare(b[sortKey]) * dir;
    return (a[sortKey] - b[sortKey]) * dir;
  }).map(m => buildDisplayMember(m, () => openMemberFrom(m.id, 'list')));

  const selM = members.find(m => m.id === selectedId);
  const selectedMember = selM ? buildDisplayMember(selM, null) : null;
  const selectedMemberTransactions = selM ? (selM.transactions || []).map((t: any) => ({ ...t, dateLabel: fmtDate(t.date), totalLabel: fmtRupiah(t.total) })) : [];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#FCFBF8', fontFamily: "'Inter', sans-serif", color: '#3B2A22', boxSizing: 'border-box', overflow: 'hidden' }}>

      {/* Mobile sidebar drawer overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(26,19,15,0.55)', backdropFilter: 'blur(2px)' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '260px', background: '#3B2A22', display: 'flex', flexDirection: 'column', padding: '26px 18px', boxSizing: 'border-box', boxShadow: '4px 0 40px rgba(0,0,0,0.4)' }}
          >
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
              <div onClick={() => { setScreen('search'); setSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 12px', borderRadius: '12px', cursor: 'pointer', background: screen === 'search' ? 'rgba(166,124,82,.9)' : 'transparent', color: screen === 'search' ? '#2A1E18' : 'rgba(248, 244, 238, 0.72)' }}>
                <div style={{ width: '16px', height: '16px', border: '1.6px solid currentColor', borderRadius: '50%', flex: 'none', position: 'relative' }}>
                  <div style={{ position: 'absolute', width: '6px', height: '1.6px', background: 'currentColor', transform: 'rotate(45deg)', right: '-4px', bottom: '1px' }}></div>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Cari Anggota</span>
              </div>
              <div onClick={() => { setScreen('list'); setSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 12px', borderRadius: '12px', cursor: 'pointer', background: screen === 'list' || screen === 'detail' || screen === 'edit' ? 'rgba(166,124,82,.9)' : 'transparent', color: screen === 'list' || screen === 'detail' || screen === 'edit' ? '#2A1E18' : 'rgba(248, 244, 238, 0.72)' }}>
                <div style={{ width: '16px', height: '12px', flex: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <span style={{ height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></span>
                  <span style={{ height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></span>
                  <span style={{ height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></span>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Daftar Anggota</span>
              </div>
            </div>
            <div style={{ flex: 1 }}></div>
            <div style={{ padding: '12px', fontSize: '11px', lineHeight: 1.5, color: 'rgba(248, 244, 238, 0.5)' }}>Alat Staf · Penggunaan Internal<br/>{members.length} anggota terdaftar</div>
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
          <div onClick={() => setScreen('search')} style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 12px', borderRadius: '12px', cursor: 'pointer', background: screen === 'search' ? 'rgba(166,124,82,.9)' : 'transparent', color: screen === 'search' ? '#2A1E18' : 'rgba(248, 244, 238, 0.72)' }}>
            <div style={{ width: '16px', height: '16px', border: '1.6px solid currentColor', borderRadius: '50%', flex: 'none', position: 'relative' }}>
              <div style={{ position: 'absolute', width: '6px', height: '1.6px', background: 'currentColor', transform: 'rotate(45deg)', right: '-4px', bottom: '1px' }}></div>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Cari Anggota</span>
          </div>
          <div onClick={() => setScreen('list')} style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 12px', borderRadius: '12px', cursor: 'pointer', background: screen === 'list' || screen === 'detail' || screen === 'edit' ? 'rgba(166,124,82,.9)' : 'transparent', color: screen === 'list' || screen === 'detail' || screen === 'edit' ? '#2A1E18' : 'rgba(248, 244, 238, 0.72)' }}>
            <div style={{ width: '16px', height: '12px', flex: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span style={{ height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></span>
              <span style={{ height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></span>
              <span style={{ height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></span>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Daftar Anggota</span>
          </div>
        </div>
        <div style={{ flex: 1 }}></div>
        <div style={{ padding: '12px', fontSize: '11px', lineHeight: 1.5, color: 'rgba(248, 244, 238, 0.5)' }}>Alat Staf · Penggunaan Internal<br/>{members.length} anggota terdaftar</div>
      </div>

      {/* Main content area with mobile top bar */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Mobile top bar */}
        <div className="flex md:hidden" style={{ background: '#3B2A22', padding: '14px 16px', alignItems: 'center', gap: '12px', flex: 'none' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'rgba(255,255,255,.08)', border: 'none', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer', flex: 'none' }}
          >
            <span style={{ width: '14px', height: '1.6px', background: '#E9C9A6', borderRadius: '1px', display: 'block' }} />
            <span style={{ width: '14px', height: '1.6px', background: '#E9C9A6', borderRadius: '1px', display: 'block' }} />
            <span style={{ width: '14px', height: '1.6px', background: '#E9C9A6', borderRadius: '1px', display: 'block' }} />
          </button>
          <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '.22em', color: 'rgba(248,244,238,.55)', textTransform: 'uppercase' }}>ROEMAH ROTI</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(248,244,238,.92)', marginLeft: '2px' }}>Manajemen Anggota</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', boxSizing: 'border-box' }}>
        
        {screen === 'search' && (
          <div style={{ maxWidth: '760px', margin: '0 auto', padding: '52px 40px 60px' }}>
            <div style={{ fontSize: '27px', fontWeight: 600, letterSpacing: '-0.03em', color: '#3B2A22' }}>Cari Anggota</div>
            <div style={{ fontSize: '15px', color: '#7A6A5F', marginTop: '6px' }}>Cari berdasarkan Nomor WhatsApp atau ID Anggota.</div>
            <div style={{ marginTop: '26px' }}>
              <Input label="NOMOR WHATSAPP ATAU ID ANGGOTA" placeholder="Contoh: 0812-3456-7801 atau RR-01042" value={searchQuery} onChange={(e: any) => setSearchQuery(e.target.value)} />
            </div>
            {q.length > 0 ? (
              <div style={{ marginTop: '22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', color: '#A08A7B', textTransform: 'uppercase', marginBottom: '2px' }}>{searchResults.length} hasil ditemukan</div>
                {searchResults.map(m => (
                  <div key={m.id} onClick={m.onClick} style={{ display: 'flex', alignItems: 'center', gap: '18px', background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', padding: '16px 18px', cursor: 'pointer', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#F8F4EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: '#A67C52', flex: 'none' }}>{m.initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#3B2A22' }}>{m.name}</div>
                      <div style={{ fontSize: '13px', color: '#7A6A5F', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>{m.memberId} · {m.wa}</div>
                    </div>
                    <StatusPill bg={m.pillBg} color={m.pillColor} label={m.statusLabel} />
                  </div>
                ))}
                {searchResults.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7A6A5F', fontSize: '14px' }}>Tidak ada anggota yang cocok dengan “{searchQuery}”.</div>}
              </div>
            ) : (
              <div style={{ marginTop: '40px', textAlign: 'center', padding: '48px 30px', background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)' }}>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#3B2A22' }}>Ketik nomor WhatsApp atau ID Anggota untuk mulai mencari</div>
                <div style={{ fontSize: '14px', color: '#7A6A5F', marginTop: '8px', lineHeight: 1.6 }}>Atau lihat semua anggota yang terdaftar di Daftar Anggota.</div>
                <div style={{ marginTop: '22px', display: 'flex', justifyContent: 'center' }}><Button variant="outline" onClick={() => setScreen('list')} style={{ padding: '14px 26px' }}>Buka Daftar Anggota</Button></div>
              </div>
            )}
          </div>
        )}

        {screen === 'list' && (
          <div style={{ padding: '52px 40px 60px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '27px', fontWeight: 600, letterSpacing: '-0.03em', color: '#3B2A22' }}>Daftar Anggota</div>
                <div style={{ fontSize: '15px', color: '#7A6A5F', marginTop: '6px' }}>{sortedMembers.length} dari {members.length} anggota</div>
              </div>
              <div style={{ display: 'flex', gap: '10px', width: '100%', flex: '1 1 auto', justifyContent: 'flex-start' }}>
                <div style={{ flex: '1 1 50%', maxWidth: '220px' }}><Button variant="outline" onClick={() => setScreen('search')} style={{ width: '100%', paddingLeft: '6px', paddingRight: '6px' }}>Cari Anggota</Button></div>
                <div style={{ flex: '1 1 50%', maxWidth: '180px' }}><Button variant="primary" onClick={() => setAddMemberOpen(true)} style={{ width: '100%', paddingLeft: '6px', paddingRight: '6px' }}>+ Tambah Anggota</Button></div>
              </div>
            </div>
            <div style={{ marginTop: '22px', maxWidth: '520px' }}>
              <SegmentedToggle options={[{ value: 'all', label: 'Semua' }, { value: 'Active', label: 'Aktif' }, { value: 'Suspended', label: 'Ditangguhkan' }, { value: 'Archived', label: 'Diarsipkan' }]} value={listFilter} onChange={setListFilter} />
            </div>
            <div style={{ marginTop: '22px', background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.3fr .9fr .7fr 1fr 1fr 1fr', gap: '10px', padding: '14px 20px', background: '#F8F4EE', fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', color: '#A08A7B', textTransform: 'uppercase' }}>
                <div style={{ cursor: 'pointer' }} onClick={() => { setSortKey('name'); setSortDir(sortDir==='asc'?'desc':'asc')}}>Nama</div>
                <div>ID Anggota</div><div>No. WhatsApp</div><div>Status</div>
                <div style={{ cursor: 'pointer' }} onClick={() => { setSortKey('visits'); setSortDir(sortDir==='asc'?'desc':'asc')}}>Visit</div>
                <div style={{ cursor: 'pointer' }} onClick={() => { setSortKey('spending'); setSortDir(sortDir==='asc'?'desc':'asc')}}>Belanja</div>
                <div>Aktivitas Terakhir</div><div>Bergabung</div>
              </div>
              {sortedMembers.map(m => (
                <div key={m.id} onClick={m.onClick} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.3fr .9fr .7fr 1fr 1fr 1fr', gap: '10px', padding: '15px 20px', cursor: 'pointer', borderTop: '1px solid #EAE1D5', alignItems: 'center', fontSize: '13px', color: '#4A3830' }}>
                  <div style={{ fontWeight: 600, color: '#3B2A22' }}>{m.name}</div>
                  <div style={{ fontVariantNumeric: 'tabular-nums', color: '#7A6A5F' }}>{m.memberId}</div>
                  <div style={{ fontVariantNumeric: 'tabular-nums', color: '#7A6A5F' }}>{m.wa}</div>
                  <div><StatusPill bg={m.pillBg} color={m.pillColor} label={m.statusLabel} /></div>
                  <div style={{ fontVariantNumeric: 'tabular-nums' }}>{m.visits}/{m.goal}</div>
                  <div style={{ fontVariantNumeric: 'tabular-nums' }}>{m.spendingLabel}</div>
                  <div style={{ color: '#7A6A5F' }}>{m.lastActivityLabel}</div>
                  <div style={{ color: '#7A6A5F', fontVariantNumeric: 'tabular-nums' }}>{m.joinDateLabel}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {screen === 'detail' && (
          <div style={{ maxWidth: '920px', margin: '0 auto', padding: '52px 40px 60px' }}>
            <div onClick={() => setScreen(cameFrom)} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', cursor: 'pointer', color: '#7A6A5F', fontSize: '13px', fontWeight: 600, marginBottom: '20px' }}>
              <span style={{ fontSize: '15px' }}>←</span> Kembali ke {cameFrom === 'search' ? 'hasil pencarian' : 'Daftar Member'}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '58px', height: '58px', borderRadius: '50%', background: '#F8F4EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '19px', fontWeight: 600, color: '#A67C52', flex: 'none' }}>{selectedMember.initials}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '27px', fontWeight: 600, letterSpacing: '-0.03em', color: '#3B2A22' }}>{selectedMember.name}</div>
                    <StatusPill bg={selectedMember.pillBg} color={selectedMember.pillColor} label={selectedMember.statusLabel} />
                  </div>
                  <div style={{ fontSize: '13.5px', color: '#7A6A5F', marginTop: '5px', fontVariantNumeric: 'tabular-nums' }}>{selectedMember.memberId} · {selectedMember.wa}</div>
                </div>
              </div>
              <div style={{ width: '140px' }}><Button variant="primary" onClick={() => { setDraft({ ...selectedMember, goal: GOAL }); setScreen('edit'); }}>Edit</Button></div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '18px', marginTop: '26px', alignItems: 'start' }}>
              <VisitProgressCard visits={selectedMember!.visits} goal={selectedMember!.goal} reward={selectedMember!.reward} />
              <div style={{ background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', padding: '20px', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', textTransform: 'uppercase' }}>Reward Status</div>
                  <div style={{ fontSize: '14.5px', fontWeight: 600, color: '#3B2A22', marginTop: '4px' }}>{selectedMember!.rewardStatusLabel}</div>
                </div>
                <div style={{ height: '1px', background: '#EAE1D5' }}></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', textTransform: 'uppercase' }}>Total Belanja</div>
                    <div style={{ fontSize: '14.5px', fontWeight: 600, color: '#3B2A22', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>{selectedMember!.spendingLabel}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', textTransform: 'uppercase' }}>Aktivitas Terakhir</div>
                    <div style={{ fontSize: '14.5px', fontWeight: 600, color: '#3B2A22', marginTop: '4px' }}>{selectedMember!.lastActivityLabel}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', textTransform: 'uppercase' }}>Tanggal Bergabung</div>
                    <div style={{ fontSize: '14.5px', fontWeight: 600, color: '#3B2A22', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>{selectedMember!.joinDateLabel}</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '26px' }}>
              <div style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.02em', color: '#3B2A22', marginBottom: '12px' }}>Riwayat Transaksi</div>
              <div style={{ background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr 1fr', gap: '10px', padding: '13px 20px', background: '#F8F4EE', fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', color: '#A08A7B', textTransform: 'uppercase' }}>
                  <div>Tanggal</div><div>Invoice</div><div>Total Belanja</div><div>Visit Earned</div>
                </div>
                {selectedMemberTransactions.map((t: any, i: number) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr 1fr', gap: '10px', padding: '14px 20px', borderTop: '1px solid #EAE1D5', fontSize: '13.5px', color: '#4A3830' }}>
                    <div style={{ fontVariantNumeric: 'tabular-nums' }}>{t.dateLabel}</div>
                    <div style={{ fontVariantNumeric: 'tabular-nums', color: '#7A6A5F' }}>{t.invoice}</div>
                    <div style={{ fontVariantNumeric: 'tabular-nums' }}>{t.totalLabel}</div>
                    <div style={{ color: '#A67C52', fontWeight: 600 }}>+{t.visitEarned}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {screen === 'edit' && draft && (
          <div style={{ maxWidth: '640px', margin: '0 auto', padding: '52px 40px 60px' }}>
            <div onClick={() => setScreen('detail')} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', cursor: 'pointer', color: '#7A6A5F', fontSize: '13px', fontWeight: 600, marginBottom: '20px' }}>
              <span style={{ fontSize: '15px' }}>←</span> Batal, kembali ke Member Detail
            </div>
            <div style={{ fontSize: '27px', fontWeight: 600, letterSpacing: '-0.03em', color: '#3B2A22' }}>Edit Member</div>
            <div style={{ fontSize: '15px', color: '#7A6A5F', marginTop: '6px' }}>{draft.memberId} · {draft.wa}</div>
            
            <div style={{ marginTop: '28px', background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', padding: '22px', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#3B2A22' }}>Data Pribadi</div>
              <Input label="NAMA" value={draft.name} onChange={(e: any) => setDraft({ ...draft, name: e.target.value })} />
              <Input label="NO. HP / WHATSAPP" value={draft.wa} onChange={(e: any) => setDraft({ ...draft, wa: e.target.value })} />
              <div style={{ height: '1px', background: '#EAE1D5', margin: '4px 0' }}></div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#3B2A22' }}>Status Anggota</div>
              <SegmentedToggle options={[{ value: 'Active', label: 'Aktif' }, { value: 'Suspended', label: 'Ditangguhkan' }, { value: 'Archived', label: 'Diarsipkan' }]} value={draft.status} onChange={(v: any) => setDraft({ ...draft, status: v })} />
              <div style={{ height: '1px', background: '#EAE1D5', margin: '4px 0' }}></div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#3B2A22' }}>Koreksi Visit</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8F4EE', borderRadius: '14px', padding: '14px 16px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', textTransform: 'uppercase' }}>Visit saat ini</div>
                  <div style={{ fontSize: '22px', fontWeight: 600, color: '#3B2A22', marginTop: '3px', fontVariantNumeric: 'tabular-nums' }}>{draft.visits} / {draft.goal}</div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div onClick={() => setDraft({ ...draft, visits: Math.max(0, draft.visits - 1) })} style={{ width: '44px', height: '44px', borderRadius: '12px', border: '1px solid #E0D5C6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 600, color: '#3B2A22', cursor: 'pointer', background: '#FFFFFF' }}>−</div>
                  <div onClick={() => setDraft({ ...draft, visits: Math.min(GOAL, draft.visits + 1) })} style={{ width: '44px', height: '44px', borderRadius: '12px', border: '1px solid #E0D5C6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 600, color: '#3B2A22', cursor: 'pointer', background: '#FFFFFF' }}>+</div>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <div style={{ flex: 1 }}><Button variant="outline" onClick={() => setScreen('detail')}>Batal</Button></div>
              <div style={{ flex: 1 }}><Button variant="primary" onClick={async () => {
                await saveMember(draft.id, { name: draft.name, wa: draft.wa, status: draft.status, visits: draft.visits });
                const updated = await getMembers();
                setMembers(updated);
                setScreen('detail');
              }}>Simpan</Button></div>
            </div>
          </div>
        )}

      </div>{/* close overflowY:auto */}
      </div>{/* close flex flex-col main content wrapper */}

      {addMemberOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(43, 30, 24, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: '420px', background: '#FFFFFF', borderRadius: '22px', padding: '26px', boxShadow: '0 30px 60px -20px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#3B2A22' }}>Tambah Anggota Baru</div>
            <div style={{ fontSize: '13.5px', color: '#7A6A5F', marginTop: '6px' }}>Masukkan nama dan nomor WhatsApp anggota.</div>
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input label="NAMA" placeholder="Contoh: Siti Rahayu" value={newMember.name} onChange={(e: any) => setNewMember({ ...newMember, name: e.target.value })} />
              <Input label="NO. WHATSAPP" placeholder="Contoh: 0812-3456-7801" value={newMember.wa} onChange={(e: any) => setNewMember({ ...newMember, wa: e.target.value })} />
            </div>
            {addMemberError && <div style={{ marginTop: '12px', fontSize: '12.5px', color: '#B4432A' }}>{addMemberError}</div>}
              <div style={{ display: 'flex', gap: '12px', marginTop: '22px' }}>
              <div style={{ flex: 1 }}><Button variant="outline" onClick={() => setAddMemberOpen(false)}>Batal</Button></div>
              <div style={{ flex: 1 }}><Button variant="primary" onClick={async () => {
                const name = newMember.name.trim();
                const wa = newMember.wa.trim();
                if (!name || !wa) return setAddMemberError('Nama dan nomor WhatsApp wajib diisi.');
                
                try {
                  await createMemberAdmin({ name, wa });
                  const updated = await getMembers();
                  setMembers(updated);
                  setAddMemberOpen(false);
                  setNewMember({ name: '', wa: '' });
                } catch(err: any) {
                  setAddMemberError(err.message || 'Gagal menambahkan member');
                }
              }}>Simpan</Button></div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
