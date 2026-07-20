'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

// ─── Default values for all editable UI text strings ──────────────────────────
export const UI_TEXT_DEFAULTS: Record<string, string> = {
  // /visits — Dashboard
  'visits.greeting_morning': 'Good morning,',
  'visits.greeting_afternoon': 'Good afternoon,',
  'visits.greeting_evening': 'Good evening,',
  'visits.brand_label': 'ROEMAH ROTI',
  'visits.member_since_prefix': 'Member since',
  'visits.referral_code_label': 'REFERRAL CODE',
  'visits.invite_friends_button': 'Invite Friends',
  'visits.lifetime_spend_label': 'LIFETIME SPEND',
  'visits.max_tier_message': 'You have reached the highest tier!',
  'visits.tier_progress_suffix': 'more in lifetime spend until',
  'visits.tier_progress_note': 'No rush \u2014 it adds up over time.',
  'visits.visit_progress_label': 'Visit Progress',
  'visits.view_history_link': 'View History',
  'visits.updates_title': 'Updates',
  'visits.updates_subtitle': 'New menu, promos, and announcements.',
  'visits.refer_friend_title': 'Refer a Friend',
  'visits.refer_friend_subtitle': 'Share something you trust.',
  'visits.roadmap_title': 'Your journey',
  'visits.roadmap_subtitle': 'Four tiers, one step at a time. Everything you\u2019ve reached stays yours.',

  // /rewards
  'rewards.page_title': 'Your Rewards',
  'rewards.locked_footer': 'This reward will unlock automatically as you visit.',
  'rewards.unlocked_footer': 'Show this code to our cashier before payment.',
  'rewards.redeemed_footer': 'Enjoy your treat. See you again soon.',
  'rewards.expired_footer': 'This offer has ended.',
  'rewards.keep_visiting': 'Keep visiting to unlock this reward.',
  'rewards.history_title': 'Redemption History',

  // /referral
  'referral.page_title': 'Referral Program',
  'referral.page_subtitle': 'Share Roemah Roti with someone you trust.',
  'referral.code_label': 'YOUR REFERRAL CODE',
  'referral.code_instruction': 'Give this code to a friend when they sign up.',
  'referral.share_title': 'Share Your Link',
  'referral.progress_title': 'Referral Progress',
  'referral.friends_title': 'Friends Who Joined',

  // /profile
  'profile.personal_info': 'Personal Information',
  'profile.membership_details': 'Membership Details',

  // /membership
  'membership.page_label': 'GOOD TO KNOW',
  'membership.page_title': 'How benefits work',
  'membership.page_subtitle': 'Nothing to keep track of \u2014 here\u2019s the whole idea in three plain notes.',
  'membership.tier_note': 'And your tier never goes down. However far you\u2019ve come, it stays yours. See you soon.',
};

// ─── Context ──────────────────────────────────────────────────────────────────
type UiTextContextType = {
  t: (key: string, fallback?: string) => string;
  overrides: Record<string, string>;
  loaded: boolean;
};

const UiTextContext = createContext<UiTextContextType>({
  t: (key: string, fallback?: string) => fallback || UI_TEXT_DEFAULTS[key] || key,
  overrides: {},
  loaded: false,
});

export function UiTextProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/ui-text')
      .then(res => res.json())
      .then(data => {
        setOverrides(data || {});
        setLoaded(true);
      })
      .catch(() => {
        setLoaded(true); // Still mark as loaded so pages render with defaults
      });
  }, []);

  const t = (key: string, fallback?: string): string => {
    if (overrides[key] !== undefined && overrides[key] !== '') {
      return overrides[key];
    }
    return fallback || UI_TEXT_DEFAULTS[key] || key;
  };

  return (
    <UiTextContext.Provider value={{ t, overrides, loaded }}>
      {children}
    </UiTextContext.Provider>
  );
}

export function useUiText() {
  return useContext(UiTextContext);
}
