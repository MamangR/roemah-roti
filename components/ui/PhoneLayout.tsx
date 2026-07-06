'use client';

import React from 'react';

interface PhoneLayoutProps {
  children: React.ReactNode;
}

export default function PhoneLayout({ children }: PhoneLayoutProps) {
  return (
    <>
      {/* Mobile: full-bleed, edge-to-edge, no frame chrome */}
      <div
        className="flex flex-col sm:hidden"
        style={{
          width: '100%',
          minHeight: '100dvh',
          background: 'var(--surface-page)',
          color: 'var(--text-primary)',
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>

      {/* sm+: phone-frame demo mode, centered on bg-page canvas */}
      <div
        className="hidden sm:flex min-h-screen w-full items-center justify-center sm:p-6 md:p-12 box-border"
        style={{ background: 'var(--bg-page)' }}
      >
        <div
          className="relative flex flex-col w-full sm:h-[842px] sm:max-w-[390px] overflow-hidden"
          style={{
            background: 'var(--surface-page)',
            borderRadius: 'var(--radius-hero)',
            boxShadow: 'var(--shadow-device)',
          }}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', color: 'var(--text-primary)', position: 'relative', overflow: 'hidden' }}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

