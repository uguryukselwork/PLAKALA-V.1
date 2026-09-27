import React, { useEffect, useState } from 'react';
import { BellRing, ShieldAlert, MessageSquare, ArrowRight, X, Clock } from 'lucide-react';
import { NotificationItem } from '../types';

interface FullSizeEmergencyModalProps {
  isOpen: boolean;
  notification: { plate: string; reason: string; note?: string; roomCode: string } | null;
  onClose: () => void;
  onOpenRoom: (roomCode: string) => void;
  onSendEta: (mins: number, roomCode: string) => void;
}

export const FullSizeEmergencyModal: React.FC<FullSizeEmergencyModalProps> = ({
  isOpen,
  notification,
  onClose,
  onOpenRoom,
  onSendEta,
}) => {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(3);
      return;
    }

    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, notification]);

  if (!isOpen || !notification) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200 select-none">
      {/* Background Strobe Glow */}
      <div className="absolute inset-0 bg-radial from-red-600/40 via-transparent to-transparent animate-pulse pointer-events-none" />

      <div className="relative w-full max-w-[400px] bg-linear-to-b from-[#1a1c23] to-[#111315] border-2 border-red-500 rounded-3xl p-6 text-white shadow-[0_0_50px_rgba(239,68,68,0.5)] flex flex-col items-center text-center overflow-hidden">
        {/* Top Emergency Header */}
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1.5 rounded-full border border-red-500/40">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              ACİL ARAÇ BİLDİRİMİ
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Kapat"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pulsing Siren Icon */}
        <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center my-3 relative shadow-[0_0_25px_rgba(239,68,68,0.4)] animate-bounce">
          <BellRing className="w-10 h-10 text-red-400" />
        </div>

        {/* Plate */}
        <div className="text-xs text-zinc-400 font-bold mb-1">BİLDİRİM GELEN PLAKA</div>
        <div className="font-mono-plate text-3xl font-black text-white tracking-wider mb-4 px-4 py-2 bg-white/5 rounded-2xl border border-white/10 w-full">
          {notification.plate}
        </div>

        {/* Reason & Note Box */}
        <div className="w-full bg-red-950/40 border border-red-500/30 rounded-2xl p-4 mb-5 text-left">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-red-400 mb-1">
            ⚠️ DURUM / SEBEP:
          </div>
          <div className="text-sm font-bold text-white mb-2 leading-snug">
            "{notification.reason}"
          </div>
          {notification.note && (
            <div className="text-xs text-zinc-300 italic bg-black/20 p-2.5 rounded-xl border border-white/5">
              "{notification.note}"
            </div>
          )}
        </div>

        {/* Countdown Indicator (e.g. 3s mandatory takeover or dismiss) */}
        <div className="text-[11px] text-zinc-400 mb-3 flex items-center gap-1.5 font-medium">
          <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>{countdown > 0 ? `Acil ekran (${countdown}s açık kalıyor...)` : 'Yanıtınızı seçin:'}</span>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={() => {
              onOpenRoom(notification.roomCode);
              onClose();
            }}
            className="w-full h-12 bg-[#d8ff35] hover:bg-[#c6f024] text-black font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(216,255,53,0.3)] active:scale-98 transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Hemen Odaya Gir & Yazış</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Quick ETA responses */}
          <div className="grid grid-cols-3 gap-2 mt-1">
            <button
              onClick={() => {
                onSendEta(2, notification.roomCode);
                onClose();
              }}
              className="py-2.5 px-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-bold text-white active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 leading-tight"
            >
              <span>2 Dk'ya</span>
              <span className="text-[11px] text-zinc-300">Geliyorum</span>
            </button>
            <button
              onClick={() => {
                onSendEta(5, notification.roomCode);
                onClose();
              }}
              className="py-2.5 px-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-bold text-white active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 leading-tight"
            >
              <span>5 Dk'ya</span>
              <span className="text-[11px] text-zinc-300">Oradayım</span>
            </button>
            <button
              onClick={() => {
                onSendEta(10, notification.roomCode);
                onClose();
              }}
              className="py-2.5 px-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-bold text-white active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 leading-tight"
            >
              <span>Hemen</span>
              <span className="text-[11px] text-zinc-300">Çekiyorum</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
