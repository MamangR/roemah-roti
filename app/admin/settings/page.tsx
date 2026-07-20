'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { LockedPage } from '@/components/admin/LockedPage';

const PERMISSIONS = [
  { id: 'view_dashboard', label: 'View dashboard & reports', cashierDefault: false },
  { id: 'manage_members', label: 'Manage members', cashierDefault: false },
  { id: 'add_visits', label: 'Add visits', cashierDefault: true },
  { id: 'redeem_rewards', label: 'Redeem rewards', cashierDefault: true },
  { id: 'manage_rewards', label: 'Create/edit/delete rewards', cashierDefault: false },
  { id: 'manage_referral', label: 'Manage referral program', cashierDefault: false },
  { id: 'manage_updates', label: 'Create/edit/delete updates', cashierDefault: false },
  { id: 'manage_settings', label: 'Manage settings', cashierDefault: false },
  { id: 'manage_pos', label: 'Manage POS integration', cashierDefault: false },
  { id: 'manage_whatsapp', label: 'Manage WhatsApp API', cashierDefault: false },
];

function fmtLogTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

const SEED_SYNC_LOGS = [
  { id: 'l1', time: '2026-07-05T08:12:00', status: 'Success' },
  { id: 'l2', time: '2026-07-05T07:57:00', status: 'Success' },
  { id: 'l3', time: '2026-07-05T07:42:00', status: 'Success' },
  { id: 'l4', time: '2026-07-05T07:27:00', status: 'Failed, retrying' },
  { id: 'l5', time: '2026-07-05T07:12:00', status: 'Success' },
];

const SEED_MAPPINGS = [
  { id: 'sm1', name: 'Roemah Roti Greenville', posId: 'POS-GRV-001' },
  { id: 'sm2', name: 'Roemah Roti Kemang', posId: 'POS-KMG-002' },
];

const SEED_TEMPLATES = [
  { id: 'tpl_bday', name: 'Birthday reminder', body: 'Selamat ulang tahun dari kami di Roemah Roti. Semoga hari ini menyenangkan \u2014 mampir ya, ada sesuatu yang menunggu untuk Anda.' },
  { id: 'tpl_reward', name: 'Reward notification', body: 'Reward Anda sudah siap ditukar di Roemah Roti. Tunjukkan kartu member Anda saat kunjungan berikutnya.' },
  { id: 'tpl_referral', name: 'Referral notification', body: 'Teman yang Anda ajak sudah bergabung sebagai member Roemah Roti. Kunjungan bonus sudah ditambahkan ke akun Anda.' },
];

const Button = ({ variant, onClick, children, style }: any) => {
  const isPri = variant === 'primary';
  return (
    <div onClick={onClick} style={{ padding: '10px 16px', borderRadius: '14px', fontSize: '13px', fontWeight: 600, textAlign: 'center', cursor: 'pointer', background: isPri ? '#A67C52' : 'transparent', color: isPri ? '#fff' : '#3B2A22', border: isPri ? 'none' : '1px solid #E0D5C6', boxShadow: isPri ? '0 14px 26px -14px rgba(166, 124, 82, 0.9)' : 'none', ...style }}>
      {children}
    </div>
  );
};

export default function SettingsPageWrapper() {
  const { adminUser, hasPermission, loading: authLoading } = useAdminAuth();

  if (authLoading) return null;
  if (!adminUser) return null;
  if (!hasPermission('manage_settings')) {
    return <LockedPage pageName="Settings" />;
  }

  return <SettingsPage />;
}

import { LogOut, Type } from 'lucide-react';

function SettingsPage() {
  const router = useRouter();
  const { adminUser, permissions, refreshPermissions, logout } = useAdminAuth();

  const [posConnected, setPosConnected] = useState(true);
  const [storeMappings, setStoreMappings] = useState(SEED_MAPPINGS);
  const [editingMappingId, setEditingMappingId] = useState<string | null>(null);
  const [mappingDraft, setMappingDraft] = useState<any>(null);
  const syncLogs = SEED_SYNC_LOGS;

  const [waConnected, setWaConnected] = useState(true);
  const [templates, setTemplates] = useState(SEED_TEMPLATES);

  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateModalMode, setTemplateModalMode] = useState<'add' | 'edit'>('add');
  const [activeTemplate, setActiveTemplate] = useState<any>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

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
              <div style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 12px', borderRadius: '12px', background: 'rgba(166,124,82,.9)', color: '#2A1E18' }}>
                <div style={{ width: '15px', height: '15px', border: '1.6px solid currentColor', borderRadius: '4px', flex: 'none', position: 'relative' }}><div style={{ position: 'absolute', top: '5px', left: '2px', width: '7px', height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></div><div style={{ position: 'absolute', top: '8.5px', left: '2px', width: '5px', height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></div></div>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Settings</span>
              </div>
              <div onClick={() => { setSidebarOpen(false); router.push('/admin/settings/edit-ui'); }} style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 12px', borderRadius: '12px', color: 'rgba(248, 244, 238, 0.72)', cursor: 'pointer' }}>
                <Type size={15} />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Edit UI</span>
              </div>
              {/* Logout Button */}
              <div onClick={() => setLogoutModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 12px', borderRadius: '12px', color: '#FF6B6B', cursor: 'pointer', marginTop: '4px' }}>
                <LogOut size={16} strokeWidth={2} />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Logout</span>
              </div>
            </div>
            <div style={{ flex: 1 }}></div>
            <div style={{ padding: '12px', fontSize: '11px', lineHeight: 1.5, color: 'rgba(248, 244, 238, 0.5)' }}>Staff Tool · Internal Use<br />Logged in as {adminUser?.role === 'admin' ? 'Owner' : 'Cashier'}</div>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 12px', borderRadius: '12px', background: 'rgba(166,124,82,.9)', color: '#2A1E18' }}>
            <div style={{ width: '15px', height: '15px', border: '1.6px solid currentColor', borderRadius: '4px', flex: 'none', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '5px', left: '2px', width: '7px', height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></div>
              <div style={{ position: 'absolute', top: '8.5px', left: '2px', width: '5px', height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></div>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Settings</span>
          </div>
          <div onClick={() => router.push('/admin/settings/edit-ui')} style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 12px', borderRadius: '12px', color: 'rgba(248, 244, 238, 0.72)', cursor: 'pointer' }}>
            <Type size={15} />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Edit UI</span>
          </div>
          {/* Logout Button */}
          <div onClick={() => setLogoutModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 12px', borderRadius: '12px', color: '#FF6B6B', cursor: 'pointer', marginTop: '4px' }}>
            <LogOut size={16} strokeWidth={2} />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Logout</span>
          </div>
        </div>

        <div style={{ flex: 1 }}></div>
        <div style={{ padding: '12px', fontSize: '11px', lineHeight: 1.5, color: 'rgba(248, 244, 238, 0.5)' }}>Staff Tool · Internal Use<br />Logged in as {adminUser?.role === 'admin' ? 'Owner' : 'Cashier'}</div>
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
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(248,244,238,.92)', marginLeft: '2px' }}>Settings</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', boxSizing: 'border-box' }}>
          <div style={{ maxWidth: '920px', margin: '0 auto', padding: '52px 40px 70px' }}>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '27px', fontWeight: 600, letterSpacing: '-0.03em', color: '#3B2A22' }}>Settings</div>
                <div style={{ fontSize: '15px', color: '#7A6A5F', marginTop: '6px' }}>Permissions, integrasi POS, dan WhatsApp API.</div>
              </div>
            </div>

            {/* Permissions */}
            <div style={{ marginTop: '32px', background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 22px 16px' }}>
                <div style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.02em', color: '#3B2A22' }}>Admin roles & permissions</div>
                <div style={{ fontSize: '13px', color: '#7A6A5F', marginTop: '4px' }}>Only owners can change what cashier accounts are allowed to do.</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px', gap: '10px', padding: '12px 22px', background: '#F8F4EE', fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', color: '#A08A7B', textTransform: 'uppercase' }}>
                <div>Permissions</div><div style={{ textAlign: 'center' }}>Owner</div><div style={{ textAlign: 'center' }}>Cashier</div>
              </div>
              {PERMISSIONS.map(p => (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px', gap: '10px', padding: '13px 22px', borderTop: '1px solid #EAE1D5', alignItems: 'center', fontSize: '13.5px', color: '#4A3830' }}>
                  <div>{p.label}</div>
                  <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 700, color: '#5C7B5A' }}>✓</div>
                  <div onClick={async () => {
                    const newPerms = { ...permissions, [p.id]: !permissions[p.id] };
                    await fetch('/api/admin/permissions', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ permissions: newPerms })
                    });
                    refreshPermissions();
                  }} style={{ textAlign: 'center', fontSize: '16px', fontWeight: 700, color: permissions[p.id] ? '#5C7B5A' : '#A08A7B', cursor: 'pointer', userSelect: 'none' }}>
                    {permissions[p.id] ? '✓' : '✕'}
                  </div>
                </div>
              ))}
            </div>

            {/* POS */}
            <div style={{ marginTop: '22px', background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)', padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.02em', color: '#3B2A22' }}>POS Integration</div>
                  <div style={{ fontSize: '13px', color: '#7A6A5F', marginTop: '4px' }}>Connect your point-of-sale so visits and spend sync automatically.</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 'none' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: posConnected ? 'rgba(122, 150, 116, 0.18)' : '#F1EBE1', color: posConnected ? '#5A6A54' : '#7A6A5F', fontSize: '11px', fontWeight: 600, padding: '5px 11px', borderRadius: '999px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: posConnected ? '#5A6A54' : '#7A6A5F' }}></span>{posConnected ? 'Connected' : 'Disconnected'}
                  </span>
                  <div style={{ width: '120px' }}>
                    <Button variant="outline" onClick={() => setPosConnected(!posConnected)}>{posConnected ? 'Disconnect' : 'Connect'}</Button>
                  </div>
                </div>
              </div>

              <div style={{ height: '1px', background: '#EAE1D5', margin: '18px 0' }}></div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '.08em', color: '#A08A7B', textTransform: 'uppercase' }}>Store / outlet mapping</div>
                <span onClick={() => {
                  const id = 'sm' + Date.now();
                  setStoreMappings([...storeMappings, { id, name: '', posId: '' }]);
                  setEditingMappingId(id);
                  setMappingDraft({ name: '', posId: '' });
                }} style={{ fontSize: '12.5px', fontWeight: 600, color: '#A67C52', cursor: 'pointer' }}>+ Add outlet</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {storeMappings.map(sm => (
                  <div key={sm.id} style={{ border: '1px solid #E6DDD0', borderRadius: '14px', padding: '12px 14px' }}>
                    {editingMappingId === sm.id ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'center' }}>
                        <input value={mappingDraft?.name || ''} onChange={(e: any) => setMappingDraft({ ...mappingDraft, name: e.target.value })} placeholder="Outlet name" style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E6DDD0', borderRadius: '14px', padding: '9px 11px', fontSize: '13.5px', color: '#3B2A22', outline: 'none' }} />
                        <input value={mappingDraft?.posId || ''} onChange={(e: any) => setMappingDraft({ ...mappingDraft, posId: e.target.value })} placeholder="POS ID" style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E6DDD0', borderRadius: '14px', padding: '9px 11px', fontSize: '13.5px', color: '#3B2A22', outline: 'none', fontVariantNumeric: 'tabular-nums' }} />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span onClick={() => {
                            if (!sm.name) setStoreMappings(storeMappings.filter(m => m.id !== sm.id));
                            setEditingMappingId(null);
                          }} style={{ fontSize: '12.5px', fontWeight: 600, color: '#7A6A5F', cursor: 'pointer' }}>Cancel</span>
                          <span onClick={() => {
                            if (mappingDraft?.name) {
                              setStoreMappings(storeMappings.map(m => m.id === sm.id ? { ...m, name: mappingDraft.name, posId: mappingDraft.posId } : m));
                            }
                            setEditingMappingId(null);
                          }} style={{ fontSize: '12.5px', fontWeight: 600, color: '#A67C52', cursor: 'pointer' }}>Save</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#3B2A22' }}>{sm.name}</div>
                          <div style={{ fontSize: '12.5px', color: '#7A6A5F', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>POS ID · {sm.posId}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '14px', flex: 'none' }}>
                          <span onClick={() => { setEditingMappingId(sm.id); setMappingDraft({ name: sm.name, posId: sm.posId }); }} style={{ fontSize: '12.5px', fontWeight: 600, color: '#A67C52', cursor: 'pointer' }}>Edit</span>
                          <span onClick={() => setStoreMappings(storeMappings.filter(m => m.id !== sm.id))} style={{ fontSize: '12.5px', fontWeight: 600, color: '#7A6A5F', cursor: 'pointer' }}>Delete</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {storeMappings.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: '#7A6A5F', fontSize: '13px' }}>No outlets connected yet.</div>}
              </div>

              <div style={{ height: '1px', background: '#EAE1D5', margin: '18px 0' }}></div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '.08em', color: '#A08A7B', textTransform: 'uppercase', marginBottom: '8px' }}>Transaction sync</div>
                  <div style={{ fontSize: '14.5px', fontWeight: 600, color: '#3B2A22', background: '#F8F4EE', borderRadius: '14px', padding: '14px 16px' }}>Real-time</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '.08em', color: '#A08A7B', textTransform: 'uppercase', marginBottom: '8px' }}>Member matching</div>
                  <div style={{ fontSize: '14.5px', fontWeight: 600, color: '#3B2A22', background: '#F8F4EE', borderRadius: '14px', padding: '14px 16px' }}>By WhatsApp number</div>
                </div>
              </div>

              <div style={{ height: '1px', background: '#EAE1D5', margin: '18px 0' }}></div>

              <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '.08em', color: '#A08A7B', textTransform: 'uppercase', marginBottom: '10px' }}>Sync logs</div>
              <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #E6DDD0', borderRadius: '14px' }}>
                {syncLogs.map(lg => (
                  <div key={lg.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '10px 14px', borderTop: '1px solid #EAE1D5' }}>
                    <span style={{ fontSize: '12.5px', color: '#7A6A5F', fontVariantNumeric: 'tabular-nums' }}>{fmtLogTime(lg.time)}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: lg.status === 'Success' ? '#5C7B5A' : '#A08A7B' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: lg.status === 'Success' ? '#5C7B5A' : '#A08A7B' }}></span>{lg.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp */}
            <div style={{ marginTop: '22px', background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)', padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.02em', color: '#3B2A22' }}>WhatsApp API</div>
                  <div style={{ fontSize: '13px', color: '#7A6A5F', marginTop: '4px' }}>Manage the connection used to reach members on WhatsApp.</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 'none' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: waConnected ? 'rgba(122, 150, 116, 0.18)' : '#F1EBE1', color: waConnected ? '#5A6A54' : '#7A6A5F', fontSize: '11px', fontWeight: 600, padding: '5px 11px', borderRadius: '999px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: waConnected ? '#5A6A54' : '#7A6A5F' }}></span>{waConnected ? 'Connected' : 'Disconnected'}
                  </span>
                  <div style={{ width: '120px' }}>
                    <Button variant="outline" onClick={() => setWaConnected(!waConnected)}>{waConnected ? 'Disconnect' : 'Connect'}</Button>
                  </div>
                </div>
              </div>

              <div style={{ height: '1px', background: '#EAE1D5', margin: '18px 0' }}></div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '.08em', color: '#A08A7B', textTransform: 'uppercase' }}>Message templates</div>
                <span onClick={() => { setTemplateModalMode('add'); setActiveTemplate({ name: '', body: '' }); setTemplateModalOpen(true); }} style={{ fontSize: '12.5px', fontWeight: 600, color: '#A67C52', cursor: 'pointer' }}>+ Add template</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {templates.map(tp => (
                  <div key={tp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', border: '1px solid #E6DDD0', borderRadius: '14px', padding: '12px 14px' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#3B2A22' }}>{tp.name}</div>
                      <div style={{ fontSize: '12.5px', color: '#7A6A5F', marginTop: '2px', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tp.body}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '14px', flex: 'none' }}>
                      <span onClick={() => { setTemplateModalMode('edit'); setActiveTemplate(tp); setTemplateModalOpen(true); }} style={{ fontSize: '12.5px', fontWeight: 600, color: '#A67C52', cursor: 'pointer' }}>View</span>
                      <span onClick={() => setTemplates(templates.filter(t => t.id !== tp.id))} style={{ fontSize: '12.5px', fontWeight: 600, color: '#7A6A5F', cursor: 'pointer' }}>Delete</span>
                    </div>
                  </div>
                ))}
                {templates.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: '#7A6A5F', fontSize: '13px' }}>No message templates yet.</div>}
              </div>

              <div style={{ height: '1px', background: '#EAE1D5', margin: '18px 0' }}></div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#3B2A22' }}>Who can send broadcasts</div>
                  <div style={{ fontSize: '12.5px', color: '#7A6A5F', marginTop: '3px', maxWidth: '400px', lineHeight: 1.5 }}>Broadcasts can only be sent by owners.</div>
                </div>
                <div style={{ fontSize: '14.5px', fontWeight: 600, color: '#3B2A22', background: '#F8F4EE', borderRadius: '14px', padding: '12px 16px', flex: 'none' }}>Owners only</div>
              </div>
            </div>

          </div>{/* close max-width inner div */}
        </div>{/* close overflowY:auto */}
      </div>{/* close flex flex-col main wrapper */}

      {templateModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(43, 30, 24, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: '480px', background: '#FFFFFF', borderRadius: '22px', padding: '26px', boxShadow: '0 30px 60px -20px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#3B2A22' }}>{templateModalMode === 'add' ? 'Add template' : 'Edit template'}</div>
            <div style={{ fontSize: '12.5px', color: '#7A6A5F', marginTop: '4px' }}>{templateModalMode === 'add' ? 'Create a new message template.' : 'Edit the content of this message template.'}</div>

            {templateModalMode === 'add' && (
              <div style={{ marginTop: '18px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: '#A08A7B', textTransform: 'uppercase', marginBottom: '6px' }}>TEMPLATE NAME</div>
                <input value={activeTemplate.name} onChange={(e: any) => setActiveTemplate({ ...activeTemplate, name: e.target.value })} placeholder="e.g., Payment reminder" style={{ background: '#FFFFFF', border: '1px solid #E6DDD0', borderRadius: '14px', padding: '12px 14px', fontSize: '15px', color: '#3B2A22', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
              </div>
            )}

            <div style={{ marginTop: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', textTransform: 'uppercase', marginBottom: '8px' }}>Message body</div>
              <textarea value={activeTemplate.body} onChange={(e: any) => setActiveTemplate({ ...activeTemplate, body: e.target.value })} rows={6} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E6DDD0', borderRadius: '14px', padding: '12px 13px', fontSize: '13.5px', fontFamily: "'Inter', sans-serif", color: '#3B2A22', background: '#FFFFFF', outline: 'none', resize: 'vertical', lineHeight: 1.5 }} />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '22px' }}>
              <div style={{ flex: 1 }}><Button variant="outline" onClick={() => setTemplateModalOpen(false)}>Cancel</Button></div>
              <div style={{ flex: 1 }}><Button variant="primary" onClick={() => {
                if (templateModalMode === 'add') {
                  if (activeTemplate.name) {
                    setTemplates([...templates, { id: 'tpl' + Date.now(), name: activeTemplate.name, body: activeTemplate.body }]);
                  }
                } else {
                  setTemplates(templates.map(t => t.id === activeTemplate.id ? { ...t, body: activeTemplate.body } : t));
                }
                setTemplateModalOpen(false);
              }}>Save</Button></div>
            </div>
          </div>
        </div>
      )}

      {logoutModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(43, 30, 24, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: '380px', background: '#FFFFFF', borderRadius: '22px', padding: '26px', boxShadow: '0 30px 60px -20px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#3B2A22', textAlign: 'center' }}>Are you sure you want to sign out?</div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '26px' }}>
              <div style={{ flex: 1 }}><Button variant="outline" onClick={() => setLogoutModalOpen(false)}>Cancel</Button></div>
              <div style={{ flex: 1 }}><Button variant="primary" onClick={() => { setLogoutModalOpen(false); logout(); }}>Sign Out</Button></div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
