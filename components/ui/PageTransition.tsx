'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ type: 'spring', stiffness: 350, damping: 35, mass: 0.8 }}
        style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', minHeight: 0 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
