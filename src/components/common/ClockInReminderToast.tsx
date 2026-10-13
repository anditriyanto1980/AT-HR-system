import React, { useState, useEffect } from 'react';
import {
  BellRing,
  Camera,
  X,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { ClockInReminderEventDetail } from '../../services/notificationService';

interface ClockInReminderToastProps {
  onNavigateTab: (tab: string) => void;
}

export const ClockInReminderToast: React.FC<ClockInReminderToastProps> = ({
  onNavigateTab,
}) => {
  const [activeReminder, setActiveReminder] =
    useState<ClockInReminderEventDetail | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const handleTrigger = (event: any) => {
      const detail = event.detail as ClockInReminderEventDetail;
      if (detail) {
        setClosing(false);
        setActiveReminder(detail);
      }
    };

    window.addEventListener('clockin_reminder_triggered', handleTrigger);
    return () => {
      window.removeEventListener('clockin_reminder_triggered', handleTrigger);
    };
  }, []);

  if (!activeReminder) return null;

  const handleDismiss = () => {
    setClosing(true);
    setTimeout(() => {
      setActiveReminder(null);
      setClosing(false);
    }, 200);
  };

  const handleGoClockIn = () => {
    handleDismiss();
    onNavigateTab('clock-in');
  };

  return (
    <div
      className={`fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-full transition-all duration-200 ${
        closing
          ? 'opacity-0 translate-y-3 scale-95'
          : 'opacity-100 translate-y-0 scale-100 animate-in slide-in-from-bottom-5'
      }`}
    >
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-amber-400 overflow-hidden text-slate-800 shadow-amber-500/20">
        {/* Top Header Strip */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 px-4 py-2.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
              <BellRing className="w-3.5 h-3.5 animate-bounce text-white" />
            </div>
            <span className="text-xs font-black tracking-wide uppercase">
              {activeReminder.isTest
                ? 'Uji Notifikasi Clock-In'
                : 'Pengingat Absen Masuk'}
            </span>
          </div>

          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup Notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
              <Clock className="w-5 h-5 text-amber-700" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                Waktunya Absen Masuk, {activeReminder.userName}!
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                Jam kerja <span className="font-semibold text-slate-800">{activeReminder.shiftName}</span> telah dimulai pukul{' '}
                <span className="font-mono font-bold text-amber-700">{activeReminder.startTime} WIB</span>. Anda belum melakukan Clock In hari ini.
              </p>
            </div>
          </div>

          <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200/80 text-[10px] text-amber-900 flex items-center gap-1.5 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>Lakukan absensi foto selfie sekarang agar terhindar dari catatan keterlambatan.</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleGoClockIn}
              className="flex-1 py-2.5 px-3 bg-[#1D63FF] hover:bg-blue-600 active:scale-95 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Absen Sekarang</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>

            <button
              onClick={handleDismiss}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Nanti Saja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
