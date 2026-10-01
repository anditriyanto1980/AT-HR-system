import React from 'react';
import { LayoutDashboard, Clock, Calendar, Users, Layers, CalendarDays } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface MobileNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, setCurrentTab }) => {
  const { role } = useAuth();
  const isSuperOrHr = role === 'SUPER_ADMIN' || role === 'HR_ADMIN';

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'leave', label: 'Leave', icon: CalendarDays },
    { id: 'clock-in', label: 'Clock In', icon: Clock, isPrimary: true },
    { id: 'attendance-history', label: 'History', icon: Calendar },
    ...(isSuperOrHr
      ? [{ id: 'employees', label: 'People', icon: Users }]
      : [{ id: 'attendance-monitoring', label: 'Team', icon: Users }]),
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0B1528] border-t border-slate-800/90 px-2 flex items-center justify-around z-30 shadow-2xl">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;

        if (item.isPrimary) {
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className="flex flex-col items-center justify-center -mt-6 group focus:outline-none cursor-pointer"
            >
              <div className="w-13 h-13 rounded-full bg-[#1D63FF] text-white flex items-center justify-center shadow-lg shadow-blue-500/40 active:scale-95 transition-transform border-4 border-[#0B1528]">
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-amber-400 mt-0.5">Clock In</span>
            </button>
          );
        }

        return (
          <button
            key={item.id}
            onClick={() => setCurrentTab(item.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              isActive ? 'text-[#1D63FF] font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] mt-1">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
