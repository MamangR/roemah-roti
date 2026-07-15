'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function AdminSignInPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      router.push('/admin');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

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
        width: '100%',
        maxWidth: '420px',
        background: '#FFFFFF',
        border: '1px solid #EFE8DE',
        borderRadius: '28px',
        boxShadow: '0 30px 60px -20px rgba(59, 42, 34, 0.25), 0 0 0 1px rgba(59, 42, 34, 0.03)',
        padding: '44px 36px 40px',
        boxSizing: 'border-box',
      }}>
        {/* Logo & Branding */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: '#3B2A22',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 26px -12px rgba(59, 42, 34, 0.6)',
          }}>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#E9C9A6', letterSpacing: '-.02em' }}>RR</span>
          </div>
          <div style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '.26em',
            color: '#A67C52',
            marginTop: '16px',
            textTransform: 'uppercase',
          }}>
            ROEMAH ROTI
          </div>
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginTop: '28px' }}>
          <div style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-.03em', color: '#3B2A22' }}>
            Staff Sign In
          </div>
          <div style={{ fontSize: '14px', lineHeight: 1.55, color: '#8A7A6E', marginTop: '7px' }}>
            Access the admin dashboard with your staff credentials.
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: '20px',
            padding: '12px 14px',
            background: '#FFF5F5',
            border: '1px solid #FFE0E0',
            color: '#C53030',
            borderRadius: '14px',
            fontSize: '13px',
            fontWeight: 500,
            lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <div style={{ marginTop: '26px' }} onKeyDown={handleKeyDown}>
          {/* Username */}
          <div>
            <div style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '.1em',
              color: '#A08A7B',
              textTransform: 'uppercase',
            }}>
              USERNAME
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
              style={{
                marginTop: '8px',
                width: '100%',
                boxSizing: 'border-box',
                background: '#fff',
                border: '1px solid #E6DDD0',
                borderRadius: '14px',
                padding: '14px 16px',
                fontSize: '15px',
                fontFamily: 'inherit',
                color: '#3B2A22',
                outline: 'none',
                transition: 'border-color .2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#A67C52'}
              onBlur={(e) => e.target.style.borderColor = '#E6DDD0'}
            />
          </div>

          {/* Password */}
          <div style={{ marginTop: '16px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '.1em',
              color: '#A08A7B',
              textTransform: 'uppercase',
            }}>
              PASSWORD
            </div>
            <div style={{ position: 'relative', marginTop: '8px' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#fff',
                  border: '1px solid #E6DDD0',
                  borderRadius: '14px',
                  padding: '14px 44px 14px 16px',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  color: '#3B2A22',
                  outline: 'none',
                  transition: 'border-color .2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#A67C52'}
                onBlur={(e) => e.target.style.borderColor = '#E6DDD0'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#A08A7B',
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            marginTop: '28px',
            width: '100%',
            background: loading ? '#C3A990' : '#A67C52',
            color: '#FFFCF7',
            textAlign: 'center',
            padding: '16px',
            borderRadius: '15px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: loading ? 'default' : 'pointer',
            border: 'none',
            boxShadow: loading ? 'none' : '0 14px 26px -14px rgba(166,124,82,.9)',
            transition: 'transform .12s ease, box-shadow .12s ease, background .2s',
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        {/* Footer note */}
        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '12px',
          color: '#B9AB9E',
          lineHeight: 1.5,
        }}>
          Staff Tool · Internal Use Only
        </div>
      </div>
    </div>
  );
}
