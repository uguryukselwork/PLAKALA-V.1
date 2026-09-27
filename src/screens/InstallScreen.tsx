import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, ArrowRight, Apple, Smartphone, Info, Download, CheckCircle, ShieldCheck } from 'lucide-react';
import { ScreenType } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface InstallScreenProps {
  onNavigate: (screen: ScreenType) => void;
  onRequestNotificationPermission: () => void;
}

export const InstallScreen: React.FC<InstallScreenProps> = ({
  onNavigate,
  onRequestNotificationPermission,
}) => {
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detect if running as standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOSDevice) {
      setPlatform('ios');
    } else {
      setPlatform('android');
    }

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleTriggerInstall = async () => {
    triggerHaptic('success');
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      onRequestNotificationPermission();
    }
  };

  return (
    <section className="flex-1 flex flex-col pt-3 pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] px-5">
      <div className="mb-2">
        <button
          onClick={() => onNavigate('home')}
          className="text-xs font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-2 hover:text-[#111315] dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Geri
        </button>
      </div>

      {/* Official App Logo & Identity Card */}
      <div className="bg-[#111315] text-white rounded-3xl p-5 mb-4 shadow-md border border-white/10 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="font-mono font-black text-xs uppercase text-[#d8ff35] tracking-wider">
              Resmi Uygulama
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-[#d8ff35]" />
          </div>
          <p className="text-xs text-zinc-300 font-medium leading-snug">
            Kornaya Gerek Yok • Anonim İletişim
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-center gap-1">
          <div className="w-16 h-16 rounded-[18px] overflow-hidden bg-black border border-white/20 shadow-lg flex items-center justify-center">
            <img src="/apple-touch-icon.png" alt="Ana Ekran Logosu" className="w-full h-full object-cover" />
          </div>
          <span className="text-[9px] font-bold text-zinc-400 tracking-wider uppercase">Ana Ekran İkonu</span>
        </div>
      </div>

      <h2 className="text-2xl font-extrabold tracking-tight text-[#111315] dark:text-white mb-1">
        {isInstalled ? 'Uygulama Yüklü' : 'Ana Ekrana Ekle'}
      </h2>
      <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4 font-normal">
        {isInstalled
          ? 'Plakala cihazınızda yüklü. Bildirimleriniz anında kilit ekranında gösterilecektir.'
          : 'Uygulama logosuyla ana ekranınızdan tek dokunuşla açıp anlık push bildirimleri alın.'}
      </p>

      {/* Direct Install Button if available (Android/Chrome/Edge) */}
      {deferredPrompt && (
        <button
          onClick={handleTriggerInstall}
          className="w-full h-14 bg-[#d8ff35] hover:bg-[#c9f518] text-[#111315] font-extrabold text-sm rounded-full flex items-center justify-between pl-6 pr-2 shadow-lg shadow-[#d8ff35]/20 active:scale-[0.98] transition-all cursor-pointer mb-4"
        >
          <span className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Şimdi Uygulamayı Yükle
          </span>
          <div className="w-10 h-10 rounded-full bg-[#111315] text-white flex items-center justify-center">
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      )}

      {/* Platform Segmented Switch */}
      <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-zinc-800 rounded-2xl mb-4 select-none">
        <button
          onClick={() => {
            triggerHaptic('selection');
            setPlatform('ios');
          }}
          className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            platform === 'ios'
              ? 'bg-[#d8ff35] text-black shadow-xs'
              : 'text-slate-500 dark:text-zinc-400 hover:text-[#111315]'
          }`}
        >
          <Apple className="w-4 h-4 fill-current" /> iPhone (iOS)
        </button>
        <button
          onClick={() => {
            triggerHaptic('selection');
            setPlatform('android');
          }}
          className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            platform === 'android'
              ? 'bg-[#d8ff35] text-black shadow-xs'
              : 'text-slate-500 dark:text-zinc-400 hover:text-[#111315]'
          }`}
        >
          <Smartphone className="w-4 h-4" /> Android
        </button>
      </div>

      {/* Step Guide */}
      {platform === 'ios' ? (
        <div className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs animate-fadeIn">
          <div className="space-y-3.5 text-xs text-[#111315] dark:text-slate-200 font-medium">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#111315] text-[#d8ff35] flex items-center justify-center font-bold text-[11px] shrink-0 select-none">
                1
              </div>
              <span>Safari tarayıcısında alt bardaki <strong>Paylaş</strong> simgesine dokunun.</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#111315] text-[#d8ff35] flex items-center justify-center font-bold text-[11px] shrink-0 select-none">
                2
              </div>
              <span>Aşağı kaydırıp <strong>"Ana Ekrana Ekle"</strong> seçeneğini seçin.</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#111315] text-[#d8ff35] flex items-center justify-center font-bold text-[11px] shrink-0 select-none">
                3
              </div>
              <span>Ana ekranda oluşan <strong>Plakala</strong> uygulama ikonuna tıklayarak açın.</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#111315] text-[#d8ff35] flex items-center justify-center font-bold text-[11px] shrink-0 select-none">
                4
              </div>
              <span>Gelen bildirim kutusunda <strong>"İzin Ver"</strong> seçeneğini onaylayın.</span>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-semibold flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-amber-600" />
            <span>iOS 16.4+ Web Push desteği yalnızca Ana Ekrana eklenen PWA uygulamalarında çalışır.</span>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs animate-fadeIn">
          <div className="space-y-3.5 text-xs text-[#111315] dark:text-slate-200 font-medium">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#111315] text-[#d8ff35] flex items-center justify-center font-bold text-[11px] shrink-0 select-none">
                1
              </div>
              <span>Chrome sağ üst köşedeki üç nokta <strong>(⋮)</strong> menüsüne dokunun.</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#111315] text-[#d8ff35] flex items-center justify-center font-bold text-[11px] shrink-0 select-none">
                2
              </div>
              <span><strong>"Uygulamayı Yükle"</strong> veya <strong>"Ana Ekrana Ekle"</strong> butonuna basın.</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#111315] text-[#d8ff35] flex items-center justify-center font-bold text-[11px] shrink-0 select-none">
                3
              </div>
              <span>Yüklemeyi onaylayarak uygulama çekmecesinden veya ana ekrandan açın.</span>
            </div>
          </div>
        </div>
      )}

      {/* Permission test button */}
      <button
        onClick={onRequestNotificationPermission}
        className="w-full h-14 bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 hover:border-[#111315] dark:hover:border-[#d8ff35] text-[#111315] dark:text-white font-extrabold text-sm rounded-full flex items-center justify-between pl-6 pr-2 shadow-xs active:scale-[0.98] transition-all cursor-pointer group mt-4"
      >
        <span className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#536500] dark:text-[#d8ff35]" />
          Bildirim İznini Etkinleştir & Test Et
        </span>
        <div className="w-10 h-10 rounded-full bg-[#111315] dark:bg-white text-white dark:text-black flex items-center justify-center transition-transform group-hover:rotate-45">
          <ArrowRight className="w-4 h-4" />
        </div>
      </button>
    </section>
  );
};
