import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Hand,
  ShieldAlert,
  Footprints,
  Lightbulb,
  AppWindow,
  BellOff,
  Car,
  Truck,
  Bell,
  ArrowRight,
  Fuel,
} from 'lucide-react';
import { ScreenType } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { getDailyContactsCount } from '../utils/dailyLimits';

interface ReasonScreenProps {
  targetPlate: string;
  onNavigate: (screen: ScreenType) => void;
  onSendNotification: (reason: string, note?: string) => void;
}

const REASONS = [
  { id: '1', title: 'Önümü kapattı', icon: Hand },
  { id: '2', title: 'Çıkışı kapattı', icon: ShieldAlert },
  { id: '3', title: 'Geçidi kapattı', icon: Footprints },
  { id: '4', title: 'Farlar açık', icon: Lightbulb },
  { id: '5', title: 'Camı açık', icon: AppWindow },
  { id: '6', title: 'Depo kapağı açık', icon: Fuel },
  { id: '7', title: 'Alarm çalıyor', icon: BellOff },
  { id: '8', title: 'Araca çarpıldı', icon: Car },
  { id: '9', title: 'Çekici geliyor', icon: Truck },
];

export const ReasonScreen: React.FC<ReasonScreenProps> = ({
  targetPlate,
  onNavigate,
  onSendNotification,
}) => {
  const [selectedReason, setSelectedReason] = useState('Geçidi kapattı');
  const [note, setNote] = useState('');

  const handleSend = () => {
    triggerHaptic('success');
    onSendNotification(selectedReason, note.trim() || undefined);
  };

  return (
    <section className="flex-1 flex flex-col pt-3 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] px-5">
      <div className="mb-2">
        <button
          onClick={() => onNavigate('home')}
          className="text-xs font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-2 hover:text-[#111315] dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Geri
        </button>
      </div>

      {/* Target plate banner */}
      <div className="flex items-center justify-between bg-[#111315] text-white rounded-2xl p-4 mb-3 shadow-sm border border-white/10">
        <div>
          <div className="text-[10px] uppercase font-bold text-zinc-400">
            Bildirilecek Araç
          </div>
          <div className="font-mono-plate text-2xl font-black text-[#d8ff35] tracking-wide mt-0.5">
            {targetPlate}
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-xs font-semibold text-slate-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#d8ff35]" />
          <span>Sistemde Kayıtlı</span>
        </div>
      </div>

      {/* Daily Quota Indicator */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60 text-xs font-semibold mb-3">
        <span className="text-slate-600 dark:text-zinc-300">Bugünkü İletişim Hakkı:</span>
        <span className="font-mono font-black text-[#111315] dark:text-[#d8ff35]">
          {getDailyContactsCount()}/3 Kişi (Maksimum 3)
        </span>
      </div>

      <h2 className="text-xl font-extrabold text-[#111315] dark:text-white tracking-tight">
        Neden haber veriyorsun?
      </h2>
      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-normal">
        Duruma uygun nedeni seçin; sahibine anında iletilsin.
      </p>

      {/* 2-Column Reason Grid */}
      <div className="grid grid-cols-2 gap-2.5 my-4">
        {REASONS.map((item) => {
          const Icon = item.icon;
          const isSelected = selectedReason === item.title;
          return (
            <div
              key={item.id}
              onClick={() => {
                triggerHaptic('selection');
                setSelectedReason(item.title);
              }}
              className={`rounded-2xl p-4 flex flex-col justify-between h-[100px] cursor-pointer transition-all duration-200 select-none ${
                isSelected
                  ? 'border-2 border-[#111315] dark:border-[#d8ff35] bg-[#111315] text-white shadow-md'
                  : 'bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 text-[#111315] dark:text-slate-200 hover:border-slate-400'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors ${
                  isSelected
                    ? 'bg-[#d8ff35] text-black'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs leading-tight">
                {item.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Short Note Input */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-500 dark:text-zinc-400 font-semibold mb-1.5">
          <span>İsteğe bağlı kısa not</span>
          <span>{note.length}/60</span>
        </div>
        <input
          type="text"
          maxLength={60}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Örn: Beyaz Megane arkasındayım..."
          className="w-full h-12 bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-700 rounded-2xl px-4 text-sm font-medium text-[#111315] dark:text-white outline-none focus:ring-2 focus:ring-[#111315] dark:focus:ring-[#d8ff35]"
        />
      </div>

      {/* Fixed Sticky Action Bar - Bildirimi Gönder */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] bg-gradient-to-t from-[#f7f9fc] via-[#f7f9fc]/95 to-transparent dark:from-[#14171a] dark:via-[#14171a]/95 backdrop-blur-md z-40 border-t border-slate-200/50 dark:border-zinc-800/50">
        <button
          onClick={handleSend}
          className="w-full h-14 bg-[#d8ff35] hover:bg-[#c9f518] text-[#111315] font-extrabold text-base rounded-full flex items-center justify-between pl-6 pr-2 shadow-[0_8px_25px_-4px_rgba(216,255,53,0.6)] active:scale-[0.98] transition-all cursor-pointer group"
        >
          <span className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 fill-current" />
            Bildirimi Gönder
          </span>
          <div className="w-10 h-10 rounded-full bg-[#111315] text-white flex items-center justify-center transition-transform group-hover:rotate-45">
            <ArrowRight className="w-5 h-5 text-white" />
          </div>
        </button>
      </div>
    </section>
  );
};
