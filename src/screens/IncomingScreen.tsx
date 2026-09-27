import React from 'react';
import { AlertTriangle, Ban, MessageSquare, ArrowRight } from 'lucide-react';
import { ScreenType } from '../types';

interface IncomingScreenProps {
  plate: string;
  reason: string;
  note?: string;
  onSendEta: (mins: number) => void;
  onReject: () => void;
  onOpenChat: () => void;
  onNavigate: (screen: ScreenType) => void;
}

export const IncomingScreen: React.FC<IncomingScreenProps> = ({
  plate,
  reason,
  note = 'Beyaz aracın arkasındayım, acil çıkmam gerekiyor.',
  onSendEta,
  onReject,
  onOpenChat,
}) => {
  return (
    <section className="flex-1 flex flex-col pt-3 pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] px-5">
      {/* Alert Card */}
      <div className="bg-[#111315] text-white rounded-3xl p-6 text-center shadow-lg border border-white/10 animate-fadeIn">
        <div className="w-14 h-14 rounded-full bg-[#d8ff35] text-black flex items-center justify-center text-2xl mx-auto mb-3 shadow-[0_0_20px_rgba(216,255,53,0.5)]">
          <AlertTriangle className="w-7 h-7 text-black stroke-[2.5]" />
        </div>

        <span className="text-xs uppercase font-extrabold text-[#d8ff35] tracking-widest select-none">
          Acil Çağrı
        </span>

        <h2 className="text-2xl font-black mt-1 tracking-tight">
          Aracın İçin Bildirim Var!
        </h2>

        <div className="font-mono-plate text-xl font-bold bg-white/10 text-[#d8ff35] inline-block px-4 py-1 rounded-full mt-3">
          {plate}
        </div>

        <div className="text-sm font-semibold text-zinc-300 mt-3">
          Sebep: <strong className="text-white">{reason}</strong>
        </div>

        {note && (
          <p className="text-xs text-zinc-400 mt-1 italic">
            "{note}"
          </p>
        )}
      </div>

      {/* ETA Selection Grid */}
      <div className="my-6">
        <div className="text-center font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3 select-none">
          Ne zaman gelebilirsin?
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => onSendEta(2)}
            className="h-20 rounded-2xl bg-white dark:bg-[#1e2226] border-2 border-slate-200 dark:border-zinc-700 hover:border-[#111315] dark:hover:border-[#d8ff35] flex flex-col items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer group"
          >
            <span className="font-mono-plate text-2xl font-black text-[#111315] dark:text-white group-hover:text-black dark:group-hover:text-[#d8ff35]">
              2 DK
            </span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">
              Geliyorum
            </span>
          </button>

          <button
            onClick={() => onSendEta(5)}
            className="h-20 rounded-2xl bg-white dark:bg-[#1e2226] border-2 border-slate-200 dark:border-zinc-700 hover:border-[#111315] dark:hover:border-[#d8ff35] flex flex-col items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer group"
          >
            <span className="font-mono-plate text-2xl font-black text-[#111315] dark:text-white group-hover:text-black dark:group-hover:text-[#d8ff35]">
              5 DK
            </span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">
              Hemen
            </span>
          </button>

          <button
            onClick={() => onSendEta(10)}
            className="h-20 rounded-2xl bg-white dark:bg-[#1e2226] border-2 border-slate-200 dark:border-zinc-700 hover:border-[#111315] dark:hover:border-[#d8ff35] flex flex-col items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer group"
          >
            <span className="font-mono-plate text-2xl font-black text-[#111315] dark:text-white group-hover:text-black dark:group-hover:text-[#d8ff35]">
              10 DK
            </span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">
              Birazdan
            </span>
          </button>
        </div>
      </div>

      <button
        onClick={onReject}
        className="w-full py-3 rounded-2xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-[#111315] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
      >
        <Ban className="w-4 h-4 inline mr-1.5" /> Araç Benim Değil / Yanlış Plaka
      </button>

      <div className="mt-auto pt-5">
        <button
          onClick={onOpenChat}
          className="w-full h-14 bg-[#d8ff35] hover:bg-[#c9f518] text-[#111315] font-extrabold text-sm rounded-full flex items-center justify-between pl-6 pr-2 shadow-md active:scale-[0.98] transition-all cursor-pointer group"
        >
          <span className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Odaya Gir (Anonim Sohbet)
          </span>
          <div className="w-10 h-10 rounded-full bg-[#111315] text-white flex items-center justify-center transition-transform group-hover:rotate-45">
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      </div>
    </section>
  );
};
