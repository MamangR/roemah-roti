'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Croissant, Gift, Key, Bell, Award } from 'lucide-react';
import { useUiText } from '@/context/UiTextContext';
import styles from './page.module.css';

export default function LandingPage() {
  const router = useRouter();
  const { t } = useUiText();

  const handleJoin = () => {
    router.push('/signin');
  };

  const scrollToBenefits = () => {
    const el = document.getElementById('benefits');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.root}>
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2C9 2 5 5 5 9.5C5 12.5 6.8 15 9 15C11.2 15 13 12.5 13 9.5C13 5 9 2 9 2Z" fill="#F8F4EE" opacity="0.9" />
              <path d="M6 10C7 9 8 8.5 9 8.5C10 8.5 11 9 12 10" stroke="#F8F4EE" strokeWidth="1" strokeLinecap="round" opacity="0.6" fill="none" />
            </svg>
          </div>
          <div>
            <div className={styles.logoText}>{t('landing.logo_text', 'Roemah Roti')}</div>
            <div className={styles.logoSub}>{t('landing.logo_sub', 'Insider')}</div>
          </div>
        </div>
        <div className={styles.navLinks}>
          <a href="#benefits" className={styles.navLink} onClick={(e) => { e.preventDefault(); scrollToBenefits(); }}>{t('landing.nav_benefits', 'Benefits')}</a>
          <a href="#how-it-works" className={styles.navLink}>{t('landing.nav_how_it_works', 'How it works')}</a>
          <button className={styles.btnNav} onClick={handleJoin}>{t('landing.nav_join', 'Join now')}</button>
        </div>
      </nav>

      <div className={styles.hero}>
        <div className={styles.heroTag}>
          <Croissant size={14} aria-hidden="true" />
          {t('landing.hero_tag', 'Membership program')}
        </div>
        <h1>{t('landing.hero_title_1', 'Join ')}<em>{t('landing.hero_title_em', 'Roemah Roti')}</em><br />{t('landing.hero_title_2', 'Insider')}</h1>
        <p>{t('landing.hero_desc', 'Exclusive treats, birthday surprises, and early access to everything fresh from our oven — made for those who keep coming back.')}</p>
        <div className={styles.heroCtas}>
          <button className={styles.btnPrimary} onClick={handleJoin}>{t('landing.hero_btn_primary', 'Join for free')}</button>
          <button className={styles.btnSecondary} onClick={scrollToBenefits}>{t('landing.hero_btn_secondary', 'See member benefits')}</button>
        </div>
        <div className={styles.socialProof}>
          <div className={styles.avatars}>
            <div className={styles.avatar} style={{ background: '#D4C4B0', color: '#6B4C2A' }}>SR</div>
            <div className={styles.avatar} style={{ background: '#B8A898', color: '#3B2A22' }}>MD</div>
            <div className={styles.avatar} style={{ background: '#C9B8A8', color: '#5A3D2B' }}>TW</div>
            <div className={styles.avatar} style={{ background: '#A67C52', color: '#F8F4EE' }}>+</div>
          </div>
          <div className={styles.proofText}><strong>{t('landing.social_proof_count', '1,240+ members')}</strong> {t('landing.social_proof_text', 'already enjoying insider access')}</div>
        </div>
      </div>

      <div className={styles.divider}></div>

      <div className={styles.section} id="benefits">
        <div className={styles.sectionLabel}>{t('landing.benefits_label', 'Member benefits')}</div>
        <h2>{t('landing.benefits_title_1', 'Everything fresh,')}<br />{t('landing.benefits_title_2', 'just for you')}</h2>
        <p className={styles.sectionSub}>{t('landing.benefits_sub', 'Become an insider and unlock a layer of the bakery most customers never see.')}</p>
        <div className={styles.benefits}>
          <div className={styles.benefitCard}>
            <div className={styles.benefitIcon}><Gift size={20} aria-hidden="true" /></div>
            <h3>{t('landing.benefit_1_title', 'Birthday treat')}</h3>
            <p>{t('landing.benefit_1_desc', 'A complimentary pastry or drink, waiting for you every year on your special day.')}</p>
          </div>
          <div className={styles.benefitCard}>
            <div className={styles.benefitIcon}><Key size={20} aria-hidden="true" /></div>
            <h3>{t('landing.benefit_2_title', 'Insider access')}</h3>
            <p>{t('landing.benefit_2_desc', 'Early notice on seasonal menus, limited batches, and behind-the-scenes stories.')}</p>
          </div>
          <div className={styles.benefitCard}>
            <div className={styles.benefitIcon}><Bell size={20} aria-hidden="true" /></div>
            <h3>{t('landing.benefit_3_title', 'Fresh batch alerts')}</h3>
            <p>{t('landing.benefit_3_desc', 'Real-time WhatsApp notifications when your favorite items come out of the oven.')}</p>
          </div>
          <div className={styles.benefitCard}>
            <div className={styles.benefitIcon}><Award size={20} aria-hidden="true" /></div>
            <h3>{t('landing.benefit_4_title', 'Member rewards')}</h3>
            <p>{t('landing.benefit_4_desc', 'Collect visits, unlock treats. No points math — just simple, honest recognition.')}</p>
          </div>
        </div>
      </div>

      <div className={styles.divider}></div>

      <div className={styles.section} id="how-it-works">
        <div className={styles.sectionLabel}>{t('landing.how_label', 'How it works')}</div>
        <h2>{t('landing.how_title', 'Simple by design')}</h2>
        <p className={styles.sectionSub}>{t('landing.how_sub', 'No app to download. No complicated points system.')}</p>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNum}>1</div>
            <div>
              <h4>{t('landing.how_step1_title', 'Join for free')}</h4>
              <p>{t('landing.how_step1_desc', "Sign up in under a minute with your name, WhatsApp number, and birthday. That's all we need.")}</p>
            </div>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>2</div>
            <div>
              <h4>{t('landing.how_step2_title', 'Collect visits')}</h4>
              <p>{t('landing.how_step2_desc', 'Every time you visit, our team scans your QR card. Your history is always right there — no receipts to keep.')}</p>
            </div>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>3</div>
            <div>
              <h4>{t('landing.how_step3_title', 'Unlock rewards')}</h4>
              <p>{t('landing.how_step3_desc', 'At 10 visits, you unlock a free Saltbread Original. More visits bring more surprises from the kitchen.')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.divider}></div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>{t('landing.testi_label', 'From our members')}</div>
        <h2>{t('landing.testi_title_1', 'Real regulars,')}<br />{t('landing.testi_title_2', 'real stories')}</h2>
        <p className={styles.sectionSub}>{t('landing.testi_sub', 'What keeps them coming back every morning.')}</p>
        <div className={styles.statRow}>
          <div className={styles.stat}><div className={styles.statNum}>{t('landing.testi_stat1_num', '1,240')}</div><div className={styles.statLabel}>{t('landing.testi_stat1_label', 'Members')}</div></div>
          <div className={styles.stat}><div className={styles.statNum}>{t('landing.testi_stat2_num', '4.9')}</div><div className={styles.statLabel}>{t('landing.testi_stat2_label', 'Avg rating')}</div></div>
          <div className={styles.stat}><div className={styles.statNum}>{t('landing.testi_stat3_num', '3.2×')}</div><div className={styles.statLabel}>{t('landing.testi_stat3_label', 'More visits')}</div></div>
        </div>
        <div className={styles.testimonials}>
          <div className={styles.testimonial}>
            <div className={styles.testimonialHeader}>
              <div className={styles.testimonialAvatar} style={{ background: '#D4C4B0', color: '#6B4C2A' }}>SR</div>
              <div>
                <div className={styles.testimonialName}>{t('landing.testi_1_name', 'Sari Rahayu')}</div>
                <div className={styles.testimonialRole}>{t('landing.testi_1_role', 'Morning professional · Grogol')}</div>
              </div>
            </div>
            <div className={styles.testimonialStars}>★★★★★</div>
            <p>{t('landing.testi_1_quote', '"I come here before work every single day. The fresh batch alerts on WhatsApp are honestly the best part — I know exactly when the sourdough is ready."')}</p>
          </div>
          <div className={styles.testimonial}>
            <div className={styles.testimonialHeader}>
              <div className={styles.testimonialAvatar} style={{ background: '#B8D4B0', color: '#2A4B2A' }}>BW</div>
              <div>
                <div className={styles.testimonialName}>{t('landing.testi_2_name', 'Budi Wibowo')}</div>
                <div className={styles.testimonialRole}>{t('landing.testi_2_role', 'Father of two · Greenville')}</div>
              </div>
            </div>
            <div className={styles.testimonialStars}>★★★★★</div>
            <p>{t('landing.testi_2_quote', '"My kids actually ask me to take them here. When the truffle egg bread is fresh — nothing beats it. The birthday treat last month was a lovely surprise."')}</p>
          </div>
        </div>
      </div>

      <div className={styles.ctaSection}>
        <h2>{t('landing.cta_title_1', 'Ready to become')}<br />{t('landing.cta_title_2', 'an insider?')}</h2>
        <p>{t('landing.cta_sub', 'Join free in under a minute. No commitments, no subscriptions.')}</p>
        <button className={styles.btnCta} onClick={handleJoin}>{t('landing.cta_btn', 'Join Roemah Roti Insider ↗')}</button>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerLeft}>{t('landing.footer_text', '© 2025 Roemah Roti · Greenville, West Jakarta')}</div>
        <div className={styles.footerLinks}>
          <a href={t('landing.footer_url_1', '#')}>{t('landing.footer_link_1', 'Privacy')}</a>
          <a href={t('landing.footer_url_2', '#')}>{t('landing.footer_link_2', 'WhatsApp')}</a>
          <a href={t('landing.footer_url_3', '#')}>{t('landing.footer_link_3', 'Instagram')}</a>
        </div>
      </footer>
    </div>
  );
}
