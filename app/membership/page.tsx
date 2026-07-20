'use client';

import React, { useState, useEffect } from 'react';
import PhoneLayout from '@/components/ui/PhoneLayout';
import BottomNav from '@/components/ui/BottomNav';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import PageTransition from '@/components/ui/PageTransition';
import { useUiText } from '@/context/UiTextContext';

const slideVariants = {
  initial: (d: number) => ({
    x: d > 0 ? 300 : d < 0 ? -300 : 0,
    opacity: 0
  }),
  animate: {
    x: 0,
    opacity: 1
  },
  exit: (d: number) => ({
    x: d > 0 ? -300 : d < 0 ? 300 : 0,
    opacity: 0
  })
};

const NOTES = [
  { id: '1', title: 'Benefits add up', text: 'When you reach a new tier, you keep everything from the tiers below it and gain the new ones. So Neighbor has all of Familiar\'s benefits, plus its own.' },
  { id: '2', title: 'The Welcome Treat is one-time', text: 'The free Americano when you join is a one-time hello. You enjoy it once — it isn\'t repeated as you move up.' },
  { id: '3', title: 'One birthday reward at a time', text: 'Your birthday reward always matches your highest tier. A higher tier replaces the earlier birthday reward — you get the best one, not several stacked together.' }
];

export default function MembershipPage() {
  const router = useRouter();
  const { t } = useUiText();
  const [view, _setView] = useState<'main' | 'detail'>('main');
  const [direction, setDirection] = useState(0);

  const setView = (newView: 'main' | 'detail') => {
    const depth: Record<string, number> = { main: 0, detail: 1 };
    const currentDepth = depth[view] || 0;
    const newDepth = depth[newView] || 0;
    setDirection(newDepth > currentDepth ? 1 : newDepth < currentDepth ? -1 : 0);
    _setView(newView);
    if (typeof window !== 'undefined') sessionStorage.setItem('membership_view', newView);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedView = sessionStorage.getItem('membership_view');
      if (savedView === 'main' || savedView === 'detail') _setView(savedView);
    }
  }, []);

  return (
    <PhoneLayout>
      <PageTransition>
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            className="m-scroll"
            key={view}
            custom={direction}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: 'spring', stiffness: 350, damping: 35, mass: 0.8 }}
            style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto', color: '#3B2A22', background: '#FAF8F5' }}
          >
            {view === 'main' && (
              <div style={{ padding: '32px 20px 120px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div onClick={() => router.push('/visits')} style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#EAE1D5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#3B2A22', flex: 'none' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.12em', color: '#A08A7B', textTransform: 'uppercase' }}>{t('membership.page_label', 'GOOD TO KNOW')}</div>
                    <div style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-.02em', marginTop: '2px', color: '#3B2A22' }}>{t('membership.page_title', 'How benefits work')}</div>
                  </div>
                </div>
                <div style={{ fontSize: '14.5px', lineHeight: 1.5, color: '#7A6A5F', marginTop: '12px' }}>
                  {t('membership.page_subtitle', 'Nothing to keep track of \u2014 here\'s the whole idea in three plain notes.')}
                </div>

                <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {NOTES.map(note => (
                    <div key={note.id} style={{ background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 14px -6px rgba(59,42,34,.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#F1EBE1', color: '#A67C52', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                          {note.id}
                        </div>
                        <div style={{ fontSize: '15.5px', fontWeight: 600, color: '#3B2A22' }}>{note.title}</div>
                      </div>
                      <div style={{ fontSize: '14.5px', color: '#7A6A5F', marginTop: '14px', lineHeight: 1.55 }}>
                        {note.text}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={{ marginTop: '16px', background: '#F3F6F3', border: '1px solid #E4EBE4', borderRadius: '20px', padding: '20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#5C7B5A', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', marginTop: '2px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" ry="3"></rect><rect x="8" y="10" width="8" height="4" rx="1" ry="1"></rect></svg>
                  </div>
                  <div style={{ fontSize: '14px', color: '#4A6548', lineHeight: 1.5, fontWeight: 500 }}>
                    {t('membership.tier_note', 'And your tier never goes down. However far you\'ve come, it stays yours. See you soon.')}
                  </div>
                </div>

              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </PageTransition>
      <BottomNav />
    </PhoneLayout>
  );
}
