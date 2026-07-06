'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const PERMISSIONS = [
  { id: 'view_dashboard', label: 'View dashboard & reports', cashierDefault: false },
  { id: 'manage_members', label: 'Manage members', cashierDefault: false },
  { id: 'add_visits', label: 'Add visits', cashierDefault: true },
  { id: 'redeem_rewards', label: 'Redeem rewards', cashierDefault: true },
  { id: 'manage_rewards', label: 'Create/edit/delete rewards', cashierDefault: false },
  { id: 'manage_referral', label: 'Manage referral program', cashierDefault: false },
  { id: 'manage_updates', label: 'Create/edit/delete updates', cashierDefault: false },
  { id: 'manage_settings', label: 'Manage settings', cashierDefault: false },
  { id: 'manage_admins', label: 'Manage admin users', cashierDefault: false },
  { id: 'manage_pos', label: 'Manage POS integration', cashierDefault: false },
  { id: 'manage_whatsapp', label: 'Manage WhatsApp API', cashierDefault: false },
  { id: 'search_members', label: 'Search members', cashierDefault: true },
  { id: 'scan_qr', label: 'Scan member QR', cashierDefault: true },
  { id: 'view_member_info', label: 'View member information', cashierDefault: true },
  { id: 'delete_member_data', label: 'Delete member data', cashierDefault: false },
];

function fmtLogTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

const SEED_SYNC_LOGS = [
  { id: 'l1', time: '2026-07-05T08:12:00', status: 'Berhasil' },
  { id: 'l2', time: '2026-07-05T07:57:00', status: 'Berhasil' },
  { id: 'l3', time: '2026-07-05T07:42:00', status: 'Berhasil' },
  { id: 'l4', time: '2026-07-05T07:27:00', status: 'Gagal, dicoba ulang' },
  { id: 'l5', time: '2026-07-05T07:12:00', status: 'Berhasil' },
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

const SegmentedToggle = ({ options, value, onChange }: any) => (
  <div style={{ display: 'flex', background: '#F1EBE1', borderRadius: '14px', padding: '4px' }}>
    {options.map((o: any) => (
      <div key={o.value} onClick={() => onChange(o.value)} style={{ flex: 1, textAlign: 'center', padding: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: value === o.value ? '#fff' : 'transparent', borderRadius: '11px', color: value === o.value ? '#3B2A22' : '#A08A7B', boxShadow: value === o.value ? '0 4px 12px -4px rgba(59,42,34,.25)' : 'none' }}>
        {o.label}
      </div>
    ))}
  </div>
);

export default function SettingsPage() {
  const router = useRouter();
  
  const [role, setRole] = useState<'owner' | 'cashier'>('owner');
  const [cashierPerms, setCashierPerms] = useState<Record<string, boolean>>(Object.fromEntries(PERMISSIONS.map(p => [p.id, p.cashierDefault])));
  
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 12px', borderRadius: '12px', background: 'rgba(166,124,82,.9)', color: '#2A1E18' }}>
                <div style={{ width: '15px', height: '15px', border: '1.6px solid currentColor', borderRadius: '4px', flex: 'none', position: 'relative' }}><div style={{ position: 'absolute', top: '5px', left: '2px', width: '7px', height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></div><div style={{ position: 'absolute', top: '8.5px', left: '2px', width: '5px', height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></div></div>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Settings</span>
              </div>
            </div>
            <div style={{ flex: 1 }}></div>
            <div style={{ padding: '12px', fontSize: '11px', lineHeight: 1.5, color: 'rgba(248, 244, 238, 0.5)' }}>Staff tool · internal use<br/>Logged in as {role === 'owner' ? 'Owner' : 'Cashier'}</div>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 12px', borderRadius: '12px', background: 'rgba(166,124,82,.9)', color: '#2A1E18' }}>
            <div style={{ width: '15px', height: '15px', border: '1.6px solid currentColor', borderRadius: '4px', flex: 'none', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '5px', left: '2px', width: '7px', height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></div>
              <div style={{ position: 'absolute', top: '8.5px', left: '2px', width: '5px', height: '1.6px', background: 'currentColor', borderRadius: '1px' }}></div>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Settings</span>
          </div>
        </div>

        <div style={{ flex: 1 }}></div>
        <div style={{ padding: '12px', fontSize: '11px', lineHeight: 1.5, color: 'rgba(248, 244, 238, 0.5)' }}>Staff tool · internal use<br/>Logged in as {role === 'owner' ? 'Owner' : 'Cashier'}</div>
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
              <div style={{ fontSize: '15px', color: '#7A6A5F', marginTop: '6px' }}>Permissions, POS integration and WhatsApp API.</div>
            </div>
            <div style={{ textAlign: 'right', flex: 'none' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', textTransform: 'uppercase', marginBottom: '8px' }}>View as</div>
              <div style={{ width: '220px' }}>
                <SegmentedToggle options={[{ value: 'owner', label: 'Owner' }, { value: 'cashier', label: 'Cashier' }]} value={role} onChange={setRole} />
              </div>
            </div>
          </div>

          {role === 'cashier' && (
            <div style={{ marginTop: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '60px 30px', background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#F8F4EE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <div style={{ width: '16px', height: '13px', border: '1.8px solid #7A6A5F', borderTop: 'none', borderRadius: '0 0 3px 3px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-11px', left: '2px', width: '10px', height: '11px', border: '1.8px solid #7A6A5F', borderBottom: 'none', borderRadius: '6px 6px 0 0' }}></div>
                </div>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#3B2A22' }}>Only owner can manage settings</div>
              <div style={{ fontSize: '14px', color: '#7A6A5F', marginTop: '8px', maxWidth: '360px', lineHeight: 1.6 }}>Cashier accounts don’t have access to permissions, POS integration or WhatsApp API. Switch to Owner to view or make changes.</div>
            </div>
          )}

          {role === 'owner' && (
            <>
              {/* Permissions */}
              <div style={{ marginTop: '32px', background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)', overflow: 'hidden' }}>
                <div style={{ padding: '20px 22px 16px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.02em', color: '#3B2A22' }}>Admin roles & permissions</div>
                  <div style={{ fontSize: '13px', color: '#7A6A5F', marginTop: '4px' }}>Only the owner can change what cashier accounts are allowed to do.</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px', gap: '10px', padding: '12px 22px', background: '#F8F4EE', fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', color: '#A08A7B', textTransform: 'uppercase' }}>
                  <div>Permission</div><div style={{ textAlign: 'center' }}>Owner</div><div style={{ textAlign: 'center' }}>Cashier</div>
                </div>
                {PERMISSIONS.map(p => (
                  <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px', gap: '10px', padding: '13px 22px', borderTop: '1px solid #EAE1D5', alignItems: 'center', fontSize: '13.5px', color: '#4A3830' }}>
                    <div>{p.label}</div>
                    <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 700, color: '#5C7B5A' }}>✓</div>
                    <div onClick={() => setCashierPerms({ ...cashierPerms, [p.id]: !cashierPerms[p.id] })} style={{ textAlign: 'center', fontSize: '16px', fontWeight: 700, color: cashierPerms[p.id] ? '#5C7B5A' : '#A08A7B', cursor: 'pointer', userSelect: 'none' }}>
                      {cashierPerms[p.id] ? '✓' : '✕'}
                    </div>
                  </div>
                ))}
              </div>

              {/* POS */}
              <div style={{ marginTop: '22px', background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)', padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.02em', color: '#3B2A22' }}>POS integration</div>
                    <div style={{ fontSize: '13px', color: '#7A6A5F', marginTop: '4px' }}>Connect your point-of-sale so visits and spending sync automatically.</div>
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
                  }} style={{ fontSize: '12.5px', fontWeight: 600, color: '#A67C52', cursor: 'pointer' }}>+ Tambah outlet</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {storeMappings.map(sm => (
                    <div key={sm.id} style={{ border: '1px solid #E6DDD0', borderRadius: '14px', padding: '12px 14px' }}>
                      {editingMappingId === sm.id ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'center' }}>
                          <input value={mappingDraft?.name || ''} onChange={(e: any) => setMappingDraft({ ...mappingDraft, name: e.target.value })} placeholder="Nama outlet" style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E6DDD0', borderRadius: '14px', padding: '9px 11px', fontSize: '13.5px', color: '#3B2A22', outline: 'none' }} />
                          <input value={mappingDraft?.posId || ''} onChange={(e: any) => setMappingDraft({ ...mappingDraft, posId: e.target.value })} placeholder="POS ID" style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E6DDD0', borderRadius: '14px', padding: '9px 11px', fontSize: '13.5px', color: '#3B2A22', outline: 'none', fontVariantNumeric: 'tabular-nums' }} />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <span onClick={() => {
                              if (!sm.name) setStoreMappings(storeMappings.filter(m => m.id !== sm.id));
                              setEditingMappingId(null);
                            }} style={{ fontSize: '12.5px', fontWeight: 600, color: '#7A6A5F', cursor: 'pointer' }}>Batal</span>
                            <span onClick={() => {
                              if (mappingDraft?.name) {
                                setStoreMappings(storeMappings.map(m => m.id === sm.id ? { ...m, name: mappingDraft.name, posId: mappingDraft.posId } : m));
                              }
                              setEditingMappingId(null);
                            }} style={{ fontSize: '12.5px', fontWeight: 600, color: '#A67C52', cursor: 'pointer' }}>Simpan</span>
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
                            <span onClick={() => setStoreMappings(storeMappings.filter(m => m.id !== sm.id))} style={{ fontSize: '12.5px', fontWeight: 600, color: '#7A6A5F', cursor: 'pointer' }}>Hapus</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {storeMappings.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: '#7A6A5F', fontSize: '13px' }}>Belum ada outlet yang dihubungkan.</div>}
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
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: lg.status === 'Berhasil' ? '#5C7B5A' : '#A08A7B' }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: lg.status === 'Berhasil' ? '#5C7B5A' : '#A08A7B' }}></span>{lg.status}
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
                  <span onClick={() => { setTemplateModalMode('add'); setActiveTemplate({ name: '', body: '' }); setTemplateModalOpen(true); }} style={{ fontSize: '12.5px', fontWeight: 600, color: '#A67C52', cursor: 'pointer' }}>+ Tambah template</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {templates.map(tp => (
                    <div key={tp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', border: '1px solid #E6DDD0', borderRadius: '14px', padding: '12px 14px' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#3B2A22' }}>{tp.name}</div>
                        <div style={{ fontSize: '12.5px', color: '#7A6A5F', marginTop: '2px', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tp.body}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '14px', flex: 'none' }}>
                        <span onClick={() => { setTemplateModalMode('edit'); setActiveTemplate(tp); setTemplateModalOpen(true); }} style={{ fontSize: '12.5px', fontWeight: 600, color: '#A67C52', cursor: 'pointer' }}>Lihat</span>
                        <span onClick={() => setTemplates(templates.filter(t => t.id !== tp.id))} style={{ fontSize: '12.5px', fontWeight: 600, color: '#7A6A5F', cursor: 'pointer' }}>Hapus</span>
                      </div>
                    </div>
                  ))}
                  {templates.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: '#7A6A5F', fontSize: '13px' }}>Belum ada template pesan.</div>}
                </div>

                <div style={{ height: '1px', background: '#EAE1D5', margin: '18px 0' }}></div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#3B2A22' }}>Who can send broadcasts</div>
                    <div style={{ fontSize: '12.5px', color: '#7A6A5F', marginTop: '3px', maxWidth: '400px', lineHeight: 1.5 }}>Broadcasts can only be sent by the owner.</div>
                  </div>
                  <div style={{ fontSize: '14.5px', fontWeight: 600, color: '#3B2A22', background: '#F8F4EE', borderRadius: '14px', padding: '12px 16px', flex: 'none' }}>Owner only</div>
                </div>
              </div>
            </>
          )}

        </div>{/* close max-width inner div */}
      </div>{/* close overflowY:auto */}
      </div>{/* close flex flex-col main wrapper */}

      {templateModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(43, 30, 24, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: '480px', background: '#FFFFFF', borderRadius: '22px', padding: '26px', boxShadow: '0 30px 60px -20px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#3B2A22' }}>{templateModalMode === 'add' ? 'Tambah template' : 'Edit template'}</div>
            <div style={{ fontSize: '12.5px', color: '#7A6A5F', marginTop: '4px' }}>{templateModalMode === 'add' ? 'Buat template pesan baru.' : 'Edit konten template pesan ini.'}</div>

            {templateModalMode === 'add' && (
              <div style={{ marginTop: '18px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: '#A08A7B', textTransform: 'uppercase', marginBottom: '6px' }}>NAMA TEMPLATE</div>
                <input value={activeTemplate.name} onChange={(e: any) => setActiveTemplate({ ...activeTemplate, name: e.target.value })} placeholder="Contoh: Reminder pembayaran" style={{ background: '#FFFFFF', border: '1px solid #E6DDD0', borderRadius: '14px', padding: '12px 14px', fontSize: '15px', color: '#3B2A22', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
              </div>
            )}

            <div style={{ marginTop: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', textTransform: 'uppercase', marginBottom: '8px' }}>Isi pesan</div>
              <textarea value={activeTemplate.body} onChange={(e: any) => setActiveTemplate({ ...activeTemplate, body: e.target.value })} rows={6} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E6DDD0', borderRadius: '14px', padding: '12px 13px', fontSize: '13.5px', fontFamily: "'Inter', sans-serif", color: '#3B2A22', background: '#FFFFFF', outline: 'none', resize: 'vertical', lineHeight: 1.5 }} />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '22px' }}>
              <div style={{ flex: 1 }}><Button variant="outline" onClick={() => setTemplateModalOpen(false)}>Batal</Button></div>
              <div style={{ flex: 1 }}><Button variant="primary" onClick={() => {
                if (templateModalMode === 'add') {
                  if (activeTemplate.name) {
                    setTemplates([...templates, { id: 'tpl' + Date.now(), name: activeTemplate.name, body: activeTemplate.body }]);
                  }
                } else {
                  setTemplates(templates.map(t => t.id === activeTemplate.id ? { ...t, body: activeTemplate.body } : t));
                }
                setTemplateModalOpen(false);
              }}>Simpan</Button></div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
