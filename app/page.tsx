'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PhoneLayout from '@/components/ui/PhoneLayout';
import { useMember } from '@/context/MemberContext';

export default function LoginPage() {
  const router = useRouter();
  const { refreshMember } = useMember();
  const [method, setMethod] = useState<'whatsapp' | 'memberId'>('whatsapp');
  const [auth, setAuth] = useState<'otp' | 'password'>('otp');
  
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ind = (active: boolean) => ({
    position: 'absolute' as const, top: '4px', bottom: '4px', left: '4px',
    width: 'calc(50% - 4px)', background: '#fff', borderRadius: '11px',
    boxShadow: '0 2px 6px rgba(59,42,34,.12)', zIndex: 1,
    transform: active ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform .32s cubic-bezier(.22,1,.36,1)'
  });

  const handleSendOtp = async () => {
    if (!phone) return setError('Please enter your phone number');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      if (data.devMode) {
        console.log("DEV MODE OTP:", data.code);
        alert(`DEV MODE OTP (Normally sent to WhatsApp): ${data.code}`);
      }
      setOtpStep(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!code) return setError('Please enter the 6-digit code');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      await refreshMember();
      router.push('/visits');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (auth === 'otp' && !otpStep) {
      handleSendOtp();
    } else if (auth === 'otp' && otpStep) {
      handleVerifyOtp();
    } else if (auth === 'password') {
      if (!phone || !password) return setError('Please enter both identifier and password');
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/auth/login-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: phone, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Invalid credentials');
        await refreshMember();
        router.push('/visits');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <PhoneLayout>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', color: '#3B2A22' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: '#3B2A22', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 26px -12px rgba(59,42,34,.6)' }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#E9C9A6', letterSpacing: '-.02em' }}>RR</span>
          </div>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.26em', color: '#A67C52', marginTop: '14px' }}>ROEMAH ROTI</div>
        </div>

        <div style={{ marginTop: '30px' }}>
          <div style={{ fontSize: '27px', fontWeight: 600, letterSpacing: '-.03em' }}>{otpStep ? 'Verify WhatsApp' : 'Welcome back'}</div>
          <div style={{ fontSize: '14px', lineHeight: 1.55, color: '#8A7A6E', marginTop: '7px' }}>
            {otpStep ? `Enter the 6-digit code sent to ${phone}` : 'Access your Roemah Roti Insider membership.'}
          </div>
        </div>

        {error && (
          <div style={{ marginTop: '16px', padding: '12px', background: '#FFEBEB', color: '#D32F2F', borderRadius: '12px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {!otpStep ? (
          <>
            <div style={{ position: 'relative', display: 'flex', marginTop: '26px', background: '#F1EBE1', borderRadius: '14px', padding: '4px' }}>
              <div style={ind(method === 'whatsapp')}></div>
              <div onClick={() => setMethod('whatsapp')} style={{ position: 'relative', zIndex: 2, flex: 1, textAlign: 'center', padding: '10px 0', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#3B2A22' }}>WhatsApp</div>
              <div onClick={() => setMethod('memberId')} style={{ position: 'relative', zIndex: 2, flex: 1, textAlign: 'center', padding: '10px 0', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#3B2A22' }}>Member ID</div>
            </div>

            <div style={{ marginTop: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B' }}>{method === 'whatsapp' ? 'WHATSAPP NUMBER' : 'MEMBER ID'}</div>
              <input 
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={method === 'whatsapp' ? '+62 812 3456 789' : 'RR-04217'} 
                style={{ marginTop: '8px', width: '100%', boxSizing: 'border-box', background: '#fff', border: '1px solid #E6DDD0', borderRadius: '14px', padding: '15px 16px', fontSize: '15px', fontFamily: 'inherit', color: '#3B2A22', outline: 'none' }} 
              />
            </div>

            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', marginBottom: '8px' }}>HOW TO VERIFY</div>
              <div style={{ position: 'relative', display: 'flex', background: '#F1EBE1', borderRadius: '14px', padding: '4px' }}>
                <div style={ind(auth === 'otp')}></div>
                <div onClick={() => setAuth('otp')} style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '10px 0', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#3B2A22' }}>
                  OTP <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '.04em', color: '#5C7B5A', background: 'rgba(122,150,116,.18)', padding: '2px 6px', borderRadius: '6px' }}>RECOMMENDED</span>
                </div>
                <div onClick={() => setAuth('password')} style={{ position: 'relative', zIndex: 2, flex: 1, textAlign: 'center', padding: '10px 0', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#3B2A22' }}>Password</div>
              </div>
            </div>

            {auth === 'otp' ? (
              <div style={{ marginTop: '14px', background: '#F3F5F1', border: '1px solid #E1E8DD', borderRadius: '14px', padding: '14px 15px', display: 'flex', gap: '11px', alignItems: 'flex-start' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: '#5C7B5A', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: '12px', height: '9px', border: '1.6px solid #fff', borderRadius: '2px' }}></div></div>
                <div style={{ fontSize: '12.5px', lineHeight: 1.5, color: '#5A6A54' }}>We'll send a 6-digit code to your WhatsApp. No password to remember.</div>
              </div>
            ) : (
              <div style={{ marginTop: '14px' }}>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password" 
                  style={{ width: '100%', boxSizing: 'border-box', background: '#fff', border: '1px solid #E6DDD0', borderRadius: '14px', padding: '15px 16px', fontSize: '15px', fontFamily: 'inherit', color: '#3B2A22', outline: 'none' }} 
                />
              </div>
            )}
          </>
        ) : (
          <div style={{ marginTop: '26px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B' }}>6-DIGIT CODE</div>
            <input 
              type="text" 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000" 
              maxLength={6}
              style={{ marginTop: '8px', width: '100%', boxSizing: 'border-box', background: '#fff', border: '1px solid #E6DDD0', borderRadius: '14px', padding: '15px 16px', fontSize: '24px', letterSpacing: '.5em', textAlign: 'center', fontFamily: 'inherit', color: '#3B2A22', outline: 'none' }} 
            />
            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#A08A7B', cursor: 'pointer' }} onClick={() => { setOtpStep(false); setCode(''); setError(''); }}>
              Use a different number
            </div>
          </div>
        )}

        <div style={{ flex: 1 }}></div>

        <button 
          onClick={handleLogin}
          disabled={loading}
          style={{ marginTop: '20px', background: loading ? '#C3A990' : '#A67C52', color: '#FFFCF7', textAlign: 'center', padding: '16px', borderRadius: '15px', fontSize: '15px', fontWeight: 600, cursor: loading ? 'default' : 'pointer', border: 'none', width: '100%', boxShadow: loading ? 'none' : '0 14px 26px -14px rgba(166,124,82,.9)', transition: 'transform .12s ease,box-shadow .12s ease' }}
        >
          {loading ? 'Processing...' : (auth === 'otp' ? (otpStep ? 'Verify & log in' : 'Send code & log in') : 'Log in')}
        </button>

        {!otpStep && (
          <>
            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#A08A7B', cursor: 'pointer' }}>Forgot password?</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#EAE1D5' }}></div>
              <span style={{ fontSize: '11px', color: '#B9AB9E' }}>New here?</span>
              <div style={{ flex: 1, height: '1px', background: '#EAE1D5' }}></div>
            </div>

            <button onClick={() => router.push('/register')} style={{ width: '100%', textAlign: 'center', padding: '15px', border: '1px solid #E0D5C6', background: 'transparent', borderRadius: '15px', fontSize: '14px', fontWeight: 600, color: '#3B2A22', cursor: 'pointer' }}>
              Become a Member
            </button>
          </>
        )}
      </div>
    </PhoneLayout>
  );
}
