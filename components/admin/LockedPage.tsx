'use client';

import React from 'react';

interface LockedPageProps {
  pageName?: string;
}

export function LockedPage({ pageName }: LockedPageProps) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F8F4EE',
      fontFamily: "'Inter', sans-serif",
      padding: '20px',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '60px 30px',
        background: '#FFFFFF',
        border: '1px solid #EFE8DE',
        borderRadius: '22px',
        boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)',
        maxWidth: '440px',
        width: '100%',
      }}>
        {/* Lock icon */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#F8F4EE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '22px',
        }}>
          <div style={{
            width: '18px',
            height: '15px',
            border: '2px solid #7A6A5F',
            borderTop: 'none',
            borderRadius: '0 0 4px 4px',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              top: '-13px',
              left: '2px',
              width: '10px',
              height: '13px',
              border: '2px solid #7A6A5F',
              borderBottom: 'none',
              borderRadius: '7px 7px 0 0',
            }}></div>
          </div>
        </div>
        <div style={{
          fontSize: '20px',
          fontWeight: 600,
          color: '#3B2A22',
          letterSpacing: '-0.02em',
        }}>
          This page is locked for cashier
        </div>
        <div style={{
          fontSize: '14px',
          color: '#7A6A5F',
          marginTop: '10px',
          maxWidth: '340px',
          lineHeight: 1.6,
        }}>
          {pageName
            ? `You don't have permission to access ${pageName}. Contact your admin to update your access.`
            : `You don't have permission to access this page. Contact your admin to update your access.`
          }
        </div>
      </div>
    </div>
  );
}
