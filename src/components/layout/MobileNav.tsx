import React from 'react';
import { LayoutDashboard, Clock, Calendar, CalendarDays, Menu, Camera } from 'lucide-react';

interface MobileNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenMenu: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  setCurrentTab,
  onOpenMenu,
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0B1528]/95 backdrop-blur-md border-t border-slate-800/90 px-3 flex items-center justify-between z-30 shadow-2xl select-none">
      {/* 1. Beranda / Home */}
      <button
        onClick={() => setCurrentTab('dashboard')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
          currentTab === 'dashboard' ? 'text-[#1D63FF] font-bold' : 'text-slate-400 hover:text-white'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px] mt-1 font-medium">Beranda</span>
      </button>

      {/* 2. Cuti & Izin */}
      <button
        onClick={() => setCurrentTab('leave')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
          currentTab === 'leave' || currentTab === 'permission'
            ? 'text-[#1D63FF] font-bold'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <CalendarDays className="w-5 h-5" />
        <span className="text-[10px] mt-1 font-medium">Cuti & Izin</span>
      </button>

      {/* 3. Central Primary Button: Clock In (Elevated Floating Action) */}
      <button
        onClick={() => setCurrentTab('clock-in')}
        className="flex flex-col items-center justify-center -mt-6 px-1 group focus:outline-none cursor-pointer"
        title="Presensi Wajib Kamera & GPS"
      >
        <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-all border-4 border-[#0B1528] ${
          currentTab === 'clock-in'
            ? 'bg-amber-500 text-slate-950 shadow-amber-500/50 scale-105'
            : 'bg-gradient-to-tr from-[#1D63FF] to-blue-500 text-white shadow-blue-500/40'
        }`}>
          <Camera className="w-6 h-6 animate-pulse" />
        </div>
        <span className="text-[10px] font-bold text-amber-400 mt-0.5 tracking-tight">
          Clock In
        </span>
      </button>

      {/* 4. Riwayat Absensi */}
      <button
        onClick={() => setCurrentTab('attendance-history')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
          currentTab === 'attendance-history'
            ? 'text-[#1D63FF] font-bold'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <Calendar className="w-5 h-5" />
        <span className="text-[10px] mt-1 font-medium">Riwayat</span>
      </button>

      {/* 5. Menu Lengkap Drawer */}
      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[10px] mt-1 font-medium">Menu</span>
      </button>
    </nav>
  );
};
