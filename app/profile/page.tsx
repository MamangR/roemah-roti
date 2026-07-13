'use client';

import React, { useState, useEffect } from 'react';
import PhoneLayout from '@/components/ui/PhoneLayout';
import BottomNav from '@/components/ui/BottomNav';
import { useRouter } from 'next/navigation';
import { useMember } from '@/context/MemberContext';

export default function ProfilePage() {
  const router = useRouter();
  const { member, logout } = useMember();
  const [view, setView] = useState<'main' | 'personal' | 'membership' | 'edit' | 'loggedOut'>('main');
  const [logoutSheetOpen, setLogoutSheetOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastKey, setToastKey] = useState(0);

  const [profile, setProfile] = useState({ name: 'Loading...', phone: 'Loading...', email: 'example@roemahroti.id', dob: 'Loading...' });
  const [form, setForm] = useState({ ...profile });

  useEffect(() => {
    if (member) {
      const data = {
        name: member.name,
        phone: member.phone,
        email: member.email || 'Not Set',
        dob: member.birthday || 'Unknown'
      };
      setProfile(data);
      setForm(data);
    }
  }, [member]);

  const toast = (msg: string) => {
    setToastMsg(msg);
    setToastKey(k => k + 1);
    setTimeout(() => setToastMsg(''), 1800);
  };

  const initials = member?.initials || 'U';
  const since = member?.since || 'Unknown';
  const memberId = member?.id || 'RR-00000';
  const tier = 'Insider';
  const outlet = 'Greenville Outlet';
  const referral = member?.referralCode || 'RR-CODE';

  const saveProfile = () => {
    setProfile({ ...form });
    setView('main');
    toast('Profile updated');
  };

  const confirmLogout = async () => {
    setLogoutSheetOpen(false);
    await logout();
  };

  return (
    <PhoneLayout>
      <div className="p-scroll" key={view} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto', animation: 'pslide .3s cubic-bezier(.22,1,.36,1)', color: '#3B2A22' }}>

        {/* ============ PROFILE MAIN ============ */}
        {view === 'main' && (
          <div style={{ padding: '16px 20px 96px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: '10px' }}>
              <div style={{ width: '76px', height: '76px', borderRadius: '50%', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: 600, color: '#A67C52' }}>{initials}</div>
              <div style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-.02em', marginTop: '14px' }}>{profile.name}</div>
              <div style={{ fontSize: '12.5px', color: '#A08A7B', marginTop: '4px' }}>Insider since {since}</div>
            </div>

            <div style={{ marginTop: '26px', background: '#fff', border: '1px solid #EFE8DE', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 26px -20px rgba(59,42,34,.35)' }}>
              <div onClick={() => setView('personal')} style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '16px 17px', cursor: 'pointer', borderBottom: '1px solid #F2ECE3' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: '#F1EBE1', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#A67C52" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"></path></svg>
                </div>
                <div style={{ flex: 1, fontSize: '14.5px', fontWeight: 600 }}>Personal Information</div>
                <div style={{ fontSize: '16px', color: '#C4B6A9' }}>›</div>
              </div>
              <div onClick={() => setView('membership')} style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '16px 17px', cursor: 'pointer', borderBottom: '1px solid #F2ECE3' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: '#F1EBE1', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#A67C52" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="13" rx="3"></rect><path d="M3 10h18 M7 15h4"></path></svg>
                </div>
                <div style={{ flex: 1, fontSize: '14.5px', fontWeight: 600 }}>Membership Information</div>
                <div style={{ fontSize: '16px', color: '#C4B6A9' }}>›</div>
              </div>
              <div onClick={() => { setForm({ ...profile }); setView('edit'); }} style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '16px 17px', cursor: 'pointer' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: '#F1EBE1', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#A67C52" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20l4-1 11-11-3-3L5 16z"></path></svg>
                </div>
                <div style={{ flex: 1, fontSize: '14.5px', fontWeight: 600 }}>Edit Profile</div>
                <div style={{ fontSize: '16px', color: '#C4B6A9' }}>›</div>
              </div>
            </div>

            <div onClick={() => setLogoutSheetOpen(true)} style={{ marginTop: '16px', textAlign: 'center', padding: '15px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#8A7A6E' }}>Logout</div>
          </div>
        )}

        {/* ============ PERSONAL INFO ============ */}
        {view === 'personal' && (
          <div style={{ padding: '8px 22px 60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div onClick={() => setView('main')} style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#3B2A22' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg></div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>Personal Information</div>
            </div>
            <div style={{ marginTop: '22px', background: '#F8F4EE', borderRadius: '18px', padding: '6px 20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #EFE6DA' }}><span style={{ fontSize: '13px', color: '#A08A7B' }}>Full Name</span><span style={{ fontSize: '13.5px', fontWeight: 600 }}>{profile.name}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #EFE6DA' }}><span style={{ fontSize: '13px', color: '#A08A7B' }}>Phone Number</span><span style={{ fontSize: '13.5px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{profile.phone}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #EFE6DA' }}><span style={{ fontSize: '13px', color: '#A08A7B' }}>Email</span><span style={{ fontSize: '13.5px', fontWeight: 600 }}>{profile.email}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0' }}><span style={{ fontSize: '13px', color: '#A08A7B' }}>Date of Birth</span><span style={{ fontSize: '13.5px', fontWeight: 600 }}>{profile.dob}</span></div>
            </div>
          </div>
        )}

        {/* ============ MEMBERSHIP INFO ============ */}
        {view === 'membership' && (
          <div style={{ padding: '8px 22px 60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div onClick={() => setView('main')} style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#3B2A22' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg></div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>Membership Information</div>
            </div>
            <div style={{ marginTop: '22px', background: '#F8F4EE', borderRadius: '18px', padding: '6px 20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #EFE6DA' }}><span style={{ fontSize: '13px', color: '#A08A7B' }}>Member ID</span><span style={{ fontSize: '13.5px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{memberId}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #EFE6DA' }}><span style={{ fontSize: '13px', color: '#A08A7B' }}>Membership Tier</span><span style={{ fontSize: '13.5px', fontWeight: 600 }}>{tier}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #EFE6DA' }}><span style={{ fontSize: '13px', color: '#A08A7B' }}>Member Since</span><span style={{ fontSize: '13.5px', fontWeight: 600 }}>{since}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #EFE6DA' }}><span style={{ fontSize: '13px', color: '#A08A7B' }}>Home Outlet</span><span style={{ fontSize: '13.5px', fontWeight: 600 }}>{outlet}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0' }}><span style={{ fontSize: '13px', color: '#A08A7B' }}>Referral Code</span><span style={{ fontSize: '13.5px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', letterSpacing: '.03em' }}>{referral}</span></div>
            </div>
          </div>
        )}

        {/* ============ EDIT PROFILE ============ */}
        {view === 'edit' && (
          <div style={{ padding: '8px 22px 60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div onClick={() => setView('main')} style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#3B2A22' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg></div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>Edit Profile</div>
            </div>

            <div style={{ marginTop: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', marginBottom: '7px' }}>FULL NAME</div>
                <input className="p-input" style={{ width: '100%', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#3B2A22', background: '#fff', border: '1px solid #E6DDD0', borderRadius: '14px', padding: '13px 14px', outline: 'none' }} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', marginBottom: '7px' }}>PHONE NUMBER</div>
                <input className="p-input" style={{ width: '100%', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#3B2A22', background: '#fff', border: '1px solid #E6DDD0', borderRadius: '14px', padding: '13px 14px', outline: 'none' }} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', marginBottom: '7px' }}>EMAIL</div>
                <input className="p-input" style={{ width: '100%', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#3B2A22', background: '#fff', border: '1px solid #E6DDD0', borderRadius: '14px', padding: '13px 14px', outline: 'none' }} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', marginBottom: '7px' }}>DATE OF BIRTH</div>
                <input className="p-input" style={{ width: '100%', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#3B2A22', background: '#fff', border: '1px solid #E6DDD0', borderRadius: '14px', padding: '13px 14px', outline: 'none' }} value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
              </div>
            </div>

            <div onClick={saveProfile} style={{ marginTop: '26px', textAlign: 'center', background: '#A67C52', color: '#FFFCF7', padding: '16px', borderRadius: '16px', fontSize: '14.5px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 14px 26px -16px rgba(166,124,82,.9)', transition: 'transform .12s ease' }}>Save Changes</div>
          </div>
        )}

        {/* ============ LOGGED OUT ============ */}
        {view === 'loggedOut' && (
          <div style={{ minHeight: '766px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px', boxSizing: 'border-box', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#A67C52' }}>RR</div>
            <div style={{ fontSize: '19px', fontWeight: 600, letterSpacing: '-.02em', marginTop: '20px' }}>You've been logged out</div>
            <div style={{ fontSize: '13.5px', color: '#8A7A6E', marginTop: '8px' }}>See you soon.</div>
            <div onClick={() => router.push('/signin')} style={{ marginTop: '26px', width: '100%', boxSizing: 'border-box', background: '#A67C52', color: '#FFFCF7', textAlign: 'center', padding: '16px', borderRadius: '16px', fontSize: '14.5px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 14px 26px -16px rgba(166,124,82,.9)', transition: 'transform .12s ease' }}>Log In Again</div>
          </div>
        )}

      </div>

      {view === 'main' && <BottomNav />}

      {/* LOGOUT SHEET */}
      {logoutSheetOpen && (
        <>
          <div onClick={() => setLogoutSheetOpen(false)} style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(43,30,24,.5)', animation: 'pfade .2s ease' }}></div>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 21, background: '#FCFBF8', borderRadius: '24px 24px 0 0', padding: '10px 20px 30px', boxShadow: '0 -20px 50px -20px rgba(0,0,0,.3)', animation: 'psheetup .32s cubic-bezier(.22,1,.36,1)' }}>
            <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#E0D5C6', margin: '6px auto 18px' }}></div>
            <div style={{ fontSize: '15px', fontWeight: 600, textAlign: 'center' }}>Log out of your Roemah Roti account?</div>
            <div style={{ fontSize: '12.5px', color: '#8A7A6E', textAlign: 'center', marginTop: '6px' }}>You can log back in anytime.</div>
            <div onClick={confirmLogout} style={{ marginTop: '22px', textAlign: 'center', background: '#3B2A22', color: '#F8F4EE', padding: '15px', borderRadius: '14px', fontSize: '14.5px', fontWeight: 600, cursor: 'pointer' }}>Log Out</div>
            <div onClick={() => setLogoutSheetOpen(false)} style={{ marginTop: '10px', textAlign: 'center', border: '1px solid #E0D5C6', padding: '15px', borderRadius: '14px', fontSize: '14.5px', fontWeight: 600, cursor: 'pointer' }}>Cancel</div>
          </div>
        </>
      )}

      {/* TOAST */}
      {toastMsg && (
        <div key={toastKey} style={{ position: 'absolute', left: '50%', bottom: '30px', zIndex: 30, background: '#3B2A22', color: '#F8F4EE', fontSize: '12.5px', fontWeight: 600, padding: '11px 18px', borderRadius: '999px', boxShadow: '0 12px 26px -12px rgba(0,0,0,.4)', animation: 'ptoast 1.8s ease forwards', whiteSpace: 'nowrap', transform: 'translateX(-50%)' }}>
          {toastMsg}
        </div>
      )}
    </PhoneLayout>
  );
}
