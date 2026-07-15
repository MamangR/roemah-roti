'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { BarChart3, Users, Gift, Link as LinkIcon, Megaphone, Settings, Home, LogOut } from 'lucide-react';

export default function CashierDashboardPageWrapper() {
  const { adminUser, loading } = useAdminAuth();

  if (loading) return null;
  if (!adminUser) return null;
  // This page is meant for any logged-in admin/cashier to see what they can access
  return <CashierDashboardPage />;
}

function CashierDashboardPage() {
  const router = useRouter();
  const { hasPermission, adminUser, logout } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const links = [
    {
      title: 'Dashboard & Reports',
      desc: 'Ringkasan performa dan laporan.',
      path: '/admin',
      perm: hasPermission('view_dashboard'),
      icon: <BarChart3 size={28} strokeWidth={1.5} color="#A67C52" />
    },
    {
      title: 'Member Management',
      desc: 'Kelola data member dan poin.',
      path: '/admin/members',
      perm: hasPermission('manage_members'),
      icon: <Users size={28} strokeWidth={1.5} color="#A67C52" />
    },
    {
      title: 'Rewards',
      desc: 'Kelola dan tukarkan rewards.',
      path: '/admin/rewards',
      perm: hasPermission('manage_rewards') || hasPermission('redeem_rewards'),
      icon: <Gift size={28} strokeWidth={1.5} color="#A67C52" />
    },
    {
      title: 'Referrals',
      desc: 'Program referral dan komisi.',
      path: '/admin/referrals',
      perm: hasPermission('manage_referral'),
      icon: <LinkIcon size={28} strokeWidth={1.5} color="#A67C52" />
    },
    {
      title: 'Updates',
      desc: 'Kelola pengumuman dan promo.',
      path: '/admin/updates',
      perm: hasPermission('manage_updates'),
      icon: <Megaphone size={28} strokeWidth={1.5} color="#A67C52" />
    },
    {
      title: 'Settings',
      desc: 'Pengaturan sistem dan izin.',
      path: '/admin/settings',
      perm: hasPermission('manage_settings'),
      icon: <Settings size={28} strokeWidth={1.5} color="#A67C52" />
    }
  ];

  const allowedLinks = links.filter(l => l.perm);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#FCFBF8', fontFamily: "'Inter', sans-serif", color: '#3B2A22', boxSizing: 'border-box', overflow: 'hidden' }}>
      
      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(26,19,15,0.55)', backdropFilter: 'blur(2px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '260px', background: '#3B2A22', display: 'flex', flexDirection: 'column', padding: '26px 18px', boxSizing: 'border-box', boxShadow: '4px 0 40px rgba(0,0,0,0.4)' }}>
            <div onClick={() => router.push('/admin/cashierdashboard')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '11px', padding: '0 8px 26px', borderBottom: '1px solid rgba(248, 244, 238, 0.12)' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><span style={{ fontSize: '15px', fontWeight: 700, color: '#E9C9A6', letterSpacing: '-.02em' }}>RR</span></div>
              <div><div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.22em', color: 'rgba(248, 244, 238, 0.72)' }}>ROEMAH ROTI</div><div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(248, 244, 238, 0.92)', marginTop: '2px' }}>Cashier Menu</div></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 12px', borderRadius: '12px', background: 'rgba(166,124,82,.9)', color: '#2A1E18' }}>
                <Home size={16} strokeWidth={2} />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Home</span>
              </div>
              <div onClick={() => setLogoutModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 12px', borderRadius: '12px', color: '#FF6B6B', cursor: 'pointer', marginTop: '4px' }}>
                <LogOut size={16} strokeWidth={2} />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Logout</span>
              </div>
            </div>
            <div style={{ flex: 1 }}></div>
            <div style={{ padding: '12px', fontSize: '11px', lineHeight: 1.5, color: 'rgba(248, 244, 238, 0.5)' }}>Logged in as {adminUser?.role === 'admin' ? 'Owner' : 'Cashier'}</div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div style={{ width: '250px', flex: 'none', background: '#3B2A22', display: 'flex', flexDirection: 'column', padding: '26px 18px', boxSizing: 'border-box' }} className="hidden md:flex">
        <div onClick={() => router.push('/admin/cashierdashboard')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '11px', padding: '0 8px 26px', borderBottom: '1px solid rgba(248, 244, 238, 0.12)' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#E9C9A6', letterSpacing: '-.02em' }}>RR</span>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.22em', color: 'rgba(248, 244, 238, 0.72)' }}>ROEMAH ROTI</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(248, 244, 238, 0.92)', marginTop: '2px' }}>Cashier Menu</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 12px', borderRadius: '12px', background: 'rgba(166,124,82,.9)', color: '#2A1E18' }}>
            <Home size={16} strokeWidth={2} />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Home</span>
          </div>
          <div onClick={() => setLogoutModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 12px', borderRadius: '12px', color: '#FF6B6B', cursor: 'pointer', marginTop: '4px' }}>
            <LogOut size={16} strokeWidth={2} />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Logout</span>
          </div>
        </div>
        <div style={{ flex: 1 }}></div>
        <div style={{ padding: '12px', fontSize: '11px', lineHeight: 1.5, color: 'rgba(248, 244, 238, 0.5)' }}>Logged in as {adminUser?.role === 'admin' ? 'Owner' : 'Cashier'}</div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="flex md:hidden" style={{ background: '#3B2A22', padding: '14px 16px', alignItems: 'center', gap: '12px', flex: 'none' }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'rgba(255,255,255,.08)', border: 'none', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer', flex: 'none' }}>
            <span style={{ width: '14px', height: '1.6px', background: '#E9C9A6', borderRadius: '1px', display: 'block' }} />
            <span style={{ width: '14px', height: '1.6px', background: '#E9C9A6', borderRadius: '1px', display: 'block' }} />
            <span style={{ width: '14px', height: '1.6px', background: '#E9C9A6', borderRadius: '1px', display: 'block' }} />
          </button>
          <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '.22em', color: 'rgba(248,244,238,.55)', textTransform: 'uppercase' }}>ROEMAH ROTI</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(248,244,238,.92)', marginLeft: '2px' }}>Cashier Menu</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', boxSizing: 'border-box' }}>
          <div style={{ maxWidth: '920px', margin: '0 auto', padding: '52px 40px 70px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '27px', fontWeight: 600, letterSpacing: '-0.03em', color: '#3B2A22' }}>Welcome, {adminUser?.role === 'admin' ? 'Admin' : 'Cashier'}</div>
                <div style={{ fontSize: '15px', color: '#7A6A5F', marginTop: '6px' }}>Select an area to manage based on your permissions.</div>
              </div>
            </div>

            <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {allowedLinks.map(link => (
                <div
                  key={link.path}
                  onClick={() => router.push(link.path)}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #EFE8DE',
                    borderRadius: '22px',
                    padding: '24px',
                    cursor: 'pointer',
                    boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.2)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 14px 28px -15px rgba(59, 42, 34, 0.25)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 26px -20px rgba(59, 42, 34, 0.2)';
                  }}
                >
                  <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px', borderRadius: '14px', background: '#F8F4EE' }}>
                    {link.icon}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#3B2A22' }}>{link.title}</div>
                  <div style={{ fontSize: '13.5px', color: '#7A6A5F', marginTop: '6px', lineHeight: 1.4 }}>{link.desc}</div>
                </div>
              ))}
              {allowedLinks.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', background: '#FFFFFF', borderRadius: '22px', border: '1px solid #EFE8DE' }}>
                  <div style={{ fontSize: '16px', color: '#7A6A5F' }}>You do not have permission to view any pages.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {logoutModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(43, 30, 24, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ width: '380px', background: '#FFFFFF', borderRadius: '22px', padding: '26px', boxShadow: '0 30px 60px -20px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#3B2A22', textAlign: 'center' }}>Are you sure you want to sign out?</div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '26px' }}>
              <div style={{ flex: 1 }}>
                <div onClick={() => setLogoutModalOpen(false)} style={{ padding: '10px 16px', borderRadius: '14px', fontSize: '13px', fontWeight: 600, textAlign: 'center', cursor: 'pointer', border: '1px solid #E0D5C6', color: '#3B2A22' }}>Cancel</div>
              </div>
              <div style={{ flex: 1 }}>
                <div onClick={() => { setLogoutModalOpen(false); logout(); }} style={{ padding: '10px 16px', borderRadius: '14px', fontSize: '13px', fontWeight: 600, textAlign: 'center', cursor: 'pointer', background: '#A67C52', color: '#fff', boxShadow: '0 14px 26px -14px rgba(166, 124, 82, 0.9)' }}>Sign Out</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
