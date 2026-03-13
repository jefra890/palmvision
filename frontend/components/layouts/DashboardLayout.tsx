'use client';

import { ReactNode, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Hand,
  History,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  Sparkles,
  User,
} from 'lucide-react';
import { useAuth } from '@/app/providers';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { name: 'Leer Palma', href: '/dashboard', icon: Hand },
  { name: 'Mis Lecturas', href: '/dashboard/readings', icon: History },
  { name: 'Mi Perfil', href: '/dashboard/settings', icon: User },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const toggleUserMenu = useCallback(() => {
    setUserMenuOpen(prev => !prev);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-gray-900 border-r border-purple-900/30 transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-purple-900/30">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-amber-400 flex items-center justify-center">
                <span className="text-white text-sm">&#10070;</span>
              </div>
              <span className="font-bold text-lg text-white">PalmVision</span>
            </Link>
            <button
              onClick={closeSidebar}
              className="lg:hidden p-2 hover:bg-gray-800 rounded-lg"
            >
              <X className="w-5 h-5 text-purple-300" />
            </button>
          </div>

          {/* Plan info */}
          <div className="px-4 py-3 border-b border-purple-900/30">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-900/20">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <div className="text-left">
                <p className="text-sm font-medium text-white">Plan Gratuito</p>
                <p className="text-xs text-purple-400">3 lecturas restantes</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                    isActive
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      : 'text-purple-300/60 hover:bg-gray-800 hover:text-purple-200'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-purple-900/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || 'Usuario'}
                </p>
                <p className="text-xs text-purple-400/60 truncate">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="Cerrar sesion"
              >
                <LogOut className="w-5 h-5 text-purple-400/60" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-gray-950/80 backdrop-blur-sm border-b border-purple-900/20">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 hover:bg-gray-800 rounded-lg"
              >
                <Menu className="w-5 h-5 text-purple-300" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-purple-400/60" />
              </button>

              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-semibold text-sm">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <ChevronDown className="w-4 h-4 text-purple-400/60" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-purple-900/30 rounded-lg shadow-lg py-1 z-50">
                    <Link
                      href="/dashboard/settings"
                      className="block px-4 py-2 text-sm text-purple-200 hover:bg-gray-800"
                    >
                      Mi Perfil
                    </Link>
                    <hr className="my-1 border-purple-900/30" />
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-900/20"
                    >
                      Cerrar Sesion
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
