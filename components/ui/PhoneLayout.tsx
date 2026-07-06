'use client';

import React from 'react';

interface PhoneLayoutProps {
  children: React.ReactNode;
}

export default function PhoneLayout({ children }: PhoneLayoutProps) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center sm:p-6 md:p-12 box-border" style={{ background: 'var(--bg-page)' }}>
      <div 
        className="relative flex flex-col w-full h-[100dvh] sm:h-auto sm:min-h-[842px] sm:max-w-[390px] overflow-x-hidden overflow-y-auto"
        style={{
          background: 'var(--surface-page)',
          borderRadius: 'var(--radius-hero)',
          boxShadow: 'var(--shadow-device)'
        }}
      >
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '22px 28px 26px', boxSizing: 'border-box', color: 'var(--text-primary)', position: 'relative' }}>
            {children}
        </div>
      </div>
    </div>
  );
}
