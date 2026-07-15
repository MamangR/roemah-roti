'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { LockedPage } from '@/components/admin/LockedPage';
import { ImageSelector } from '@/components/admin/ImageSelector';

function fmtDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
function statusPill(kind: string, value: string) {
  if (kind === 'newMenu') {
    if (value === 'Published') return { bg: 'rgba(122, 150, 116, 0.18)', color: '#5A6A54' };
    return { bg: '#F1EBE1', color: '#7A6A5F' };
  }
  if (value === 'Aktif') return { bg: 'rgba(122, 150, 116, 0.18)', color: '#5A6A54' };
  if (value === 'Segera Berakhir') return { bg: 'rgba(166,124,82,.16)', color: '#3B2A22' };
  return { bg: '#F1EBE1', color: '#7A6A5F' };
}

function emptyDraft(type: string) {
  if (type === 'newMenu') return { name: '', category: 'Bread', shortDesc: '', longDesc: '', imageUrl: '', price: '', dateAdded: todayIso(), status: 'Draft' };
  if (type === 'promo') return { name: '', shortDesc: '', longDesc: '', imageUrl: '', terms: [''], startDate: todayIso(), endDate: todayIso(), promoStatus: 'Aktif' };
  return { title: '', summary: '', content: '', outlet: 'All outlets', pinned: false, datePosted: todayIso() };
}

const Button = ({ variant, onClick, children, style, disabled }: any) => {
  const isPri = variant === 'primary';
  return (
    <div onClick={disabled ? undefined : onClick} style={{ padding: '10px 16px', borderRadius: '14px', fontSize: '13px', fontWeight: 600, textAlign: 'center', cursor: disabled ? 'not-allowed' : 'pointer', background: isPri ? '#A67C52' : 'transparent', color: isPri ? '#fff' : '#3B2A22', border: isPri ? 'none' : '1px solid #E0D5C6', boxShadow: isPri ? '0 14px 26px -14px rgba(166, 124, 82, 0.9)' : 'none', opacity: disabled ? 0.6 : 1, ...style }}>
      {children}
    </div>
  );
};

const Input = ({ label, placeholder, value, onChange, type = 'text' }: any) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    {label && <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: '#A08A7B', textTransform: 'uppercase' }}>{label}</div>}
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ background: '#FFFFFF', border: '1px solid #E6DDD0', borderRadius: '14px', padding: '12px 14px', fontSize: '15px', color: '#3B2A22', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
  </div>
);

const SegmentedToggle = ({ options, value, onChange }: any) => (
  <div style={{ display: 'flex', background: '#F1EBE1', borderRadius: '14px', padding: '4px' }}>
    {options.map((o: any) => {
      const isSel = value === o.value;
      const isDis = o.disabled;
      return (
        <div
          key={o.value}
          onClick={isDis ? undefined : () => onChange(o.value)}
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: isDis ? 'not-allowed' : 'pointer',
            background: isSel ? '#fff' : 'transparent',
            borderRadius: '11px',
            color: isSel ? '#3B2A22' : (isDis ? 'rgba(59,42,34,0.3)' : '#A08A7B'),
            boxShadow: isSel ? '0 4px 12px -4px rgba(59,42,34,.25)' : 'none',
            opacity: isDis ? 0.5 : 1
          }}
        >
          {o.label}
        </div>
      );
    })}
  </div>
);

export default function UpdatesManagementPageWrapper() {
  const { adminUser, hasPermission, loading: authLoading } = useAdminAuth();

  if (authLoading) return null;
  if (!adminUser) return null;
  // allow all admin/cashiers to view updates
  
  return <UpdatesManagementPage />;
}

function UpdatesManagementPage() {
  const router = useRouter();
  const { adminUser, hasPermission } = useAdminAuth();
  const canManageUpdates = hasPermission('manage_updates');
  const [screen, setScreen] = useState<'list' | 'form'>('list');
  const [activeTab, setActiveTab] = useState('newMenu');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [newMenuItems, setNewMenuItems] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formType, setFormType] = useState('newMenu');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<any>(emptyDraft('newMenu'));

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  // ─── Fetch all three lists on mount ─────────────────────────────────────────
  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const [nm, pr, an] = await Promise.all([
          fetch('/api/updates?type=newMenu').then(r => r.json()),
          fetch('/api/updates?type=promo').then(r => r.json()),
          fetch('/api/updates?type=announcement').then(r => r.json()),
        ]);
        setNewMenuItems(Array.isArray(nm) ? nm : []);
        setPromos(Array.isArray(pr) ? pr : []);
        setAnnouncements(Array.isArray(an) ? an : []);
      } catch (err) {
        console.error('Failed to load updates', err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  // Enforce promo status rules dynamically when end date changes in draft
  useEffect(() => {
    if (formType === 'promo' && draft && draft.endDate) {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const end = new Date(draft.endDate + 'T23:59:59');
      const today = new Date(todayStr + 'T00:00:00');
      const diffTime = end.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        if (draft.promoStatus !== 'Berakhir') {
          setDraft((d: any) => ({ ...d, promoStatus: 'Berakhir' }));
        }
      } else if (diffDays <= 3) {
        if (draft.promoStatus !== 'Segera Berakhir') {
          setDraft((d: any) => ({ ...d, promoStatus: 'Segera Berakhir' }));
        }
      } else {
        if (draft.promoStatus !== 'Aktif') {
          setDraft((d: any) => ({ ...d, promoStatus: 'Aktif' }));
        }
      }
    }
  }, [draft?.endDate, formType]);

  // ─── Refresh a single list ───────────────────────────────────────────────────
  async function refreshList(type: string) {
    const res = await fetch(`/api/updates?type=${type}`);
    const data = await res.json();
    if (type === 'newMenu') setNewMenuItems(Array.isArray(data) ? data : []);
    else if (type === 'promo') setPromos(Array.isArray(data) ? data : []);
    else setAnnouncements(Array.isArray(data) ? data : []);
  }

  // ─── Save (create or update) ─────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    try {
      const isEdit = formMode === 'edit';
      let finalPromoStatus = draft.promoStatus;
      if (formType === 'promo' && draft.endDate) {
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        const end = new Date(draft.endDate + 'T23:59:59');
        const today = new Date(todayStr + 'T00:00:00');
        const diffTime = end.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          finalPromoStatus = 'Berakhir';
        } else if (diffDays <= 3) {
          finalPromoStatus = 'Segera Berakhir';
        } else {
          finalPromoStatus = 'Aktif';
        }
      }
      const payload = {
        type: formType,
        ...(isEdit ? { id: editingId } : {}),
        ...draft,
        ...(formType === 'promo' ? { promoStatus: finalPromoStatus } : {})
      };
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch('/api/updates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');
      await refreshList(formType);
      setScreen('list');
    } catch (err) {
      alert('Gagal menyimpan. Coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  // ─── Delete ──────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const type = deleteTarget.type || formType;
      const res = await fetch('/api/updates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id: deleteTarget.id }),
      });
      if (!res.ok) throw new Error('Delete failed');
      await refreshList(type);
      setDeleteConfirmOpen(false);
      if (deleteTarget.fromForm) setScreen('list');
    } catch (err) {
      alert('Gagal menghapus. Coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  const totalCount = newMenuItems.length + promos.length + announcements.length;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#FCFBF8', fontFamily: "'Inter', sans-serif", color: '#3B2A22', boxSizing: 'border-box', overflow: 'hidden' }}>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(26,19,15,0.55)', backdropFilter: 'blur(2px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '260px', background: '#3B2A22', display: 'flex', flexDirection: 'column', padding: '26px 18px', boxSizing: 'border-box', boxShadow: '4px 0 40px rgba(0,0,0,0.4)' }}>
            <div onClick={() => router.push(adminUser?.role === 'cashier' ? '/admin/cashierdashboard' : '/admin')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '11px', padding: '0 8px 26px', borderBottom: '1px solid rgba(248, 244, 238, 0.12)' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><span style={{ fontSize: '15px', fontWeight: 700, color: '#E9C9A6', letterSpacing: '-.02em' }}>RR</span></div>
              <div><div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.22em', color: 'rgba(248, 244, 238, 0.72)' }}>ROEMAH ROTI</div><div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(248, 244, 238, 0.92)', marginTop: '2px' }}>{adminUser?.role === 'cashier' ? 'Cashier Menu' : 'Dashboard'}</div></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '22px' }}>
              <div onClick={() => { setScreen('list'); setSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 12px', borderRadius: '12px', cursor: 'pointer', background: 'rgba(166,124,82,.9)', color: '#2A1E18' }}>
                <div style={{ width: '16px', height: '12px', flex: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}><span style={{ height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></span><span style={{ height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></span><span style={{ height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></span></div>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Daftar Update</span>
              </div>
            </div>
            <div style={{ flex: 1 }}></div>
            <div style={{ padding: '12px', fontSize: '11px', lineHeight: 1.5, color: 'rgba(248, 244, 238, 0.5)' }}>Alat Staf · Penggunaan Internal<br />{loading ? 'Memuat...' : `${totalCount} update tersimpan`}</div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar — hidden on mobile */}
      <div style={{ width: '250px', flex: 'none', background: '#3B2A22', display: 'flex', flexDirection: 'column', padding: '26px 18px', boxSizing: 'border-box' }} className="hidden md:flex">
        <div onClick={() => router.push(adminUser?.role === 'cashier' ? '/admin/cashierdashboard' : '/admin')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '11px', padding: '0 8px 26px', borderBottom: '1px solid rgba(248, 244, 238, 0.12)' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#E9C9A6', letterSpacing: '-.02em' }}>RR</span>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.22em', color: 'rgba(248, 244, 238, 0.72)' }}>ROEMAH ROTI</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(248, 244, 238, 0.92)', marginTop: '2px' }}>{adminUser?.role === 'cashier' ? 'Cashier Menu' : 'Dashboard'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '22px' }}>
          <div onClick={() => setScreen('list')} style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 12px', borderRadius: '12px', cursor: 'pointer', background: 'rgba(166,124,82,.9)', color: '#2A1E18' }}>
            <div style={{ width: '16px', height: '12px', flex: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span style={{ height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></span>
              <span style={{ height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></span>
              <span style={{ height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></span>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Daftar Update</span>
          </div>
        </div>

        <div style={{ flex: 1 }}></div>
        <div style={{ padding: '12px', fontSize: '11px', lineHeight: 1.5, color: 'rgba(248, 244, 238, 0.5)' }}>
          Alat Staf · Penggunaan Internal<br />
          {loading ? 'Memuat...' : `${totalCount} update tersimpan`}
        </div>
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
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(248,244,238,.92)', marginLeft: '2px' }}>Manajemen Update</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', boxSizing: 'border-box' }}>

          {screen === 'list' && (
            <div style={{ padding: '52px 40px 60px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '27px', fontWeight: 600, letterSpacing: '-0.03em', color: '#3B2A22' }}>Daftar Update</div>
                  <div style={{ fontSize: '15px', color: '#7A6A5F', marginTop: '6px' }}>{
                    loading ? 'Memuat data...' :
                      activeTab === 'newMenu' ? newMenuItems.length + ' item tersimpan' :
                        activeTab === 'promo' ? promos.length + ' promo tersimpan' :
                          announcements.length + ' announcement tersimpan'
                  }</div>
                </div>
                <div style={{ width: '180px', opacity: canManageUpdates ? 1 : 0.4, pointerEvents: canManageUpdates ? 'auto' : 'none' }}>
                  <Button variant="primary" onClick={() => { setFormMode('add'); setFormType(activeTab); setDraft(emptyDraft(activeTab)); setScreen('form'); }}>+ Tambah Update</Button>
                </div>
              </div>

              <div style={{ marginTop: '22px', maxWidth: '480px' }}>
                <SegmentedToggle options={[
                  { value: 'newMenu', label: 'Menu Baru' },
                  { value: 'promo', label: 'Promo' },
                  { value: 'announcement', label: 'Announcement' }
                ]} value={activeTab} onChange={setActiveTab} />
              </div>

              {loading && (
                <div style={{ marginTop: '40px', textAlign: 'center', color: '#A08A7B', fontSize: '14px' }}>Memuat data...</div>
              )}

              {!loading && activeTab === 'newMenu' && (
                <div style={{ marginTop: '22px', background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)', overflow: 'hidden' }}>
                  <div className="text-responsive-heading" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr .9fr 1fr', gap: '10px', padding: '14px 20px', background: '#F8F4EE', fontWeight: 600, letterSpacing: '.08em', color: '#A08A7B', textTransform: 'uppercase' }}>
                    <div>Nama</div><div>Kategori</div><div>Tanggal Ditambahkan</div><div>Status</div><div>Aksi</div>
                  </div>
                  {newMenuItems.map(it => {
                    const p = statusPill('newMenu', it.status);
                    return (
                      <div key={it.id} className="text-responsive-row" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr .9fr 1fr', gap: '10px', padding: '15px 20px', borderTop: '1px solid #EAE1D5', alignItems: 'center', color: '#4A3830' }}>
                        <div style={{ fontWeight: 600, color: '#3B2A22' }}>{it.name}</div>
                        <div style={{ color: '#7A6A5F' }}>{it.category}</div>
                        <div style={{ color: '#7A6A5F', fontVariantNumeric: 'tabular-nums' }}>{fmtDate(it.dateAdded)}</div>
                        <div>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: p.bg, color: p.color, fontSize: '11px', fontWeight: 600, padding: '4px 9px', borderRadius: '999px' }}>
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: p.color }}></span>{it.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '14px', opacity: canManageUpdates ? 1 : 0.4, pointerEvents: canManageUpdates ? 'auto' : 'none' }}>
                          <span onClick={() => { setFormMode('edit'); setFormType('newMenu'); setEditingId(it.id); setDraft({ name: it.name, category: it.category, shortDesc: it.shortDesc, longDesc: it.longDesc, imageUrl: it.imageUrl || '', price: it.price || '', dateAdded: it.dateAdded, status: it.status }); setScreen('form'); }} style={{ fontSize: '12.5px', fontWeight: 600, color: '#A67C52', cursor: 'pointer' }}>Edit</span>
                          <span onClick={() => { setDeleteTarget({ id: it.id, name: it.name, type: 'newMenu' }); setDeleteConfirmOpen(true); }} style={{ fontSize: '12.5px', fontWeight: 600, color: '#7A6A5F', cursor: 'pointer' }}>Hapus</span>
                        </div>
                      </div>
                    );
                  })}
                  {newMenuItems.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#7A6A5F', fontSize: '14px', borderTop: '1px solid #EAE1D5' }}>Belum ada menu baru.</div>}
                </div>
              )}

              {!loading && activeTab === 'promo' && (
                <div style={{ marginTop: '22px', background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)', overflow: 'hidden' }}>
                  <div className="text-responsive-heading" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.4fr .9fr 1fr', gap: '10px', padding: '14px 20px', background: '#F8F4EE', fontWeight: 600, letterSpacing: '.08em', color: '#A08A7B', textTransform: 'uppercase' }}>
                    <div>Nama</div><div>Masa Berlaku</div><div>Status</div><div>Aksi</div>
                  </div>
                  {promos.map(it => {
                    const p = statusPill('promo', it.promoStatus);
                    return (
                      <div key={it.id} className="text-responsive-row" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.4fr .9fr 1fr', gap: '10px', padding: '15px 20px', borderTop: '1px solid #EAE1D5', alignItems: 'center', color: '#4A3830' }}>
                        <div style={{ fontWeight: 600, color: '#3B2A22' }}>{it.name}</div>
                        <div style={{ color: '#7A6A5F', fontVariantNumeric: 'tabular-nums' }}>{fmtDate(it.startDate)} – {fmtDate(it.endDate)}</div>
                        <div>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: p.bg, color: p.color, fontSize: '11px', fontWeight: 600, padding: '4px 9px', borderRadius: '999px' }}>
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: p.color }}></span>{it.promoStatus}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '14px', opacity: canManageUpdates ? 1 : 0.4, pointerEvents: canManageUpdates ? 'auto' : 'none' }}>
                          <span onClick={() => { setFormMode('edit'); setFormType('promo'); setEditingId(it.id); setDraft({ name: it.name, shortDesc: it.shortDesc, longDesc: it.longDesc, imageUrl: it.imageUrl || '', terms: it.terms ?? [''], startDate: it.startDate, endDate: it.endDate, promoStatus: it.promoStatus }); setScreen('form'); }} style={{ fontSize: '12.5px', fontWeight: 600, color: '#A67C52', cursor: 'pointer' }}>Edit</span>
                          <span onClick={() => { setDeleteTarget({ id: it.id, name: it.name, type: 'promo' }); setDeleteConfirmOpen(true); }} style={{ fontSize: '12.5px', fontWeight: 600, color: '#7A6A5F', cursor: 'pointer' }}>Hapus</span>
                        </div>
                      </div>
                    );
                  })}
                  {promos.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#7A6A5F', fontSize: '14px', borderTop: '1px solid #EAE1D5' }}>Belum ada promo.</div>}
                </div>
              )}

              {!loading && activeTab === 'announcement' && (
                <div style={{ marginTop: '22px', background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)', overflow: 'hidden' }}>
                  <div className="text-responsive-heading" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr .8fr 1fr', gap: '10px', padding: '14px 20px', background: '#F8F4EE', fontWeight: 600, letterSpacing: '.08em', color: '#A08A7B', textTransform: 'uppercase' }}>
                    <div>Judul</div><div>Outlet</div><div>Tanggal Posting</div><div>Pinned</div><div>Aksi</div>
                  </div>
                  {announcements.map(it => (
                    <div key={it.id} className="text-responsive-row" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr .8fr 1fr', gap: '10px', padding: '15px 20px', borderTop: '1px solid #EAE1D5', alignItems: 'center', color: '#4A3830' }}>
                      <div style={{ fontWeight: 600, color: '#3B2A22' }}>{it.title}</div>
                      <div style={{ color: '#7A6A5F' }}>{it.outlet}</div>
                      <div style={{ color: '#7A6A5F', fontVariantNumeric: 'tabular-nums' }}>{fmtDate(it.datePosted)}</div>
                      <div>
                        {it.pinned ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(166,124,82,.14)', color: '#A67C52', fontSize: '11px', fontWeight: 600, padding: '4px 9px', borderRadius: '999px' }}>Ya</span>
                        ) : (
                          <span style={{ color: '#7A6A5F' }}>Tidak</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '14px', opacity: canManageUpdates ? 1 : 0.4, pointerEvents: canManageUpdates ? 'auto' : 'none' }}>
                        <span onClick={() => { setFormMode('edit'); setFormType('announcement'); setEditingId(it.id); setDraft({ title: it.title, summary: it.summary, content: it.content, outlet: it.outlet, pinned: it.pinned, datePosted: it.datePosted }); setScreen('form'); }} style={{ fontSize: '12.5px', fontWeight: 600, color: '#A67C52', cursor: 'pointer' }}>Edit</span>
                        <span onClick={() => { setDeleteTarget({ id: it.id, name: it.title, type: 'announcement' }); setDeleteConfirmOpen(true); }} style={{ fontSize: '12.5px', fontWeight: 600, color: '#7A6A5F', cursor: 'pointer' }}>Hapus</span>
                      </div>
                    </div>
                  ))}
                  {announcements.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#7A6A5F', fontSize: '14px', borderTop: '1px solid #EAE1D5' }}>Belum ada announcement.</div>}
                </div>
              )}
            </div>
          )}

          {screen === 'form' && (
            <div style={{ maxWidth: '640px', margin: '0 auto', padding: '52px 40px 60px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div onClick={() => setScreen('list')} style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#3B2A22', flex: 'none' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#7A6A5F' }}>Batal, kembali ke Daftar Update</div>
              </div>

              <div style={{ fontSize: '27px', fontWeight: 600, letterSpacing: '-0.03em', color: '#3B2A22' }}>
                {formMode === 'add' ? 'Tambah Update Baru' : 'Edit Update'}
              </div>
              <div style={{ fontSize: '15px', color: '#7A6A5F', marginTop: '6px' }}>
                {formMode === 'add' ? 'Pilih jenis konten dan lengkapi detailnya.' : 'Ubah detail konten dan simpan.'}
              </div>

              {formMode === 'add' && (
                <div style={{ marginTop: '22px', maxWidth: '480px' }}>
                  <SegmentedToggle options={[
                    { value: 'newMenu', label: 'Menu Baru' },
                    { value: 'promo', label: 'Promo' },
                    { value: 'announcement', label: 'Announcement' }
                  ]} value={formType} onChange={(v: any) => { setFormType(v); setDraft(emptyDraft(v)); }} />
                </div>
              )}

              <div style={{ marginTop: '24px', background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', padding: '22px', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {formType === 'newMenu' && (
                  <>
                    <Input label="NAMA ITEM" placeholder="Contoh: Kouign-Amann Saltbread" value={draft.name} onChange={(e: any) => setDraft({ ...draft, name: e.target.value })} />
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', textTransform: 'uppercase', marginBottom: '8px' }}>KATEGORI</div>
                      <SegmentedToggle options={[
                        { value: 'Bread', label: 'Bread' },
                        { value: 'Pastry', label: 'Pastry' },
                        { value: 'Cake', label: 'Cake' },
                        { value: 'Coffee', label: 'Coffee' },
                        { value: 'Beverage', label: 'Beverage' }
                      ]} value={draft.category} onChange={(v: any) => setDraft({ ...draft, category: v })} />
                    </div>
                    <Input label="DESKRIPSI SINGKAT" placeholder="Satu kalimat singkat" value={draft.shortDesc} onChange={(e: any) => setDraft({ ...draft, shortDesc: e.target.value })} />
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', textTransform: 'uppercase', marginBottom: '8px' }}>DESKRIPSI LENGKAP</div>
                      <textarea value={draft.longDesc} onChange={(e: any) => setDraft({ ...draft, longDesc: e.target.value })} placeholder="Ceritakan lebih detail tentang item ini" rows={4} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E6DDD0', borderRadius: '14px', padding: '11px 13px', fontSize: '14px', fontFamily: "'Inter', sans-serif", color: '#3B2A22', background: '#FFFFFF', outline: 'none', resize: 'vertical' }} />
                    </div>
                    <Input label="HARGA (RUPIAH - OPSIONAL)" placeholder="Contoh: 18000" type="number" value={draft.price || ''} onChange={(e: any) => setDraft({ ...draft, price: e.target.value === '' ? '' : parseInt(e.target.value) })} />
                    <ImageSelector label="THUMBNAIL IMAGE (OPSIONAL)" value={draft.imageUrl || ''} onChange={(val: string) => setDraft({ ...draft, imageUrl: val })} />
                    <Input label="TANGGAL TAYANG" type="date" value={draft.dateAdded} onChange={(e: any) => setDraft({ ...draft, dateAdded: e.target.value })} />
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', textTransform: 'uppercase', marginBottom: '8px' }}>STATUS</div>
                      <SegmentedToggle options={[
                        { value: 'Published', label: 'Published' },
                        { value: 'Draft', label: 'Draft' }
                      ]} value={draft.status} onChange={(v: any) => setDraft({ ...draft, status: v })} />
                    </div>
                  </>
                )}

                {formType === 'promo' && (
                  <>
                    <Input label="NAMA PROMO" placeholder="Contoh: Weekday Morning Set" value={draft.name} onChange={(e: any) => setDraft({ ...draft, name: e.target.value })} />
                    <Input label="DESKRIPSI SINGKAT" placeholder="Satu kalimat singkat" value={draft.shortDesc} onChange={(e: any) => setDraft({ ...draft, shortDesc: e.target.value })} />
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', textTransform: 'uppercase', marginBottom: '8px' }}>DESKRIPSI LENGKAP</div>
                      <textarea value={draft.longDesc} onChange={(e: any) => setDraft({ ...draft, longDesc: e.target.value })} placeholder="Ceritakan lebih detail tentang promo ini" rows={4} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E6DDD0', borderRadius: '14px', padding: '11px 13px', fontSize: '14px', fontFamily: "'Inter', sans-serif", color: '#3B2A22', background: '#FFFFFF', outline: 'none', resize: 'vertical' }} />
                    </div>
                    <ImageSelector label="THUMBNAIL IMAGE (OPSIONAL)" value={draft.imageUrl || ''} onChange={(val: string) => setDraft({ ...draft, imageUrl: val })} />
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', textTransform: 'uppercase', marginBottom: '8px' }}>SYARAT & KETENTUAN</div>
                      {(draft.terms ?? ['']).map((t: string, i: number) => (
                        <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={t}
                            onChange={(e: any) => {
                              const terms = [...(draft.terms ?? [''])];
                              terms[i] = e.target.value;
                              setDraft({ ...draft, terms });
                            }}
                            placeholder={`Syarat ${i + 1}`}
                            style={{ flex: 1, background: '#FFFFFF', border: '1px solid #E6DDD0', borderRadius: '12px', padding: '10px 13px', fontSize: '14px', color: '#3B2A22', outline: 'none', boxSizing: 'border-box' }}
                          />
                          {(draft.terms ?? ['']).length > 1 && (
                            <span onClick={() => { const terms = (draft.terms ?? ['']).filter((_: any, idx: number) => idx !== i); setDraft({ ...draft, terms }); }} style={{ cursor: 'pointer', color: '#A08A7B', fontSize: '18px', lineHeight: 1, paddingBottom: '2px' }}>×</span>
                          )}
                        </div>
                      ))}
                      <span onClick={() => setDraft({ ...draft, terms: [...(draft.terms ?? ['']), ''] })} style={{ fontSize: '12.5px', fontWeight: 600, color: '#A67C52', cursor: 'pointer' }}>+ Tambah syarat</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <Input label="TANGGAL MULAI" type="date" value={draft.startDate} onChange={(e: any) => setDraft({ ...draft, startDate: e.target.value })} />
                      <Input label="TANGGAL BERAKHIR" type="date" value={draft.endDate} onChange={(e: any) => setDraft({ ...draft, endDate: e.target.value })} />
                    </div>
                    {(() => {
                      let diffDays = 999;
                      if (draft.endDate) {
                        const now = new Date();
                        const todayStr = now.toISOString().slice(0, 10);
                        const end = new Date(draft.endDate + 'T23:59:59');
                        const today = new Date(todayStr + 'T00:00:00');
                        const diffTime = end.getTime() - today.getTime();
                        diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      }
                      return (
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', textTransform: 'uppercase', marginBottom: '8px' }}>STATUS</div>
                          <SegmentedToggle options={[
                            { value: 'Aktif', label: 'Aktif', disabled: diffDays <= 3 },
                            { value: 'Segera Berakhir', label: 'Segera Berakhir', disabled: diffDays > 3 || diffDays < 0 },
                            { value: 'Berakhir', label: 'Berakhir', disabled: diffDays >= 0 }
                          ]} value={draft.promoStatus} onChange={(v: any) => setDraft({ ...draft, promoStatus: v })} />
                        </div>
                      );
                    })()}
                  </>
                )}

                {formType === 'announcement' && (
                  <>
                    <Input label="JUDUL" placeholder="Contoh: Jam Buka Saat Libur" value={draft.title} onChange={(e: any) => setDraft({ ...draft, title: e.target.value })} />
                    <Input label="RINGKASAN" placeholder="Satu kalimat ringkasan" value={draft.summary} onChange={(e: any) => setDraft({ ...draft, summary: e.target.value })} />
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', textTransform: 'uppercase', marginBottom: '8px' }}>ISI LENGKAP</div>
                      <textarea value={draft.content} onChange={(e: any) => setDraft({ ...draft, content: e.target.value })} placeholder="Tuliskan isi lengkap announcement" rows={4} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E6DDD0', borderRadius: '14px', padding: '11px 13px', fontSize: '14px', fontFamily: "'Inter', sans-serif", color: '#3B2A22', background: '#FFFFFF', outline: 'none', resize: 'vertical' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', textTransform: 'uppercase', marginBottom: '8px' }}>OUTLET</div>
                      <SegmentedToggle options={[
                        { value: 'All outlets', label: 'All outlets' },
                        { value: 'Greenville outlet', label: 'Greenville' },
                        { value: 'Senopati outlet', label: 'Senopati' }
                      ]} value={draft.outlet} onChange={(v: any) => setDraft({ ...draft, outlet: v })} />
                    </div>
                    <Input label="TANGGAL POSTING" type="date" value={draft.datePosted} onChange={(e: any) => setDraft({ ...draft, datePosted: e.target.value })} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8F4EE', borderRadius: '14px', padding: '14px 16px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#3B2A22' }}>Sematkan di atas</div>
                        <div style={{ fontSize: '12.5px', color: '#7A6A5F', marginTop: '3px' }}>Announcement ini akan selalu tampil di atas daftar.</div>
                      </div>
                      <div onClick={() => setDraft({ ...draft, pinned: !draft.pinned })} style={{ width: '46px', height: '27px', borderRadius: '999px', background: draft.pinned ? '#5C7B5A' : '#E6DDD0', flex: 'none', position: 'relative', cursor: 'pointer', transition: 'background .2s ease' }}>
                        <div style={{ position: 'absolute', top: '2.5px', left: draft.pinned ? '21px' : '3px', width: '22px', height: '22px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(59,42,34,.3)', transition: 'left .2s cubic-bezier(.22,1,.36,1)' }}></div>
                      </div>
                    </div>
                  </>
                )}

                {formMode === 'edit' && (
                  <>
                    <div style={{ height: '1px', background: '#EAE1D5', margin: '4px 0' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#3B2A22' }}>Hapus Update</div>
                        <div style={{ fontSize: '12.5px', color: '#7A6A5F', marginTop: '3px', maxWidth: '340px', lineHeight: 1.5 }}>Update ini akan hilang dari daftar dan tidak lagi tampil untuk member.</div>
                      </div>
                      <div style={{ width: '150px', flex: 'none' }}>
                        <Button variant="outline" onClick={() => { setDeleteTarget({ id: editingId, name: draft.name || draft.title, type: formType, fromForm: true }); setDeleteConfirmOpen(true); }} style={{ color: '#3B2A22' }}>Hapus</Button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <div style={{ flex: 1 }}><Button variant="outline" onClick={() => setScreen('list')}>Batal</Button></div>
                <div style={{ flex: 1 }}><Button variant="primary" disabled={saving} onClick={handleSave}>{saving ? 'Menyimpan...' : 'Simpan'}</Button></div>
              </div>
            </div>
          )}

        </div>{/* close overflowY:auto */}
      </div>{/* close flex flex-col main wrapper */}

      {deleteConfirmOpen && deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(43, 30, 24, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: '420px', background: '#FFFFFF', borderRadius: '22px', padding: '26px', boxShadow: '0 30px 60px -20px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#3B2A22' }}>Hapus update ini?</div>
            <div style={{ fontSize: '13.5px', lineHeight: 1.6, color: '#7A6A5F', marginTop: '10px' }}>Hapus "{deleteTarget.name}" dari Updates? Member tidak akan lagi melihat ini.</div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '22px' }}>
              <div style={{ flex: 1 }}><Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Batal</Button></div>
              <div style={{ flex: 1 }}><Button variant="primary" disabled={saving} onClick={handleDelete}>{saving ? 'Menghapus...' : 'Hapus'}</Button></div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
