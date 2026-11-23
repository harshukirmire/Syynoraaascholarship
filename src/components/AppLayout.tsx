import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bookmark,
  BookOpen,
  ClipboardCheck,
  Compass,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/find-for-me': 'Find For Me',
  '/global-scholarships': 'Global Scholarships',
  '/explorer': 'Scholarship Explorer',
  '/exam-directory': 'Exam Directory',
  '/saved': 'Saved Scholarships',
  '/tracker': 'Application Tracker',
  '/guide': 'Synora Guide AI',
  '/profile': 'Student Profile & Exams',
  '/admin': 'Admin Console',
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentTitle =
    ROUTE_TITLES[location.pathname] ||
    (location.pathname.startsWith('/scholarships/') ? 'Scholarship Details' : 'SYNORA');

  const displayName =
    profile?.personal?.fullName?.trim() ||
    user?.displayName ||
    user?.email ||
    'Student';

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/find-for-me', label: 'Find For Me', icon: Sparkles },
    { to: '/global-scholarships', label: 'Global Scholarships', icon: Globe },
    { to: '/explorer', label: 'Explorer', icon: Compass },
    { to: '/exam-directory', label: 'Exam Directory', icon: BookOpen },
    { to: '/saved', label: 'Saved', icon: Bookmark },
    { to: '/tracker', label: 'Tracker', icon: ClipboardCheck },
    { to: '/guide', label: 'Synora Guide AI', icon: MessageSquare },
    { to: '/profile', label: 'Profile & Exams', icon: User },
  ];

  async function handleSignOut() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111111] flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-zinc-200 z-20">
        <div className="h-16 px-6 flex items-center border-b border-zinc-200">
          <Link
            to="/dashboard"
            className="font-display text-lg font-bold tracking-tight text-zinc-900 whitespace-nowrap shrink-0"
          >
            SYNORA
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-zinc-200">
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100'
                  }`
                }
              >
                <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Admin Console</span>
              </NavLink>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-zinc-200">
          <div className="px-2 pb-3">
            <p className="text-xs font-medium text-zinc-900 truncate">{displayName}</p>
            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] bg-white h-full border-r border-zinc-200 flex flex-col z-50">
            <div className="h-14 px-5 flex items-center justify-between border-b border-zinc-200">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="font-display text-lg font-bold tracking-tight text-zinc-900"
              >
                SYNORA
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="p-2 text-zinc-600 hover:text-zinc-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-zinc-900 text-white'
                          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
              {isAdmin && (
                <NavLink
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors mt-3 ${
                      isActive
                        ? 'bg-zinc-900 text-white'
                        : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100'
                    }`
                  }
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Admin Console</span>
                </NavLink>
              )}
            </nav>
            <div className="p-4 border-t border-zinc-200">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-zinc-200 px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 text-zinc-700 hover:text-zinc-900 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-zinc-400 hidden sm:inline">Synora</span>
              <span className="text-zinc-300 hidden sm:inline" aria-hidden="true">/</span>
              <span className="font-display font-semibold text-zinc-900 truncate">
                {currentTitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <Link
              to="/profile"
              className="text-sm font-medium text-zinc-700 hover:text-zinc-900 truncate max-w-[180px] hidden sm:inline"
            >
              {displayName}
            </Link>
            <Link
              to="/guide"
              className="px-3.5 py-2 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
            >
              Ask Synora Guide
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-8 py-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
