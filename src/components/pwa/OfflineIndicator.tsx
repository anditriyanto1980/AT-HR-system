import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-18 lg:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-700/80 px-3.5 py-2 text-xs font-semibold text-white shadow-xl backdrop-blur-md animate-bounce">
      <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>Mode Offline Aktif — Menggunakan data cache lokal.</span>
    </div>
  );
};
