'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PhoneLayout from '@/components/ui/PhoneLayout';
import { useMember } from '@/context/MemberContext';
import { useUiText } from '@/context/UiTextContext';

export default function LoginPage() {
  const router = useRouter();
  const { refreshMember } = useMember();
  const { t } = useUiText();

  const [phone, setPhone] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      
      // Check if registration is required
      if (data.requiresRegistration) {
        throw new Error('Account not found. Please register first.');
      }
      
      await refreshMember();
      router.push('/visits');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!otpStep) {
      handleSendOtp();
    } else {
      handleVerifyOtp();
    }
  };

  return (
    <PhoneLayout>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', color: '#3B2A22', overflowY: 'auto', padding: '22px 28px 26px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: '#3B2A22', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 26px -12px rgba(59,42,34,.6)' }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#E9C9A6', letterSpacing: '-.02em' }}>RR</span>
          </div>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.26em', color: '#A67C52', marginTop: '14px' }}>{t('auth.brand', 'ROEMAH ROTI')}</div>
        </div>

        <div style={{ marginTop: '30px' }}>
          <div style={{ fontSize: '27px', fontWeight: 600, letterSpacing: '-.03em' }}>{otpStep ? t('auth.verify_title', 'Verify WhatsApp') : t('auth.signin_title', 'Welcome back')}</div>
          <div style={{ fontSize: '14px', lineHeight: 1.55, color: '#8A7A6E', marginTop: '7px' }}>
            {otpStep ? `${t('auth.verify_subtitle', 'Enter the 6-digit code sent to')} ${phone}` : t('auth.signin_subtitle', 'Access your Roemah Roti Insider membership.')}
          </div>
        </div>

        {error && (
          <div style={{ marginTop: '16px', padding: '12px', background: '#FFEBEB', color: '#D32F2F', borderRadius: '12px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {!otpStep ? (
          <>
            <div style={{ marginTop: '26px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B' }}>WHATSAPP NUMBER</div>
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px', width: '100%', boxSizing: 'border-box', background: '#fff', border: '1px solid #E6DDD0', borderRadius: '14px', padding: '15px 16px', transition: 'border-color .12s ease,box-shadow .12s ease' }}>
                <span style={{ fontSize: '15px', fontWeight: 500, color: '#A08A7B', paddingRight: '10px', borderRight: '1px solid #E6DDD0' }}>+62</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="8123456789"
                  style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: '15px', fontFamily: 'inherit', color: '#3B2A22', paddingLeft: '10px' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '14px', background: '#F3F5F1', border: '1px solid #E1E8DD', borderRadius: '14px', padding: '14px 15px', display: 'flex', gap: '11px', alignItems: 'flex-start' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: '#5C7B5A', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: '12px', height: '9px', border: '1.6px solid #fff', borderRadius: '2px' }}></div></div>
              <div style={{ fontSize: '12.5px', lineHeight: 1.5, color: '#5A6A54' }}>We'll send a 6-digit code to your WhatsApp. No password to remember.</div>
            </div>
          </>
        ) : (
          <div style={{ marginTop: '26px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B' }}>6-DIGIT CODE</div>
            <div style={{ position: 'relative', display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const digit = code[index] || '';
                return (
                  <div 
                    key={index} 
                    style={{
                      width: '45px', height: '56px', background: '#fff', border: '1px solid #E6DDD0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#3B2A22', fontWeight: 600,
                      animation: digit ? 'otp-pop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' : 'none'
                    }}
                  >
                    {digit}
                  </div>
                );
              })}
              <input 
                type="tel" 
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'text' }}
              />
              <style>{`
                @keyframes otp-pop {
                  0% { transform: scale(0.5); opacity: 0; }
                  100% { transform: scale(1); opacity: 1; }
                }
              `}</style>
            </div>
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
          {loading ? 'Processing...' : (otpStep ? 'Verify & log in' : 'Send code & log in')}
        </button>

        {!otpStep && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#EAE1D5' }}></div>
              <span style={{ fontSize: '11px', color: '#B9AB9E' }}>New here?</span>
              <div style={{ flex: 1, height: '1px', background: '#EAE1D5' }}></div>
            </div>

            <button onClick={() => router.push('/register')} style={{ width: '100%', textAlign: 'center', padding: '15px', border: '1px solid #E0D5C6', background: 'transparent', borderRadius: '15px', fontSize: '14px', fontWeight: 600, color: '#3B2A22', cursor: 'pointer' }}>
              {t('auth.btn_create_account', 'Become a Member')}
            </button>
          </>
        )}
      </div>
    </PhoneLayout>
  );
}
