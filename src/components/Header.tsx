import React from 'react';
import { Moon, Sun, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScreenType } from '../types';

interface HeaderProps {
  currentTheme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenMenu: () => void;
  onNavigate: (screen: ScreenType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTheme,
  onToggleTheme,
  onOpenMenu,
  onNavigate,
}) => {
  const logoClicksRef = React.useRef<number>(0);
  const resetTimerRef = React.useRef<any>(null);

  const handleLogoClick = () => {
    logoClicksRef.current += 1;

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    if (logoClicksRef.current >= 10) {
      logoClicksRef.current = 0;
      const password = prompt('Yönetici şifresini girin:');
      if (password) {
        const clean = password.trim();
        if (clean === '4958') {
          onNavigate('admin');
          return;
        }
      }
      if (password !== null) {
        alert('Hatalı şifre.');
      }
      return;
    }

    // Normal navigation on first click
    if (logoClicksRef.current === 1) {
      onNavigate('welcome');
    }

    // Reset click counter after 3.5 seconds of inactivity
    resetTimerRef.current = setTimeout(() => {
      logoClicksRef.current = 0;
    }, 3500);
  };

  return (
    <header className="pt-[env(safe-area-inset-top,0px)] h-[calc(4.25rem+env(safe-area-inset-top,0px))] px-5 flex items-center justify-between border-b border-slate-200/80 dark:border-zinc-800/80 sticky top-0 bg-[#f7f9fc]/95 dark:bg-[#16191e]/95 backdrop-blur-md z-40 shrink-0 shadow-2xs">
      <div
        className="flex items-center gap-3 cursor-pointer select-none"
        onClick={handleLogoClick}
      >
        {/* Kinetic Pill Badge */}
        <div className="w-10 h-7 rounded-lg bg-[#d8ff35] flex items-center justify-center font-mono-plate font-extrabold text-xs text-black border border-black shadow-[2px_2px_0px_#111315]">
          TR
        </div>
        <div>
          <span className="font-extrabold text-2xl tracking-tight text-[#111315] dark:text-white">
            Plakala
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Animated Dark / Light mode switch */}
        <button
          onClick={onToggleTheme}
          aria-label={currentTheme === 'dark' ? 'Gündüz Moduna Geç' : 'Gece Moduna Geç'}
          title={currentTheme === 'dark' ? 'Gündüz Moduna Geç' : 'Gece Moduna Geç'}
          className="relative w-10 h-10 rounded-full bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-[#111315] dark:text-white transition-all active:scale-95 shadow-xs hover:border-[#111315] dark:hover:border-[#d8ff35] overflow-hidden group cursor-pointer"
        >
          {/* Gentle expansion ripple on toggle */}
          <AnimatePresence>
            <motion.span
              key={`ripple-${currentTheme}`}
              initial={{ scale: 0.6, opacity: 0.5 }}
              animate={{ scale: 1.6, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className={`absolute inset-0 rounded-full pointer-events-none ${
                currentTheme === 'dark' ? 'bg-[#d8ff35]/30' : 'bg-amber-400/25'
              }`}
            />
          </AnimatePresence>

          {/* Animated Icon Rotation and Scale */}
          <AnimatePresence mode="wait" initial={false}>
            {currentTheme === 'dark' ? (
              <motion.div
                key="dark-sun"
                initial={{ rotate: -90, scale: 0.2, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: 90, scale: 0.2, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                className="flex items-center justify-center"
              >
                <Sun className="w-4 h-4 text-[#d8ff35] drop-shadow-[0_0_8px_rgba(216,255,53,0.7)]" />
              </motion.div>
            ) : (
              <motion.div
                key="light-moon"
                initial={{ rotate: 90, scale: 0.2, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: -90, scale: 0.2, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                className="flex items-center justify-center"
              >
                <Moon className="w-4 h-4 text-slate-700 transition-transform group-hover:-rotate-12" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Menu button */}
        <button
          onClick={onOpenMenu}
          aria-label="Menü"
          title="Menü"
          className="w-10 h-10 rounded-full bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-[#111315] dark:text-white transition-transform active:scale-95 shadow-xs hover:border-[#111315] dark:hover:border-[#d8ff35] cursor-pointer"
        >
          <Menu className="w-4 h-4 text-slate-700 dark:text-white" />
        </button>
      </div>
    </header>
  );
};
