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
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 text-xs font-bold border border-emerald-500/20 transition-all text-left group cursor-pointer"
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <Download className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="leading-tight">Pasang Aplikasi</div>
            <span className="text-[10px] text-emerald-600 font-medium">Aplikasi PWA Mandiri</span>
          </div>
        </button>
      );
    }

    return (
      <button
        onClick={install}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
        title="Pasang aplikasi AT-HR ke perangkat (PWA)"
      >
        <Download className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Pasang Aplikasi</span>
      </button>
    );
  }

  // 2. iOS Safari or other browsers without native beforeinstallprompt
  return (
    <>
      {variant === 'sidebar' ? (
        <button
          onClick={() => setShowGuide(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all text-left cursor-pointer"
        >
          <div className="w-6 h-6 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0">
            <Smartphone className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="leading-tight">Pasang di HP</div>
            <span className="text-[10px] text-slate-500 font-medium">Panduan iOS / Web</span>
          </div>
        </button>
      ) : (
        <button
          onClick={() => setShowGuide(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold border border-white/15 transition-all cursor-pointer"
          title="Panduan Pasang Aplikasi di Layar Utama HP"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-300" />
          <span className="hidden sm:inline">Pasang di HP</span>
        </button>
      )}

      {/* iOS / Manual PWA Installation Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Pasang Aplikasi di Layar HP</h3>
                  <span className="text-[10px] text-slate-400">Akses Cepat Standalone PWA</span>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {isIOS ? (
                <>
                  <p className="text-slate-600 leading-relaxed">
                    Untuk pengguna <b>iPhone / iPad (Safari)</b>, pasang aplikasi ke Layar Utama dengan langkah berikut:
                  </p>
                  <ol className="space-y-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-slate-700 font-medium">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                      <span>Ketuk tombol <b>Bagikan (Share)</b> <Share className="w-3.5 h-3.5 inline mx-1 text-blue-600" /> di bilah bawah browser Safari.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                      <span>Gulir ke bawah dan pilih <b>Tambahkan ke Layar Utama</b> (<i>Add to Home Screen</i>).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
                      <span>Ketuk <b>Tambah</b> di pojok kanan atas. Ikon aplikasi akan langsung muncul di layar ponsel Anda!</span>
                    </li>
                  </ol>
                </>
              ) : (
                <>
                  <p className="text-slate-600 leading-relaxed">
                    Untuk browser Android atau Desktop yang belum memunculkan tombol otomatis:
                  </p>
                  <ol className="space-y-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-slate-700 font-medium">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                      <span>Buka menu browser Anda (tiga titik di pojok kanan atas).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                      <span>Pilih opsi <b>Instal Aplikasi</b> atau <b>Tambahkan ke Layar Utama</b>.</span>
                    </li>
                  </ol>
                </>
              )}
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Mengerti & Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
};
