'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Search,
  Sparkles,
  LogOut,
  Building2,
  Menu,
  X,
  User,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  PhoneCall
} from 'lucide-react';

export default function AgentLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      const parsedUser = JSON.parse(storedUser);
      queueMicrotask(() => {
        setUser(parsedUser);
      });

      // Redirect if not an agent
      if (parsedUser.role !== 'agent') {
        if (parsedUser.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
        return;
      }
    } else {
      router.push('/login');
      return;
    }

    queueMicrotask(() => {
      setLoading(false);
    });
  }, [router]);

  // Close mobile menu on route change
  useEffect(() => {
    queueMicrotask(() => {
      setMobileMenuOpen(false);
    });
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="w-16 h-16 rounded-2xl border-2 border-primary/20 animate-ping absolute inset-0"></div>
            <div className="w-16 h-16 rounded-2xl border-2 border-t-primary border-r-primary border-b-transparent border-l-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
          </div>
          <p className="text-sm font-medium tracking-wider text-slate-400 uppercase">
            Securing Advisor Workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'agent') {
    return null;
  }

  const navItems = [
    {
      label: 'Dashboard',
      href: '/agent/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/agent/dashboard'
    },
    {
      label: 'My Leads',
      href: '/agent/my-leads',
      icon: Users,
      active: pathname.startsWith('/agent/my-leads')
    },
    {
      label: 'Property Search',
      href: '/agent/property-search',
      icon: Search,
      active: pathname.startsWith('/agent/property-search')
    }
  ];

  const getInitials = (name) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans antialiased text-slate-900">
      {/* Executive Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Left: Brand & Navigation */}
            <div className="flex items-center space-x-8">
              {/* Brand Logo & Tag */}
              <Link href="/agent/dashboard" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-darker p-0.5 shadow-md shadow-primary/20 transition-transform group-hover:scale-105">
                  <div className="w-full h-full bg-secondary rounded-[10px] flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-black tracking-tight text-slate-900 font-serif">
                      DREAM <span className="text-primary">LAND</span>
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20">
                      Advisor Suite
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-600 tracking-wider uppercase">
                    Executive CRM Portal
                  </span>
                </div>
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        item.active
                          ? 'text-primary bg-primary/8 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <Icon className={`w-4 h-4 transition-colors ${item.active ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 rounded-md border border-amber-200">
                          {item.badge}
                        </span>
                      )}
                      {item.active && (
                        <span className="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-primary rounded-full" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right: Advisor Profile & Logout */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Quick Jump to Leads */}
              <Link
                href="/agent/my-leads"
                className="hidden lg:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-all"
              >
                <PhoneCall className="w-3.5 h-3.5 text-primary" />
                <span>Call Queue</span>
              </Link>

              {/* User Dossier */}
              <div className="flex items-center pl-3 border-l border-slate-200 space-x-3">
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900 leading-tight">
                    {user?.name || 'Property Advisor'}
                  </div>
                  <div className="text-[11px] font-medium text-slate-600 flex items-center justify-end space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Online Advisor</span>
                  </div>
                </div>

                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white flex items-center justify-center font-bold text-sm shadow-sm border border-slate-700/50">
                    {getInitials(user?.name)}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-primary hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center space-x-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-surface px-4 pt-3 pb-5 space-y-3 shadow-xl">
            {/* User Details Box */}
            <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                {getInitials(user?.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-600 truncate">{user?.email}</p>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-md">
                Advisor
              </span>
            </div>

            {/* Links */}
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      item.active
                        ? 'bg-primary text-btn-text shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-amber-100 text-amber-900">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Agent Content Area */}
      <main className="flex-1">
        {children}
      </main>

      {/* Executive Footer Bar */}
      <footer className="bg-surface border-t border-slate-200/80 py-4 px-6 text-center text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>PropFinova Internal CRM • Protected Executive Session</span>
        </div>
        <div className="mt-2 sm:mt-0 font-medium">
          Authorized Real Estate Advisor Environment
        </div>
      </footer>
    </div>
  );
}
