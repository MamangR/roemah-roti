'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export type Member = {
  id: string;
  name: string;
  firstName: string;
  initials: string;
  phone: string;
  email: string | null;
  birthday: string;
  birthdayInput: string;       // raw "YYYY-MM-DD" used for birthday month logic
  since: string;
  referralCode: string;
  totalVisits: number;
  rewardsEarned: number;
  memberDurationLabel: string;
  activities: any[];
  rewards: any[];
  referredFriends: any[];
};


type MemberContextType = {
  member: Member | null;
  loading: boolean;
  refreshMember: () => Promise<void>;
  logout: () => Promise<void>;
};

const MemberContext = createContext<MemberContextType>({
  member: null,
  loading: true,
  refreshMember: async () => {},
  logout: async () => {},
});

export const useMember = () => useContext(MemberContext);

export function MemberProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchMember = async () => {
    try {
      const res = await fetch('/api/user/me');
      if (res.ok) {
        const data = await res.json();
        setMember(data.member);
      } else {
        setMember(null);
      }
    } catch (error) {
      console.error('Failed to fetch member', error);
      setMember(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {}
    setMember(null);
    router.push('/signin');
  };

  useEffect(() => {
    fetchMember();
  }, []);

  // Simple auth guard for internal pages
  useEffect(() => {
    if (!loading) {
      const isAuthPage = pathname === '/signin' || pathname === '/register';
      const isLandingPage = pathname === '/';
      if (!member && !isAuthPage && !isLandingPage) {
        router.push('/signin');
      } else if (member && isAuthPage) {
        router.push('/visits');
      }
    }
  }, [member, loading, pathname, router]);

  return (
    <MemberContext.Provider value={{ member, loading, refreshMember: fetchMember, logout }}>
      {children}
    </MemberContext.Provider>
  );
}
