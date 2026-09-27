import React, { useState } from 'react';
import { Plus, Trash2, QrCode, Printer, ArrowRight, BellRing, MessageSquare, Clock, CheckCircle2 } from 'lucide-react';
import { QRCodeSvg } from '../components/QRCodeSvg';
import { Car, NotificationItem, ScreenType } from '../types';

interface MyCarsScreenProps {
  cars: Car[];
  onRemoveCar: (id: string) => void;
  onNavigate: (screen: ScreenType) => void;
  incomingNotifications?: NotificationItem[];
  onOpenNotification?: (item: NotificationItem) => void;
  onSendEta?: (mins: number, item: NotificationItem) => void;
}

export const MyCarsScreen: React.FC<MyCarsScreenProps> = ({
  cars,
  onRemoveCar,
  onNavigate,
  incomingNotifications = [],
  onOpenNotification,
  onSendEta,
}) => {
  const [printQty, setPrintQty] = useState('1');
  const activeCar = cars[0] || { plate: '34 ACM 148', code: 'TR-8821' };

  const handlePrint = () => {
    window.print();
  };

  return (
    <section className="flex-1 flex flex-col pt-3 pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] px-5">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#111315] dark:text-white">
            Araçlarım
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-normal">
            Bildirim alacağınız kayıtlı plakalarınız.
          </p>
        </div>
        <button
          onClick={() => onNavigate('add-car')}
          className="px-4 h-10 rounded-full bg-[#111315] dark:bg-white text-white dark:text-[#111315] text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" /> Ekle
        </button>
      </div>

      {/* Active Incoming Live Notification Banner if any */}
      {incomingNotifications && incomingNotifications.length > 0 && (
        <div className="flex flex-col gap-3 mb-5">
          {incomingNotifications.map((notif) => (
            <div
              key={notif.id}
              className="bg-linear-to-br from-amber-500/10 via-red-500/10 to-orange-500/10 dark:from-amber-950/40 dark:via-red-950/40 dark:to-orange-950/40 border-2 border-red-500/50 dark:border-red-500/60 rounded-3xl p-4.5 shadow-md animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-80"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1">
                    <BellRing className="w-3.5 h-3.5 animate-bounce" />
                    Canlı Araç Bildirimi
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                  ODA: {notif.roomCode}
                </span>
              </div>

              <div className="font-mono-plate text-xl font-black text-[#111315] dark:text-white mb-1">
                {notif.targetPlate}
              </div>

              <div className="text-xs font-bold text-slate-800 dark:text-zinc-200 bg-white/70 dark:bg-zinc-800/70 p-2.5 rounded-2xl border border-red-500/20 dark:border-red-500/30 mb-3 leading-relaxed">
                <span className="text-red-600 dark:text-red-400 font-extrabold mr-1">Sebep:</span>
                "{notif.reason}" {notif.note ? `— ${notif.note}` : ''}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                {onOpenNotification && (
                  <button
                    onClick={() => onOpenNotification(notif)}
                    className="w-full h-11 bg-[#111315] hover:bg-[#23272b] dark:bg-[#d8ff35] dark:hover:bg-[#c6f024] text-white dark:text-black rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Odaya Gir & Yazışmaya Başla</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {onSendEta && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold shrink-0">
                      Hızlı Yanıt:
                    </span>
                    <button
                      onClick={() => onSendEta(2, notif)}
                      className="flex-1 py-1.5 px-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-amber-400 rounded-xl text-[11px] font-bold text-slate-800 dark:text-white shadow-2xs active:scale-95 transition-all cursor-pointer"
                    >
                      🏃‍♂️ 2 Dk
                    </button>
                    <button
                      onClick={() => onSendEta(5, notif)}
                      className="flex-1 py-1.5 px-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-amber-400 rounded-xl text-[11px] font-bold text-slate-800 dark:text-white shadow-2xs active:scale-95 transition-all cursor-pointer"
                    >
                      ⏱️ 5 Dk
                    </button>
                    <button
                      onClick={() => onSendEta(10, notif)}
                      className="flex-1 py-1.5 px-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-amber-400 rounded-xl text-[11px] font-bold text-slate-800 dark:text-white shadow-2xs active:scale-95 transition-all cursor-pointer"
                    >
                      🚗 10 Dk
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Car Cards List */}
      <div className="flex flex-col gap-2.5 mb-5">
        {cars.map((car) => (
          <div
            key={car.id}
            className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 rounded-3xl p-4 flex items-center justify-between shadow-xs"
          >
            <div>
              <div className="font-mono-plate text-2xl font-black text-[#111315] dark:text-white">
                {car.plate}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-extrabold text-[10px]">
                  ● Aktif Cihaz
                </span>
                <span className="text-xs text-slate-500 dark:text-zinc-400">
                  Sticker Kodu:{' '}
                  <strong className="text-[#111315] dark:text-white font-bold">
                    {car.code}
                  </strong>
                </span>
              </div>
            </div>

            {cars.length > 1 && (
              <button
                onClick={() => {
                  if (window.confirm(`${car.plate} plakalı aracı kaldırmak istiyor musunuz?`)) {
                    onRemoveCar(car.id);
                  }
                }}
                title="Aracı Kaldır"
                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 text-red-500 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Cam Sticker Preview Card */}
      <div className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#d8ff35] text-black flex items-center justify-center text-sm font-bold shadow-2xs">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-sm text-[#111315] dark:text-white uppercase tracking-tight">
              Cam QR Sticker'ı
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
            85 x 85 mm Standart
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed">
          Aracının camına yapıştır. Önünü kapatan ya da acil durumu olan herkes kornaya basmadan sana ulaşsın.
        </p>

        {/* Sticker Physical Card Representation - Ultra Yatay / Widescreen Landscape */}
        <div className="my-5 p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-white text-black border-2 border-black shadow-[4px_4px_0px_#111315] sm:shadow-[6px_6px_0px_#111315] select-none flex items-center gap-3 sm:gap-5 overflow-hidden">
          {/* Left QR Container */}
          <div className="bg-white p-1.5 sm:p-2.5 rounded-2xl sm:rounded-3xl w-20 h-20 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center border border-slate-900 shadow-sm">
            <QRCodeSvg
              value={`https://plakala.app/car/${activeCar.plate.replace(/\s+/g, '')}`}
              size={64}
              className="sm:hidden"
            />
            <QRCodeSvg
              value={`https://plakala.app/car/${activeCar.plate.replace(/\s+/g, '')}`}
              size={108}
              className="hidden sm:block"
            />
          </div>

          {/* Right Details */}
          <div className="flex-1 text-left min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-0.5 sm:mb-1">
              <span className="font-mono-plate font-black text-lg sm:text-2xl tracking-tight text-black leading-none">
                PLAKALA
              </span>
              <span className="text-[8px] sm:text-[11px] font-black uppercase text-[#a3c32b]">
                QR ARAÇ İLETİŞİM
              </span>
            </div>

            <div className="text-[10px] sm:text-[13px] font-black tracking-tight uppercase text-black leading-tight mb-1 sm:mb-2">
              ÖNÜNÜ MÜ KAPATTIM? KORNAYA GEREK YOK.
            </div>

            <div className="inline-flex items-center gap-1 text-[8px] sm:text-[10px] font-extrabold text-black bg-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-slate-200 shadow-xs mb-1.5 sm:mb-3 max-w-full">
              <span className="shrink-0">📱</span>
              <span className="truncate">Uygulama indirmeden anında kullanılabilir!</span>
            </div>

            <div className="w-full h-px bg-slate-200 mb-1.5 sm:mb-2" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 text-[8px] sm:text-[11px] font-bold text-black">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-xs sm:text-sm">🔒</span>
                <span>%100 Anonim · Numara Gizli</span>
              </div>
              <div className="font-mono font-black text-[9px] sm:text-xs flex items-center gap-1">
                <span className="text-slate-400">PIN:</span>
                <span className="bg-slate-100 px-1.5 py-0.5 rounded uppercase">{activeCar.code}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Print controls */}
        <div className="flex items-center justify-between mb-3 text-xs font-semibold">
          <span className="text-slate-600 dark:text-zinc-300">Baskı Adedi:</span>
          <select
            value={printQty}
            onChange={(e) => setPrintQty(e.target.value)}
            className="h-9 px-3 rounded-xl bg-slate-100 dark:bg-zinc-800 text-[#111315] dark:text-white border-0 font-bold text-xs outline-none cursor-pointer"
          >
            <option value="1">1 Adet (Tekli)</option>
            <option value="2">2 Adet (Ön + Arka Cam)</option>
            <option value="4">4 Adet (Sayfa Başı A4)</option>
          </select>
        </div>

        <button
          onClick={handlePrint}
          className="w-full h-13 bg-[#111315] dark:bg-white text-white dark:text-[#111315] font-extrabold text-xs rounded-full flex items-center justify-between pl-6 pr-1.5 shadow-md active:scale-[0.98] transition-all cursor-pointer group"
        >
          <span className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-[#d8ff35] dark:text-[#111315]" />
            Sticker'ı Yazdır (A4 / Ultra Yatay Çıktı)
          </span>
          <div className="w-10 h-10 rounded-full bg-[#d8ff35] text-black flex items-center justify-center font-bold">
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* Hidden Print Container specifically targeted for window.print (Ultra Yatay 150x60mm) */}
      <div className="hidden print-only">
        <div className="grid grid-cols-1 gap-12 p-12 max-w-[210mm] mx-auto bg-white">
          {Array.from({ length: Number(printQty) || 1 }).map((_, i) => (
            <div
              key={i}
              className="w-[150mm] h-[65mm] p-6 rounded-[32px] bg-white text-black border-[3px] border-black flex items-center gap-8 mx-auto shadow-[8px_8px_0px_#111315]"
            >
              <div className="bg-white p-3 rounded-[24px] border-2 border-slate-900 shrink-0">
                <QRCodeSvg
                  value={`https://plakala.app/car/${activeCar.plate.replace(/\s+/g, '')}`}
                  size={120}
                />
              </div>
              <div className="flex-1 text-left flex flex-col justify-between h-full py-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono-plate font-black text-2xl text-black">
                      PLAKALA
                    </span>
                    <span className="text-[11px] font-black uppercase text-[#a3c32b]">
                      QR ARAÇ İLETİŞİM
                    </span>
                  </div>
                  <div className="text-[16px] font-black uppercase text-black leading-tight mb-2">
                    ÖNÜNÜ MÜ KAPATTIM?<br />KORNAYA GEREK YOK.
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 text-[11px] font-black bg-white border border-slate-200 px-4 py-2 rounded-full shadow-xs text-black">
                  <span>📱</span>
                  <span>Uygulama indirmeden tarayıcıdan anında kullanılabilir!</span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold text-black border-t border-slate-200 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔒</span>
                    <span>%100 Anonim · Numara Gizli</span>
                  </div>
                  <div className="font-mono font-black text-sm flex items-center gap-1">
                    <span className="text-slate-400">PIN:</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded uppercase">{activeCar.code}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
