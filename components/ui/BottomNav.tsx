'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isDash = pathname === '/visits' || pathname === '/referral';
  const isRewards = pathname === '/rewards';
  const isProfile = pathname === '/profile';

  const navActive = '#A67C52';
  const navIdle = '#C4B6A9';

  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 6, display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px 24px 24px', background: 'rgba(252,251,248,.94)', borderTop: '1px solid #EFE8DE', backdropFilter: 'blur(10px)' }}>
      {/* Dashboard */}
      <div onClick={() => router.push('/visits')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: isDash ? navActive : navIdle, transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', transform: isDash ? 'scale(1.1)' : 'scale(1)', filter: isDash ? 'drop-shadow(0px 2px 4px rgba(166,124,82,0.3))' : 'none' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="8" rx="1.5"/>
          <rect x="14" y="3" width="7" height="5" rx="1.5"/>
          <rect x="14" y="12" width="7" height="9" rx="1.5"/>
          <rect x="3" y="15" width="7" height="6" rx="1.5"/>
        </svg>
        <span style={{ fontSize: '10px', fontWeight: isDash ? 600 : 500 }}>Dashboard</span>
      </div>

      {/* Rewards */}
      <div onClick={() => router.push('/rewards')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: isRewards ? navActive : navIdle, transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', transform: isRewards ? 'scale(1.1)' : 'scale(1)', filter: isRewards ? 'drop-shadow(0px 2px 4px rgba(166,124,82,0.3))' : 'none' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          {/* box body */}
          <rect x="3" y="11" width="18" height="11" rx="1.5"/>
          {/* lid */}
          <rect x="2" y="7" width="20" height="4" rx="1"/>
          {/* vertical ribbon */}
          <line x1="12" y1="7" x2="12" y2="22"/>
          {/* bow left */}
          <path d="M12 7 C12 7 9 5 8 3.5 S9.5 1.5 12 4"/>
          {/* bow right */}
          <path d="M12 7 C12 7 15 5 16 3.5 S14.5 1.5 12 4"/>
        </svg>
        <span style={{ fontSize: '10px', fontWeight: isRewards ? 600 : 500 }}>Rewards</span>
      </div>

      {/* Profile */}
      <div onClick={() => router.push('/profile')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: isProfile ? navActive : navIdle, transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', transform: isProfile ? 'scale(1.1)' : 'scale(1)', filter: isProfile ? 'drop-shadow(0px 2px 4px rgba(166,124,82,0.3))' : 'none' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          {/* head */}
          <circle cx="12" cy="8" r="3.5"/>
          {/* shoulders — contained within viewbox */}
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
        <span style={{ fontSize: '10px', fontWeight: isProfile ? 600 : 500 }}>Profile</span>
      </div>
    </div>
  );
}
