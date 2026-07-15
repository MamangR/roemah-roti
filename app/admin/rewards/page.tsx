'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { LockedPage } from '@/components/admin/LockedPage';
import { Link as LinkIcon, Cake } from 'lucide-react';

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
  if (value === 'Aktif') return { bg: 'var(--accent-confirm-bg)', color: 'var(--accent-confirm-text)' };
  return { bg: 'var(--surface-track)', color: 'var(--taupe)' };
}

import { getRewardsAdmin, saveReward, deleteReward, redeemRewardAdmin, getHistoryAdmin, getMembers, getMenuItemsAdmin } from '../actions';

const Button = ({ variant, onClick, children, style }: any) => {
  const isPri = variant === 'primary';
  return (
    <div onClick={onClick} style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 600, textAlign: 'center', cursor: 'pointer', background: isPri ? 'var(--accent-primary)' : 'transparent', color: isPri ? '#fff' : 'var(--text-primary)', border: isPri ? 'none' : '1px solid var(--border-outline-cta)', boxShadow: isPri ? 'var(--shadow-cta)' : 'none', transition: 'all 0.15s ease', ...style }}>
      {children}
    </div>
  );
};

const Input = ({ label, placeholder, value, onChange, type = 'text', ...rest }: any) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    {label && <div style={{ fontSize: 'var(--text-label)', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--mist)', textTransform: 'uppercase' }}>{label}</div>}
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} {...rest} style={{ background: 'var(--surface-input)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', fontSize: 'var(--text-body)', color: 'var(--text-primary)', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'all 0.15s ease' }} />
  </div>
);

const SegmentedToggle = ({ options, value, onChange }: any) => (
  <div style={{ display: 'flex', background: 'var(--surface-track)', borderRadius: 'var(--radius-sm)', padding: '4px' }}>
    {options.map((o: any) => (
      <div key={o.value} onClick={() => onChange(o.value)} style={{ flex: 1, textAlign: 'center', padding: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: value === o.value ? '#fff' : 'transparent', borderRadius: '11px', color: value === o.value ? 'var(--text-primary)' : 'var(--mist)', boxShadow: value === o.value ? '0 4px 12px -4px rgba(59,42,34,.25)' : 'none', transition: 'all 0.15s ease' }}>
        {o.label}
      </div>
    ))}
  </div>
);

export default function RewardManagementPageWrapper() {
  const { adminUser, hasPermission, loading: authLoading } = useAdminAuth();

  if (authLoading) return null;
  if (!adminUser) return null;
  if (!hasPermission('manage_rewards') && !hasPermission('redeem_rewards')) {
    return <LockedPage pageName="Reward Management" />;
  }

  return <RewardManagementPage />;
}

function RewardManagementPage() {
  const router = useRouter();
  const { adminUser, hasPermission } = useAdminAuth();
  const canManageRewards = hasPermission('manage_rewards');
  const [screen, setScreen] = useState<'list' | 'form' | 'redeem' | 'history'>('list');
  const [rewards, setRewards] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const queryProcessedRef = React.useRef(false);

  useEffect(() => {
    async function load() {
      try {
        const _rewards = await getRewardsAdmin();
        const _members = await getMembers();
        setRewards(_rewards);
        setMembers(_members);
        setMenuItems(await getMenuItemsAdmin());
        setHistory(await getHistoryAdmin());

        if (!queryProcessedRef.current) {
          queryProcessedRef.current = true;
          const search = window.location.search;
          const params = new URLSearchParams(search);
          const qMemberId = params.get('memberId');
          const qRewardId = params.get('rewardId');

          if (qMemberId && qRewardId) {
            const m = _members.find((x: any) => x.id === qMemberId || x.referralCode === qMemberId || x.phone === qMemberId || x.rawPhone === qMemberId);

            if (m) {
              let targetReward: any = null;
              let targetType = 'template';

              if (qRewardId === 'birthday') {
                targetReward = { id: 'birthday', name: 'Birthday Treat Box', visitsRequired: 0 };
                targetType = 'birthday';
              } else {
                const t = _rewards.find((x: any) => x.id === qRewardId);
                if (t) {
                  targetReward = t;
                  targetType = 'template';
                } else {
                  const mr = (m.rewards || []).find((x: any) => x.id === qRewardId);
                  if (mr) {
                    targetReward = mr;
                    targetReward.name = mr.title;
                    targetReward.visitsRequired = 0;
                    targetType = 'member_reward';
                  }
                }
              }

              if (targetReward) {
                setScreen('redeem');
                setRedeemStep('select');
                setRedeemSelectedId(m.id);
                setRedeemTarget({ memberId: m.id, memberName: m.name, rewardId: targetReward.id, rewardName: targetReward.name, visitsRequired: targetReward.visitsRequired, type: targetType });
                setRedeemConfirmOpen(true);
                router.replace('/admin/rewards', { scroll: false });
              }
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [screen, router]);

  const [listFilter, setListFilter] = useState('all');
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'system'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: '', desc: '', visitsRequired: '', status: 'Aktif', validityDays: '30', menuItemId: '' });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const [redeemStep, setRedeemStep] = useState<'search' | 'select'>('search');
  const [redeemSearchQuery, setRedeemSearchQuery] = useState('');
  const [redeemSelectedId, setRedeemSelectedId] = useState<string | null>(null);
  const [redeemConfirmOpen, setRedeemConfirmOpen] = useState(false);
  const [redeemTarget, setRedeemTarget] = useState<any>(null);
  const [redeemSuccessOpen, setRedeemSuccessOpen] = useState(false);
  const [redeemSuccessData, setRedeemSuccessData] = useState<any>(null);
  const [redeemLoading, setRedeemLoading] = useState(false);

  const [historyQuery, setHistoryQuery] = useState('');
  
  const [barcodeInput, setBarcodeInput] = useState('');

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = barcodeInput.trim();
    if (!val) return;
    
    const parts = val.split(':');
    if (parts.length === 3 && parts[0] === 'REWARD') {
      const parsedMemberId = parts[1];
      const parsedRewardId = parts[2];
      
      const m = members.find((x: any) => x.id === parsedMemberId || x.memberId === parsedMemberId || x.wa === parsedMemberId);
      if (m) {
        let targetReward: any = null;
        let targetType = 'template';

        if (parsedRewardId === 'birthday') {
          targetReward = { id: 'birthday', name: 'Birthday Treat Box', visitsRequired: 0 };
          targetType = 'birthday';
        } else {
          const t = rewards.find((x: any) => x.id === parsedRewardId);
          if (t) {
            targetReward = t;
            targetType = 'template';
          } else {
            const mr = (m.rewards || []).find((x: any) => x.id === parsedRewardId);
            if (mr) {
              targetReward = mr;
              targetReward.name = mr.title;
              targetReward.visitsRequired = 0;
              targetType = 'member_reward';
            }
          }
        }

        if (targetReward) {
          setScreen('redeem');
          setRedeemStep('select');
          setRedeemSelectedId(m.id);
          setRedeemTarget({ memberId: m.id, memberName: m.name, rewardId: targetReward.id, rewardName: targetReward.name, visitsRequired: targetReward.visitsRequired, type: targetType });
          setRedeemConfirmOpen(true);
        } else {
           alert("Reward tidak ditemukan.");
        }
      } else {
         alert("Member tidak ditemukan.");
      }
    } else {
      const m = members.find((x: any) => x.id === val || x.memberId === val || x.wa === val);
      if (m) {
        setRedeemSelectedId(m.id);
        setRedeemStep('select');
      } else {
        alert("Barcode tidak valid atau member tidak ditemukan.");
      }
    }
    setBarcodeInput('');
  };

  const normalizeDigits = (s: string) => (s || '').replace(/\D/g, '');

  const filteredRewards = rewards.filter(r => (listFilter === 'all' || r.status === listFilter) && !r.id.startsWith('SYSTEM_'));

  const qRedeem = redeemSearchQuery.trim().toLowerCase();
  const qRedeemDigits = normalizeDigits(redeemSearchQuery);
  const redeemSearchResults = qRedeem ? members.filter(m => m.memberId.toLowerCase().includes(qRedeem) || (qRedeemDigits && normalizeDigits(m.wa).includes(qRedeemDigits))).map(m => ({
    ...m, initials: initials(m.name)
  })) : [];

  const redeemSelectedMember = members.find(m => m.id === redeemSelectedId);
  let combinedRows: any[] = [];
  if (redeemSelectedMember) {
    const templateRows = rewards.filter(r => r.status === 'Aktif' && !r.id.startsWith('SYSTEM_')).map(r => {
      const alreadyRedeemed = history.some(h => h.rawMemberId === redeemSelectedMember.id && (h.sourceTemplateId === r.id || (h.rewardType || '').startsWith(r.id + '_')));
      const eligible = !alreadyRedeemed && redeemSelectedMember.visits >= r.visitsRequired;
      return {
        ...r,
        type: 'template',
        eligible,
        alreadyRedeemed,
        statusText: eligible ? 'Siap ditukar' : `Butuh ${r.visitsRequired - redeemSelectedMember.visits} kunjungan lagi`,
        cardBg: eligible ? '#FFFFFF' : '#F8F4EE',
        cardOpacity: 1
      };
    }).filter(r => !r.alreadyRedeemed);

    combinedRows = [...templateRows];

    const birthMonth = redeemSelectedMember.birthdayInput ? parseInt(redeemSelectedMember.birthdayInput.split('-')[1], 10) - 1 : -1;
    const isBirthdayMonth = birthMonth !== -1 && birthMonth === new Date().getMonth();
    const bdayReward = (redeemSelectedMember.rewards || []).find((r: any) => r.rewardType === 'birthday_treat');

    if (isBirthdayMonth || bdayReward) {
      const alreadyRedeemed = bdayReward?.redeemedAt != null;
      const eligible = !alreadyRedeemed && isBirthdayMonth;
      if (!alreadyRedeemed) {
        combinedRows.push({
          id: 'birthday',
          name: bdayReward?.title || 'Birthday Treat Box',
          type: 'birthday',
          visitsRequired: 0,
          eligible,
          alreadyRedeemed,
          statusText: eligible ? 'Siap ditukar' : 'Belum eligible',
          cardBg: eligible ? '#FFFFFF' : '#F8F4EE',
          cardOpacity: 1
        });
      }
    }

    (redeemSelectedMember.rewards || []).forEach((r: any) => {
      if (r.rewardType === 'birthday_treat' || r.rewardType === 'visit_reward') return;
      const underscoreIdx = r.rewardType.lastIndexOf('_');
      if (underscoreIdx !== -1 && rewards.some(t => t.id === r.rewardType.substring(0, underscoreIdx))) return;

      const alreadyRedeemed = r.redeemedAt != null;
      const eligible = !alreadyRedeemed && r.isAvailable;
      if (!alreadyRedeemed) {
        combinedRows.push({
          id: r.id,
          name: r.title,
          type: 'member_reward',
          visitsRequired: 0,
          eligible,
          alreadyRedeemed,
          statusText: eligible ? 'Siap ditukar' : 'Belum eligible',
          cardBg: eligible ? '#FFFFFF' : '#F8F4EE',
          cardOpacity: 1
        });
      }
    });
  }
  const eligibilityRows = combinedRows;

  const hq = historyQuery.trim().toLowerCase();
  const filteredHistory = history.filter(h => h.memberName.toLowerCase().includes(hq) || h.memberId.toLowerCase().includes(hq)).map(h => ({
    ...h, dateLabel: fmtDate(h.date)
  }));

  const navItemStyle = (isActive: boolean) => ({
    display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 12px', borderRadius: '12px', cursor: 'pointer',
    background: isActive ? 'rgba(166,124,82,.9)' : 'transparent', color: isActive ? '#2A1E18' : 'var(--text-on-hero-dim)'
  });

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  const styles = `
    :root {
      --cream:    #FCFBF8;
      --linen:    #F8F4EE;
      --sand:     #F1EBE1;
      --espresso: #3B2A22;
      --cocoa:    #4A3830;
      --taupe:    #7A6A5F;
      --mist:     #A08A7B;
      --caramel:  #A67C52;
      --wheat:    #E9C9A6;
      --sage:     #5C7B5A;
      
      --surface-page:      var(--cream);
      --surface-card:      #FFFFFF;
      --surface-secondary: var(--linen);
      --surface-input:     #FFFFFF;
      --surface-track:     var(--sand);
      --surface-hero:      var(--espresso);
      
      --text-primary:      var(--espresso);
      --text-body:         var(--cocoa);
      --text-secondary:    var(--taupe);
      --text-label:        var(--mist);
      --text-on-hero:      rgba(248, 244, 238, 0.92);
      --text-on-hero-dim:   rgba(248, 244, 238, 0.72);
      --text-on-hero-faint: rgba(248, 244, 238, 0.5);
      --text-on-hero-hair:  rgba(248, 244, 238, 0.12);
      --text-accent-on-hero: var(--wheat);
      
      --accent-primary:    var(--caramel);
      --accent-confirm:    var(--sage);
      --accent-confirm-bg: rgba(122, 150, 116, 0.18);
      --accent-confirm-text: #5A6A54;
      
      --border-hairline:   #E6DDD0;
      --border-card:       #EFE8DE;
      --border-divider:    #EAE1D5;
      --border-outline-cta: #E0D5C6;
      --focus-ring:        rgba(166, 124, 82, 0.14);
      
      --scrim: rgba(43, 30, 24, 0.55);
      
      --shadow-card: 0 10px 26px -20px rgba(59, 42, 34, 0.35);
      --shadow-hero: 0 18px 40px -18px rgba(59, 42, 34, 0.55), 0 2px 6px rgba(59, 42, 34, 0.12);
      --shadow-cta: 0 14px 26px -14px rgba(166, 124, 82, 0.9);
      --shadow-modal: 0 30px 60px -20px rgba(0, 0, 0, 0.5);
      
      --radius-sm:   14px;
      --radius-md:   18px;
      --radius-lg:   22px;
      --radius-hero: 26px;
      
      --text-hero:      34px;
      --text-display:   27px;
      --text-title:     20px;
      --text-card-name: 23px;
      --text-body:      15px;
      --text-subtext:   14px;
      --text-meta:      13px;
      --text-small:     12px;
      --text-label:     11px;
      --text-kicker:    11px;
      --text-micro:     9.5px;
    }
    
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-thumb { background: var(--border-hairline); border-radius: 8px; }
    .rm-row { transition: background 0.15s ease; cursor: pointer; }
    .rm-row:hover { background: var(--linen) !important; }
    
    @keyframes rmFade {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

  return (
    <>
      {isMounted && <style>{styles}</style>}
      <div style={{ display: 'flex', height: '100vh', width: '100vw', background: 'var(--surface-page)', fontFamily: "'Inter', sans-serif", color: 'var(--text-primary)', boxSizing: 'border-box', overflow: 'hidden' }}>

        {/* Mobile sidebar drawer */}
        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(26,19,15,0.55)', backdropFilter: 'blur(2px)' }}>
            <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '260px', background: 'var(--espresso)', display: 'flex', flexDirection: 'column', padding: '26px 18px', boxSizing: 'border-box', boxShadow: '4px 0 40px rgba(0,0,0,0.4)' }}>
              <div onClick={() => router.push(adminUser?.role === 'cashier' ? '/admin/cashierdashboard' : '/admin')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '11px', padding: '0 8px 26px', borderBottom: '1px solid var(--text-on-hero-hair)' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--wheat)', letterSpacing: '-.02em' }}>RR</span></div>
                <div><div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.22em', color: 'var(--text-on-hero-dim)' }}>ROEMAH ROTI</div><div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-on-hero)', marginTop: '2px' }}>{adminUser?.role === 'cashier' ? 'Cashier Menu' : 'Dashboard'}</div></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '22px' }}>
                <div onClick={() => { setScreen('list'); setEditingId(null); setSidebarOpen(false); }} style={navItemStyle((screen === 'list' || screen === 'form') && formMode !== 'system')}><div style={{ width: '16px', height: '12px', flex: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}><span style={{ height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></span><span style={{ height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></span><span style={{ height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></span></div><span style={{ fontSize: '14px', fontWeight: 600 }}>Daftar Reward</span></div>
                <div onClick={() => { setScreen('redeem'); setRedeemStep('search'); setEditingId(null); setSidebarOpen(false); }} style={navItemStyle(screen === 'redeem')}><div style={{ width: '16px', height: '16px', border: '1.6px solid currentColor', borderRadius: '4px', flex: 'none', position: 'relative' }}><div style={{ position: 'absolute', left: '3.4px', top: '2.4px', width: '6.5px', height: '8.5px', borderRight: '1.6px solid currentColor', borderBottom: '1.6px solid currentColor', transform: 'rotate(45deg)' }}></div></div><span style={{ fontSize: '14px', fontWeight: 600 }}>Redeem Reward</span></div>
                <div onClick={() => { setScreen('history'); setEditingId(null); setSidebarOpen(false); }} style={navItemStyle(screen === 'history')}><div style={{ width: '16px', height: '16px', border: '1.6px solid currentColor', borderRadius: '50%', flex: 'none', position: 'relative' }}><div style={{ position: 'absolute', left: '7px', top: '3px', width: '1.4px', height: '5px', background: 'currentColor' }}></div><div style={{ position: 'absolute', left: '7px', top: '7.4px', width: '4px', height: '1.4px', background: 'currentColor' }}></div></div><span style={{ fontSize: '14px', fontWeight: 600 }}>Riwayat Redeem</span></div>

                <div style={{ opacity: canManageRewards ? 1 : 0.4, pointerEvents: canManageRewards ? 'auto' : 'none' }}>
                  <div style={{ marginTop: '16px', marginBottom: '4px', fontSize: '11px', fontWeight: 600, letterSpacing: '.12em', color: 'var(--text-on-hero-faint)', textTransform: 'uppercase', paddingLeft: '12px' }}>System Rewards</div>

                  <div onClick={() => {
                    const r = rewards.find(rw => rw.id === 'SYSTEM_REFERRAL');
                    if (r) { setDraft({ ...r, visitsRequired: String(r.visitsRequired), validityDays: String(r.validityDays || 30), menuItemId: r.menuItemId || '' }); }
                    else { setDraft({ name: '', desc: '', visitsRequired: '1', status: 'Aktif', validityDays: '30', menuItemId: '' }); }
                    setEditingId('SYSTEM_REFERRAL'); setFormMode('system'); setScreen('form'); setSidebarOpen(false);
                  }} style={navItemStyle(editingId === 'SYSTEM_REFERRAL' && screen === 'form')}>
                    <LinkIcon size={16} strokeWidth={2} />
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>Referral Reward</span>
                  </div>

                  <div onClick={() => {
                    const r = rewards.find(rw => rw.id === 'SYSTEM_BIRTHDAY');
                    if (r) { setDraft({ ...r, visitsRequired: String(r.visitsRequired), validityDays: String(r.validityDays || 30), menuItemId: r.menuItemId || '' }); }
                    else { setDraft({ name: '', desc: '', visitsRequired: '0', status: 'Aktif', validityDays: '30', menuItemId: '' }); }
                    setEditingId('SYSTEM_BIRTHDAY'); setFormMode('system'); setScreen('form'); setSidebarOpen(false);
                  }} style={navItemStyle(editingId === 'SYSTEM_BIRTHDAY' && screen === 'form')}>
                    <Cake size={16} strokeWidth={2} />
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>Birthday Reward</span>
                  </div>
                </div>
              </div>



              <div style={{ flex: 1 }}></div>
              <div style={{ padding: '12px', fontSize: '11px', lineHeight: 1.5, color: 'var(--text-on-hero-faint)' }}>Staff tool · internal use<br />{rewards.filter(r => r.status === 'Aktif').length} reward aktif</div>
            </div>
          </div>
        )}

        {/* Desktop Sidebar — hidden on mobile */}
        <div style={{ width: '250px', flex: 'none', background: 'var(--espresso)', display: 'flex', flexDirection: 'column', padding: '26px 18px', boxSizing: 'border-box' }} className="hidden md:flex">
          <div onClick={() => router.push(adminUser?.role === 'cashier' ? '/admin/cashierdashboard' : '/admin')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '11px', padding: '0 8px 26px', borderBottom: '1px solid var(--text-on-hero-hair)' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--wheat)', letterSpacing: '-.02em' }}>RR</span>
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.22em', color: 'var(--text-on-hero-dim)' }}>ROEMAH ROTI</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-on-hero)', marginTop: '2px' }}>{adminUser?.role === 'cashier' ? 'Cashier Menu' : 'Dashboard'}</div>
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

            <div style={{ opacity: canManageRewards ? 1 : 0.4, pointerEvents: canManageRewards ? 'auto' : 'none' }}>
              <div style={{ marginTop: '16px', marginBottom: '4px', fontSize: '11px', fontWeight: 600, letterSpacing: '.12em', color: 'var(--text-on-hero-faint)', textTransform: 'uppercase', paddingLeft: '12px' }}>System Rewards</div>

              <div onClick={() => {
                const r = rewards.find(rw => rw.id === 'SYSTEM_REFERRAL');
                if (r) { setDraft({ ...r, visitsRequired: String(r.visitsRequired), validityDays: String(r.validityDays || 30), menuItemId: r.menuItemId || '' }); }
                else { setDraft({ name: '', desc: '', visitsRequired: '1', status: 'Aktif', validityDays: '30', menuItemId: '' }); }
                setEditingId('SYSTEM_REFERRAL'); setFormMode('system'); setScreen('form');
              }} style={navItemStyle(editingId === 'SYSTEM_REFERRAL' && screen === 'form')}>
                <LinkIcon size={16} strokeWidth={2} />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Referral Reward</span>
              </div>

              <div onClick={() => {
                const r = rewards.find(rw => rw.id === 'SYSTEM_BIRTHDAY');
                if (r) { setDraft({ ...r, visitsRequired: String(r.visitsRequired), validityDays: String(r.validityDays || 30), menuItemId: r.menuItemId || '' }); }
                else { setDraft({ name: '', desc: '', visitsRequired: '0', status: 'Aktif', validityDays: '30', menuItemId: '' }); }
                setEditingId('SYSTEM_BIRTHDAY'); setFormMode('system'); setScreen('form');
              }} style={navItemStyle(editingId === 'SYSTEM_BIRTHDAY' && screen === 'form')}>
                <Cake size={16} strokeWidth={2} />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Birthday Reward</span>
              </div>
            </div>
          </div>



          <div style={{ flex: 1 }}></div>
          <div style={{ padding: '12px', fontSize: '11px', lineHeight: 1.5, color: 'var(--text-on-hero-faint)' }}>Alat Staf · Penggunaan Internal<br />{rewards.filter(r => r.status === 'Aktif').length} reward aktif</div>
        </div>

        {/* Main content with mobile top bar */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="flex md:hidden" style={{ background: 'var(--espresso)', padding: '14px 16px', alignItems: 'center', gap: '12px', flex: 'none' }}>
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
              <div style={{ padding: '52px 40px 60px', animation: 'rmFade .3s cubic-bezier(.22,1,.36,1)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '27px', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>Daftar Reward</div>
                    <div style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '6px' }}>{filteredRewards.length} dari {rewards.length} reward</div>
                  </div>
                  <div style={{ width: '190px', opacity: canManageRewards ? 1 : 0.4, pointerEvents: canManageRewards ? 'auto' : 'none' }}>
                    <Button variant="primary" onClick={() => { setFormMode('create'); setDraft({ name: '', desc: '', visitsRequired: '', status: 'Aktif', validityDays: '30', menuItemId: '' }); setScreen('form'); }}>+ Tambah Reward</Button>
                  </div>
                </div>

                <div style={{ marginTop: '22px', maxWidth: '420px' }}>
                  <SegmentedToggle options={[{ value: 'all', label: 'Semua' }, { value: 'Aktif', label: 'Aktif' }, { value: 'Nonaktif', label: 'Nonaktif' }]} value={listFilter} onChange={setListFilter} />
                </div>

                <div style={{ marginTop: '22px', background: 'var(--surface-card)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr .9fr 1fr', gap: '10px', padding: '14px 20px', background: 'var(--linen)', fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', color: 'var(--text-label)', textTransform: 'uppercase' }}>
                    <div>Nama Reward</div><div>Syarat</div><div>Status</div><div>Aksi</div>
                  </div>
                  {filteredRewards.map(r => {
                    const pill = statusPill(r.status);
                    return (
                      <div key={r.id} className="rm-row" onClick={(e) => { if (!canManageRewards) return; e.stopPropagation(); setFormMode('edit'); setEditingId(r.id); setDraft({ ...r, visitsRequired: String(r.visitsRequired), validityDays: String(r.validityDays || 30), menuItemId: r.menuItemId || '' }); setScreen('form'); }} style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr .9fr 1fr', gap: '10px', padding: '15px 20px', borderTop: '1px solid var(--border-divider)', alignItems: 'center', fontSize: '13.5px', color: 'var(--text-body)', cursor: canManageRewards ? 'pointer' : 'default' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</div>
                        <div style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{r.visitsRequired} kunjungan</div>
                        <div>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: pill.bg, color: pill.color, fontSize: '11px', fontWeight: 600, padding: '4px 9px', borderRadius: '999px' }}>
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: pill.color }}></span>{r.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '14px', opacity: canManageRewards ? 1 : 0.4, pointerEvents: canManageRewards ? 'auto' : 'none' }}>
                          <span onClick={(e) => { e.stopPropagation(); setFormMode('edit'); setEditingId(r.id); setDraft({ ...r, visitsRequired: String(r.visitsRequired), validityDays: String(r.validityDays || 30), menuItemId: r.menuItemId || '' }); setScreen('form'); }} style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--caramel)', cursor: 'pointer' }}>Edit</span>
                          <span onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); setDeleteConfirmOpen(true); }} style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>Hapus</span>
                        </div>
                      </div>
                    );
                  })}
                  {filteredRewards.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px', borderTop: '1px solid var(--border-divider)' }}>Tidak ada reward dengan status ini.</div>}
                </div>
              </div>
            )}

            {screen === 'form' && (
              <div style={{ maxWidth: '640px', margin: '0 auto', padding: '52px 40px 60px', animation: 'rmFade .3s cubic-bezier(.22,1,.36,1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div onClick={() => setScreen('list')} style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)', flex: 'none' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Batal, kembali ke Daftar Reward</div>
                </div>
                <div style={{ fontSize: '27px', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                  {formMode === 'create' ? 'Tambah Reward Baru' : (formMode === 'system' ? (editingId === 'SYSTEM_REFERRAL' ? 'Pengaturan Referral Reward' : 'Pengaturan Birthday Reward') : 'Edit Reward')}
                </div>
                <div style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '6px' }}>{formMode === 'create' ? 'Lengkapi detail reward di bawah ini.' : 'Ubah detail reward dan syaratnya.'}</div>

                <div style={{ marginTop: '24px', background: 'var(--surface-card)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-lg)', padding: '22px', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-label)', textTransform: 'uppercase' }}>ITEM MENU (WAJIB)</div>
                    <select value={draft.menuItemId} onChange={(e: any) => setDraft({ ...draft, menuItemId: e.target.value })} style={{ background: 'var(--surface-card)', border: '1px solid #E6DDD0', borderRadius: '14px', padding: '12px 14px', fontSize: '15px', color: 'var(--text-primary)', outline: 'none', width: '100%', boxSizing: 'border-box' }}>
                      <option value="">-- Pilih Item Menu --</option>
                      {menuItems.map((item: any) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                  <Input label="NAMA REWARD (OPSIONAL OVERRIDE)" placeholder="Kosongkan untuk memakai nama menu" value={draft.name || ''} onChange={(e: any) => setDraft({ ...draft, name: e.target.value })} />
                  <Input label="DESKRIPSI SINGKAT (OPSIONAL OVERRIDE)" placeholder="Kosongkan untuk memakai deskripsi menu" value={draft.desc || ''} onChange={(e: any) => setDraft({ ...draft, desc: e.target.value })} />
                  {editingId !== 'SYSTEM_BIRTHDAY' && (
                    <Input label={editingId === 'SYSTEM_REFERRAL' ? 'SYARAT REFERRAL' : 'SYARAT KUNJUNGAN'} type="number" placeholder={editingId === 'SYSTEM_REFERRAL' ? '1' : '10'} value={draft.visitsRequired} onChange={(e: any) => setDraft({ ...draft, visitsRequired: e.target.value })} />
                  )}
                  <Input label="MASA BERLAKU (HARI)" type="number" placeholder="Contoh: 30" value={draft.validityDays} onChange={(e: any) => setDraft({ ...draft, validityDays: e.target.value })} />

                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: 'var(--text-label)', textTransform: 'uppercase', marginBottom: '8px' }}>STATUS</div>
                    <SegmentedToggle options={[{ value: 'Aktif', label: 'Aktif' }, { value: 'Nonaktif', label: 'Nonaktif' }]} value={draft.status} onChange={(v: any) => setDraft({ ...draft, status: v })} />
                  </div>

                  {formMode === 'edit' && (
                    <>
                      <div style={{ height: '1px', background: '#EAE1D5', margin: '4px 0' }}></div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Hapus Reward</div>
                          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '3px', maxWidth: '340px', lineHeight: 1.5 }}>Reward ini akan hilang dari daftar dan tidak lagi bisa di-redeem member.</div>
                        </div>
                        <div style={{ width: '150px', flex: 'none' }}>
                          <Button variant="outline" onClick={() => { setDeleteTarget({ id: editingId, name: draft.name, fromForm: true }); setDeleteConfirmOpen(true); }} style={{ color: 'var(--text-primary)' }}>Hapus</Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <div style={{ flex: 1 }}><Button variant="outline" onClick={() => setScreen('list')}>Batal</Button></div>
                  <div style={{ flex: 1 }}><Button variant="primary" onClick={async () => {
                    if (!draft.menuItemId) {
                      alert('Item Menu wajib dipilih!');
                      return;
                    }
                    const record = { id: formMode === 'create' ? 'rw' + Date.now() : editingId!, name: draft.name || null, desc: draft.desc || null, visitsRequired: parseInt(draft.visitsRequired, 10) || 0, status: draft.status, validityDays: parseInt(draft.validityDays, 10) || 30, menuItemId: draft.menuItemId };
                    await saveReward(record);
                    setRewards(await getRewardsAdmin());
                    if (formMode !== 'system') setScreen('list');
                    else alert('Perubahan berhasil disimpan!');
                  }}>Simpan</Button></div>
                </div>
              </div>
            )}

            {screen === 'redeem' && (
              <div style={{ maxWidth: '760px', margin: '0 auto', padding: '52px 40px 60px', animation: 'rmFade .3s cubic-bezier(.22,1,.36,1)' }}>
                {redeemStep === 'search' && (
                  <>
                    <div style={{ fontSize: '27px', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>Redeem Reward</div>
                    <div style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '6px' }}>Cari member berdasarkan Nomor WhatsApp atau Member ID.</div>
                    
                    <div style={{ marginTop: '26px', background: 'var(--surface-card)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ flex: 'none', color: 'var(--caramel)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V4h3"></path><path d="M17 4h3v3"></path><path d="M20 17v3h-3"></path><path d="M7 20H4v-3"></path><line x1="4" y1="12" x2="20" y2="12"></line></svg>
                      </div>
                      <form onSubmit={handleBarcodeSubmit} style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--mist)', textTransform: 'uppercase', marginBottom: '4px' }}>Scan Barcode (Klik di sini)</div>
                        <input 
                          autoFocus
                          placeholder="Siap untuk scan..." 
                          value={barcodeInput} 
                          onChange={e => setBarcodeInput(e.target.value)} 
                          style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }} 
                        />
                      </form>
                    </div>

                    <div style={{ marginTop: '26px' }}>
                      <Input label="NOMOR WHATSAPP ATAU MEMBER ID" placeholder="Contoh: 0812-3456-7801 atau RR-01042" value={redeemSearchQuery} onChange={(e: any) => setRedeemSearchQuery(e.target.value)} />
                    </div>
                    {qRedeem && (
                      <div style={{ marginTop: '22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {redeemSearchResults.map(m => (
                          <div key={m.id} className="rm-row" onClick={() => { setRedeemSelectedId(m.id); setRedeemStep('select'); }} style={{ display: 'flex', alignItems: 'center', gap: '18px', background: 'var(--surface-card)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-lg)', padding: '16px 18px', cursor: 'pointer', boxShadow: 'var(--shadow-card)' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--linen)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: 'var(--caramel)', flex: 'none' }}>{m.initials}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
                              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>{m.memberId} · {m.wa}</div>
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums', flex: 'none' }}>{m.visits} kunjungan</div>
                          </div>
                        ))}
                        {redeemSearchResults.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', fontSize: '14px' }}>Tidak ada member yang cocok dengan “{redeemSearchQuery}”.</div>}
                      </div>
                    )}
                  </>
                )}

                {redeemStep === 'select' && redeemSelectedMember && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: '27px', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>Redeem Reward</div>
                        <div style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '6px' }}>Pilih reward yang ingin di-redeem untuk member ini.</div>
                      </div>
                      <div style={{ width: '170px' }}>
                        <Button variant="outline" onClick={() => { setRedeemStep('search'); setRedeemSearchQuery(''); }}>Cari member lain</Button>
                      </div>
                    </div>

                    <div style={{ marginTop: '22px', display: 'flex', alignItems: 'center', gap: '18px', background: 'var(--surface-card)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', boxShadow: 'var(--shadow-card)' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--linen)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 600, color: 'var(--caramel)', flex: 'none' }}>{initials(redeemSelectedMember.name)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{redeemSelectedMember.name}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>{redeemSelectedMember.memberId} · {redeemSelectedMember.wa}</div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', flex: 'none' }}>{redeemSelectedMember.visits} kunjungan</div>
                    </div>

                    <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {eligibilityRows.map(r => (
                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: r.cardBg, border: '1px solid var(--border-card)', borderRadius: 'var(--radius-lg)', padding: '16px 18px', boxShadow: 'var(--shadow-card)', opacity: r.cardOpacity }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>{r.statusText}</div>
                          </div>
                          <div style={{ width: '130px', flex: 'none' }}>
                            {r.alreadyRedeemed ? (
                              <div style={{ width: '100%', height: '44px', borderRadius: '14px', background: '#EAE1D5', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600 }}>Redeemed</div>
                            ) : r.eligible ? (
                              <Button variant="primary" onClick={() => { setRedeemTarget({ memberId: redeemSelectedMember.id, memberName: redeemSelectedMember.name, rewardId: r.id, rewardName: r.name, visitsRequired: r.visitsRequired, type: r.type }); setRedeemConfirmOpen(true); }}>Redeem</Button>
                            ) : (
                              <div style={{ width: '100%', height: '44px', borderRadius: '14px', background: '#F1EBE1', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600 }}>Belum memenuhi syarat</div>
                            )}
                          </div>
                        </div>
                      ))}
                      {eligibilityRows.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', fontSize: '14px' }}>Belum ada reward aktif untuk di-redeem.</div>}
                    </div>
                  </>
                )}
              </div>
            )}

            {screen === 'history' && (
              <div style={{ padding: '52px 40px 60px', animation: 'rmFade .3s cubic-bezier(.22,1,.36,1)' }}>
                <div style={{ fontSize: '27px', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>Riwayat Redeem</div>
                <div style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '6px' }}>{filteredHistory.length} riwayat ditemukan</div>

                <div style={{ marginTop: '22px', maxWidth: '420px' }}>
                  <Input label="" placeholder="Cari nama atau Member ID" value={historyQuery} onChange={(e: any) => setHistoryQuery(e.target.value)} />
                </div>

                <div style={{ marginTop: '22px', background: 'var(--surface-card)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1.6fr 1fr 1fr', gap: '10px', padding: '14px 20px', background: 'var(--linen)', fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', color: 'var(--text-label)', textTransform: 'uppercase' }}>
                    <div>Nama Member</div><div>Member ID</div><div>Reward yang Diredeem</div><div>Tanggal Redeem</div><div>Outlet</div>
                  </div>
                  {filteredHistory.map(h => (
                    <div key={h.id} className="rm-row" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1.6fr 1fr 1fr', gap: '10px', padding: '15px 20px', borderTop: '1px solid var(--border-divider)', alignItems: 'center', fontSize: '13.5px', color: 'var(--text-body)' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{h.memberName}</div>
                      <div style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{h.memberId}</div>
                      <div>{h.rewardName}</div>
                      <div style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{h.dateLabel}</div>
                      <div style={{ color: 'var(--text-secondary)' }}>{h.outlet}</div>
                    </div>
                  ))}
                  {filteredHistory.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px', borderTop: '1px solid var(--border-divider)' }}>Tidak ada riwayat yang cocok.</div>}
                </div>
              </div>
            )}

          </div>{/* close overflowY:auto */}
        </div>      {deleteConfirmOpen && deleteTarget && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(43, 30, 24, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ width: '420px', background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', padding: '26px', boxShadow: '0 30px 60px -20px rgba(0, 0, 0, 0.5)' }}>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Hapus reward ini?</div>
              <div style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'var(--text-secondary)', marginTop: '10px' }}>Hapus “{deleteTarget.name}” dari Daftar Reward? Member tidak akan lagi bisa menukar reward ini.</div>
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
            <div style={{ width: '420px', background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', padding: '26px', boxShadow: '0 30px 60px -20px rgba(0, 0, 0, 0.5)' }}>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Confirm Redemption</div>
              <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)', marginTop: '10px' }}>
                Are you sure you want to redeem <strong>{redeemTarget.rewardName}</strong> for user <strong>{redeemTarget.memberName}</strong>?
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '26px' }}>
                <div style={{ flex: 1 }}><Button variant="outline" onClick={() => setRedeemConfirmOpen(false)}>Cancel</Button></div>
                <div style={{ flex: 1 }}><Button variant="primary" onClick={async () => {
                  try {
                    setRedeemLoading(true);
                    await redeemRewardAdmin(redeemTarget.memberId, redeemTarget.rewardId, redeemTarget.type || 'template');
                    setRedeemLoading(false);
                    setRedeemConfirmOpen(false);
                    setRedeemSuccessData(redeemTarget);
                    setRedeemSuccessOpen(true);
                  } catch (e: any) {
                    setRedeemLoading(false);
                    alert(e.message || e);
                  }
                }}>{redeemLoading ? 'Redeeming...' : 'Proceed'}</Button></div>
              </div>
            </div>
          </div>
        )}

        {redeemSuccessOpen && redeemSuccessData && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(43, 30, 24, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
            <style>{`
            @keyframes popScale {
              0% { opacity: 0; transform: scale(0.9); }
              50% { transform: scale(1.05); }
              100% { opacity: 1; transform: scale(1); }
            }
            @keyframes checkmark {
              0% { stroke-dashoffset: 24; }
              100% { stroke-dashoffset: 0; }
            }
          `}</style>
            <div style={{ width: '380px', background: 'var(--surface-card)', borderRadius: '24px', padding: '32px 26px', boxShadow: '0 30px 60px -20px rgba(0, 0, 0, 0.5)', textAlign: 'center', animation: 'popScale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(122, 150, 116, 0.15)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5A6A54" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 24, strokeDashoffset: 24, animation: 'checkmark 0.4s ease-out 0.2s forwards' }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>Redemption Successful!</div>
              <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)', marginTop: '12px' }}>
                Successfully redeemed <strong>{redeemSuccessData.rewardName}</strong> for <strong>{redeemSuccessData.memberName}</strong>.
              </div>
              <div style={{ marginTop: '28px' }}>
                <Button variant="primary" onClick={() => {
                  setRedeemSuccessOpen(false);
                  setRedeemStep('search');
                  setRedeemSelectedId(null);
                  setRedeemSearchQuery('');
                }} style={{ width: '100%' }}>Done</Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
