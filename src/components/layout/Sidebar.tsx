import React from 'react';
import {
  LayoutDashboard,
  Clock,
  Calendar,
  Layers,
  Database,
  ShieldCheck,
  MapPin,
  ChevronRight,
  LogOut,
  CalendarDays,
  FileText,
  Timer,
  CheckSquare,
  FileSpreadsheet,
  CalendarCheck,
  History,
  Plane,
  CalendarRange,
  DollarSign,
  Receipt,
  Award,
  Megaphone,
  Users,
  Building2,
  TrendingUp,
  Activity,
  Radio,
  Power,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { UserRole } from '../../types';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  badge?: string;
  isAction?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenDbModal: () => void;
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenDbModal,
  collapsed = false,
}) => {
  const { role, currentUser, logout } = useAuth();

  const isSuperOrHr = role === 'SUPER_ADMIN' || role === 'HR_ADMIN';
  const isManager = role === 'MANAGER';

  const pendingApprovalsCount = currentUser
    ? dataService.getPendingApprovalsCount(currentUser)
    : 0;

  const menuSections: MenuSection[] = [
    {
      title: 'MAIN MENU',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'clock-in', label: 'Clock In / Out', icon: Clock, badge: 'Live GPS' },
        { id: 'attendance-history', label: 'Attendance', icon: Calendar },
        ...(isSuperOrHr || isManager
          ? [{ id: 'attendance-monitoring', label: 'Live Monitoring', icon: MapPin }]
          : []),
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'leave', label: 'Leave (Cuti)', icon: CalendarDays },
        { id: 'permission', label: 'Permission (Izin)', icon: FileText },
        { id: 'overtime', label: 'Overtime (Lembur)', icon: Timer },
        { id: 'business-trip', label: 'Business Trip', icon: Plane },
        { id: 'holiday', label: 'Holidays', icon: CalendarCheck },
        { id: 'attendance-correction', label: 'Correction', icon: History },
        ...(isSuperOrHr || isManager
          ? [
              {
                id: 'approvals-hub',
                label: 'Approvals Hub',
                icon: CheckSquare,
                badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : undefined,
              },
            ]
          : []),
      ],
    },
    {
      title: 'FINANCE & PAYROLL',
      items: [
        {
          id: 'payroll',
          label: role === 'EMPLOYEE' ? 'My Payslips' : 'Payroll & Slips',
          icon: DollarSign,
        },
        { id: 'reimbursements', label: 'Reimbursements', icon: Receipt },
      ],
    },
    {
      title: 'TALENT & NOTICE',
      items: [
        { id: 'performance', label: 'Performance KPI', icon: Award },
        { id: 'company-hub', label: 'Company Notice', icon: Megaphone },
      ],
    },
    {
      title: 'ORGANIZATION',
      items: [
        { id: 'schedule', label: 'Work Schedule', icon: CalendarRange },
        ...(isSuperOrHr || isManager
          ? [{ id: 'employees', label: 'Employees', icon: Users }]
          : []),
        ...(isSuperOrHr
          ? [
              { id: 'organization', label: 'Branch & Units', icon: Building2 },
              { id: 'shifts', label: 'Shift Rules', icon: Layers },
            ]
          : []),
        { id: 'reports', label: 'HR Reports', icon: FileSpreadsheet },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        ...(isSuperOrHr ? [{ id: 'audit-logs', label: 'Audit Trail', icon: ShieldCheck }] : []),
        { id: 'database-setup', label: 'Database & SQL', icon: Database, isAction: true },
      ],
    },
  ];

  if (collapsed) {
    return (
      <aside className="hidden lg:flex flex-col w-18 bg-[#0B1528] border-r border-slate-800/90 select-none shrink-0 h-[calc(100vh-4rem)] py-3 px-2 space-y-4 items-center">
        {menuSections.map((section, sIdx) =>
          section.items.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'database-setup') onOpenDbModal();
                  else setCurrentTab(item.id);
                }}
                className={`p-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#1D63FF] text-white shadow-md shadow-blue-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
                title={item.label}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })
        )}
      </aside>
    );
  }

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-[#0B1528] border-r border-slate-800/90 select-none shrink-0 h-[calc(100vh-4rem)] sticky top-16 text-slate-300">
      {/* Scrollable Navigation Menu Items */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
        {menuSections.map((section, idx) => {
          if (section.items.length === 0) return null;
          return (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {section.title}
              </div>
              <div className="space-y-0.5 pt-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;

                  const handleClick = () => {
                    if (item.id === 'database-setup') {
                      onOpenDbModal();
                    } else {
                      setCurrentTab(item.id);
                    }
                  };

                  return (
                    <button
                      key={item.id}
                      onClick={handleClick}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all group ${
                        isActive
                          ? 'bg-[#1D63FF] text-white font-bold shadow-md shadow-blue-500/20'
                          : 'text-slate-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.badge && (
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                              isActive
                                ? 'bg-white/25 text-white'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-transform ${
                            isActive
                              ? 'text-white'
                              : 'text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Live Office Rate Widget (Matching "Live Gold Rate" in reference image) */}
      <div className="p-3 border-t border-slate-800 bg-[#070D18]">
        <div className="bg-[#0D1B2A] border border-slate-800 rounded-xl p-3 space-y-2.5 shadow-md">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
              <span className="text-sm">🪙</span>
              <span>Live Office Radar</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          {/* Metric 1: Rate */}
          <div className="space-y-0.5 border-b border-slate-800/80 pb-1.5">
            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>Attendance Rate</span>
              <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-1 py-0.2 rounded font-mono">
                ▲ 0.65%
              </span>
            </div>
            <div className="text-xs font-mono font-bold text-white tabular-nums">
              95.4% Today
            </div>
          </div>

          {/* Metric 2: Active On-Duty */}
          <div className="space-y-0.5">
            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>Active On-Duty</span>
              <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-1 py-0.2 rounded font-mono">
                ▲ 0.60%
              </span>
            </div>
            <div className="text-xs font-mono font-bold text-white tabular-nums">
              14 / 17 Staff
            </div>
          </div>

          {/* Timestamp Footer */}
          <div className="text-[9px] text-slate-500 font-mono pt-1 text-center border-t border-slate-800/60">
            Last Updated : {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Quick Logout Button */}
        <button
          onClick={logout}
          className="mt-2.5 w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-950/40 text-xs font-semibold transition-colors"
        >
          <Power className="w-3.5 h-3.5 text-rose-500" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
