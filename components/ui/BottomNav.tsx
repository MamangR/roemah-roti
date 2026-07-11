'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isDash = pathname === '/visits' || pathname === '/referral' || pathname === '/updates';
  const isRewards = pathname === '/rewards';
  const isProfile = pathname === '/profile';

  const navActive = '#A67C52';
  const navIdle = '#A08A7B';
  const activeBg = 'rgba(166,124,82,0.12)';

  const NavItem = ({ active, onClick, icon, label }: any) => (
    <div onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: active ? navActive : navIdle, transition: 'color 0.2s ease', position: 'relative', width: '60px' }}>
      <div style={{ position: 'absolute', inset: '-6px -12px', background: active ? activeBg : 'transparent', borderRadius: '16px', zIndex: -1, transition: 'background 0.3s cubic-bezier(.22,1,.36,1), transform 0.3s cubic-bezier(.22,1,.36,1)', transform: active ? 'scale(1)' : 'scale(0.8)' }}></div>
      <div style={{ transition: 'transform 0.3s cubic-bezier(.175, .885, .32, 1.275)', transform: active ? 'scale(1.15) translateY(-2px)' : 'scale(1) translateY(0)' }}>
        {icon}
      </div>
      <span style={{ fontSize: '10px', fontWeight: active ? 600 : 500, transition: 'transform 0.3s cubic-bezier(.175, .885, .32, 1.275)', transform: active ? 'translateY(1px)' : 'translateY(0)' }}>{label}</span>
    </div>
  );

  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 6, display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '12px 24px 28px', background: 'rgba(255,255,255,0.92)', borderTop: '1px solid #EFE8DE', backdropFilter: 'blur(12px)' }}>
      <NavItem active={isDash} onClick={() => router.push('/visits')} label="Dashboard" icon={
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="8" rx="1.5"/>
          <rect x="14" y="3" width="7" height="5" rx="1.5"/>
          <rect x="14" y="12" width="7" height="9" rx="1.5"/>
          <rect x="3" y="15" width="7" height="6" rx="1.5"/>
        </svg>
      } />
      
      <NavItem active={isRewards} onClick={() => router.push('/rewards')} label="Rewards" icon={
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="1.5"/>
          <rect x="2" y="7" width="20" height="4" rx="1"/>
          <line x1="12" y1="7" x2="12" y2="22"/>
          <path d="M12 7 C12 7 9 5 8 3.5 S9.5 1.5 12 4"/>
          <path d="M12 7 C12 7 15 5 16 3.5 S14.5 1.5 12 4"/>
        </svg>
      } />

      <NavItem active={isProfile} onClick={() => router.push('/profile')} label="Profile" icon={
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="3.5"/>
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
      } />
    </div>
  );
}
