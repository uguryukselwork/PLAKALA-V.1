import React, { useState } from 'react';
import {
  Car,
  MapPin,
  ShieldCheck,
  Crosshair,
  ExternalLink,
  Trash2,
  Check,
  Loader2,
} from 'lucide-react';
import { ParkLocation } from '../types';

interface ParkScreenProps {
  parkHistory: ParkLocation[];
  onSaveParkLocation: (loc: ParkLocation) => void;
  onClearParkLocation: () => void;
  onRemoveParkItem: (index: number) => void;
}

export const ParkScreen: React.FC<ParkScreenProps> = ({
  parkHistory,
  onSaveParkLocation,
  onClearParkLocation,
  onRemoveParkItem,
}) => {
  const parkLocation = parkHistory[0] || null;
  const [noteInput, setNoteInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveLocation = () => {
    setIsLoading(true);

    const onLocationSuccess = (lat: number, lng: number) => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const dateStr = now.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
      });

      const newLocation: ParkLocation = {
        lat,
        lng,
        note: noteInput.trim() || 'Not eklenmedi',
        time: timeStr,
        date: dateStr,
      };

      onSaveParkLocation(newLocation);
      setNoteInput('');
      setIsLoading(false);
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onLocationSuccess(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // Fallback to central location (Levent, Istanbul) if permission denied or unavailable
          onLocationSuccess(41.0766, 29.0135);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      onLocationSuccess(41.0766, 29.0135);
    }
  };

  const handleOpenGoogleMaps = (loc: ParkLocation) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="flex-1 flex flex-col pt-3 pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] px-5">
      <div className="mb-4">
        <h2 className="text-3xl font-extrabold tracking-tight text-[#111315] dark:text-white">
          Park Konumum
        </h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-normal">
          Aracını nereye bıraktığını hatırla. Konum yalnızca cihazında saklanır.
        </p>
      </div>

      {/* Stylized Parking Graphic Map */}
      <div className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 rounded-3xl p-0 overflow-hidden relative h-44 mb-4 shadow-xs">
        {/* Geometric Road Graphic */}
        <div className="absolute inset-0 bg-[#e2e8f0] dark:bg-[#181b1e]">
          <div className="absolute w-14 h-[200%] bg-white dark:bg-[#23282e] left-1/3 -top-12 rotate-45" />
          <div className="absolute h-9 w-[200%] bg-white dark:bg-[#23282e] top-1/2 -left-10 -rotate-12" />
        </div>

        {/* Pulse Pin */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-[#d8ff35]/50 animate-ping absolute" />
          <div className="w-10 h-10 rounded-full bg-[#111315] text-[#d8ff35] flex items-center justify-center shadow-lg z-10 border-2 border-[#d8ff35]">
            <Car className="w-5 h-5" />
          </div>
        </div>

        {/* Privacy Pill Tag */}
        <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-[#1e2226]/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-[#111315] dark:text-white flex items-center gap-1.5 shadow-2xs select-none">
          <ShieldCheck className="w-3.5 h-3.5 text-[#536500] dark:text-[#d8ff35]" />
          Sadece Cihazında Saklanır
        </div>

        {parkLocation && (
          <div className="absolute top-3 right-3 bg-[#111315]/90 text-[#d8ff35] px-2.5 py-1 rounded-full text-[10px] font-mono-plate font-bold tracking-wider">
            {parkLocation.lat.toFixed(4)}, {parkLocation.lng.toFixed(4)}
          </div>
        )}
      </div>

      {/* Parking Note & Actions Card */}
      <div className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs mb-5">
        <div className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase mb-2 select-none">
          Kat veya Sütun Notu
        </div>

        <input
          type="text"
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          placeholder="Örn: B2 Otoparkı, Yeşil Sütun No: 42"
          className="w-full h-12 bg-slate-100 dark:bg-zinc-800 rounded-2xl px-4 text-sm font-semibold text-[#111315] dark:text-white outline-none focus:ring-2 focus:ring-[#111315] dark:focus:ring-[#d8ff35] mb-3"
        />

        <button
          onClick={handleSaveLocation}
          disabled={isLoading}
          className="w-full h-13 bg-[#111315] dark:bg-white text-white dark:text-[#111315] font-extrabold text-xs rounded-full flex items-center justify-between pl-6 pr-1.5 shadow-md active:scale-[0.98] transition-all cursor-pointer group"
        >
          <span className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-[#d8ff35] dark:text-[#111315]" />
            {isLoading ? 'Konum Alınıyor...' : 'Konumu Cihazıma Kaydet'}
          </span>
          <div className="w-10 h-10 rounded-full bg-[#d8ff35] text-black flex items-center justify-center font-bold">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </div>
        </button>
      </div>

      {/* Park History List */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Kaydedilen Parklar ({parkHistory.length})
          </h3>
          {parkHistory.length > 0 && (
            <button
              onClick={() => window.confirm('Tüm geçmiş silinsin mi?') && onClearParkLocation()}
              className="text-[11px] font-bold text-red-500 hover:text-red-600 cursor-pointer"
            >
              Tümünü Temizle
            </button>
          )}
        </div>

        <div className="space-y-3">
          {parkHistory.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-zinc-800/40 border border-dashed border-slate-200 dark:border-zinc-700 rounded-3xl">
              <MapPin className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
                Henüz bir park konumu kaydedilmedi.
              </p>
            </div>
          ) : (
            parkHistory.map((item, index) => (
              <div
                key={index}
                className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 rounded-3xl p-4 shadow-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#d8ff35] text-[#111315] flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#111315] dark:text-white">
                        {item.note}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                        {item.date}, {item.time}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                    {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <button
                    onClick={() => handleOpenGoogleMaps(item)}
                    className="flex-1 h-9 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-[#111315] dark:text-white font-bold text-[11px] flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Haritada Aç
                  </button>
                  <button
                    onClick={() => onRemoveParkItem(index)}
                    className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center hover:bg-red-500/20 active:scale-98 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};
