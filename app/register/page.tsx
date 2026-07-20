'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PhoneLayout from '@/components/ui/PhoneLayout';
import { useMember } from '@/context/MemberContext';
import { Eye, EyeOff } from 'lucide-react';
import { useUiText } from '@/context/UiTextContext';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function RegisterPage() {
  const router = useRouter();
  const { refreshMember } = useMember();
  const { t } = useUiText();
  const [step, setStep] = useState<'form' | 'otp' | 'handoff'>('form');

  const [name, setName] = useState('');
  const [wa, setWa] = useState('');
  const [waFocused, setWaFocused] = useState(false);
  const [birthday, setBirthday] = useState<{ y: number, m: number, d: number } | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calMode, setCalMode] = useState<'day' | 'month' | 'year'>('day');
  const [calMonth, setCalMonth] = useState(6);
  const [calYear, setCalYear] = useState(1995);
  const [referral, setReferral] = useState('');
  const [referralStatus, setReferralStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref') || params.get('code') || '';
      if (refCode) {
        const uppercaseCode = refCode.toUpperCase();
        setReferral(uppercaseCode);
        setReferralStatus('checking');
        fetch(`/api/referral/check?code=${encodeURIComponent(uppercaseCode)}`)
          .then(res => res.json())
          .then(data => {
            if (data.valid) {
              setReferralStatus('valid');
            } else {
              setReferralStatus('invalid');
            }
          })
          .catch(() => {
            setReferralStatus('invalid');
          });
      }
    }
  }, []);

  const toggleCalendar = () => {
    setCalendarOpen(v => !v);
    setCalMode('day');
  };
  const prevMonth = () => {
    let m = calMonth - 1, y = calYear;
    if (m < 0) { m = 11; y -= 1; }
    setCalMonth(m); setCalYear(y);
  };
  const nextMonth = () => {
    let m = calMonth + 1, y = calYear;
    if (m > 11) { m = 0; y += 1; }
    setCalMonth(m); setCalYear(y);
  };

  const pickDate = (y: number, m: number, d: number) => {
    setBirthday({ y, m, d });
    setCalendarOpen(false);
  };

  const buildCalendarCells = () => {
    const firstDow = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push({ empty: true });
    for (let d = 1; d <= daysInMonth; d++) {
      const isSel = birthday && birthday.y === calYear && birthday.m === calMonth && birthday.d === d;
      cells.push({
        day: d,
        isSel,
        onPick: () => pickDate(calYear, calMonth, d)
      });
    }
    return cells;
  };

  const waDigits = wa.replace(/\D/g, '');
  const waValid = waDigits.length >= 9 && waDigits.length <= 13;
  const waHasError = wa.length > 0 && !waValid && !waFocused;

  const nameValid = name.trim().length >= 2;
  const birthdayValid = !!birthday;

  const referralTrim = referral.trim().toUpperCase();
  const referralEmpty = referralTrim.length === 0;
  const referralValid = referralStatus === 'valid';
  const referralNotFound = referralStatus === 'invalid';

  const passwordValid = password.length >= 6;
  const canSubmit = nameValid && waValid && birthdayValid && passwordValid && !loading;

  const birthdayLabel = birthday
    ? String(birthday.d).padStart(2, '0') + '/' + String(birthday.m + 1).padStart(2, '0') + '/' + birthday.y
    : 'dd/mm/yyyy';

  const waBorder = waFocused ? '1px solid var(--accent-primary)' : (waHasError ? '1px solid var(--mist)' : '1px solid var(--border-hairline)');
  const waShadow = waFocused ? '0 0 0 3px var(--focus-ring)' : 'none';

  const checkReferralCode = async () => {
    if (referralEmpty) return;
    setReferralStatus('checking');
    try {
      const res = await fetch(`/api/referral/check?code=${encodeURIComponent(referralTrim)}`);
      const data = await res.json();
      if (data.valid) {
        setReferralStatus('valid');
      } else {
        setReferralStatus('invalid');
      }
    } catch {
      setReferralStatus('invalid');
    }
  };

  const submitForm = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      let finalReferralValid = referralValid;
      if (!referralEmpty && referralStatus !== 'valid') {
        const res = await fetch(`/api/referral/check?code=${encodeURIComponent(referralTrim)}`);
        const data = await res.json();
        if (data.valid) {
          setReferralStatus('valid');
          finalReferralValid = true;
        } else {
          setReferralStatus('invalid');
          throw new Error('Invalid referral code. Please check or leave it empty.');
        }
      }

      const birthdayInput = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(birthday!.d).padStart(2, '0')}`;
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: wa,
          name,
          birthdayInput,
          password,
          referralCode: finalReferralValid ? referralTrim : ''
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      await refreshMember();
      setStep('handoff');
      setTimeout(() => {
        router.push('/visits');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async () => {
    // Unused: registration bypasses OTP
  };

  return (

    <PhoneLayout>
      {step === 'form' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', padding: '22px 28px 26px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '2px', flex: 'none' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--espresso)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--wheat)', fontWeight: 700, fontSize: '18px', letterSpacing: '-0.03em' }}>RR</div>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.26em', color: 'var(--caramel)', marginTop: '10px' }}>ROEMAH ROTI</div>
          </div>

          <div style={{ marginTop: '20px', flex: 'none' }}>
            <div style={{ fontSize: 'var(--text-display)', fontWeight: 600, letterSpacing: 'var(--tracking-display)' }}>{t('auth.register_title', 'Create your account')}</div>
            <div style={{ fontSize: '14px', lineHeight: 1.55, color: 'var(--text-label)', marginTop: '7px' }}>{t('auth.register_subtitle', 'Join Roemah Roti Insider membership.')}</div>
          </div>

          {error && (
            <div style={{ marginTop: '16px', padding: '12px', background: '#FFEBEB', color: '#D32F2F', borderRadius: '12px', fontSize: '13px', flex: 'none' }}>
              {error}
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            <div>
              <div style={{ fontSize: 'var(--text-label)', fontWeight: 600, letterSpacing: 'var(--tracking-label)', color: 'var(--text-label)', marginBottom: '8px' }}>FULL NAME</div>
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface-input)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)', padding: '15px 16px', fontSize: 'var(--text-body)', fontFamily: 'inherit', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            <div style={{ marginTop: '18px' }}>
              <div style={{ fontSize: 'var(--text-label)', fontWeight: 600, letterSpacing: 'var(--tracking-label)', color: 'var(--text-label)', marginBottom: '8px' }}>WHATSAPP NUMBER</div>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', boxSizing: 'border-box', background: 'var(--surface-input)', border: waBorder, boxShadow: waShadow, borderRadius: 'var(--radius-sm)', padding: '15px 16px', transition: 'border-color .12s ease,box-shadow .12s ease' }}>
                <span style={{ fontSize: 'var(--text-body)', fontWeight: 500, color: 'var(--text-label)', paddingRight: '10px', borderRight: '1px solid var(--border-hairline)' }}>+62</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="812 3456 789"
                  value={wa}
                  onChange={e => setWa(e.target.value)}
                  onFocus={() => setWaFocused(true)}
                  onBlur={() => setWaFocused(false)}
                  style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 'var(--text-body)', fontFamily: 'inherit', color: 'var(--text-primary)', paddingLeft: '10px' }}
                />
              </div>
              {waHasError && (
                <div style={{ fontSize: '12px', color: 'var(--text-label)', marginTop: '6px' }}>Enter a valid WhatsApp number.</div>
              )}
            </div>

            <div style={{ marginTop: '18px', position: 'relative' }}>
              <div style={{ fontSize: 'var(--text-label)', fontWeight: 600, letterSpacing: 'var(--tracking-label)', color: 'var(--text-label)', marginBottom: '8px' }}>BIRTHDAY</div>
              <div onClick={toggleCalendar} style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface-input)', border: '1px solid var(--border-hairline)', boxShadow: calendarOpen ? '0 0 0 3px var(--focus-ring)' : 'none', borderRadius: 'var(--radius-sm)', padding: '15px 16px', fontSize: 'var(--text-body)', fontFamily: 'inherit', color: birthday ? 'var(--text-primary)' : 'var(--mist)', outline: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{birthdayLabel}</span>
                <div style={{ width: '16px', height: '16px', border: '1.6px solid var(--text-label)', borderRadius: '3px', position: 'relative', flex: 'none' }}>
                  <div style={{ position: 'absolute', top: '-3px', left: '3px', width: '1.6px', height: '5px', background: 'var(--text-label)' }}></div>
                  <div style={{ position: 'absolute', top: '-3px', right: '3px', width: '1.6px', height: '5px', background: 'var(--text-label)' }}></div>
                  <div style={{ position: 'absolute', top: '2px', left: 0, right: 0, height: '1.6px', background: 'var(--text-label)' }}></div>
                </div>
              </div>

              {calendarOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: '#fff', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-modal)', padding: '14px', zIndex: 20 }}>

                  {/* ── DAY VIEW ── */}
                  {calMode === 'day' && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div onClick={prevMonth} style={{ width: '28px', height: '28px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--surface-secondary)' }}>
                          <div style={{ width: '6px', height: '6px', borderLeft: '1.6px solid var(--text-primary)', borderBottom: '1.6px solid var(--text-primary)', transform: 'rotate(45deg)' }}></div>
                        </div>
                        {/* Click header → month view */}
                        <div onClick={() => setCalMode('month')} style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', userSelect: 'none' }}>
                          {MONTHS[calMonth]} {calYear}
                          <div style={{ width: '0', height: '0', borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '5px solid var(--text-label)', marginTop: '1px' }}></div>
                        </div>
                        <div onClick={nextMonth} style={{ width: '28px', height: '28px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--surface-secondary)' }}>
                          <div style={{ width: '6px', height: '6px', borderRight: '1.6px solid var(--text-primary)', borderTop: '1.6px solid var(--text-primary)', transform: 'rotate(45deg)' }}></div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px', marginBottom: '4px' }}>
                        {WEEKDAYS.map((d, i) => (
                          <div key={i} style={{ textAlign: 'center', fontSize: '10.5px', fontWeight: 600, color: 'var(--text-label)', padding: '4px 0' }}>{d}</div>
                        ))}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px' }}>
                        {buildCalendarCells().map((cell, i) => cell.empty ? (
                          <div key={i}></div>
                        ) : (
                          <div key={i} onClick={cell.onPick} style={{ textAlign: 'center', fontSize: '13px', padding: '7px 0', borderRadius: '10px', cursor: 'pointer', fontWeight: cell.isSel ? 600 : 500, color: cell.isSel ? '#FFFCF7' : 'var(--text-primary)', background: cell.isSel ? 'var(--accent-primary)' : 'transparent' }}>
                            {cell.day}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* ── MONTH VIEW ── */}
                  {calMode === 'month' && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div onClick={() => setCalYear(y => y - 1)} style={{ width: '28px', height: '28px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--surface-secondary)' }}>
                          <div style={{ width: '6px', height: '6px', borderLeft: '1.6px solid var(--text-primary)', borderBottom: '1.6px solid var(--text-primary)', transform: 'rotate(45deg)' }}></div>
                        </div>
                        {/* Click year → year view */}
                        <div onClick={() => setCalMode('year')} style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', userSelect: 'none' }}>
                          {calYear}
                          <div style={{ width: '0', height: '0', borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '5px solid var(--text-label)', marginTop: '1px' }}></div>
                        </div>
                        <div onClick={() => setCalYear(y => y + 1)} style={{ width: '28px', height: '28px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--surface-secondary)' }}>
                          <div style={{ width: '6px', height: '6px', borderRight: '1.6px solid var(--text-primary)', borderTop: '1.6px solid var(--text-primary)', transform: 'rotate(45deg)' }}></div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px' }}>
                        {MONTHS.map((m, i) => (
                          <div key={i} onClick={() => { setCalMonth(i); setCalMode('day'); }} style={{ textAlign: 'center', fontSize: '13px', fontWeight: calMonth === i ? 600 : 500, padding: '10px 0', borderRadius: '10px', cursor: 'pointer', background: calMonth === i ? 'var(--accent-primary)' : 'var(--surface-secondary)', color: calMonth === i ? '#FFFCF7' : 'var(--text-primary)' }}>
                            {m.slice(0, 3)}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* ── YEAR VIEW ── */}
                  {calMode === 'year' && (() => {
                    const currentYear = new Date().getFullYear();
                    const years = Array.from({ length: currentYear - 1949 }, (_, i) => currentYear - i);
                    return (
                      <>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-label)', letterSpacing: '.05em', textAlign: 'center', marginBottom: '10px' }}>SELECT YEAR</div>
                        <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px' }}>
                          {years.map(y => (
                            <div key={y} onClick={() => { setCalYear(y); setCalMode('month'); }} style={{ textAlign: 'center', fontSize: '13px', fontWeight: calYear === y ? 600 : 500, padding: '9px 0', borderRadius: '10px', cursor: 'pointer', background: calYear === y ? 'var(--accent-primary)' : 'var(--surface-secondary)', color: calYear === y ? '#FFFCF7' : 'var(--text-primary)' }}>
                              {y}
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}

                </div>
              )}
              <div style={{ fontSize: '12px', color: 'var(--text-label)', marginTop: '6px', lineHeight: 1.5 }}>We'll let you know when your birthday reward is ready.</div>
            </div>

            <div style={{ marginTop: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                <span style={{ fontSize: 'var(--text-label)', fontWeight: 600, letterSpacing: 'var(--tracking-label)', color: 'var(--text-label)' }}>REFERRAL CODE</span>
                <span style={{ fontSize: '11px', color: 'var(--text-label)', letterSpacing: 0, fontWeight: 500 }}>(Optional)</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="text"
                    placeholder="e.g. ROTI2026"
                    value={referral}
                    onChange={e => { setReferral(e.target.value); setReferralStatus('idle'); }}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface-input)', border: referralValid ? '1px solid var(--sage)' : (referralNotFound ? '1px solid #D32F2F' : '1px solid var(--border-hairline)'), borderRadius: 'var(--radius-sm)', padding: '15px 40px 15px 16px', fontSize: 'var(--text-body)', fontFamily: 'inherit', color: 'var(--text-primary)', outline: 'none' }}
                  />
                  {referralValid && (
                    <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent-confirm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '8px', height: '5px', borderLeft: '1.6px solid var(--sage)', borderBottom: '1.6px solid var(--sage)', transform: 'rotate(-45deg) translate(1px,-1px)' }}></div>
                    </div>
                  )}
                </div>
                <button
                  onClick={checkReferralCode}
                  disabled={referralEmpty || referralStatus === 'checking'}
                  style={{ flex: 'none', background: 'var(--surface-secondary)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)', padding: '0 16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', cursor: (referralEmpty || referralStatus === 'checking') ? 'default' : 'pointer', opacity: (referralEmpty || referralStatus === 'checking') ? 0.6 : 1 }}
                >
                  {referralStatus === 'checking' ? '...' : 'Check'}
                </button>
              </div>
              {referralValid && (
                <div style={{ fontSize: '12px', color: 'var(--sage)', marginTop: '6px' }}>Code applied. You'll both earn a visit.</div>
              )}
              {referralNotFound && (
                <div style={{ fontSize: '12px', color: '#D32F2F', marginTop: '6px' }}>Code not found — please check or leave it empty.</div>
              )}
              {referralEmpty && (
                <div style={{ fontSize: '12px', color: 'var(--text-label)', marginTop: '6px', lineHeight: 1.5 }}>Share with a friend — you both earn a visit.</div>
              )}
            </div>

            <div style={{ marginTop: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                <span style={{ fontSize: 'var(--text-label)', fontWeight: 600, letterSpacing: 'var(--tracking-label)', color: 'var(--text-label)' }}>PASSWORD</span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password (min. 6 chars)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface-input)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)', padding: '15px 44px 15px 16px', fontSize: 'var(--text-body)', fontFamily: 'inherit', color: 'var(--text-primary)', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--text-label)',
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-label)', marginTop: '6px', lineHeight: 1.5 }}>You can use this to log in without WhatsApp OTP next time.</div>
            </div>

          </div>

          <div style={{ flex: 1 }}></div>

          <div style={{ flex: 'none', marginTop: '16px' }}>
            <button onClick={submitForm} disabled={!canSubmit || loading} style={{ width: '100%', margin: 0, background: 'var(--accent-primary)', color: '#FFFCF7', textAlign: 'center', padding: '16px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-body)', fontWeight: 600, border: 'none', cursor: canSubmit && !loading ? 'pointer' : 'default', boxShadow: 'var(--shadow-cta)', transition: 'transform .12s ease,box-shadow .12s ease,opacity .12s ease', opacity: canSubmit ? 1 : 0.45, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {loading ? (
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,252,247,.35)', borderTopColor: '#FFFCF7', animation: 'rr-spin .7s linear infinite' }}></div>
              ) : (
                <span>{t('auth.btn_create_account', 'Register')}</span>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--text-label)' }}>
              Already have an account? <span onClick={() => router.push('/signin')} style={{ color: 'var(--caramel)', fontWeight: 600, cursor: 'pointer' }}>Login</span>
            </div>
          </div>
        </div>
      )}

      {step === 'otp' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', padding: '22px 28px 26px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '2px', flex: 'none' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--espresso)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--wheat)', fontWeight: 700, fontSize: '18px', letterSpacing: '-0.03em' }}>RR</div>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.26em', color: 'var(--caramel)', marginTop: '10px' }}>ROEMAH ROTI</div>
          </div>

          <div style={{ marginTop: '30px', flex: 'none' }}>
            <div style={{ fontSize: 'var(--text-display)', fontWeight: 600, letterSpacing: 'var(--tracking-display)' }}>Verify WhatsApp</div>
            <div style={{ fontSize: '14px', lineHeight: 1.55, color: 'var(--text-label)', marginTop: '7px' }}>
              Enter the 6-digit code sent to +62 {wa}
            </div>
          </div>

          {error && (
            <div style={{ marginTop: '16px', padding: '12px', background: '#FFEBEB', color: '#D32F2F', borderRadius: '12px', fontSize: '13px', flex: 'none' }}>
              {error}
            </div>
          )}

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
            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#A08A7B', cursor: 'pointer' }} onClick={() => { setStep('form'); setCode(''); setError(''); }}>
              Back to registration details
            </div>
          </div>

          <div style={{ flex: 1 }}></div>

          <button onClick={submitOtp} disabled={loading} style={{ width: '100%', margin: 0, background: 'var(--accent-primary)', color: '#FFFCF7', textAlign: 'center', padding: '16px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-body)', fontWeight: 600, border: 'none', cursor: loading ? 'default' : 'pointer', boxShadow: loading ? 'none' : 'var(--shadow-cta)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {loading ? (
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,252,247,.35)', borderTopColor: '#FFFCF7', animation: 'rr-spin .7s linear infinite' }}></div>
            ) : (
              <span>Verify & complete</span>
            )}
          </button>
        </div>
      )}

      {step === 'handoff' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '22px 28px 26px' }}>
          <style>{`
            @keyframes rr-success-pop {
              0% { transform: scale(0.8); opacity: 0; }
              50% { transform: scale(1.1); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--sage)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 26px -12px rgba(59,42,34,.4)', animation: 'rr-success-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
            <div style={{ width: '20px', height: '11px', borderBottom: '3px solid #fff', borderLeft: '3px solid #fff', transform: 'rotate(-45deg) translate(2px, -2px)' }}></div>
          </div>
          <div style={{ fontSize: 'var(--text-title)', fontWeight: 600, letterSpacing: 'var(--tracking-title)', marginTop: '22px', animation: 'rr-success-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards', animationDelay: '0.1s', opacity: 0 }}>Registration Complete!</div>
          <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-label)', marginTop: '10px', maxWidth: '260px', animation: 'rr-success-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards', animationDelay: '0.2s', opacity: 0 }}>
            Your account is verified and ready to use. Redirecting to your dashboard...
          </div>
        </div>
      )}
    </PhoneLayout>
  );
}
