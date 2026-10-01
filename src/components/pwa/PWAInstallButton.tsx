import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X, Check, Laptop } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // 1. Android / Chrome / Edge Native Prompt Available
  if (isInstallable) {
    if (variant === 'sidebar') {
      return (
        <button
          onClick={install}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 text-xs font-bold border border-emerald-500/20 transition-all text-left group"
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <Download className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="leading-tight">Install AT-HR</div>
            <span className="text-[10px] text-emerald-600 font-medium">Standalone PWA</span>
          </div>
        </button>
      );
    }

    return (
      <button
        onClick={install}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
        title="Pasang aplikasi AT-HR ke perangkat (PWA)"
      >
        <Download className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  // 2. iOS Safari or other browsers without native beforeinstallprompt
  return (
    <>
      {variant === 'sidebar' ? (
        <button
          onClick={() => setShowGuide(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all text-left"
        >
          <div className="w-6 h-6 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0">
            <Smartphone className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="leading-tight">Install PWA</div>
            <span className="text-[10px] text-slate-500 font-medium">Add to Homescreen</span>
          </div>
        </button>
      ) : (
        <button
          onClick={() => setShowGuide(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
          title="Panduan pasang aplikasi AT-HR ke Home Screen"
        >
          <Smartphone className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden sm:inline">Pasang PWA</span>
        </button>
      )}

      {/* Installation Guide Modal (iOS & Generic Desktop) */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  AT
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Install AT-HR PWA</h3>
                  <span className="text-[10px] text-slate-400 font-medium">Aplikasi Web Progresif</span>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">
                  Cara memasang di iPhone / iPad (Safari):
                </p>
                <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Tekan tombol <strong>Share</strong> (ikon kotak dengan panah atas <Share className="w-3.5 h-3.5 inline mx-0.5" />) di bilah bawah Safari.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Gulir ke bawah lalu pilih opsi <strong>Add to Home Screen</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-0.5" />).
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Tekan <strong>Add</strong> di pojok kanan atas. Aplikasi AT-HR siap dibuka layaknya native app!
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">
                  Cara memasang di Chrome / Android / Komputer:
                </p>
                <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <div className="flex items-start gap-2.5">
                    <Laptop className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                    <span>
                      Klik ikon <strong>Install App</strong> pada bilah URL browser atau menu titik tiga (⋮) $\rightarrow$ <strong>Install AT-HR</strong>.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Smartphone className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                    <span>
                      Di perangkat Android, pilih <strong>Tambahkan ke Layar Utama</strong> untuk akses cepat tanpa browser frame.
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGuide(false)}
              className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs"
            >
              Mengerti & Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
};
