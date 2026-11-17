import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Bell,
  Box,
  ChevronRight,
  LogIn,
  LogOut,
  Menu,
  ShieldCheck,
  UserCheck,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { AuthUser, DashboardNotification } from '../../types/civic';
import { NotificationPanel } from './NotificationPanel';

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface DashboardLayoutProps {
  role: 'citizen' | 'admin';
  activeTab: string;
  activeTabLabel: string;
  navItems: SidebarNavItem[];
  onSelectTab: (tabId: string) => void;
  onSwitchRole: (role: 'citizen' | 'admin') => void;
  onReturnToCity: () => void;
  primaryAction?: ReactNode;
  notifications: DashboardNotification[];
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onSelectNotification: (notif: DashboardNotification) => void;
  currentUser?: AuthUser | null;
  onSignOut?: () => void;
  onOpenAuth?: (mode: 'login' | 'signup') => void;
  children: ReactNode;
}

export function DashboardLayout({
  role,
  activeTab,
  activeTabLabel,
  navItems,
  onSelectTab,
  onSwitchRole,
  onReturnToCity,
  primaryAction,
  notifications,
  onMarkAllRead,
  onMarkRead,
  onSelectNotification,
  currentUser,
  onSignOut,
  onOpenAuth,
  children,
}: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifContainerRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = notifications.filter(
    (n) => !n.read && (n.audience === 'both' || n.audience === role),
  ).length;

  useEffect(() => {
    if (!notifOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        notifContainerRef.current &&
        !notifContainerRef.current.contains(e.target as Node)
      ) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [notifOpen]);

  const roleLabel = role === 'admin' ? 'Administrator Console' : 'Citizen Portal';

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0B221A] text-[#E6F2EC] select-none">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <button
          type="button"
          onClick={onReturnToCity}
          className="flex items-center gap-2.5 text-left cursor-pointer group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#10B981] to-[#059669] text-[#052016] font-display font-bold text-sm shadow-[0_2px_8px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.4)]">
            CV
          </div>
          <div>
            <div className="font-display text-sm font-bold tracking-tight text-white group-hover:text-[#6EE7B7] transition-colors">
              CivicVoice
            </div>
            <div className="text-[11px] text-[#8BB3A1]">{roleLabel}</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close sidebar"
          className="lg:hidden rounded-md p-1.5 text-[#9DC2B1] hover:bg-white/10 hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Role Switcher */}
      <div className="px-4 pt-4 pb-2">
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#071812] p-1 border border-white/10">
          <button
            type="button"
            onClick={() => {
              onSwitchRole('citizen');
              setMobileMenuOpen(false);
            }}
            className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all cursor-pointer ${
              role === 'citizen'
                ? 'bg-[#0F392A] text-[#ECFDF5] shadow-xs border border-[#10B981]/30'
                : 'text-[#8BB3A1] hover:text-white'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Citizen</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onSwitchRole('admin');
              setMobileMenuOpen(false);
            }}
            className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all cursor-pointer ${
              role === 'admin'
                ? 'bg-[#0F392A] text-[#ECFDF5] shadow-xs border border-[#10B981]/30'
                : 'text-[#8BB3A1] hover:text-white'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Admin</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1" aria-label="Workspace Navigation">
        <div className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-[#6F9B88] uppercase">
          Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#123D2E] text-white border border-[#10B981]/30 shadow-[0_2px_8px_rgba(0,0,0,0.2)]'
                  : 'text-[#A8C9B9] hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <span className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-[#34D399]' : 'text-[#78A390]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </span>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span
                  className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] tabular-nums ${
                    isActive
                      ? 'bg-[#10B981]/25 text-[#6EE7B7]'
                      : 'bg-white/10 text-[#C2DCD0]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-4">
          <div className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-[#6F9B88] uppercase">
            Spatial Model
          </div>
          <button
            type="button"
            onClick={onReturnToCity}
            className="w-full flex items-center justify-between gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-[#A8C9B9] hover:bg-white/5 hover:text-white border border-transparent transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              <Box className="h-4 w-4 text-[#34D399]" />
              <span>3D Smart City Twin</span>
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-[#6F9B88]" />
          </button>
        </div>
      </nav>

      {/* Live Sync & Account Footer */}
      <div className="border-t border-white/10 p-4 space-y-3">
        <div className="flex items-center justify-between rounded-lg bg-[#081913] border border-white/10 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34D399] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
            </span>
            <span className="text-[11px] font-medium text-[#C5DFD3]">
              City Grid Synced
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#6EE7B7]">Live</span>
        </div>

        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#154534] border border-[#10B981]/30 text-xs font-semibold text-[#ECFDF5]">
              {currentUser
                ? currentUser.name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                : role === 'admin'
                  ? 'RK'
                  : 'AR'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {currentUser
                  ? currentUser.name
                  : role === 'admin'
                    ? 'Raghavendra Kulkarni'
                    : 'Ananya Rao'}
              </div>
              <div className="text-[11px] text-[#8BB3A1] truncate">
                {currentUser
                  ? currentUser.district
                  : role === 'admin'
                    ? 'Karnataka Municipal Operations'
                    : 'Bengaluru East · Indiranagar'}
              </div>
            </div>
          </div>

          {currentUser && onSignOut ? (
            <button
              type="button"
              onClick={onSignOut}
              title="Sign out"
              aria-label="Sign out"
              className="rounded-md p-1.5 text-[#8BB3A1] hover:bg-white/10 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          ) : (
            onOpenAuth && (
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                title="Sign in"
                aria-label="Sign in"
                className="rounded-md p-1.5 text-[#8BB3A1] hover:bg-white/10 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <LogIn className="h-3.5 w-3.5" />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F9F6] text-[#0F2920] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-[#0F2E23]">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 w-64 max-w-[82vw] h-full shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Breadcrumb on Left, Action + Notification + Profile on Right */}
        <header className="sticky top-0 z-30 h-16 border-b border-[#DCE7E1] bg-white/95 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden rounded-md border border-[#DCE7E1] bg-[#F7FAF8] p-2 text-[#0F2920] hover:bg-[#EBF3EE] cursor-pointer"
            >
              <Menu className="h-4 w-4" />
            </button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs sm:text-sm min-w-0">
              <span className="text-[#6B877B] hidden sm:inline">CivicVoice</span>
              <ChevronRight className="h-3.5 w-3.5 text-[#9CB3A8] hidden sm:inline shrink-0" />
              <span className="text-[#527064] truncate">{roleLabel}</span>
              <ChevronRight className="h-3.5 w-3.5 text-[#9CB3A8] shrink-0" />
              <span className="font-semibold text-[#0F2920] truncate">
                {activeTabLabel}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {primaryAction}

            <div className="relative" ref={notifContainerRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                aria-label="Toggle notifications"
                className="relative inline-flex items-center justify-center rounded-lg border border-[#DCE7E1] bg-white p-2 text-[#0F2920] hover:bg-[#F3F8F5] hover:border-[#059669]/40 transition-colors cursor-pointer"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#059669] px-1 font-mono text-[10px] font-bold text-white shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              <NotificationPanel
                open={notifOpen}
                notifications={notifications}
                audience={role}
                onClose={() => setNotifOpen(false)}
                onMarkAllRead={onMarkAllRead}
                onMarkRead={onMarkRead}
                onSelectNotification={(n) => {
                  onSelectNotification(n);
                  setNotifOpen(false);
                }}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1360px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
