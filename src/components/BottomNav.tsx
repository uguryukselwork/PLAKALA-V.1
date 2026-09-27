import React from 'react';
import { Search, MapPin, Car, User } from 'lucide-react';
import { ScreenType } from '../types';

interface BottomNavProps {
  activeScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  hasCarSignal?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeScreen,
  onNavigate,
  hasCarSignal = false,
}) => {
  // Dedicated screens have their own fixed action buttons docked at the bottom
  // ('Plakayı Ara & Bildir', 'Bildirimi Gönder', 'Odaya Gir & Yazış (Anonim)', chat input)
  if (
    activeScreen === 'chat' ||
    activeScreen === 'welcome' ||
    activeScreen === 'reason' ||
    activeScreen === 'status'
  ) {
    return null;
  }

  const isPlakaActive = activeScreen === 'home' || activeScreen === 'incoming';
  const isParkActive = activeScreen === 'park';
  const isCarsActive = activeScreen === 'my-cars' || activeScreen === 'add-car';
  const isProfileActive =
    activeScreen === 'profile' ||
    activeScreen === 'settings' ||
    activeScreen === 'faq' ||
    activeScreen === 'info' ||
    activeScreen === 'install';

  return (
    <nav
      aria-label="Alt Navigasyon"
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[408px] h-[68px] bg-[#111315]/95 dark:bg-[#181c22]/95 backdrop-blur-xl rounded-full flex items-center justify-around p-1.5 shadow-[0_16px_36px_-8px_rgba(0,0,0,0.35)] z-45 border border-white/10 dark:border-white/15 select-none"
    >
      {/* Tab: Plaka */}
      <button
        onClick={() => onNavigate('home')}
        className={`flex flex-col items-center justify-center flex-1 h-[52px] rounded-full transition-all duration-200 cursor-pointer ${
          isPlakaActive
            ? 'bg-[#d8ff35] text-[#111315] font-extrabold shadow-sm'
            : 'text-slate-400 hover:text-white font-semibold'
        }`}
      >
        <Search className="w-5 h-5 mb-0.5" />
        <span className="text-[11px] leading-tight">Plaka</span>
      </button>

      {/* Tab: Park */}
      <button
        onClick={() => onNavigate('park')}
        className={`flex flex-col items-center justify-center flex-1 h-[52px] rounded-full transition-all duration-200 cursor-pointer ${
          isParkActive
            ? 'bg-[#d8ff35] text-[#111315] font-extrabold shadow-sm'
            : 'text-slate-400 hover:text-white font-semibold'
        }`}
      >
        <MapPin className="w-5 h-5 mb-0.5" />
        <span className="text-[11px] leading-tight">Park</span>
      </button>

      {/* Tab: Araçlarım */}
      <button
        onClick={() => onNavigate('my-cars')}
        className={`flex flex-col items-center justify-center flex-1 h-[52px] rounded-full transition-all duration-200 cursor-pointer relative ${
          isCarsActive
            ? 'bg-[#d8ff35] text-[#111315] font-extrabold shadow-sm'
            : 'text-slate-400 hover:text-white font-semibold'
        }`}
      >
        <div className="relative">
          <Car className="w-5 h-5 mb-0.5" />
          {hasCarSignal && (
            <span className="absolute -top-1 -right-1.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-80"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-[#111315] shadow-[0_0_8px_rgba(239,68,68,1)]"></span>
            </span>
          )}
        </div>
        <span className="text-[11px] leading-tight">Araçlarım</span>
      </button>

      {/* Tab: Profil */}
      <button
        onClick={() => onNavigate('profile')}
        className={`flex flex-col items-center justify-center flex-1 h-[52px] rounded-full transition-all duration-200 cursor-pointer ${
          isProfileActive
            ? 'bg-[#d8ff35] text-[#111315] font-extrabold shadow-sm'
            : 'text-slate-400 hover:text-white font-semibold'
        }`}
      >
        <User className="w-5 h-5 mb-0.5" />
        <span className="text-[11px] leading-tight">Profil</span>
      </button>
    </nav>
  );
};
