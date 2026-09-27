import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Check,
  Zap,
  Copy,
  Share2,
  MessageSquare,
  ArrowRight,
  Eye,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { NotificationItem, ScreenType } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface StatusScreenProps {
  notification: NotificationItem | null;
  onNavigate: (screen: ScreenType) => void;
  onOpenChat: () => void;
}

export const StatusScreen: React.FC<StatusScreenProps> = ({
  notification,
  onNavigate,
  onOpenChat,
}) => {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState<number>(4);
  const [isShaking, setIsShaking] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const copyTimeoutRef = useRef<any>(null);
  const shakeTimeoutRef = useRef<any>(null);
  const warningTimeoutRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      clearTimeout(copyTimeoutRef.current);
      clearTimeout(shakeTimeoutRef.current);
      clearTimeout(warningTimeoutRef.current);
    };
  }, []);

  // 4-second visual countdown for connection establishment (does NOT auto-enter room)
  useEffect(() => {
    setCountdown(4);
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
  }, [notification?.id]);

  const isSeen = notification?.status === 'seen' || notification?.status === 'replied';
  const isReplied = notification?.status === 'replied';

  const handleConnectNow = () => {
    // Saniye sayarken odaya giriş engellenir, telefon titrer ve buton sallanma animasyonu oynatılır
    if (countdown > 0) {
      triggerHaptic('error');
      setIsShaking(false);
      // Trigger reflow to restart CSS shake animation on every tap
      requestAnimationFrame(() => {
        setIsShaking(true);
      });
      setShowWarning(true);

      clearTimeout(shakeTimeoutRef.current);
      shakeTimeoutRef.current = setTimeout(() => {
        setIsShaking(false);
      }, 420);

      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(false);
      }, 2200);

      return;
    }

    // Geri sayım bittiğinde odaya başarıyla girilir
    triggerHaptic('success');
    onOpenChat();
  };

  if (!notification) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-slate-500">Aktif bir bildirim bulunamadı.</p>
        <button
          onClick={() => onNavigate('home')}
          className="mt-3 px-4 py-2 bg-[#111315] text-white rounded-full text-xs font-bold"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  const handleCopyCode = () => {
    navigator.clipboard
      .writeText(notification.roomCode)
      .then(() => {
        setCopied(true);
        clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => alert('Oda kodu: ' + notification.roomCode));
  };

  const handleShare = () => {
    const text = `Plakala: ${notification.targetPlate} için bildirim var. Oda Kodu: ${notification.roomCode}.`;
    if (navigator.share) {
      navigator.share({ title: 'Plakala', text, url: window.location.href }).catch(() => {});
    } else {
      handleCopyCode();
    }
  };

  return (
    <section className="flex-1 flex flex-col justify-between max-w-[420px] mx-auto w-full px-5 py-2.5">
      {/* Top Section */}
      <div className="space-y-3">
        {/* Back Link */}
        <div>
          <button
            onClick={() => onNavigate('home')}
            className="text-xs font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 hover:text-[#111315] dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
          </button>
        </div>

        {/* Plate & Header */}
        <div className="text-center pt-0.5">
          <div className="inline-block bg-[#111315] text-[#d8ff35] px-4 py-1.5 rounded-full font-mono-plate text-lg font-black shadow-xs tracking-wider mb-2">
            {notification.targetPlate}
          </div>

          <h2 className="text-2xl font-black tracking-tight text-[#111315] dark:text-white">
            {isReplied ? 'Cevap Geldi!' : 'Bildirim İletildi!'}
          </h2>

          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {isReplied
              ? 'Araç sahibi hemen geleceğini bildirdi.'
              : 'Araç sahibine push bildirimi ulaştırıldı. Cevap bekleniyor.'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between relative py-1 px-5">
          <div className="absolute left-9 right-9 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 dark:bg-zinc-800 -z-0" />

          {/* Step 1: İletildi */}
          <div className="flex flex-col items-center gap-1 z-10 select-none">
            <div className="w-8 h-8 rounded-full bg-[#111315] text-[#d8ff35] flex items-center justify-center font-bold text-xs shadow-xs">
              <Check className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-[#111315] dark:text-white">İletildi</span>
          </div>

          {/* Step 2: Görüldü */}
          <div className="flex flex-col items-center gap-1 z-10 select-none">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                isSeen
                  ? 'bg-[#111315] text-[#d8ff35]'
                  : 'bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-700 text-slate-400'
              }`}
            >
              {isSeen ? <Eye className="w-4 h-4" /> : '2'}
            </div>
            <span
              className={`text-[10px] font-bold ${
                isSeen ? 'text-[#111315] dark:text-white' : 'text-slate-400 dark:text-zinc-500'
              }`}
            >
              Görüldü
            </span>
          </div>

          {/* Step 3: Yanıt */}
          <div className="flex flex-col items-center gap-1 z-10 select-none">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                isReplied
                  ? 'bg-[#d8ff35] text-black ring-3 ring-[#d8ff35]/30'
                  : 'bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-700 text-slate-400'
              }`}
            >
              {isReplied ? <Zap className="w-4 h-4 fill-current" /> : '3'}
            </div>
            <span
              className={`text-[10px] font-bold ${
                isReplied ? 'text-[#111315] dark:text-white' : 'text-slate-400 dark:text-zinc-500'
              }`}
            >
              Yanıt
            </span>
          </div>
        </div>

        {/* Owner Reply Box (If replied) */}
        {isReplied && (
          <div className="bg-[#d8ff35]/20 border-2 border-[#d8ff35] rounded-3xl text-center p-3.5 shadow-xs animate-fadeIn">
            <span className="text-[10px] font-extrabold uppercase text-[#3e4c00] dark:text-[#d8ff35] tracking-wider">
              ARAÇ SAHİBİNİN YANITI
            </span>
            <div className="font-mono-plate text-2xl font-black text-[#111315] dark:text-white mt-0.5">
              "{notification.replyText || 'Geliyorum, 2 dk'}"
            </div>
          </div>
        )}

        {/* Room Code Card */}
        <div className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 rounded-3xl p-3.5 shadow-xs">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider select-none">
            BU OTURUMUN ÖZEL ODA KODU
          </div>
          <div className="flex items-center justify-between bg-slate-100 dark:bg-zinc-800 rounded-2xl px-3.5 py-2.5 my-2">
            <span className="font-mono-plate text-lg font-black tracking-widest text-[#111315] dark:text-white">
              {notification.roomCode}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyCode}
                aria-label="Kodu Kopyala"
                className="w-8 h-8 rounded-full bg-[#111315] dark:bg-[#d8ff35] text-white dark:text-black flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleShare}
                aria-label="Paylaş"
                className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-white flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Button: Manual user entry with live connection status countdown */}
      <div className="pt-3 pb-2 space-y-2">
        {/* Warning notification when tapping during countdown */}
        {showWarning && countdown > 0 && (
          <div className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold animate-in fade-in zoom-in-95 duration-150">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Şoförle güvenli hat kuruluyor, lütfen <strong>{countdown} sn</strong> bekleyin!</span>
          </div>
        )}

        <button
          onClick={handleConnectNow}
          className={`w-full h-14 bg-[#111315] hover:bg-[#23272b] dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-full flex items-center justify-between pl-5 pr-2.5 shadow-lg select-none cursor-pointer active:scale-98 transition-all ${
            isShaking ? 'animate-shake-reject ring-2 ring-red-500/70' : ''
          }`}
        >
          <div className="flex flex-col text-left">
            <span className="flex items-center gap-2.5 text-sm font-black text-white">
              <MessageSquare className="w-4 h-4 text-[#d8ff35] fill-current" />
              Odaya Gir &amp; Yazış (Anonim)
            </span>
            {countdown > 0 ? (
              <div className="pl-6.5 flex items-center gap-1.5 mt-0.5">
                <span className="text-[11.5px] text-zinc-300 font-medium">Şoför ile bağlantı kuruluyor:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-red-500/20 text-red-500 border border-red-500/40 text-xs font-black font-mono tracking-wide animate-pulse">
                  {countdown} sn
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-emerald-400 font-bold pl-6.5 mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                Bağlantı hazır • Odaya girmek için dokunun
              </span>
            )}
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#d8ff35] text-black flex items-center justify-center font-bold shrink-0 shadow-xs">
            <ArrowRight className="w-4.5 h-4.5 text-black" />
          </div>
        </button>

        <div className="text-center">
          <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-emerald-500 inline shrink-0" />
            <span>Kişisel bilgiler ve telefon numaranız asla paylaşılmaz</span>
          </span>
        </div>
      </div>
    </section>
  );
};
