import React from 'react';
import { ArrowLeft, Check, AlertOctagon, ShieldCheck, Clock } from 'lucide-react';
import { ScreenType } from '../types';

interface InfoScreenProps {
  onNavigate: (screen: ScreenType) => void;
}

export const InfoScreen: React.FC<InfoScreenProps> = ({ onNavigate }) => {
  return (
    <section className="flex-1 flex flex-col pt-3 pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] px-5">
      <div className="mb-2">
        <button
          onClick={() => onNavigate('home')}
          className="text-xs font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-2 hover:text-[#111315] dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
        </button>
      </div>

      <h2 className="text-3xl font-extrabold tracking-tight text-[#111315] dark:text-white">
        Önemli<br />Bilgilendirme
      </h2>
      <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4 font-normal">
        Kullanım esasları ve güvenlik taahhüdümüz.
      </p>

      {/* 1. Privacy Guarantee */}
      <div className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 border-l-4 border-l-[#d8ff35] rounded-2xl p-4 mb-3 shadow-xs">
        <div className="flex items-center gap-2 font-extrabold text-sm text-[#111315] dark:text-white mb-1">
          <ShieldCheck className="w-4 h-4 text-[#536500] dark:text-[#d8ff35]" />
          Gizlilik ve Sıfır Bilgi Prensibi
        </div>
        <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-normal">
          Kullanıcıların kimlik, telefon veya konum bilgileri asla üçüncü şahıslara veya diğer araç sahiplerine iletilmez. İletişim rastgele şifreli odalarla sağlanır.
        </p>
      </div>

      {/* 2. 24h Purge */}
      <div className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 border-l-4 border-l-[#d8ff35] rounded-2xl p-4 mb-3 shadow-xs">
        <div className="flex items-center gap-2 font-extrabold text-sm text-[#111315] dark:text-white mb-1">
          <Clock className="w-4 h-4 text-[#536500] dark:text-[#d8ff35]" />
          24 Saatte Otomatik Temizlik
        </div>
        <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-normal">
          Tüm bildirimler, açılan sohbet odaları ve iletilen mesajlar 24 saat içinde sistemden otomatik ve kalıcı olarak temizlenir.
        </p>
      </div>

      {/* 3. 112 Emergency disclaimer */}
      <div className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 border-l-4 border-l-red-500 rounded-2xl p-4 mb-5 shadow-xs">
        <div className="flex items-center gap-2 font-extrabold text-sm text-red-600 dark:text-red-400 mb-1">
          <AlertOctagon className="w-4 h-4 text-red-500" />
          Resmi Kurum Değildir — Acil Durum 112
        </div>
        <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-normal">
          Plakala bir kolluk kuvveti, trafik zabıtası veya resmi kurum değildir. Kaza, yangın, ambulans engeli gibi can güvenliğini ilgilendiren hallerde derhal <strong>112 Acil Çağrı Merkezini</strong> arayınız.
        </p>
      </div>

      <button
        onClick={() => onNavigate('home')}
        className="w-full h-13 bg-[#111315] dark:bg-white text-white dark:text-[#111315] font-extrabold text-xs rounded-full flex items-center justify-between pl-6 pr-1.5 shadow-md active:scale-[0.98] transition-all cursor-pointer group"
      >
        <span>Anladım, Devam Et</span>
        <div className="w-10 h-10 rounded-full bg-[#d8ff35] text-black flex items-center justify-center font-bold">
          <Check className="w-4 h-4" />
        </div>
      </button>
    </section>
  );
};
