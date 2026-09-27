import React, { useState } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { ScreenType } from '../types';

interface FaqScreenProps {
  onNavigate: (screen: ScreenType) => void;
}

const FAQ_ITEMS = [
  {
    q: 'Plakala nasıl çalışır?',
    a: 'Önünüzü kapatan veya ışığı açık kalan aracın plakasını yazıp tek tıkla sebep seçersiniz. Araç sahibi sistemde kayıtlıysa telefonuna anında push bildirim düşer ve 2 dk / 5 dk seçenekleriyle cevap verebilir.',
  },
  {
    q: 'Telefon numaram karşı tarafa görünür mü?',
    a: 'Kesinlikle hayır! Plakala\'da üyelik, ad, soyad ve telefon kaydı zorunluluğu yoktur. İletişim rastgele üretilen tek seferlik şifreli oda kodları üzerinden tamamen anonim yürütülür.',
  },
  {
    q: 'Araç sahibi henüz Plakala kullanmıyorsa ne olur?',
    a: 'Gönderdiğiniz bildirim 24 saat boyunca askıda bekletilir. Araç sahibi uygulamayı açtığı veya plakasını eklediği anda bildirimi hemen teslim alır. Ayrıca aracının camındaki QR kodu okutan herkes anında iletişime geçebilir.',
  },
  {
    q: 'Park konumu nerede saklanır?',
    a: 'Park konumunuz ve notlarınız hiçbir sunucuya iletilmez. Yalnızca telefonunuzun yerel tarayıcı belleğinde (LocalStorage) tutulur ve yalnızca siz görebilirsiniz.',
  },
  {
    q: 'Kötü niyetli bildirimlere karşı nasıl korunurum?',
    a: 'Plakala\'da her kullanıcı için günlük bildirim kotası ve spam koruma algoritmaları bulunur. Ayrıca istenmeyen bir sohbet odasını tek tıkla engelleyebilirsiniz.',
  },
];

export const FaqScreen: React.FC<FaqScreenProps> = ({ onNavigate }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

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
        Sıkça Sorulan<br />Sorular
      </h2>
      <p className="text-xs text-slate-500 dark:text-zinc-400 mb-5 font-normal">
        Plakala hakkında merak ettiğiniz tüm detaylar.
      </p>

      <div className="space-y-2.5">
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`bg-white dark:bg-[#1e2226] border rounded-2xl transition-all duration-200 overflow-hidden shadow-2xs ${
                isOpen
                  ? 'border-[#111315] dark:border-[#d8ff35]'
                  : 'border-slate-200 dark:border-zinc-800'
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full p-4.5 text-left font-bold text-sm text-[#111315] dark:text-white flex justify-between items-center cursor-pointer select-none"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
                    isOpen ? 'rotate-180 text-[#111315] dark:text-[#d8ff35]' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-4.5 pb-4.5 text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-normal border-t border-slate-100 dark:border-zinc-800 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
