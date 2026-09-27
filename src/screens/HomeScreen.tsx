import React, { useState } from 'react';
import {
  Search,
  ArrowRight,
  Zap,
  X,
  Hash,
  MapPin,
  ChevronRight,
  Smartphone,
  History,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { PlateInput } from '../components/PlateInput';
import { NotificationItem, ParkLocation, PlateSegments, ScreenType } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { getDailyContactsCount } from '../utils/dailyLimits';

interface HomeScreenProps {
  plateInput: PlateSegments;
  onPlateChange: (val: PlateSegments) => void;
  onSearchPlate: () => void;
  onNavigate: (screen: ScreenType) => void;
  parkLocation: ParkLocation | null;
  notifications: NotificationItem[];
  onOpenRoom: (item: NotificationItem) => void;
  onSimulateIncoming: () => void;
  recentSearches?: string[];
  onSelectRecentPlate?: (plate: string) => void;
  isSearching?: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  plateInput,
  onPlateChange,
  onSearchPlate,
  onNavigate,
  parkLocation,
  notifications,
  onOpenRoom,
  onSimulateIncoming,
  recentSearches = [],
  onSelectRecentPlate,
  isSearching = false,
}) => {
  const [showPwaBanner, setShowPwaBanner] = useState(true);
  const [roomCodeInput, setRoomCodeInput] = useState('');

  const handleJoinRoom = () => {
    const clean = roomCodeInput.trim().replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (!clean || clean.length < 4) {
      alert('Lütfen geçerli 6 haneli oda kodunu girin (Örn: 842915)');
      return;
    }
    const roomItem: NotificationItem = {
      id: 'room-' + Date.now(),
      targetPlate: 'ODA ' + clean,
      reason: 'Oda katılımı',
      timestamp: Date.now(),
      timeFormatted: 'Şimdi',
      roomCode: clean,
      status: 'replied',
    };
    onOpenRoom(roomItem);
  };

  return (
    <section className="flex-1 flex flex-col pt-3 pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] px-5">
      {/* PWA Install Banner */}
      {showPwaBanner && (
        <div className="bg-[#111315] text-white rounded-3xl p-4 mb-4 flex items-center justify-between shadow-md border border-white/10 animate-fadeIn">
          <div
            onClick={() => onNavigate('install')}
            className="flex items-center gap-3 cursor-pointer select-none flex-1"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#d8ff35] text-black flex items-center justify-center text-lg shrink-0 font-bold shadow-sm">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-tight text-white">
                Plakala Uygulamasını Yükle
              </div>
              <div className="text-[11px] text-zinc-400">
                Push bildirimlerini anında almak için ekle
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowPwaBanner(false)}
            aria-label="Kapat"
            className="text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Plate Query */}
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d8ff35]/25 border border-[#d8ff35]/40 text-[#536500] dark:text-[#d8ff35] text-[11px] font-extrabold uppercase tracking-wide select-none">
            <span className="w-2 h-2 rounded-full bg-[#759000] dark:bg-[#d8ff35] animate-pulse" />
            ANONİM İLETİŞİM
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60 text-slate-600 dark:text-zinc-300 text-[10px] font-bold shadow-2xs select-none">
            <span>Günlük İletişim:</span>
            <span className="font-extrabold text-[#111315] dark:text-[#d8ff35]">
              {getDailyContactsCount()}/3 Kişi
            </span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#111315] dark:text-white whitespace-nowrap">
          Plakayı Yaz
        </h1>
      </div>

      <PlateInput
        value={plateInput}
        onChange={onPlateChange}
        onSubmit={onSearchPlate}
      />

      {/* Son Aramalar (Son 3 Plaka) */}
      {recentSearches && recentSearches.length > 0 && (
        <div className="mb-3 px-0.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 select-none">
              <History className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
              Son Aramalar
            </span>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium select-none">
              Dokunarak Doldur
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {recentSearches.slice(0, 3).map((plate) => (
              <button
                key={plate}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  onSelectRecentPlate?.(plate);
                }}
                className="group px-3 py-1.5 rounded-xl bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 hover:border-[#111315] dark:hover:border-[#d8ff35] text-[#111315] dark:text-white font-mono-plate font-extrabold text-xs shadow-2xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span className="text-[9px] px-1 py-0.2 rounded bg-[#1e4fc2] text-white font-bold">TR</span>
                <span>{plate}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ana Arama Butonu */}
      <button
        onClick={() => {
          if (isSearching) return;
          triggerHaptic('medium');
          onSearchPlate();
        }}
        disabled={isSearching}
        className="w-full h-14 bg-[#d8ff35] hover:bg-[#c9f518] disabled:opacity-70 text-[#111315] font-extrabold text-sm rounded-full flex items-center justify-between pl-6 pr-2 shadow-[0_8px_25px_-4px_rgba(216,255,53,0.5)] active:scale-[0.98] transition-all cursor-pointer group"
      >
        <span className="flex items-center gap-2.5">
          <Search className="w-4 h-4" />
          {isSearching ? 'Araç Kaydı Doğrulanıyor...' : 'Plakayı Ara & Bildir'}
        </span>
        <div className="w-10 h-10 rounded-full bg-[#111315] text-white flex items-center justify-center transition-transform group-hover:rotate-45">
          {isSearching ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Anonimlik ve Güven Rozetleri */}
      <div className="flex items-center justify-center gap-2 mt-3 text-xs select-none">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700/60 text-slate-600 dark:text-zinc-300 font-semibold text-[11px]">
          <Lock className="w-3 h-3 text-slate-400" />
          %100 Anonim
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700/60 text-slate-600 dark:text-zinc-300 font-semibold text-[11px]">
          <ShieldCheck className="w-3 h-3 text-slate-400" />
          Telefon numaran gizli kalır
        </div>
      </div>

      {/* Oda Koduna Katıl Card */}
      <div className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 rounded-3xl p-4 mt-3 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 select-none">
            <Hash className="w-4 h-4 text-[#d8ff35] bg-[#111315] p-0.5 rounded" />
            6 Haneli Oda Koduna Katıl
          </span>
          <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium select-none">
            Örn: 842915
          </span>
        </div>

        <div className="flex gap-2 mt-2.5">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(e.target.value.replace(/[^0-9A-Za-z]/g, '').toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
            placeholder="842915"
            className="flex-1 h-12 bg-slate-100 dark:bg-zinc-800 rounded-2xl px-4 font-mono-plate font-bold text-lg tracking-widest text-center uppercase outline-none text-[#111315] dark:text-white focus:ring-2 focus:ring-[#111315] dark:focus:ring-[#d8ff35]"
          />
          <button
            onClick={handleJoinRoom}
            className="px-5 h-12 rounded-2xl bg-[#111315] text-white dark:bg-[#d8ff35] dark:text-black font-bold text-xs uppercase hover:bg-black active:scale-95 transition-all cursor-pointer"
          >
            Katıl
          </button>
        </div>
      </div>

      {/* Park Konumu Hızlı Kartı */}
      <div
        onClick={() => onNavigate('park')}
        className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 hover:border-[#111315] dark:hover:border-[#d8ff35] rounded-3xl p-4 mt-3 cursor-pointer shadow-xs active:scale-[0.99] transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#d8ff35] text-[#111315] flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-[#111315] dark:text-white">
                Aracım Nerede?
              </div>
              <div className="text-xs text-slate-500 dark:text-zinc-400 truncate max-w-[200px]">
                {parkLocation
                  ? `${parkLocation.note || 'Konum kaydedildi'} (${parkLocation.time})`
                  : 'Henüz konum kaydedilmedi'}
              </div>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-zinc-300">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Son Bildirimler Listesi */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-extrabold text-sm uppercase tracking-wider text-slate-500 dark:text-zinc-400 select-none">
            Son Bildirimler (24s)
          </span>
          <span className="text-[11px] font-bold text-[#536500] dark:text-[#d8ff35] flex items-center gap-1.5 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d8ff35] animate-ping" />
            Canlı Akış
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => onOpenRoom(item)}
              className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 hover:border-[#111315] dark:hover:border-[#d8ff35] rounded-3xl p-4 cursor-pointer shadow-xs active:scale-[0.99] transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono-plate font-bold text-base text-[#111315] dark:text-white">
                    {item.targetPlate}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      item.isIncoming
                        ? 'bg-[#d8ff35] text-black'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    {item.isIncoming ? 'SANA GELDİ' : 'SEN BİLDİRDİN'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
                  {item.timeFormatted}
                </span>
              </div>

              <div className="text-xs font-semibold text-[#111315] dark:text-zinc-200 mt-2">
                Sebep: {item.reason} ·{' '}
                <span className="text-slate-500 dark:text-zinc-400 font-normal">
                  {item.replyText ? `"${item.replyText}"` : item.note || 'Cevap bekleniyor...'}
                </span>
              </div>

              <div className="mt-2 text-[11px] text-slate-400 dark:text-zinc-500 flex items-center justify-between border-t border-slate-100 dark:border-zinc-800/80 pt-2 font-medium">
                <span>Oda: {item.roomCode}</span>
                <span className="font-bold text-[#111315] dark:text-[#d8ff35] flex items-center gap-1">
                  Odaya Git <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
