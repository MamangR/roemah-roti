'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Croissant, Gift, Key, Bell, Award } from 'lucide-react';
import styles from './page.module.css';

export default function LandingPage() {
  const router = useRouter();

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
              <path d="M9 2C9 2 5 5 5 9.5C5 12.5 6.8 15 9 15C11.2 15 13 12.5 13 9.5C13 5 9 2 9 2Z" fill="#F8F4EE" opacity="0.9"/>
              <path d="M6 10C7 9 8 8.5 9 8.5C10 8.5 11 9 12 10" stroke="#F8F4EE" strokeWidth="1" strokeLinecap="round" opacity="0.6" fill="none"/>
            </svg>
          </div>
          <div>
            <div className={styles.logoText}>Roemah Roti</div>
            <div className={styles.logoSub}>Insider</div>
          </div>
        </div>
        <div className={styles.navLinks}>
          <a href="#benefits" className={styles.navLink} onClick={(e) => { e.preventDefault(); scrollToBenefits(); }}>Benefits</a>
          <a href="#how-it-works" className={styles.navLink}>How it works</a>
          <button className={styles.btnNav} onClick={handleJoin}>Join now</button>
        </div>
      </nav>

      <div className={styles.hero}>
        <div className={styles.heroTag}>
          <Croissant size={14} aria-hidden="true" />
          Membership program
        </div>
        <h1>Join <em>Roemah Roti</em><br/>Insider</h1>
        <p>Exclusive treats, birthday surprises, and early access to everything fresh from our oven — made for those who keep coming back.</p>
        <div className={styles.heroCtas}>
          <button className={styles.btnPrimary} onClick={handleJoin}>Join for free</button>
          <button className={styles.btnSecondary} onClick={scrollToBenefits}>See member benefits</button>
        </div>
        <div className={styles.socialProof}>
          <div className={styles.avatars}>
            <div className={styles.avatar} style={{ background: '#D4C4B0', color: '#6B4C2A' }}>SR</div>
            <div className={styles.avatar} style={{ background: '#B8A898', color: '#3B2A22' }}>MD</div>
            <div className={styles.avatar} style={{ background: '#C9B8A8', color: '#5A3D2B' }}>TW</div>
            <div className={styles.avatar} style={{ background: '#A67C52', color: '#F8F4EE' }}>+</div>
          </div>
          <div className={styles.proofText}><strong>1,240+ members</strong> already enjoying insider access</div>
        </div>
      </div>

      <div className={styles.divider}></div>

      <div className={styles.section} id="benefits">
        <div className={styles.sectionLabel}>Member benefits</div>
        <h2>Everything fresh,<br/>just for you</h2>
        <p className={styles.sectionSub}>Become an insider and unlock a layer of the bakery most customers never see.</p>
        <div className={styles.benefits}>
          <div className={styles.benefitCard}>
            <div className={styles.benefitIcon}><Gift size={20} aria-hidden="true" /></div>
            <h3>Birthday treat</h3>
            <p>A complimentary pastry or drink, waiting for you every year on your special day.</p>
          </div>
          <div className={styles.benefitCard}>
            <div className={styles.benefitIcon}><Key size={20} aria-hidden="true" /></div>
            <h3>Insider access</h3>
            <p>Early notice on seasonal menus, limited batches, and behind-the-scenes stories.</p>
          </div>
          <div className={styles.benefitCard}>
            <div className={styles.benefitIcon}><Bell size={20} aria-hidden="true" /></div>
            <h3>Fresh batch alerts</h3>
            <p>Real-time WhatsApp notifications when your favorite items come out of the oven.</p>
          </div>
          <div className={styles.benefitCard}>
            <div className={styles.benefitIcon}><Award size={20} aria-hidden="true" /></div>
            <h3>Member rewards</h3>
            <p>Collect visits, unlock treats. No points math — just simple, honest recognition.</p>
          </div>
        </div>
      </div>

      <div className={styles.divider}></div>

      <div className={styles.section} id="how-it-works">
        <div className={styles.sectionLabel}>How it works</div>
        <h2>Simple by design</h2>
        <p className={styles.sectionSub}>No app to download. No complicated points system.</p>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNum}>1</div>
            <div>
              <h4>Join for free</h4>
              <p>Sign up in under a minute with your name, WhatsApp number, and birthday. That's all we need.</p>
            </div>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>2</div>
            <div>
              <h4>Collect visits</h4>
              <p>Every time you visit, our team scans your QR card. Your history is always right there — no receipts to keep.</p>
            </div>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>3</div>
            <div>
              <h4>Unlock rewards</h4>
              <p>At 10 visits, you unlock a free Saltbread Original. More visits bring more surprises from the kitchen.</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.divider}></div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>From our members</div>
        <h2>Real regulars,<br/>real stories</h2>
        <p className={styles.sectionSub}>What keeps them coming back every morning.</p>
        <div className={styles.statRow}>
          <div className={styles.stat}><div className={styles.statNum}>1,240</div><div className={styles.statLabel}>Members</div></div>
          <div className={styles.stat}><div className={styles.statNum}>4.9</div><div className={styles.statLabel}>Avg rating</div></div>
          <div className={styles.stat}><div className={styles.statNum}>3.2×</div><div className={styles.statLabel}>More visits</div></div>
        </div>
        <div className={styles.testimonials}>
          <div className={styles.testimonial}>
            <div className={styles.testimonialHeader}>
              <div className={styles.testimonialAvatar} style={{ background: '#D4C4B0', color: '#6B4C2A' }}>SR</div>
              <div>
                <div className={styles.testimonialName}>Sari Rahayu</div>
                <div className={styles.testimonialRole}>Morning professional · Grogol</div>
              </div>
            </div>
            <div className={styles.testimonialStars}>★★★★★</div>
            <p>"I come here before work every single day. The fresh batch alerts on WhatsApp are honestly the best part — I know exactly when the sourdough is ready."</p>
          </div>
          <div className={styles.testimonial}>
            <div className={styles.testimonialHeader}>
              <div className={styles.testimonialAvatar} style={{ background: '#B8D4B0', color: '#2A4B2A' }}>BW</div>
              <div>
                <div className={styles.testimonialName}>Budi Wibowo</div>
                <div className={styles.testimonialRole}>Father of two · Greenville</div>
              </div>
            </div>
            <div className={styles.testimonialStars}>★★★★★</div>
            <p>"My kids actually ask me to take them here. When the truffle egg bread is fresh — nothing beats it. The birthday treat last month was a lovely surprise."</p>
          </div>
        </div>
      </div>

      <div className={styles.ctaSection}>
        <h2>Ready to become<br/>an insider?</h2>
        <p>Join free in under a minute. No commitments, no subscriptions.</p>
        <button className={styles.btnCta} onClick={handleJoin}>Join Roemah Roti Insider ↗</button>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerLeft}>© 2025 Roemah Roti · Greenville, West Jakarta</div>
        <div className={styles.footerLinks}>
          <a href="#">Privacy</a>
          <a href="#">WhatsApp</a>
          <a href="#">Instagram</a>
        </div>
      </footer>
    </div>
  );
}
