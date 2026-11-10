'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Building2,
  Search,
  Users,
  Newspaper,
  BarChart3,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ExternalLink,
  Globe,
  FileSpreadsheet
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      if (parsedUser.role !== 'admin') {
        router.push('/');
        return;
      }
    } else {
      router.push('/login');
      return;
    }

    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      name: 'Sales CRM',
      href: '/admin/crm/leads',
      badge: 'Core',
      badgeColor: 'bg-primary/20 text-primary-light border border-primary/40',
      icon: Users,
    },
    {
      name: 'Properties',
      href: '/admin/properties',
      icon: Building2,
    },
    {
      name: 'Property Search',
      href: '/admin/property-search',
      icon: Search,
    },
    {
      name: 'Property Sheet',
      href: '/admin/property-sheet',
      icon: FileSpreadsheet,
    },
    {
      name: 'Editorial & Blogs',
      href: '/admin/blogs',
      icon: Newspaper,
    },
    {
      name: 'Analytics & Intel',
      href: '/admin/analytics',
      icon: BarChart3,
    },
    {
      name: 'User Access',
      href: '/admin/users',
      icon: UserCog,
    },
    {
      name: 'System Settings',
      href: '/admin/settings',
      icon: Settings,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-2 border-t-primary animate-spin"></div>
          </div>
          <p className="text-sm font-medium tracking-wider uppercase text-slate-400">Authenticating Executive Session...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased selection:bg-primary selection:text-btn-text">
      {/* Mobile Header */}
      <div className="md:hidden bg-secondary text-white border-b border-slate-800 px-4 py-3 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            className="p-2 -ml-1 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors focus:outline-none"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-darker flex items-center justify-center text-btn-text font-bold text-sm shadow-md shadow-primary/30">
              P
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white">PROPFINOVA</h2>
              <p className="text-[10px] uppercase tracking-widest text-primary font-semibold">CRM Suite</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/"
            target="_blank"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg text-xs flex items-center gap-1 transition-colors"
            title="View Live Site"
          >
            <Globe className="w-4 h-4" />
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-50 md:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-secondary text-white">
            <div className="absolute top-3 right-3">
              <button
                type="button"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarContent
              navigation={navigation}
              pathname={pathname}
              user={user}
              onLogout={handleLogout}
              collapsed={false}
              onToggleCollapse={() => {}}
              onItemClick={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Desktop Static Sidebar */}
      <div
        className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 z-30 transition-all duration-300 ease-in-out border-r border-slate-800/80 bg-secondary ${
          sidebarCollapsed ? 'md:w-[76px]' : 'md:w-68'
        }`}
      >
        <SidebarContent
          navigation={navigation}
          pathname={pathname}
          user={user}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main Content Area */}
      <div
        className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'md:pl-[76px]' : 'md:pl-68'
        }`}
      >
        {/* Desktop Top Command Bar */}
        <header className="hidden md:flex sticky top-0 z-20 h-16 bg-surface/85 backdrop-blur-md border-b border-slate-200/80 px-8 items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-500">
              <span className="text-slate-400">Workspace</span>
              <span>/</span>
              <span className="text-primary font-semibold">
                {pathname === '/admin'
                  ? 'Overview'
                  : pathname.startsWith('/admin/crm')
                  ? 'Sales Pipeline CRM'
                  : pathname.split('/')[2]?.replace('-', ' ')?.toUpperCase() || 'Admin'}
              </span>
            </div>
            <div className="h-4 w-px bg-slate-200"></div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-[11px] font-medium text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/70 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>Public Portal</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            <Link
              href="/admin/crm/leads"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-btn-text bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary-darker shadow-sm shadow-primary/20 transition-all hover:shadow"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Open CRM</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  navigation,
  pathname,
  user,
  onLogout,
  collapsed,
  onToggleCollapse,
  onItemClick,
}) {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-secondary text-slate-300">
      {/* Brand Header */}
      <div
        className={`h-20 flex items-center border-b border-slate-800/80 px-4 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        {!collapsed ? (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary-dark to-primary-darker p-0.5 shadow-lg shadow-primary/30 flex items-center justify-center flex-shrink-0">
              <div className="w-full h-full rounded-[10px] bg-secondary/30 flex items-center justify-center text-white font-black text-base tracking-tighter">
                P
              </div>
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black tracking-wider text-white">PROPFINOVA</h1>
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
                Executive Suite
              </p>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary-dark to-primary-darker flex items-center justify-center text-btn-text font-black text-sm shadow-lg shadow-primary/30">
            P
          </div>
        )}

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={onToggleCollapse}
          className={`hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors focus:outline-none ${
            collapsed ? 'mt-2' : ''
          }`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
        <div className={`px-2 pb-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase ${collapsed ? 'text-center' : ''}`}>
          {collapsed ? '•••' : 'Platform Modules'}
        </div>

        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href === '/admin/crm/leads' && pathname.startsWith('/admin/crm')) ||
            (item.href === '/admin/property-search' && pathname.startsWith('/admin/property-search')) ||
            (item.href === '/ai-assistant' && pathname.startsWith('/ai-assistant')) ||
            (item.href === '/admin/blogs' && pathname.startsWith('/admin/blogs'));

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onItemClick}
              className={`group relative flex items-center rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-primary to-primary-dark text-btn-text shadow-md shadow-primary/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              } ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? item.name : ''}
            >
              <Icon
                className={`flex-shrink-0 transition-transform duration-150 ${
                  collapsed ? 'w-5 h-5' : 'w-4 h-4 mr-3'
                } ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200 group-hover:scale-105'}`}
              />

              {!collapsed && (
                <span className="flex-1 flex items-center justify-between overflow-hidden">
                  <span className="truncate">{item.name}</span>
                  {item.badge && (
                    <span
                      className={`ml-2 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-md tracking-wider ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badgeColor || 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </span>
              )}

              {/* Collapsed Tooltip */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800/80 bg-secondary-dark">
        {collapsed ? (
          <div className="flex flex-col items-center space-y-2 py-1">
            <div className="relative group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-bold text-white text-xs border border-slate-600/50 shadow-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-secondary rounded-full"></span>
              <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 border border-slate-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                {user?.name || 'Administrator'}
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/80 to-slate-800 flex items-center justify-center font-bold text-btn-text text-xs border border-slate-700/60 shadow-inner">
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-secondary rounded-full"></span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'Executive Admin'}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-primary/20 text-primary-light">
                    Superadmin
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}