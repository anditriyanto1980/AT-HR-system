import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Database,
  UserCheck,
  ChevronDown,
  Building,
  Radio,
  MapPin,
  Bell,
  CheckCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Search,
  Calendar,
  Settings,
  Maximize,
  Minimize,
  Menu,
  Sparkles,
  Gem,
  LogOut,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { AppNotification, Company, UserRole } from '../../types';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { BrandIcon } from '../common/BrandIcon';

interface HeaderProps {
  currentTab: string;
  onOpenDbModal: () => void;
  onNavigateTab?: (tab: string) => void;
  onToggleSidebar?: () => void;
  onOpenMobileDrawer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenDbModal,
  onNavigateTab,
  onToggleSidebar,
  onOpenMobileDrawer,
}) => {
  const { currentUser, role, switchRole, logout } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [calendarMenuOpen, setCalendarMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResultsOpen, setSearchResultsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [company, setCompany] = useState<Company>(() => dataService.getCompany());

  useEffect(() => {
    const handleCompanyUpdate = (e: any) => {
      if (e.detail) {
        setCompany(e.detail);
      } else {
        setCompany(dataService.getCompany());
      }
    };
    window.addEventListener('company_updated', handleCompanyUpdate);
    return () => {
      window.removeEventListener('company_updated', handleCompanyUpdate);
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      setNotifications(dataService.getNotifications(currentUser.id));
    }
  }, [currentUser, currentTab, role]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    if (currentUser) {
      dataService.markAllNotificationsAsRead(currentUser.id);
      setNotifications(dataService.getNotifications(currentUser.id));
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    dataService.markNotificationAsRead(notif.id);
    if (currentUser) {
      setNotifications(dataService.getNotifications(currentUser.id));
    }
    setNotifMenuOpen(false);
    if (notif.target_tab && onNavigateTab) {
      onNavigateTab(notif.target_tab);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const roleLabels: Record<UserRole, { title: string; subtitle: string }> = {
    SUPER_ADMIN: { title: 'Admin', subtitle: 'Main Branch' },
    HR_ADMIN: { title: 'HR Admin', subtitle: 'Head Office' },
    MANAGER: { title: 'Manager', subtitle: 'Tech Branch' },
    EMPLOYEE: { title: 'Employee', subtitle: 'Jakarta Hub' },
  };

  const quickNavList = [
    { label: 'Dashboard Overview', tab: 'dashboard', category: 'Overview' },
    { label: 'Clock In / Live Attendance', tab: 'clock-in', category: 'Attendance' },
    { label: 'Leave Requests (Cuti)', tab: 'leave', category: 'Time Off' },
    { label: 'Overtime Logging (Lembur)', tab: 'overtime', category: 'Time Off' },
    { label: 'Payroll & Slip Gaji', tab: 'payroll', category: 'Finance' },
    { label: 'Reimbursement Claims', tab: 'reimbursements', category: 'Finance' },
    { label: 'Performance & KPI', tab: 'performance', category: 'Talent' },
    { label: 'Company Hub Announcements', tab: 'company-hub', category: 'Corporate' },
    { label: 'Employee Directory & Accounts', tab: 'employees', category: 'People' },
    { label: 'Shift Rules & Tolerances', tab: 'shifts', category: 'People' },
    { label: 'Work Schedule Calendar', tab: 'schedule', category: 'People' },
    { label: 'Attendance Reports', tab: 'reports', category: 'Reports' },
    { label: 'Approvals Hub', tab: 'approvals-hub', category: 'Approvals' },
    { label: 'Buku Panduan & User Guideline', tab: 'user-guide', category: 'Documentation' },
  ];

  const filteredQuickNav = searchQuery.trim()
    ? quickNavList.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelectNav = (tab: string) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
    setSearchQuery('');
    setSearchResultsOpen(false);
  };

  const formattedDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="h-16 bg-[#0B132B] border-b border-slate-800 px-3 sm:px-5 flex items-center justify-between sticky top-0 z-40 select-none text-white shadow-md">
      {/* Zone 1: Logo & Brand Lockup + Hamburger Toggle */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Brand Icon & Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20 shrink-0">
            <BrandIcon name={company.brand_icon} className="w-5 h-5 text-slate-950" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm sm:text-base font-bold text-white tracking-tight leading-none flex items-center gap-1.5 truncate max-w-[180px] sm:max-w-xs md:max-w-sm">
              <span className="truncate">{company.app_name || company.name || 'AT-HR Enterprise'}</span>
            </span>
            <span className="text-[10px] text-amber-400 font-medium tracking-wide mt-0.5 hidden xs:inline truncate max-w-[200px] sm:max-w-xs">
              {company.tagline || 'Smart Solutions for Smart Business'}
            </span>
          </div>
        </div>

        {/* Hamburger Sidebar / Mobile Drawer Toggle */}
        <button
          onClick={() => {
            if (window.innerWidth < 1024 && onOpenMobileDrawer) {
              onOpenMobileDrawer();
            } else if (onToggleSidebar) {
              onToggleSidebar();
            }
          }}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors ml-1 focus:outline-none cursor-pointer"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Zone 2: Global Search Bar (Matching Reference Image) */}
      <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md mx-3 lg:mx-6 hidden sm:block relative">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchResultsOpen(true);
            }}
            onFocus={() => setSearchResultsOpen(true)}
            placeholder="Search here..."
            className="w-full bg-white text-slate-800 placeholder-slate-400 text-xs rounded-full pl-9 pr-9 py-2 border border-slate-200/80 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          {searchQuery ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResultsOpen(false);
              }}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          ) : (
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
          )}
        </div>

        {/* Live Search Quick Results Dropdown */}
        {searchResultsOpen && filteredQuickNav.length > 0 && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setSearchResultsOpen(false)}
            />
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-40 max-h-72 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Navigation
              </div>
              {filteredQuickNav.map((item) => (
                <button
                  key={item.tab}
                  onClick={() => handleSelectNav(item.tab)}
                  className="w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-blue-50 text-xs text-slate-800 transition-colors group"
                >
                  <span className="font-semibold group-hover:text-blue-600">{item.label}</span>
                  <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-700">
                    {item.category}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Zone 3: Actions & Profile Lockup (Matching Reference Image) */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Date Pill (White pill with calendar icon) */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setCalendarMenuOpen(!calendarMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white text-slate-800 text-xs font-semibold shadow-xs hover:bg-slate-50 transition-colors border border-slate-200"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-medium">{formattedDate}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {calendarMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setCalendarMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-40 text-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1.5">
                  Corporate Calendar
                </div>
                <div className="text-[11px] text-slate-500">
                  Hari kerja aktif: Senin – Jumat (08:00 – 17:00 WIB)
                </div>
                <button
                  onClick={() => {
                    setCalendarMenuOpen(false);
                    if (onNavigateTab) onNavigateTab('holiday');
                  }}
                  className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs transition-colors"
                >
                  Lihat Kalender Libur Nasional
                </button>
              </div>
            </>
          )}
        </div>

        {/* PWA In-App Install Prompt */}
        <PWAInstallButton variant="header" />

        {/* Notifications Bell with Red Badge */}
        <div className="relative">
          <button
            onClick={() => setNotifMenuOpen(!notifMenuOpen)}
            className="p-2 rounded-xl hover:bg-white/10 text-white relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute 1 top-1 right-1 w-4 h-4 rounded-full bg-[#FF2E7E] text-white font-mono text-[9px] font-bold flex items-center justify-center animate-pulse shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setNotifMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-40 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-50 text-rose-700 font-bold border border-rose-200 font-mono">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No notifications at this time.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 ${
                          !notif.read ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="pt-0.5 shrink-0">
                          {notif.type === 'SUCCESS' && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          )}
                          {notif.type === 'ACTION_REQUIRED' && (
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                          )}
                          {notif.type === 'INFO' && (
                            <Info className="w-4 h-4 text-sky-600" />
                          )}
                          {notif.type === 'WARNING' && (
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {notif.title}
                            </span>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 ml-2" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-2">
                            {notif.message}
                          </p>
                          <div className="text-[10px] text-slate-400 font-mono pt-0.5">
                            {new Date(notif.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Guideline (Panduan Pengguna) Icon */}
        <button
          onClick={() => onNavigateTab && onNavigateTab('user-guide')}
          className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors"
          title="Buku Panduan Pengguna & SOP Sistem (User Guideline)"
        >
          <BookOpen className="w-4 h-4 text-amber-300" />
        </button>

        {/* Settings Gear Icon (Database & Configuration) */}
        <button
          onClick={onOpenDbModal}
          className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors"
          title="Status Database Firebase Cloud Firestore"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Fullscreen Expand Icon */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors hidden sm:block"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>

        {/* User Profile Area (Matching Reference Image) */}
        <div className="relative pl-1">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/10 transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-white/20 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-xs">
              {currentUser?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="text-left hidden lg:block leading-tight">
              <div className="text-xs font-bold text-white flex items-center gap-1">
                <span>{role === 'SUPER_ADMIN' ? 'Admin' : currentUser?.full_name || 'Admin'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <span className="text-[10px] text-emerald-400 font-medium">
                {roleLabels[role].subtitle}
              </span>
            </div>
          </button>

          {roleMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setRoleMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-40 text-slate-800 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                    {currentUser?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {currentUser?.full_name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      @{currentUser?.username || 'user'}
                    </div>
                  </div>
                </div>

                <div className="px-3 py-2 border-b border-slate-100">
                  <button
                    onClick={() => {
                      setRoleMenuOpen(false);
                      if (onNavigateTab) onNavigateTab('user-guide');
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl flex items-center gap-2 text-xs text-blue-700 bg-blue-50/70 hover:bg-blue-100 font-bold transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Buku Panduan Pengguna (SOP)</span>
                  </button>
                </div>

                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Switch Active RBAC Role
                  </div>
                  <div className="space-y-1">
                    {(['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'] as UserRole[]).map(
                      (r) => {
                        const isCurrent = role === r;
                        return (
                          <button
                            key={r}
                            onClick={() => {
                              switchRole(r);
                              setRoleMenuOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                              isCurrent ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <span>{roleLabels[r].title}</span>
                            {isCurrent && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className="p-1">
                  <button
                    onClick={() => {
                      setRoleMenuOpen(false);
                      logout();
                    }}
                    className="w-full px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out of Workspace</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
