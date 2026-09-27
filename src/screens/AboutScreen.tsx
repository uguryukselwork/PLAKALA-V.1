import React from 'react';
import { ArrowLeft, Users, Globe, Check } from 'lucide-react';
import { ScreenType } from '../types';

interface AboutScreenProps {
  onNavigate: (screen: ScreenType) => void;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({ onNavigate }) => {
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
        Hakkımızda
      </h2>
      <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6 font-normal">
        Plakala serüveni ve ekibimiz.
      </p>

      <div className="space-y-4">
        <div className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs">
          <div className="w-10 h-10 rounded-full bg-[#d8ff35]/20 text-[#536500] dark:text-[#d8ff35] flex items-center justify-center mb-3">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-[#111315] dark:text-white mb-2">Biz Kimiz?</h3>
          <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-normal">
            Plakala, şehir içi trafik ve park sorunlarına dijital çözümler üreten bağımsız bir teknoloji girişimidir. Günlük hayattaki küçük pürüzleri teknolojiyle gidermeyi seviyoruz.
          </p>
        </div>

        <div className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs">
          <div className="w-10 h-10 rounded-full bg-[#d8ff35]/20 text-[#536500] dark:text-[#d8ff35] flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-[#111315] dark:text-white mb-2">Ekibimiz</h3>
          <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-normal">
            Sürücü dostu, kullanıcı deneyimi odaklı ve güvenlikten ödün vermeyen bir ekip olarak, her geçen gün sistemi daha da iyileştirmek için çalışıyoruz.
          </p>
        </div>
      </div>

      <button
        onClick={() => onNavigate('home')}
        className="w-full h-13 bg-[#111315] dark:bg-white text-white dark:text-[#111315] font-extrabold text-xs rounded-full flex items-center justify-between pl-6 pr-1.5 shadow-md active:scale-[0.98] transition-all cursor-pointer group mt-auto"
      >
        <span>Kapat</span>
        <div className="w-10 h-10 rounded-full bg-[#d8ff35] text-black flex items-center justify-center font-bold">
          <Check className="w-4 h-4" />
        </div>
      </button>
    </section>
  );
};
