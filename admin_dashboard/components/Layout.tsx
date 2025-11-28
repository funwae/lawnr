'use client';

import type { User } from '@/lib/types/auth';
import { getCurrentUser, logout } from '@/lib/utils/auth';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Contractors', href: '/contractors', icon: '👷' },
  { name: 'Jobs', href: '/jobs', icon: '📋' },
  { name: 'Transactions', href: '/transactions', icon: '💰' },
  { name: 'Disputes', href: '/disputes', icon: '⚖️' },
  { name: 'FAQs', href: '/faqs', icon: '❓' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname === '/login') {
      setLoading(false);
      return;
    }

    async function checkAuth() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
          router.push('/login');
          return;
        }
        setUser(currentUser);
      } catch (error) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [pathname, router]);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-[#00FF00] text-xl">Loading...</div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1A1A1A] border-r border-[#00FF00]/20 flex flex-col">
        <div className="p-6 border-b border-[#00FF00]/20">
          <h1 className="text-2xl font-bold text-[#00FF00]">Lawnr Admin</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#00FF00] text-black font-semibold'
                    : 'text-gray-300 hover:bg-[#00FF00]/10 hover:text-[#00FF00]'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.name}</span>
              </a>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[#00FF00]/20">
          {user && (
            <div className="mb-4">
              <div className="text-sm text-gray-400">Logged in as</div>
              <div className="text-[#00FF00] font-semibold">{user.full_name}</div>
              <div className="text-xs text-gray-500">{user.email}</div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

