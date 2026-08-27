import React, { useState, useEffect } from 'react';
import { Download, Chrome, Smartphone, Monitor, X, CheckCircle2, Share2, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaInstallPromptProps {
  onInstalled?: () => void;
}

export const PwaInstallPrompt: React.FC<PwaInstallPromptProps> = ({ onInstalled }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if already installed in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      
      // Check if user dismissed banner previously
      const dismissed = localStorage.getItem('pwa_banner_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowBanner(false);
      if (onInstalled) onInstalled();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onInstalled]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // If deferredPrompt is not available (e.g. iOS or manual install needed), show clear guide
      setShowGuideModal(true);
    }
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Floating / Top Banner for One-Click Chrome Download */}
      {showBanner && (
        <div id="pwa-install-banner" className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-emerald-500/40 text-white px-4 py-2.5 shadow-xl animate-fade-in relative z-30">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <img 
                src="/app-icon.jpg" 
                alt="Logo Bel Syuriyah" 
                className="w-9 h-9 rounded-xl border border-amber-400/50 shadow-md object-cover shrink-0" 
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-white">Pasang Aplikasi ke Chrome / Laptop</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-400 text-slate-950 uppercase">PWA</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Jalankan aplikasi bel mandiri di desktop tanpa perlu membuka tab browser setiap hari.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                id="btn-install-pwa-banner"
                type="button"
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-md transition-all active:scale-95 whitespace-nowrap"
              >
                <Download className="w-4 h-4 text-slate-950" />
                <span>Unduh / Pasang Sekarang</span>
              </button>

              <button
                type="button"
                onClick={handleDismissBanner}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Tutup banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chrome Install Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <img src="/app-icon.jpg" alt="Icon" className="w-10 h-10 rounded-xl border border-amber-400/60 shadow" />
                <div>
                  <h3 className="text-base font-bold text-white">Unduh di Google Chrome</h3>
                  <p className="text-xs text-slate-400">Panduan Pemasangan Aplikasi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-200">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
                <Monitor className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Di Google Chrome (Komputer / Laptop):</p>
                  <p className="text-slate-300 mt-1">
                    1. Lihat di bilah alamat URL atas sebelah kanan icon bookmark (★).<br />
                    2. Klik icon <strong>"Install / Pasang Aplikasi"</strong> (<Download className="w-3 h-3 inline text-amber-400" />).<br />
                    3. Klik <strong>"Install"</strong>. Aplikasi akan muncul di desktop dan start menu.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Di Google Chrome (Android / HP):</p>
                  <p className="text-slate-300 mt-1">
                    1. Ketuk tombol menu titik tiga (⋮) di pojok kanan atas.<br />
                    2. Pilih <strong>"Pasang aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.<br />
                    3. Aplikasi akan terpasang di beranda HP Anda seperti aplikasi bawaan.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Mengerti, Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
