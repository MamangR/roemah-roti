'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export type AdminUser = {
  id: string;
  username: string;
  role: 'admin' | 'cashier';
};

type AdminAuthContextType = {
  adminUser: AdminUser | null;
  permissions: Record<string, boolean>;
  loading: boolean;
  logout: () => Promise<void>;
  hasPermission: (permissionId: string) => boolean;
  refreshPermissions: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextType>({
  adminUser: null,
  permissions: {},
  loading: true,
  logout: async () => {},
  hasPermission: () => false,
  refreshPermissions: async () => {},
  refreshSession: async () => {},
});

export const useAdminAuth = () => useContext(AdminAuthContext);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchAdminMe = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/me');
      if (res.ok) {
        const data = await res.json();
        setAdminUser(data.admin);
        setPermissions(data.permissions || {});
      } else {
        setAdminUser(null);
        setPermissions({});
      }
    } catch (error) {
      console.error('Failed to fetch admin session', error);
      setAdminUser(null);
      setPermissions({});
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPermissions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/me');
      if (res.ok) {
        const data = await res.json();
        setPermissions(data.permissions || {});
      }
    } catch (error) {
      console.error('Failed to refresh permissions', error);
    }
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (err) { }
    setAdminUser(null);
    setPermissions({});
    router.push('/admin/signin');
  };

  const hasPermission = (permissionId: string): boolean => {
    if (!adminUser) return false;
    // Admin has full access
    if (adminUser.role === 'admin') return true;
    // Cashier checks permission map
    return !!permissions[permissionId];
  };

  useEffect(() => {
    fetchAdminMe();
  }, [fetchAdminMe]);

  // Auth guard for admin pages
  useEffect(() => {
    if (!loading) {
      const isSigninPage = pathname === '/admin/signin';
      if (!adminUser && !isSigninPage) {
        router.push('/admin/signin');
      } else if (adminUser && isSigninPage) {
        router.push(adminUser.role === 'cashier' ? '/admin/cashierdashboard' : '/admin');
      }
    }
  }, [adminUser, loading, pathname, router]);

  return (
    <AdminAuthContext.Provider value={{ adminUser, permissions, loading, logout, hasPermission, refreshPermissions, refreshSession: fetchAdminMe }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
