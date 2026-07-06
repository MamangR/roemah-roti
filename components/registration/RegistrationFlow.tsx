"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { QrPreview } from "@/components/shared/QrPreview";
import { registerMember } from "@/services/member.service";
import type { Member } from "@/types/member";

const favoriteOptions = [
  "Saltbread Original",
  "Truffle Egg",
  "Dubai Saltbread",
  "Sourdough",
  "Croissant",
  "Flat White",
  "Cinnamon Roll",
  "Focaccia",
];

export function RegistrationFlow() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [registeredMember, setRegisteredMember] = useState<Member | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleFavorite(item: string) {
    setFavorites((current) => (current.includes(item) ? current.filter((favorite) => favorite !== item) : [...current, item]));
  }

  async function finishRegistration() {
    setIsSaving(true);
    setError("");

    try {
      const member = await registerMember({
        name,
        phone,
        birthday,
        favorites,
      });
      setRegisteredMember(member);
      setStep(3);
    } catch (registrationError) {
      setError(registrationError instanceof Error ? registrationError.message : "Registration could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="reg-root">
      <div className="reg-card">
        <div className="reg-progress">
          {[0, 1, 2, 3].map((dot) => (
            <span className="reg-progress-part" key={dot}>
              <span className={`reg-step-dot ${dot < step ? "done" : dot === step ? "active" : ""}`} />
              {dot < 3 && <span className={`reg-step-line ${dot < step ? "done" : ""}`} />}
            </span>
          ))}
        </div>

        {step === 0 && (
          <div className="reg-screen active">
            <div className="reg-step-label">Step 1 of 3</div>
            <div className="reg-title">Let&apos;s get to know you</div>
            <div className="reg-subtitle">Your personal details help us make every visit feel like home.</div>
            <div className="reg-field">
              <label className="reg-label">Full name</label>
              <input className="reg-input" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="reg-field">
              <label className="reg-label">WhatsApp number</label>
              <input
                className="reg-input"
                type="tel"
                placeholder="+62 812 0000 0000"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
            <button className="reg-btn-primary" onClick={() => setStep(1)}>Continue -&gt;</button>
            <p className="reg-hint">We only use WhatsApp for fresh batch alerts and reward notifications.</p>
          </div>
        )}

        {step === 1 && (
          <div className="reg-screen active">
            <button className="reg-back" onClick={() => setStep(0)}>
              <ArrowLeft size={14} /> Back
            </button>
            <div className="reg-step-label">Step 2 of 3</div>
            <div className="reg-title">When&apos;s your birthday?</div>
            <div className="reg-subtitle">We&apos;ll send you a little something special from our kitchen.</div>
            <div className="reg-field">
              <label className="reg-label">Date of birth</label>
              <input className="reg-input" type="date" value={birthday} onChange={(event) => setBirthday(event.target.value)} />
            </div>
            <button className="reg-btn-primary" onClick={() => setStep(2)}>Continue -&gt;</button>
            <p className="reg-hint">Only the day and month are used - we&apos;ll never ask for your year if you&apos;d rather not share.</p>
          </div>
        )}

        {step === 2 && (
          <div className="reg-screen active">
            <button className="reg-back" onClick={() => setStep(1)}>
              <ArrowLeft size={14} /> Back
            </button>
            <div className="reg-step-label">Step 3 of 3</div>
            <div className="reg-title">What&apos;s your go-to?</div>
            <div className="reg-subtitle">Pick a favorite - we&apos;ll make sure you&apos;re first to know when it&apos;s fresh.</div>
            <div className="reg-chips">
              {favoriteOptions.map((item) => (
                <button
                  className={`reg-chip ${favorites.includes(item) ? "selected" : ""}`}
                  key={item}
                  onClick={() => toggleFavorite(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            {error && <p className="reg-hint">{error}</p>}
            <button className="reg-btn-primary reg-join" disabled={isSaving} onClick={finishRegistration}>
              {isSaving ? "Saving..." : "Join Roemah Roti Insider"}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="reg-screen active">
            <div className="reg-success">
              <div className="reg-success-icon">
                <Check size={28} />
              </div>
              <h2>You&apos;re an Insider now</h2>
              <p>
                Welcome to Roemah Roti Insider, <strong>{registeredMember?.firstName}</strong>. Your membership card is ready -
                show it at the counter every time you visit.
              </p>
              <div className="reg-card-preview">
                <div className="reg-card-logo">Roemah Roti Insider</div>
                <div className="reg-card-name">{registeredMember?.name}</div>
                <div className="reg-card-tag">Insider Member</div>
                <QrPreview />
                <div className="reg-card-since">Member since - {registeredMember?.since ?? "June 2025"}</div>
              </div>
              <Link className="reg-btn-primary reg-link-btn" href="/member">View my dashboard -&gt;</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
