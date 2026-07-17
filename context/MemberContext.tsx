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
  lifetimeSpend: number;
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
  refreshMember: async () => { },
  logout: async () => { },
});

export const useMember = () => useContext(MemberContext);

export function MemberProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const memberStrRef = React.useRef<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const fetchMember = async () => {
    try {
      const res = await fetch('/api/user/me');
      if (res.ok) {
        const data = await res.json();
        const dataStr = JSON.stringify(data.member);
        if (dataStr !== memberStrRef.current) {
          memberStrRef.current = dataStr;
          setMember(data.member);
        }
      } else {
        if (memberStrRef.current !== null) {
          memberStrRef.current = null;
          setMember(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch member', error);
      if (memberStrRef.current !== null) {
        memberStrRef.current = null;
        setMember(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) { }
    memberStrRef.current = null;
    setMember(null);
    router.push('/signin');
  };

  useEffect(() => {
    fetchMember();
  }, []);

  // Simple auth guard for internal pages
  useEffect(() => {
    if (!loading) {
      // Admin routes have their own auth — skip member auth guard
      const isAdminRoute = pathname.startsWith('/admin');
      if (isAdminRoute) return;

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
