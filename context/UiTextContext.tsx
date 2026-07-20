'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

// ─── Default values for all editable UI text strings ──────────────────────────
export const UI_TEXT_DEFAULTS: Record<string, string> = {
  // landing
  'landing.nav_benefits': 'Benefits',
  'landing.nav_how_it_works': 'How it works',
  'landing.nav_join': 'Join now',
  'landing.logo_text': 'Roemah Roti',
  'landing.logo_sub': 'Insider',
  'landing.hero_tag': 'Membership program',
  'landing.hero_title_1': 'Join ',
  'landing.hero_title_em': 'Roemah Roti',
  'landing.hero_title_2': 'Insider',
  'landing.hero_desc': 'Exclusive treats, birthday surprises, and early access to everything fresh from our oven — made for those who keep coming back.',
  'landing.hero_btn_primary': 'Join for free',
  'landing.hero_btn_secondary': 'See member benefits',
  'landing.social_proof_count': '1,240+ members',
  'landing.social_proof_text': 'already enjoying insider access',
  'landing.benefits_label': 'Member benefits',
  'landing.benefits_title_1': 'Everything fresh,',
  'landing.benefits_title_2': 'just for you',
  'landing.benefits_sub': 'Become an insider and unlock a layer of the bakery most customers never see.',
  'landing.benefit_1_title': 'Birthday treat',
  'landing.benefit_1_desc': 'A complimentary pastry or drink, waiting for you every year on your special day.',
  'landing.benefit_2_title': 'Insider access',
  'landing.benefit_2_desc': 'Early notice on seasonal menus, limited batches, and behind-the-scenes stories.',
  'landing.benefit_3_title': 'Fresh batch alerts',
  'landing.benefit_3_desc': 'Real-time WhatsApp notifications when your favorite items come out of the oven.',
  'landing.benefit_4_title': 'Member rewards',
  'landing.benefit_4_desc': 'Collect visits, unlock treats. No points math — just simple, honest recognition.',
  'landing.how_label': 'How it works',
  'landing.how_title': 'Simple by design',
  'landing.how_sub': 'No app to download. No complicated points system.',
  'landing.how_step1_title': 'Join for free',
  'landing.how_step1_desc': "Sign up in under a minute with your name, WhatsApp number, and birthday. That's all we need.",
  'landing.how_step2_title': 'Collect visits',
  'landing.how_step2_desc': 'Every time you visit, our team scans your QR card. Your history is always right there — no receipts to keep.',
  'landing.how_step3_title': 'Unlock rewards',
  'landing.how_step3_desc': 'At 10 visits, you unlock a free Saltbread Original. More visits bring more surprises from the kitchen.',
  'landing.testi_label': 'From our members',
  'landing.testi_title_1': 'Real regulars,',
  'landing.testi_title_2': 'real stories',
  'landing.testi_sub': 'What keeps them coming back every morning.',
  'landing.testi_stat1_num': '1,240',
  'landing.testi_stat1_label': 'Members',
  'landing.testi_stat2_num': '4.9',
  'landing.testi_stat2_label': 'Avg rating',
  'landing.testi_stat3_num': '3.2×',
  'landing.testi_stat3_label': 'More visits',
  'landing.testi_1_name': 'Sari Rahayu',
  'landing.testi_1_role': 'Morning professional · Grogol',
  'landing.testi_1_quote': '"I come here before work every single day. The fresh batch alerts on WhatsApp are honestly the best part — I know exactly when the sourdough is ready."',
  'landing.testi_2_name': 'Budi Wibowo',
  'landing.testi_2_role': 'Father of two · Greenville',
  'landing.testi_2_quote': '"My kids actually ask me to take them here. When the truffle egg bread is fresh — nothing beats it. The birthday treat last month was a lovely surprise."',
  'landing.cta_title_1': 'Ready to become',
  'landing.cta_title_2': 'an insider?',
  'landing.cta_sub': 'Join free in under a minute. No commitments, no subscriptions.',
  'landing.cta_btn': 'Join Roemah Roti Insider ↗',
  'landing.footer_text': '© 2025 Roemah Roti · Greenville, West Jakarta',
  'landing.footer_link_1': 'Privacy',
  'landing.footer_url_1': '#',
  'landing.footer_link_2': 'WhatsApp',
  'landing.footer_url_2': '#',
  'landing.footer_link_3': 'Instagram',
  'landing.footer_url_3': '#',

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
  'visits.tap_to_scan': 'Tap to scan',

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
  'profile.membership_details': 'Membership Information',

  // /membership
  'membership.page_label': 'GOOD TO KNOW',
  'membership.page_title': 'How benefits work',
  'membership.page_subtitle': 'Nothing to keep track of \u2014 here\u2019s the whole idea in three plain notes.',
  'membership.tier_note': 'And your tier never goes down. However far you\u2019ve come, it stays yours. See you soon.',

  // /visits - tiers
  'visits.tier_insider_desc': 'Your first step into the Roemah.',
  'visits.tier_insider_bday_title': 'Birthday Treat',
  'visits.tier_insider_bday_desc': 'A little something to mark your day.',
  'visits.tier_insider_bday_tag': 'Your first',
  'visits.tier_insider_perk1': 'Welcome Treat — free Americano',
  'visits.tier_insider_perk1_tag': 'New · one-time',
  'visits.tier_insider_perk2': 'Visit Reward Access',
  'visits.tier_insider_perk3': 'Member-only updates',
  
  'visits.tier_familiar_desc': "You're becoming part of our morning routine.",
  'visits.tier_familiar_bday_title': 'Birthday Celebration',
  'visits.tier_familiar_bday_desc': 'Replaces your Birthday Treat with something a little bigger.',
  'visits.tier_familiar_bday_tag': 'Replaces earlier',
  'visits.tier_familiar_perk1': 'Early Menu Drop Access',
  'visits.tier_familiar_perk2': 'Special Reward & Promo Access',

  'visits.tier_neighbor_desc': "You're our neighbor.",
  'visits.tier_neighbor_bday_title': 'Birthday Surprise',
  'visits.tier_neighbor_bday_desc': 'Carried from Familiar — your birthday reward stays enhanced.',
  'visits.tier_neighbor_bday_tag': 'Same as Familiar',
  'visits.tier_neighbor_perk1': 'First Batch Alert',
  'visits.tier_neighbor_perk2': 'Neighbor Day',
  'visits.tier_neighbor_perk3': 'Menu Testing Access',
  'visits.tier_neighbor_perk4': 'Mystery Reward Unlock',

  'visits.tier_inner_circle_desc': "You're part of the Roemah.",
  'visits.tier_inner_circle_bday_title': 'Curated Birthday Box',
  'visits.tier_inner_circle_bday_desc': 'Replaces every earlier birthday reward — the full box.',
  'visits.tier_inner_circle_bday_tag': 'Replaces all',
  'visits.tier_inner_circle_perk1': 'Private First Taste',
  'visits.tier_inner_circle_perk2': 'Monthly Treat',
  'visits.tier_inner_circle_perk3': 'Invite-only Experiences',
  'visits.tier_inner_circle_perk4': 'Anniversary Gift',
  'visits.tier_inner_circle_perk5': 'Secret Menu Access',

  // /rewards
  'rewards.status_locked': 'Locked',
  'rewards.status_unlocked': 'Unlocked',
  'rewards.status_redeemed': 'Redeemed',
  'rewards.status_expired': 'Expired',
  'rewards.label_progress': 'Progress',
  'rewards.label_redeemed': 'Redeemed',
  'rewards.label_expired': 'Expired',
  'rewards.label_expiration': 'Expiration',
  'rewards.empty_history_title': 'No rewards redeemed',
  'rewards.empty_history_desc': 'Rewards you claim will appear here.',

  // /updates
  'updates.page_title': 'Updates',
  'updates.filter_all': 'All',
  'updates.filter_news': 'News',
  'updates.filter_promos': 'Promos',
  'updates.empty_title': 'No updates yet',
  'updates.empty_desc': 'Check back later for news and promos.',

  // /profile
  'profile.btn_edit_profile': 'Edit Profile',
  'profile.btn_save_changes': 'Save Changes',
  'profile.label_full_name': 'Full Name',
  'profile.label_phone': 'Phone Number',
  'profile.label_email': 'Email',
  'profile.label_dob': 'Date of Birth',
  'profile.label_member_id': 'Member ID',
  'profile.label_tier': 'Tier',
  'profile.label_member_since': 'Member Since',
  'profile.label_home_outlet': 'Home Outlet',
  'profile.label_referral_code': 'Referral Code',

  // auth
  'auth.welcome_back': 'Welcome back,',
  'auth.signin_subtitle': 'Enter your credentials to continue',
  'auth.email_label': 'Email',
  'auth.password_label': 'Password',
  'auth.btn_signin': 'Sign In',
  'auth.register_prompt': "Don't have an account?",
  'auth.register_link': 'Register here',
  'auth.register_title': 'Create Account',
  'auth.register_subtitle': 'Join us for exclusive rewards',
  'auth.name_label': 'Full Name',
  'auth.phone_label': 'Phone Number',
  'auth.btn_register': 'Create Account',
  'auth.signin_prompt': 'Already have an account?',
  'auth.signin_link': 'Sign in here',
  'auth.btn_logout': 'Logout',
  'auth.logged_out_title': "You've been logged out",
  'auth.logged_out_desc': 'See you soon.',
  'auth.btn_login_again': 'Log In Again',
  'auth.logout_sheet_title': 'Log out of your Roemah Roti account?',
  'auth.logout_sheet_desc': 'You can log back in anytime.',
  'auth.btn_cancel': 'Cancel',
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
