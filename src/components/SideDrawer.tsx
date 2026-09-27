import React from 'react';
import {
  X,
  Download,
  Car,
  Target,
  Users,
  Sliders,
  HelpCircle,
  Shield,
  ChevronRight,
  ArrowRight,
  Moon,
  Sun,
} from 'lucide-react';
import { ScreenType } from '../types';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: ScreenType) => void;
  currentTheme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  currentTheme = 'light',
  onToggleTheme,
}) => {
  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-xs z-50 transition-opacity duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 bottom-0 w-[300px] max-w-[85vw] bg-white dark:bg-[#1e2226] z-55 transform transition-transform duration-250 ease-out flex flex-col pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] px-6 shadow-2xl ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-5 border-b border-slate-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 rounded bg-[#d8ff35] text-black font-mono-plate font-black text-xs flex items-center justify-center border border-black shadow-xs">
              TR
            </div>
            <span className="font-extrabold text-xl text-[#111315] dark:text-white">
              Plakala
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu list */}
        <div className="flex flex-col gap-2.5 mt-6">
          <button
            onClick={() => {
              onNavigate('install');
              onClose();
            }}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#d8ff35] text-black font-bold text-sm shadow-sm hover:brightness-105 active:scale-[0.98] transition-all"
          >
            <span className="flex items-center gap-3">
              <Download className="w-4 h-4" /> Uygulamayı İndir (PWA)
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              onNavigate('my-cars');
              onClose();
            }}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-[#111315] dark:text-white font-semibold text-sm hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <span className="flex items-center gap-3">
              <Car className="w-4 h-4 text-slate-600 dark:text-slate-300" /> Araçlarım & QR Cam Sticker
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => {
              onNavigate('mission');
              onClose();
            }}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-[#111315] dark:text-white font-semibold text-sm hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <span className="flex items-center gap-3">
              <Target className="w-4 h-4 text-slate-600 dark:text-slate-300" /> Misyonumuz
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => {
              onNavigate('about');
              onClose();
            }}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-[#111315] dark:text-white font-semibold text-sm hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <span className="flex items-center gap-3">
              <Users className="w-4 h-4 text-slate-600 dark:text-slate-300" /> Hakkımızda
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => {
              onNavigate('faq');
              onClose();
            }}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-[#111315] dark:text-white font-semibold text-sm hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <span className="flex items-center gap-3">
              <HelpCircle className="w-4 h-4 text-slate-600 dark:text-slate-300" /> Sıkça Sorulan Sorular
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => {
              onNavigate('info');
              onClose();
            }}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-[#111315] dark:text-white font-semibold text-sm hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <span className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-slate-600 dark:text-slate-300" /> Güvenlik & Gizlilik
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-auto pt-6 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
          Kornaya gerek yok. · Kinetic Mobility UI v2.0
        </div>
      </aside>
    </>
  );
};
