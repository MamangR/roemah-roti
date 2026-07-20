'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { LockedPage } from '@/components/admin/LockedPage';
import { UI_TEXT_DEFAULTS } from '@/context/UiTextContext';
import { LogOut, Type, ChevronDown, ChevronRight, RotateCcw, Search, Check, Settings } from 'lucide-react';

// ─── Text field definitions grouped by page ──────────────────────────────────
const TEXT_GROUPS = [
  {
    id: 'visits',
    label: 'Visits / Dashboard',
    description: 'Main customer dashboard — greetings, labels, and CTAs.',
    fields: [
      { key: 'visits.greeting_morning', label: 'Morning greeting' },
      { key: 'visits.greeting_afternoon', label: 'Afternoon greeting' },
      { key: 'visits.greeting_evening', label: 'Evening greeting' },
      { key: 'visits.brand_label', label: 'Brand name on membership card' },
      { key: 'visits.member_since_prefix', label: '"Member since" prefix' },
      { key: 'visits.referral_code_label', label: 'Referral code section label' },
      { key: 'visits.invite_friends_button', label: 'Invite button text' },
      { key: 'visits.lifetime_spend_label', label: 'Lifetime spend section label' },
      { key: 'visits.max_tier_message', label: 'Max tier reached message' },
      { key: 'visits.tier_progress_suffix', label: 'Tier progress text (before tier name)' },
      { key: 'visits.tier_progress_note', label: 'Tier progress encouraging note' },
      { key: 'visits.visit_progress_label', label: 'Visit progress section header' },
      { key: 'visits.view_history_link', label: '"View History" link text' },
      { key: 'visits.updates_title', label: 'Updates card title' },
      { key: 'visits.updates_subtitle', label: 'Updates card subtitle' },
      { key: 'visits.refer_friend_title', label: 'Referral card title' },
      { key: 'visits.refer_friend_subtitle', label: 'Referral card subtitle' },
      { key: 'visits.roadmap_title', label: 'Membership roadmap title' },
      { key: 'visits.roadmap_subtitle', label: 'Membership roadmap description' },
    ]
  },
  {
    id: 'rewards',
    label: 'Rewards',
    description: 'Rewards page — status messages and section titles.',
    fields: [
      { key: 'rewards.page_title', label: 'Page heading' },
      { key: 'rewards.locked_footer', label: 'Locked reward footer note' },
      { key: 'rewards.unlocked_footer', label: 'Unlocked reward footer instruction' },
      { key: 'rewards.redeemed_footer', label: 'Redeemed reward footer note' },
      { key: 'rewards.expired_footer', label: 'Expired reward footer note' },
      { key: 'rewards.keep_visiting', label: 'Default locked reward message' },
      { key: 'rewards.history_title', label: 'Redemption history section title' },
    ]
  },
  {
    id: 'referral',
    label: 'Referral',
    description: 'Referral program — page titles, labels, and instructions.',
    fields: [
      { key: 'referral.page_title', label: 'Page heading' },
      { key: 'referral.page_subtitle', label: 'Page description' },
      { key: 'referral.code_label', label: 'Referral code section label' },
      { key: 'referral.code_instruction', label: 'Code instruction text' },
      { key: 'referral.share_title', label: 'Share section title' },
      { key: 'referral.progress_title', label: 'Progress section title' },
      { key: 'referral.friends_title', label: 'Friends list header' },
    ]
  },
  {
    id: 'profile',
    label: 'Profile',
    description: 'Profile page — menu item labels.',
    fields: [
      { key: 'profile.personal_info', label: 'Personal info menu item' },
      { key: 'profile.membership_details', label: 'Membership details menu item' },
    ]
  },
  {
    id: 'membership',
    label: 'Membership / How It Works',
    description: 'Membership explainer page — titles and notes.',
    fields: [
      { key: 'membership.page_label', label: 'Page label (small text)' },
      { key: 'membership.page_title', label: 'Page heading' },
      { key: 'membership.page_subtitle', label: 'Page intro text' },
      { key: 'membership.tier_note', label: 'Bottom tier permanence note' },
    ]
  },
];

export default function EditUiPageWrapper() {
  const { adminUser, hasPermission, loading: authLoading } = useAdminAuth();

  if (authLoading) return null;
  if (!adminUser) return null;
  if (!hasPermission('manage_settings')) {
    return <LockedPage pageName="Edit UI" />;
  }

  return <EditUiPage />;
}

function EditUiPage() {
  const router = useRouter();
  const { adminUser, logout } = useAdminAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [savedOverrides, setSavedOverrides] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['visits']));
  const [searchQuery, setSearchQuery] = useState('');

  // Load overrides from API
  useEffect(() => {
    fetch('/api/admin/ui-settings')
      .then(res => res.json())
      .then(data => {
        setOverrides(data.overrides || {});
        setSavedOverrides(data.overrides || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getValue = (key: string) => {
    if (overrides[key] !== undefined) return overrides[key];
    return '';
  };

  const isCustomized = (key: string) => overrides[key] !== undefined && overrides[key] !== '';

  const handleChange = (key: string, value: string) => {
    setOverrides(prev => {
      const next = { ...prev };
      if (value === '' || value === UI_TEXT_DEFAULTS[key]) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  const resetField = (key: string) => {
    setOverrides(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const hasChanges = JSON.stringify(overrides) !== JSON.stringify(savedOverrides);

  const customizedCount = Object.keys(overrides).filter(k => overrides[k] !== '').length;

  const saveAll = async () => {
    setSaving(true);
    try {
      // Build the full overrides including cleared keys
      const payload: Record<string, string> = {};
      // Include all current overrides
      for (const [key, value] of Object.entries(overrides)) {
        payload[key] = value;
      }
      // Send empty string for keys that were previously saved but now cleared
      for (const key of Object.keys(savedOverrides)) {
        if (!(key in overrides)) {
          payload[key] = '';
        }
      }

      const res = await fetch('/api/admin/ui-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrides: payload }),
      });

      if (res.ok) {
        setSavedOverrides({ ...overrides });
        setSaveToast('Changes saved successfully');
      } else {
        setSaveToast('Failed to save changes');
      }
    } catch {
      setSaveToast('Error saving changes');
    }
    setSaving(false);
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Filter fields by search
  const filteredGroups = TEXT_GROUPS.map(group => ({
    ...group,
    fields: group.fields.filter(field =>
      !searchQuery ||
      field.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      field.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (UI_TEXT_DEFAULTS[field.key] || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (overrides[field.key] || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.fields.length > 0);

  // ─── Sidebar navigation items ──────────────────────────────────────────────
  const sidebarItems = [
    { label: 'Settings', icon: <Settings size={15} />, active: false, onClick: () => router.push('/admin/settings') },
    { label: 'Edit UI', icon: <Type size={15} />, active: true, onClick: () => {} },
  ];

  const renderSidebar = (isMobile: boolean) => (
    <>
      <div onClick={() => router.push(adminUser?.role === 'cashier' ? '/admin/cashierdashboard' : '/admin')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '11px', padding: '0 8px 26px', borderBottom: '1px solid rgba(248, 244, 238, 0.12)' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#E9C9A6', letterSpacing: '-.02em' }}>RR</span>
        </div>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.22em', color: 'rgba(248, 244, 238, 0.72)' }}>ROEMAH ROTI</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(248, 244, 238, 0.92)', marginTop: '2px' }}>{adminUser?.role === 'cashier' ? 'Cashier Menu' : 'Dashboard'}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '22px' }}>
        {sidebarItems.map(item => (
          <div key={item.label} onClick={item.onClick} style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 12px', borderRadius: '12px', background: item.active ? 'rgba(166,124,82,.9)' : 'transparent', color: item.active ? '#2A1E18' : 'rgba(248, 244, 238, 0.72)', cursor: 'pointer', transition: 'background .15s' }}>
            {item.icon}
            <span style={{ fontSize: '14px', fontWeight: 600 }}>{item.label}</span>
          </div>
        ))}
        {/* Logout Button */}
        <div onClick={() => setLogoutModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 12px', borderRadius: '12px', color: '#FF6B6B', cursor: 'pointer', marginTop: '4px' }}>
          <LogOut size={16} strokeWidth={2} />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Logout</span>
        </div>
      </div>
      <div style={{ flex: 1 }}></div>
      <div style={{ padding: '12px', fontSize: '11px', lineHeight: 1.5, color: 'rgba(248, 244, 238, 0.5)' }}>Staff Tool · Internal Use<br />Logged in as {adminUser?.role === 'admin' ? 'Owner' : 'Cashier'}</div>
    </>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#FCFBF8', fontFamily: "'Inter', sans-serif", color: '#3B2A22', boxSizing: 'border-box', overflow: 'hidden' }}>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(26,19,15,0.55)', backdropFilter: 'blur(2px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '260px', background: '#3B2A22', display: 'flex', flexDirection: 'column', padding: '26px 18px', boxSizing: 'border-box', boxShadow: '4px 0 40px rgba(0,0,0,0.4)' }}>
            {renderSidebar(true)}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div style={{ width: '250px', flex: 'none', background: '#3B2A22', display: 'flex', flexDirection: 'column', padding: '26px 18px', boxSizing: 'border-box' }} className="hidden md:flex">
        {renderSidebar(false)}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Mobile top bar */}
        <div className="flex md:hidden" style={{ background: '#3B2A22', padding: '14px 16px', alignItems: 'center', gap: '12px', flex: 'none' }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'rgba(255,255,255,.08)', border: 'none', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer', flex: 'none' }}>
            <span style={{ width: '14px', height: '1.6px', background: '#E9C9A6', borderRadius: '1px', display: 'block' }} />
            <span style={{ width: '14px', height: '1.6px', background: '#E9C9A6', borderRadius: '1px', display: 'block' }} />
            <span style={{ width: '14px', height: '1.6px', background: '#E9C9A6', borderRadius: '1px', display: 'block' }} />
          </button>
          <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '.22em', color: 'rgba(248,244,238,.55)', textTransform: 'uppercase' }}>ROEMAH ROTI</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(248,244,238,.92)', marginLeft: '2px' }}>Edit UI</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', boxSizing: 'border-box' }}>
          <div style={{ maxWidth: '920px', margin: '0 auto', padding: '52px 40px 70px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '27px', fontWeight: 600, letterSpacing: '-0.03em', color: '#3B2A22' }}>Edit UI</div>
                <div style={{ fontSize: '15px', color: '#7A6A5F', marginTop: '6px' }}>Customize the wordings on customer-facing pages.</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 'none' }}>
                {customizedCount > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(166,124,82,.14)', color: '#A67C52', fontSize: '11px', fontWeight: 600, padding: '5px 11px', borderRadius: '999px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#A67C52' }}></span>{customizedCount} customized
                  </span>
                )}
                <div
                  onClick={hasChanges && !saving ? saveAll : undefined}
                  style={{
                    padding: '10px 20px', borderRadius: '14px', fontSize: '13px', fontWeight: 600, textAlign: 'center', cursor: hasChanges && !saving ? 'pointer' : 'default',
                    background: hasChanges ? '#A67C52' : '#E0D5C6', color: hasChanges ? '#fff' : '#A08A7B',
                    boxShadow: hasChanges ? '0 14px 26px -14px rgba(166, 124, 82, 0.9)' : 'none',
                    opacity: saving ? 0.7 : 1,
                    transition: 'all .2s ease',
                  }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </div>
              </div>
            </div>

            {/* Search bar */}
            <div style={{ marginTop: '24px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#A08A7B', pointerEvents: 'none' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search text fields..."
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '14px',
                  padding: '12px 14px 12px 40px', fontSize: '14px', color: '#3B2A22', outline: 'none',
                  boxShadow: '0 4px 14px -8px rgba(59,42,34,.1)',
                }}
              />
            </div>

            {/* Loading state */}
            {loading && (
              <div style={{ marginTop: '40px', textAlign: 'center', color: '#A08A7B', fontSize: '14px' }}>Loading text settings...</div>
            )}

            {/* Text groups */}
            {!loading && filteredGroups.map(group => (
              <div key={group.id} style={{ marginTop: '22px', background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', boxShadow: '0 10px 26px -20px rgba(59, 42, 34, 0.35)', overflow: 'hidden' }}>
                {/* Group header */}
                <div
                  onClick={() => toggleGroup(group.id)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F1EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                      <Type size={16} color="#A67C52" />
                    </div>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.01em', color: '#3B2A22' }}>{group.label}</div>
                      <div style={{ fontSize: '12.5px', color: '#7A6A5F', marginTop: '2px' }}>{group.description}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {group.fields.some(f => isCustomized(f.key)) && (
                      <span style={{ background: 'rgba(166,124,82,.14)', color: '#A67C52', fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '999px' }}>
                        {group.fields.filter(f => isCustomized(f.key)).length} edited
                      </span>
                    )}
                    {expandedGroups.has(group.id) ? <ChevronDown size={18} color="#A08A7B" /> : <ChevronRight size={18} color="#A08A7B" />}
                  </div>
                </div>

                {/* Expanded fields */}
                {expandedGroups.has(group.id) && (
                  <div style={{ borderTop: '1px solid #EFE8DE' }}>
                    {group.fields.map((field, fi) => {
                      const customized = isCustomized(field.key);
                      const currentValue = getValue(field.key);
                      const defaultValue = UI_TEXT_DEFAULTS[field.key] || '';

                      return (
                        <div key={field.key} style={{ padding: '16px 22px', borderTop: fi > 0 ? '1px solid #F5F0E8' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#3B2A22' }}>{field.label}</span>
                              {customized && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(166,124,82,.12)', color: '#A67C52', fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', letterSpacing: '.04em' }}>
                                  CUSTOM
                                </span>
                              )}
                            </div>
                            {customized && (
                              <div
                                onClick={() => resetField(field.key)}
                                style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', fontWeight: 600, color: '#7A6A5F', cursor: 'pointer' }}
                              >
                                <RotateCcw size={12} />
                                Reset
                              </div>
                            )}
                          </div>
                          <input
                            type="text"
                            value={currentValue}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            placeholder={defaultValue}
                            style={{
                              width: '100%', boxSizing: 'border-box',
                              background: customized ? '#FFFDF8' : '#FFFFFF',
                              border: `1px solid ${customized ? '#E9C9A6' : '#E6DDD0'}`,
                              borderRadius: '12px',
                              padding: '11px 13px', fontSize: '13.5px', color: '#3B2A22',
                              outline: 'none',
                              transition: 'border-color .15s ease',
                            }}
                          />
                          <div style={{ fontSize: '11px', color: '#A08A7B', marginTop: '5px' }}>
                            Default: <span style={{ fontWeight: 500, color: '#8A7A6E' }}>{defaultValue}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {!loading && filteredGroups.length === 0 && searchQuery && (
              <div style={{ marginTop: '40px', textAlign: 'center', color: '#A08A7B', fontSize: '14px' }}>No fields match "{searchQuery}"</div>
            )}

          </div>
        </div>
      </div>

      {/* Save toast */}
      {saveToast && (
        <div style={{
          position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
          background: '#3B2A22', color: 'rgba(248, 244, 238, 0.92)',
          padding: '12px 20px', borderRadius: '14px', fontSize: '13px', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: '0 18px 40px -18px rgba(59, 42, 34, 0.55)',
          zIndex: 100, animation: 'fadeInUp .25s ease',
        }}>
          <Check size={16} color="#E9C9A6" />
          {saveToast}
        </div>
      )}

      {/* Logout modal */}
      {logoutModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(43, 30, 24, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: '380px', background: '#FFFFFF', borderRadius: '22px', padding: '26px', boxShadow: '0 30px 60px -20px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#3B2A22', textAlign: 'center' }}>Are you sure you want to sign out?</div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '26px' }}>
              <div style={{ flex: 1 }}>
                <div onClick={() => setLogoutModalOpen(false)} style={{ padding: '10px 16px', borderRadius: '14px', fontSize: '13px', fontWeight: 600, textAlign: 'center', cursor: 'pointer', background: 'transparent', color: '#3B2A22', border: '1px solid #E0D5C6' }}>Cancel</div>
              </div>
              <div style={{ flex: 1 }}>
                <div onClick={() => { setLogoutModalOpen(false); logout(); }} style={{ padding: '10px 16px', borderRadius: '14px', fontSize: '13px', fontWeight: 600, textAlign: 'center', cursor: 'pointer', background: '#A67C52', color: '#fff', boxShadow: '0 14px 26px -14px rgba(166, 124, 82, 0.9)' }}>Sign Out</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
