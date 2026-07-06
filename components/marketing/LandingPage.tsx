import Link from "next/link";
import { Award, Bell, Gift, KeyRound } from "lucide-react";
import { BreadMark } from "@/components/shared/BreadMark";

export function LandingPage() {
  return (
    <div className="rr-root">
      <nav className="rr-nav">
        <div className="rr-logo">
          <div className="rr-logo-icon">
            <BreadMark />
          </div>
          <div>
            <div className="rr-logo-text">Roemah Roti</div>
            <div className="rr-logo-sub">Insider</div>
          </div>
        </div>
        <div className="rr-nav-links">
          <a href="#benefits" className="rr-nav-link">Benefits</a>
          <a href="#how-it-works" className="rr-nav-link">How it works</a>
          <Link className="rr-btn-nav" href="/register">Join now</Link>
        </div>
      </nav>

      <section className="rr-hero">
        <div className="rr-hero-tag">
          <BreadMark />
          Membership program
        </div>
        <h1>
          Join <em>Roemah Roti</em>
          <br />
          Insider
        </h1>
        <p>
          Exclusive treats, birthday surprises, and early access to everything fresh from our oven - made for
          those who keep coming back.
        </p>
        <div className="rr-hero-ctas">
          <Link className="rr-btn-primary" href="/register">Join for free</Link>
          <a className="rr-btn-secondary" href="#benefits">See member benefits</a>
        </div>
        <div className="rr-social-proof">
          <div className="rr-avatars">
            <div className="rr-avatar rr-avatar-sr">SR</div>
            <div className="rr-avatar rr-avatar-md">MD</div>
            <div className="rr-avatar rr-avatar-tw">TW</div>
            <div className="rr-avatar rr-avatar-more">+</div>
          </div>
          <div className="rr-proof-text">
            <strong>1,240+ members</strong> already enjoying insider access
          </div>
        </div>
      </section>

      <div className="rr-divider" />

      <section className="rr-section" id="benefits">
        <div className="rr-section-label">Member benefits</div>
        <h2>
          Everything fresh,
          <br />
          just for you
        </h2>
        <p className="rr-section-sub">Become an insider and unlock a layer of the bakery most customers never see.</p>
        <div className="rr-benefits">
          <Benefit icon={<Gift size={18} />} title="Birthday treat">
            A complimentary pastry or drink, waiting for you every year on your special day.
          </Benefit>
          <Benefit icon={<KeyRound size={18} />} title="Insider access">
            Early notice on seasonal menus, limited batches, and behind-the-scenes stories.
          </Benefit>
          <Benefit icon={<Bell size={18} />} title="Fresh batch alerts">
            Real-time WhatsApp notifications when your favorite items come out of the oven.
          </Benefit>
          <Benefit icon={<Award size={18} />} title="Member rewards">
            Collect visits, unlock treats. No points math - just simple, honest recognition.
          </Benefit>
        </div>
      </section>

      <div className="rr-divider" />

      <section className="rr-section" id="how-it-works">
        <div className="rr-section-label">How it works</div>
        <h2>Simple by design</h2>
        <p className="rr-section-sub">No app to download. No complicated points system.</p>
        <div className="rr-steps">
          <Step num="1" title="Join for free">
            Sign up in under a minute with your name, WhatsApp number, and birthday. That&apos;s all we need.
          </Step>
          <Step num="2" title="Collect visits">
            Every time you visit, our team scans your QR card. Your history is always right there - no receipts to keep.
          </Step>
          <Step num="3" title="Unlock rewards">
            At 10 visits, you unlock a free Saltbread Original. More visits bring more surprises from the kitchen.
          </Step>
        </div>
      </section>

      <div className="rr-divider" />

      <section className="rr-section">
        <div className="rr-section-label">From our members</div>
        <h2>
          Real regulars,
          <br />
          real stories
        </h2>
        <p className="rr-section-sub">What keeps them coming back every morning.</p>
        <div className="rr-stat-row">
          <div className="rr-stat"><div className="rr-stat-num">1,240</div><div className="rr-stat-label">Members</div></div>
          <div className="rr-stat"><div className="rr-stat-num">4.9</div><div className="rr-stat-label">Avg rating</div></div>
          <div className="rr-stat"><div className="rr-stat-num">3.2x</div><div className="rr-stat-label">More visits</div></div>
        </div>
        <div className="rr-testimonials">
          <Testimonial initials="SR" name="Sari Rahayu" role="Morning professional - Grogol" tone="sr">
            I come here before work every single day. The fresh batch alerts on WhatsApp are honestly the best part -
            I know exactly when the sourdough is ready.
          </Testimonial>
          <Testimonial initials="BW" name="Budi Wibowo" role="Father of two - Greenville" tone="bw">
            My kids actually ask me to take them here. When the truffle egg bread is fresh - nothing beats it. The
            birthday treat last month was a lovely surprise.
          </Testimonial>
        </div>
      </section>

      <section className="rr-cta-section">
        <h2>
          Ready to become
          <br />
          an insider?
        </h2>
        <p>Join free in under a minute. No commitments, no subscriptions.</p>
        <Link className="rr-btn-cta" href="/register">Join Roemah Roti Insider -&gt;</Link>
      </section>

      <footer className="rr-footer">
        <div className="rr-footer-left">(c) 2025 Roemah Roti - Greenville, West Jakarta</div>
        <div className="rr-footer-links">
          <a href="#">Privacy</a>
          <a href="#">WhatsApp</a>
          <a href="#">Instagram</a>
        </div>
      </footer>
    </div>
  );
}

function Benefit({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rr-benefit-card">
      <div className="rr-benefit-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

function Step({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rr-step">
      <div className="rr-step-num">{num}</div>
      <div>
        <h4>{title}</h4>
        <p>{children}</p>
      </div>
    </div>
  );
}

function Testimonial({
  initials,
  name,
  role,
  tone,
  children,
}: {
  initials: string;
  name: string;
  role: string;
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rr-testimonial">
      <div className="rr-testimonial-header">
        <div className={`rr-testimonial-avatar rr-testimonial-${tone}`}>{initials}</div>
        <div>
          <div className="rr-testimonial-name">{name}</div>
          <div className="rr-testimonial-role">{role}</div>
        </div>
      </div>
      <div className="rr-testimonial-stars">*****</div>
      <p>&quot;{children}&quot;</p>
    </div>
  );
}
