import React from 'react';
import { Search, ArrowRight, Lock, ShieldCheck, Car, ExternalLink, Sparkles } from 'lucide-react';
import { KineticRouteBox } from '../components/KineticRouteBox';
import { PlateInput } from '../components/PlateInput';
import { PlateSegments, ScreenType } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface WelcomeScreenProps {
  plateInput: PlateSegments;
  onPlateChange: (val: PlateSegments) => void;
  onSearchPlate: () => void;
  onNavigate: (screen: ScreenType) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  plateInput,
  onPlateChange,
  onSearchPlate,
  onNavigate,
}) => {
  return (
    <section className="flex-1 flex flex-col pt-3 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] px-5">
      {/* Kinetic Route Animation */}
      <KineticRouteBox />

      {/* Hero Title directly removed as per user request */}
      <div className="mt-1">
      </div>

      {/* 3-Segment Turkish License Plate Input */}
      <PlateInput
        value={plateInput}
        onChange={onPlateChange}
        onSubmit={onSearchPlate}
      />

      {/* Anonim İletişim Badge directly below Plate Input */}
      <div className="mt-2.5 mb-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d8ff35]/25 text-[#3e4c00] dark:text-[#d8ff35] text-xs font-extrabold tracking-wide uppercase select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#536500] dark:bg-[#d8ff35] animate-pulse" />
          Anonim İletişim
        </span>
      </div>

      {/* Trust Badges */}
      <div className="flex flex-wrap gap-2 mb-4 select-none">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-700 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-2xs">
          <Lock className="w-3.5 h-3.5 text-[#536500] dark:text-[#d8ff35]" />
          <span>%100 Anonim</span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-700 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[#536500] dark:text-[#d8ff35]" />
          <span>Telefon numaran gizli kalır</span>
        </div>
      </div>

      {/* Live Counter */}
      <div className="flex items-center justify-center gap-2 mb-4 text-xs font-semibold text-slate-500 dark:text-zinc-400 select-none">
        <span className="w-2 h-2 rounded-full bg-[#d8ff35] animate-ping" />
        Bugün Türkiye genelinde{' '}
        <strong className="text-[#111315] dark:text-white font-bold">
          512 araç
        </strong>{' '}
        sahibine ulaşıldı
      </div>

      {/* VEYA Divider */}
      <div className="flex items-center gap-4 my-2">
        <div className="flex-1 h-px bg-slate-200 dark:bg-zinc-800" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 select-none">
          VEYA
        </span>
        <div className="flex-1 h-px bg-slate-200 dark:bg-zinc-800" />
      </div>

      {/* Aracımı Kaydetmek İstiyorum Card */}
      <div
        onClick={() => onNavigate('add-car')}
        className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 hover:border-[#111315] dark:hover:border-[#d8ff35] rounded-3xl p-5 cursor-pointer shadow-xs active:scale-[0.99] transition-all mb-3"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#111315] text-[#d8ff35] flex items-center justify-center text-xl shadow-md shrink-0">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#111315] dark:text-white leading-snug">
                Aracımı Eklemek İstiyorum
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Biri beni beklerse anında bildirim gelsin.
              </p>
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-2 text-xs font-bold text-[#536500] dark:text-[#d8ff35]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Üyelik veya telefon numarası gerekmez</span>
        </div>
      </div>

      {/* Ana Sayfa Canlı Akış Link */}
      <div
        onClick={() => onNavigate('home')}
        className="text-center py-2 cursor-pointer text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-[#111315] dark:hover:text-white transition-colors"
      >
        Son Bildirimleri ve Paneli Görüntüle →
      </div>

      {/* Fixed Sticky Action Bar - Plakayı Ara & Bildir */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] bg-gradient-to-t from-[#f7f9fc] via-[#f7f9fc]/95 to-transparent dark:from-[#14171a] dark:via-[#14171a]/95 backdrop-blur-md z-40 border-t border-slate-200/50 dark:border-zinc-800/50">
        <button
          onClick={() => {
            triggerHaptic('medium');
            onSearchPlate();
          }}
          className="w-full h-14 bg-[#d8ff35] hover:bg-[#c9f518] text-[#111315] font-extrabold text-base rounded-full flex items-center justify-between pl-6 pr-2 shadow-[0_8px_25px_-4px_rgba(216,255,53,0.6)] active:scale-[0.98] transition-all cursor-pointer group"
        >
          <span className="flex items-center gap-3">
            <Search className="w-5 h-5" />
            Plakayı Ara & Bildir
          </span>
          <div className="w-10 h-10 rounded-full bg-[#111315] text-white flex items-center justify-center transition-transform group-hover:rotate-45">
            <ArrowRight className="w-5 h-5 text-white" />
          </div>
        </button>
      </div>
    </section>
  );
};
