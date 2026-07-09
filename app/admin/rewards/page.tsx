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
function initials(name: string) {
  return (name || '').split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0].toUpperCase()).join('');
}
function statusPill(value: string) {
  if (value === 'Aktif') return { bg: 'rgba(122, 150, 116, 0.18)', color: '#5A6A54' };
  return { bg: '#F1EBE1', color: '#7A6A5F' };
}

import { getRewardsAdmin, saveReward, deleteReward, redeemRewardAdmin, getHistoryAdmin, getMembers } from '../actions';

const Button = ({ variant, onClick, children, style }: any) => {
  const isPri = variant === 'primary';
  return (
    <div onClick={onClick} style={{ padding: '10px 16px', borderRadius: '14px', fontSize: '13px', fontWeight: 600, textAlign: 'center', cursor: 'pointer', background: isPri ? '#A67C52' : 'transparent', color: isPri ? '#fff' : '#3B2A22', border: isPri ? 'none' : '1px solid #E0D5C6', boxShadow: isPri ? '0 14px 26px -14px rgba(166, 124, 82, 0.9)' : 'none', ...style }}>
      {children}
    </div>
  );
};

const Input = ({ label, placeholder, value, onChange, type = 'text', ...rest }: any) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    {label && <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: '#A08A7B', textTransform: 'uppercase' }}>{label}</div>}
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} {...rest} style={{ background: '#FFFFFF', border: '1px solid #E6DDD0', borderRadius: '14px', padding: '12px 14px', fontSize: '15px', color: '#3B2A22', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
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

export default function RewardManagementPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<'list' | 'form' | 'redeem' | 'history'>('list');
  const [rewards, setRewards] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  useEffect(() => {
    async function load() {
      try {
        setRewards(await getRewardsAdmin());
        setMembers(await getMembers());
        setHistory(await getHistoryAdmin());
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [screen]);
  
  const [listFilter, setListFilter] = useState('all');
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'system'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: '', desc: '', visitsRequired: '', status: 'Aktif', expiryDate: '' });
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  
  const [redeemStep, setRedeemStep] = useState<'search' | 'select'>('search');
  const [redeemSearchQuery, setRedeemSearchQuery] = useState('');
  const [redeemSelectedId, setRedeemSelectedId] = useState<string | null>(null);
  const [redeemConfirmOpen, setRedeemConfirmOpen] = useState(false);
  const [redeemTarget, setRedeemTarget] = useState<any>(null);
  
  const [historyQuery, setHistoryQuery] = useState('');

  const normalizeDigits = (s: string) => (s || '').replace(/\D/g, '');

  const filteredRewards = rewards.filter(r => (listFilter === 'all' || r.status === listFilter) && !r.id.startsWith('SYSTEM_'));

  const qRedeem = redeemSearchQuery.trim().toLowerCase();
  const qRedeemDigits = normalizeDigits(redeemSearchQuery);
  const redeemSearchResults = qRedeem ? members.filter(m => m.memberId.toLowerCase().includes(qRedeem) || (qRedeemDigits && normalizeDigits(m.wa).includes(qRedeemDigits))).map(m => ({
    ...m, initials: initials(m.name)
  })) : [];

  const redeemSelectedMember = members.find(m => m.id === redeemSelectedId);
  const eligibilityRows = redeemSelectedMember ? rewards.filter(r => r.status === 'Aktif').map(r => {
    const eligible = redeemSelectedMember.visits >= r.visitsRequired;
    return {
      ...r,
      eligible,
      statusText: eligible ? 'Siap diredeem' : `Butuh ${r.visitsRequired - redeemSelectedMember.visits} visit lagi`,
      cardBg: eligible ? '#FFFFFF' : '#F8F4EE',
      cardOpacity: eligible ? 1 : 0.6
    };
  }) : [];

  const hq = historyQuery.trim().toLowerCase();
  const filteredHistory = history.filter(h => h.memberName.toLowerCase().includes(hq) || h.memberId.toLowerCase().includes(hq)).map(h => ({
    ...h, dateLabel: fmtDate(h.date)
  }));

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
              <div onClick={() => { setScreen('list'); setEditingId(null); setSidebarOpen(false); }} style={navItemStyle((screen === 'list' || screen === 'form') && formMode !== 'system')}><div style={{ width: '16px', height: '12px', flex: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}><span style={{ height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></span><span style={{ height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></span><span style={{ height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></span></div><span style={{ fontSize: '14px', fontWeight: 600 }}>Daftar Reward</span></div>
              <div onClick={() => { setScreen('redeem'); setRedeemStep('search'); setEditingId(null); setSidebarOpen(false); }} style={navItemStyle(screen === 'redeem')}><div style={{ width: '16px', height: '16px', border: '1.6px solid currentColor', borderRadius: '4px', flex: 'none', position: 'relative' }}><div style={{ position: 'absolute', left: '3.4px', top: '2.4px', width: '6.5px', height: '8.5px', borderRight: '1.6px solid currentColor', borderBottom: '1.6px solid currentColor', transform: 'rotate(45deg)' }}></div></div><span style={{ fontSize: '14px', fontWeight: 600 }}>Redeem Reward</span></div>
              <div onClick={() => { setScreen('history'); setEditingId(null); setSidebarOpen(false); }} style={navItemStyle(screen === 'history')}><div style={{ width: '16px', height: '16px', border: '1.6px solid currentColor', borderRadius: '50%', flex: 'none', position: 'relative' }}><div style={{ position: 'absolute', left: '7px', top: '3px', width: '1.4px', height: '5px', background: 'currentColor' }}></div><div style={{ position: 'absolute', left: '7px', top: '7.4px', width: '4px', height: '1.4px', background: 'currentColor' }}></div></div><span style={{ fontSize: '14px', fontWeight: 600 }}>Riwayat Redeem</span></div>
              
              <div style={{ marginTop: '16px', marginBottom: '4px', fontSize: '11px', fontWeight: 600, letterSpacing: '.12em', color: 'rgba(248, 244, 238, 0.4)', textTransform: 'uppercase', paddingLeft: '12px' }}>System Rewards</div>
              
              <div onClick={() => { 
                const r = rewards.find(rw => rw.id === 'SYSTEM_VISIT');
                if (r) { setDraft({...r, visitsRequired: String(r.visitsRequired), expiryDate: r.expiryDate ? new Date(r.expiryDate).toISOString().slice(0, 10) : ''}); } 
                else { setDraft({ name: 'Free Garlic Cream Cheese', desc: 'Selamat! Kunjungan Anda telah mencapai target.', visitsRequired: '10', status: 'Aktif', expiryDate: '' }); }
                setEditingId('SYSTEM_VISIT'); setFormMode('system'); setScreen('form'); setSidebarOpen(false); 
              }} style={navItemStyle(editingId === 'SYSTEM_VISIT' && screen === 'form')}>
                <div style={{ width: '16px', height: '16px', border: '1.6px solid currentColor', borderRadius: '50%', flex: 'none', position: 'relative' }}></div>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Visits Reward</span>
              </div>
              
              <div onClick={() => { 
                const r = rewards.find(rw => rw.id === 'SYSTEM_REFERRAL');
                if (r) { setDraft({...r, visitsRequired: String(r.visitsRequired), expiryDate: r.expiryDate ? new Date(r.expiryDate).toISOString().slice(0, 10) : ''}); } 
                else { setDraft({ name: 'Free Garlic Cream Cheese', desc: 'Our thanks for a friend who joined.', visitsRequired: '1', status: 'Aktif', expiryDate: '' }); }
                setEditingId('SYSTEM_REFERRAL'); setFormMode('system'); setScreen('form'); setSidebarOpen(false); 
              }} style={navItemStyle(editingId === 'SYSTEM_REFERRAL' && screen === 'form')}>
                <div style={{ width: '16px', height: '16px', border: '1.6px solid currentColor', borderRadius: '50%', flex: 'none', position: 'relative' }}></div>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Referral Reward</span>
              </div>
            </div>
            <div style={{ flex: 1 }}></div>
            <div style={{ padding: '12px', fontSize: '11px', lineHeight: 1.5, color: 'rgba(248, 244, 238, 0.5)' }}>Staff tool · internal use<br/>{rewards.filter(r=>r.status==='Aktif').length} reward aktif</div>
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
          <div onClick={() => { setScreen('list'); setEditingId(null); }} style={navItemStyle((screen === 'list' || screen === 'form') && formMode !== 'system')}>
            <div style={{ width: '16px', height: '12px', flex: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span style={{ height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></span>
              <span style={{ height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></span>
              <span style={{ height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></span>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Daftar Reward</span>
          </div>
          <div onClick={() => { setScreen('redeem'); setRedeemStep('search'); setEditingId(null); }} style={navItemStyle(screen === 'redeem')}>
            <div style={{ width: '16px', height: '16px', border: '1.6px solid currentColor', borderRadius: '4px', flex: 'none', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '3.4px', top: '2.4px', width: '6.5px', height: '8.5px', borderRight: '1.6px solid currentColor', borderBottom: '1.6px solid currentColor', transform: 'rotate(45deg)' }}></div>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Redeem Reward</span>
          </div>
          <div onClick={() => { setScreen('history'); setEditingId(null); }} style={navItemStyle(screen === 'history')}>
            <div style={{ width: '16px', height: '16px', border: '1.6px solid currentColor', borderRadius: '50%', flex: 'none', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '7px', top: '3px', width: '1.4px', height: '5px', background: 'currentColor' }}></div>
              <div style={{ position: 'absolute', left: '7px', top: '7.4px', width: '4px', height: '1.4px', background: 'currentColor' }}></div>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Riwayat Redeem</span>
          </div>

          <div style={{ marginTop: '16px', marginBottom: '4px', fontSize: '11px', fontWeight: 600, letterSpacing: '.12em', color: 'rgba(248, 244, 238, 0.4)', textTransform: 'uppercase', paddingLeft: '12px' }}>System Rewards</div>
          
          <div onClick={() => { 
            const r = rewards.find(rw => rw.id === 'SYSTEM_VISIT');
            if (r) { setDraft({...r, visitsRequired: String(r.visitsRequired), expiryDate: r.expiryDate ? new Date(r.expiryDate).toISOString().slice(0, 10) : ''}); } 
            else { setDraft({ name: 'Free Garlic Cream Cheese', desc: 'Selamat! Kunjungan Anda telah mencapai target.', visitsRequired: '10', status: 'Aktif', expiryDate: '' }); }
            setEditingId('SYSTEM_VISIT'); setFormMode('system'); setScreen('form'); 
          }} style={navItemStyle(editingId === 'SYSTEM_VISIT' && screen === 'form')}>
            <div style={{ width: '16px', height: '16px', border: '1.6px solid currentColor', borderRadius: '50%', flex: 'none', position: 'relative' }}></div>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Visits Reward</span>
          </div>
          
          <div onClick={() => { 
            const r = rewards.find(rw => rw.id === 'SYSTEM_REFERRAL');
            if (r) { setDraft({...r, visitsRequired: String(r.visitsRequired), expiryDate: r.expiryDate ? new Date(r.expiryDate).toISOString().slice(0, 10) : ''}); } 
            else { setDraft({ name: 'Free Garlic Cream Cheese', desc: 'Our thanks for a friend who joined.', visitsRequired: '1', status: 'Aktif', expiryDate: '' }); }
            setEditingId('SYSTEM_REFERRAL'); setFormMode('system'); setScreen('form'); 
          }} style={navItemStyle(editingId === 'SYSTEM_REFERRAL' && screen === 'form')}>
            <div style={{ width: '16px', height: '16px', border: '1.6px solid currentColor', borderRadius: '50%', flex: 'none', position: 'relative' }}></div>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Referral Reward</span>
          </div>
        </div>

        <div style={{ flex: 1 }}></div>
        <div style={{ padding: '12px', fontSize: '11px', lineHeight: 1.5, color: 'rgba(248, 244, 238, 0.5)' }}>Alat Staf · Penggunaan Internal<br/>{rewards.filter(r=>r.status==='Aktif').length} reward aktif</div>
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
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(248,244,238,.92)', marginLeft: '2px' }}>Manajemen Reward</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', boxSizing: 'border-box' }}>
        
        {screen === 'list' && (
          <div style={{ padding: '52px 40px 60px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '27px', fontWeight: 600, letterSpacing: '-0.03em', color: '#3B2A22' }}>Daftar Reward</div>
                <div style={{ fontSize: '15px', color: '#7A6A5F', marginTop: '6px' }}>{filteredRewards.length} dari {rewards.length} reward</div>
              </div>
              <div style={{ width: '190px' }}>
                <Button variant="primary" onClick={() => { setFormMode('create'); setDraft({ name: '', desc: '', visitsRequired: '', status: 'Aktif', expiryDate: '' }); setScreen('form'); }}>+ Tambah Reward</Button>
              </div>
            </div>

            <div style={{ marginTop: '22px', maxWidth: '420px' }}>
              <SegmentedToggle options={[{ value: 'all', label: 'Semua' }, { value: 'Aktif', label: 'Aktif' }, { value: 'Nonaktif', label: 'Nonaktif' }]} value={listFilter} onChange={setListFilter} />
            </div>

            <div style={{ marginTop: '22px', background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr .9fr 1fr', gap: '10px', padding: '14px 20px', background: '#F8F4EE', fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', color: '#A08A7B', textTransform: 'uppercase' }}>
                <div>Nama Reward</div><div>Syarat</div><div>Status</div><div>Aksi</div>
              </div>
              {filteredRewards.map(r => {
                const pill = statusPill(r.status);
                return (
                  <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr .9fr 1fr', gap: '10px', padding: '15px 20px', borderTop: '1px solid #EAE1D5', alignItems: 'center', fontSize: '13.5px', color: '#4A3830' }}>
                    <div style={{ fontWeight: 600, color: '#3B2A22' }}>{r.name}</div>
                    <div style={{ color: '#7A6A5F', fontVariantNumeric: 'tabular-nums' }}>{r.visitsRequired} kunjungan</div>
                    <div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: pill.bg, color: pill.color, fontSize: '11px', fontWeight: 600, padding: '4px 9px', borderRadius: '999px' }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: pill.color }}></span>{r.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '14px' }}>
                      <span onClick={() => { setFormMode('edit'); setEditingId(r.id); setDraft({ ...r, visitsRequired: String(r.visitsRequired), expiryDate: r.expiryDate ? new Date(r.expiryDate).toISOString().slice(0, 10) : '' }); setScreen('form'); }} style={{ fontSize: '12.5px', fontWeight: 600, color: '#A67C52', cursor: 'pointer' }}>Edit</span>
                      <span onClick={() => { setDeleteTarget(r); setDeleteConfirmOpen(true); }} style={{ fontSize: '12.5px', fontWeight: 600, color: '#7A6A5F', cursor: 'pointer' }}>Hapus</span>
                    </div>
                  </div>
                );
              })}
              {filteredRewards.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#7A6A5F', fontSize: '14px', borderTop: '1px solid #EAE1D5' }}>Tidak ada reward dengan status ini.</div>}
            </div>
          </div>
        )}

        {screen === 'form' && (
          <div style={{ maxWidth: '640px', margin: '0 auto', padding: '52px 40px 60px' }}>
            <div onClick={() => setScreen('list')} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', cursor: 'pointer', color: '#7A6A5F', fontSize: '13px', fontWeight: 600, marginBottom: '20px' }}>
              <span style={{ fontSize: '15px' }}>←</span>Batal, kembali ke Daftar Reward
            </div>
            <div style={{ fontSize: '27px', fontWeight: 600, letterSpacing: '-0.03em', color: '#3B2A22' }}>
              {formMode === 'create' ? 'Tambah Reward Baru' : (formMode === 'system' ? (editingId === 'SYSTEM_VISIT' ? 'Pengaturan Visits Reward' : 'Pengaturan Referral Reward') : 'Edit Reward')}
            </div>
            <div style={{ fontSize: '15px', color: '#7A6A5F', marginTop: '6px' }}>{formMode === 'create' ? 'Lengkapi detail reward di bawah ini.' : 'Ubah detail reward dan syaratnya.'}</div>

            <div style={{ marginTop: '24px', background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', padding: '22px', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <Input label="NAMA REWARD" placeholder="Contoh: Gratis Kouign-Amann Saltbread" value={draft.name} onChange={(e: any) => setDraft({ ...draft, name: e.target.value })} />
              <Input label="DESKRIPSI SINGKAT" placeholder="Satu kalimat singkat" value={draft.desc} onChange={(e: any) => setDraft({ ...draft, desc: e.target.value })} />
              <Input label={editingId === 'SYSTEM_REFERRAL' ? 'SYARAT REFERRAL' : 'SYARAT KUNJUNGAN'} type="number" placeholder={editingId === 'SYSTEM_REFERRAL' ? '1' : '10'} value={draft.visitsRequired} onChange={(e: any) => setDraft({ ...draft, visitsRequired: e.target.value })} />
              <Input label="TANGGAL KADALUARSA" type="date" min={todayIso()} value={draft.expiryDate} onChange={(e: any) => setDraft({ ...draft, expiryDate: e.target.value })} />
              
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', textTransform: 'uppercase', marginBottom: '8px' }}>STATUS</div>
                <SegmentedToggle options={[{ value: 'Aktif', label: 'Aktif' }, { value: 'Nonaktif', label: 'Nonaktif' }]} value={draft.status} onChange={(v: any) => setDraft({ ...draft, status: v })} />
              </div>

              {formMode === 'edit' && (
                <>
                  <div style={{ height: '1px', background: '#EAE1D5', margin: '4px 0' }}></div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#3B2A22' }}>Hapus Reward</div>
                      <div style={{ fontSize: '12.5px', color: '#7A6A5F', marginTop: '3px', maxWidth: '340px', lineHeight: 1.5 }}>Reward ini akan hilang dari daftar dan tidak lagi bisa di-redeem member.</div>
                    </div>
                    <div style={{ width: '150px', flex: 'none' }}>
                      <Button variant="outline" onClick={() => { setDeleteTarget({ id: editingId, name: draft.name, fromForm: true }); setDeleteConfirmOpen(true); }} style={{ color: '#3B2A22' }}>Hapus</Button>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <div style={{ flex: 1 }}><Button variant="outline" onClick={() => setScreen('list')}>Batal</Button></div>
              <div style={{ flex: 1 }}><Button variant="primary" onClick={async () => {
                if (draft.expiryDate && draft.expiryDate < todayIso()) {
                  alert('Tanggal kadaluarsa tidak boleh di masa lalu!');
                  return;
                }
                const record = { id: formMode === 'create' ? 'rw' + Date.now() : editingId!, name: draft.name, desc: draft.desc, visitsRequired: parseInt(draft.visitsRequired, 10) || 0, status: draft.status, expiryDate: draft.expiryDate || null };
                await saveReward(record);
                setRewards(await getRewardsAdmin());
                if (formMode !== 'system') setScreen('list');
                else alert('Perubahan berhasil disimpan!');
              }}>Simpan</Button></div>
            </div>
          </div>
        )}

        {screen === 'redeem' && (
          <div style={{ maxWidth: '760px', margin: '0 auto', padding: '52px 40px 60px' }}>
            {redeemStep === 'search' && (
              <>
                <div style={{ fontSize: '27px', fontWeight: 600, letterSpacing: '-0.03em', color: '#3B2A22' }}>Redeem Reward</div>
                <div style={{ fontSize: '15px', color: '#7A6A5F', marginTop: '6px' }}>Cari member berdasarkan Nomor WhatsApp atau Member ID.</div>
                <div style={{ marginTop: '26px' }}>
                  <Input label="NOMOR WHATSAPP ATAU MEMBER ID" placeholder="Contoh: 0812-3456-7801 atau RR-01042" value={redeemSearchQuery} onChange={(e: any) => setRedeemSearchQuery(e.target.value)} />
                </div>
                {qRedeem && (
                  <div style={{ marginTop: '22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {redeemSearchResults.map(m => (
                      <div key={m.id} onClick={() => { setRedeemSelectedId(m.id); setRedeemStep('select'); }} style={{ display: 'flex', alignItems: 'center', gap: '18px', background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', padding: '16px 18px', cursor: 'pointer', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#F8F4EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: '#A67C52', flex: 'none' }}>{m.initials}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '15px', fontWeight: 600, color: '#3B2A22' }}>{m.name}</div>
                          <div style={{ fontSize: '13px', color: '#7A6A5F', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>{m.memberId} · {m.wa}</div>
                        </div>
                        <div style={{ fontSize: '13px', color: '#7A6A5F', fontVariantNumeric: 'tabular-nums', flex: 'none' }}>{m.visits} kunjungan</div>
                      </div>
                    ))}
                    {redeemSearchResults.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7A6A5F', fontSize: '14px' }}>Tidak ada member yang cocok dengan “{redeemSearchQuery}”.</div>}
                  </div>
                )}
              </>
            )}

            {redeemStep === 'select' && redeemSelectedMember && (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '27px', fontWeight: 600, letterSpacing: '-0.03em', color: '#3B2A22' }}>Redeem Reward</div>
                    <div style={{ fontSize: '15px', color: '#7A6A5F', marginTop: '6px' }}>Pilih reward yang ingin di-redeem untuk member ini.</div>
                  </div>
                  <div style={{ width: '170px' }}>
                    <Button variant="outline" onClick={() => { setRedeemStep('search'); setRedeemSearchQuery(''); }}>Cari member lain</Button>
                  </div>
                </div>
                
                <div style={{ marginTop: '22px', display: 'flex', alignItems: 'center', gap: '18px', background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', padding: '18px 20px', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F8F4EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 600, color: '#A67C52', flex: 'none' }}>{initials(redeemSelectedMember.name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#3B2A22' }}>{redeemSelectedMember.name}</div>
                    <div style={{ fontSize: '13px', color: '#7A6A5F', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>{redeemSelectedMember.memberId} · {redeemSelectedMember.wa}</div>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#3B2A22', fontVariantNumeric: 'tabular-nums', flex: 'none' }}>{redeemSelectedMember.visits} kunjungan</div>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {eligibilityRows.map(r => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: r.cardBg, border: '1px solid #EFE8DE', borderRadius: '22px', padding: '16px 18px', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)', opacity: r.cardOpacity }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#3B2A22' }}>{r.name}</div>
                        <div style={{ fontSize: '13px', color: '#7A6A5F', marginTop: '3px' }}>{r.statusText}</div>
                      </div>
                      <div style={{ width: '130px', flex: 'none' }}>
                        {r.eligible ? (
                          <Button variant="primary" onClick={() => { setRedeemTarget({ memberId: redeemSelectedMember.id, memberName: redeemSelectedMember.name, rewardId: r.id, rewardName: r.name, visitsRequired: r.visitsRequired }); setRedeemConfirmOpen(true); }}>Redeem</Button>
                        ) : (
                           <div style={{ width: '100%', height: '44px', borderRadius: '14px', background: '#F1EBE1', color: '#7A6A5F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600 }}>Belum memenuhi syarat</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {eligibilityRows.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7A6A5F', fontSize: '14px' }}>Belum ada reward aktif untuk di-redeem.</div>}
                </div>
              </>
            )}
          </div>
        )}

        {screen === 'history' && (
          <div style={{ padding: '52px 40px 60px' }}>
            <div style={{ fontSize: '27px', fontWeight: 600, letterSpacing: '-0.03em', color: '#3B2A22' }}>Riwayat Redeem</div>
            <div style={{ fontSize: '15px', color: '#7A6A5F', marginTop: '6px' }}>{filteredHistory.length} riwayat ditemukan</div>
            
            <div style={{ marginTop: '22px', maxWidth: '420px' }}>
              <Input label="" placeholder="Cari nama atau Member ID" value={historyQuery} onChange={(e: any) => setHistoryQuery(e.target.value)} />
            </div>

            <div style={{ marginTop: '22px', background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1.6fr 1fr 1fr', gap: '10px', padding: '14px 20px', background: '#F8F4EE', fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', color: '#A08A7B', textTransform: 'uppercase' }}>
                <div>Nama Member</div><div>Member ID</div><div>Reward yang Diredeem</div><div>Tanggal Redeem</div><div>Outlet</div>
              </div>
              {filteredHistory.map(h => (
                <div key={h.id} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1.6fr 1fr 1fr', gap: '10px', padding: '15px 20px', borderTop: '1px solid #EAE1D5', alignItems: 'center', fontSize: '13.5px', color: '#4A3830' }}>
                  <div style={{ fontWeight: 600, color: '#3B2A22' }}>{h.memberName}</div>
                  <div style={{ color: '#7A6A5F', fontVariantNumeric: 'tabular-nums' }}>{h.memberId}</div>
                  <div>{h.rewardName}</div>
                  <div style={{ color: '#7A6A5F', fontVariantNumeric: 'tabular-nums' }}>{h.dateLabel}</div>
                  <div style={{ color: '#7A6A5F' }}>{h.outlet}</div>
                </div>
              ))}
              {filteredHistory.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#7A6A5F', fontSize: '14px', borderTop: '1px solid #EAE1D5' }}>Tidak ada riwayat yang cocok.</div>}
            </div>
          </div>
        )}

      </div>{/* close overflowY:auto */}
      </div>{/* close flex flex-col main wrapper */}

      {deleteConfirmOpen && deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(43, 30, 24, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: '420px', background: '#FFFFFF', borderRadius: '22px', padding: '26px', boxShadow: '0 30px 60px -20px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#3B2A22' }}>Hapus reward ini?</div>
            <div style={{ fontSize: '13.5px', lineHeight: 1.6, color: '#7A6A5F', marginTop: '10px' }}>Hapus “{deleteTarget.name}” dari Daftar Reward? Member tidak akan lagi bisa menukar reward ini.</div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '22px' }}>
              <div style={{ flex: 1 }}><Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Batal</Button></div>
              <div style={{ flex: 1 }}><Button variant="primary" onClick={async () => {
                await deleteReward(deleteTarget.id);
                setDeleteConfirmOpen(false);
                if (deleteTarget.fromForm) setScreen('list');
                else setRewards(await getRewardsAdmin());
              }}>Hapus</Button></div>
            </div>
          </div>
        </div>
      )}

      {redeemConfirmOpen && redeemTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(43, 30, 24, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: '420px', background: '#FFFFFF', borderRadius: '22px', padding: '26px', boxShadow: '0 30px 60px -20px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#3B2A22' }}>Redeem reward ini?</div>
            <div style={{ fontSize: '13.5px', lineHeight: 1.6, color: '#7A6A5F', marginTop: '10px' }}>Redeem “{redeemTarget.rewardName}” untuk {redeemTarget.memberName}?</div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '22px' }}>
              <div style={{ flex: 1 }}><Button variant="outline" onClick={() => setRedeemConfirmOpen(false)}>Batal</Button></div>
              <div style={{ flex: 1 }}><Button variant="primary" onClick={async () => {
                try {
                  await redeemRewardAdmin(redeemTarget.memberId, redeemTarget.rewardId);
                  setRedeemConfirmOpen(false);
                  setRedeemStep('search');
                  setRedeemSelectedId(null);
                  setRedeemSearchQuery('');
                } catch(e) {
                  alert(e);
                }
              }}>Redeem</Button></div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
