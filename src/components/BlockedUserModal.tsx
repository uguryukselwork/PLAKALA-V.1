import React, { useState, useRef } from 'react';
import { ShieldAlert, MessageCircle, Lock, AlertTriangle, KeyRound, X, Check } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface BlockedUserModalProps {
  isOpen: boolean;
  unblockRequested?: boolean;
  blockReason?: string;
  ticketNo?: string;
  onRequestUnblock: () => void;
  onSecretUnblock?: () => void;
}

export const BlockedUserModal: React.FC<BlockedUserModalProps> = ({ 
  isOpen, 
  unblockRequested,
  blockReason,
  ticketNo = '0MHQ1',
  onRequestUnblock,
  onSecretUnblock
}) => {
  const clickCountRef = useRef<number>(0);
  const resetTimerRef = useRef<any>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [hasError, setHasError] = useState(false);

  if (!isOpen) return null;

  const handleIconClick = () => {
    clickCountRef.current += 1;
    const current = clickCountRef.current;

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    if (current >= 10) {
      clickCountRef.current = 0;
      setShowPasswordModal(true);
      setPasswordInput('');
      setHasError(false);
      return;
    }

    // Reset if no clicks for 3.5 seconds
    resetTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 3500);
  };

  const handleVerifyPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = passwordInput.trim().toUpperCase();
    
    // Accept 4958 or 0MHQ1
    if (clean === '4958' || clean === '0MHQ1') {
      setShowPasswordModal(false);
      setPasswordInput('');
      setHasError(false);
      triggerHaptic('success');
      if (onSecretUnblock) {
        onSecretUnblock();
      }
    } else {
      triggerHaptic('error');
      setHasError(true);
    }
  };

  const handleWhatsAppSupport = () => {
    const phoneNumber = '905427844958';
    const message = encodeURIComponent(`Hesabım kısıtlandı açarmısınız (Talep No: ${ticketNo})`);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-[#111315] z-[9999] flex flex-col items-center justify-center px-6 text-center animate-in fade-in duration-500">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-900 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-sm w-full">
        {/* Icon Container */}
        <div 
          className="mb-8 relative inline-block cursor-pointer select-none"
          onClick={handleIconClick}
          role="button"
          tabIndex={0}
          aria-label="Güvenlik Kalkanı"
        >
          <div className="w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center animate-pulse">
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg border-2 border-[#111315]">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        <h2 className="text-3xl font-black text-white tracking-tight mb-4 uppercase italic leading-tight">
          Hesabın<br />Kısıtlandı
        </h2>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs uppercase tracking-widest mb-3">
            <span className="flex items-center gap-2 text-red-400 font-bold">
              <AlertTriangle className="w-4 h-4" /> Politika İhlali
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-white font-mono text-[10px] font-black">
              Talep No: {ticketNo}
            </span>
          </div>
          <p className="text-zinc-300 text-sm leading-relaxed mb-4 font-medium">
            {blockReason || 'Sistemimiz, kullanım kurallarımızı ihlal eden şüpheli hareketler tespit etti.'}
          </p>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium">
            <span>
              Durum: <span className={unblockRequested ? "text-amber-400 font-bold" : "text-red-500 font-bold"}>
                {unblockRequested ? 'İnceleme Bekliyor' : 'Kısıtlı'}
              </span>
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {!unblockRequested ? (
            <button
              onClick={onRequestUnblock}
              className="w-full h-15 bg-white text-black rounded-full flex items-center justify-center gap-3 font-black text-sm uppercase tracking-wide shadow-xl active:scale-[0.98] transition-all cursor-pointer"
            >
              İnceleme Talebi Gönder
            </button>
          ) : (
            <button
              onClick={handleWhatsAppSupport}
              className="w-full h-16 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-full flex items-center justify-between pl-8 pr-2 shadow-xl shadow-green-900/20 animate-in zoom-in-95 duration-300 cursor-pointer"
            >
              <span className="flex items-center gap-3 font-black text-sm uppercase tracking-wide">
                <MessageCircle className="w-6 h-6 fill-current" />
                WhatsApp'tan İletişime Geç
              </span>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white animate-ping" />
              </div>
            </button>
          )}
          
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed px-4">
            {!unblockRequested 
              ? 'WhatsApp ile iletişime geçmeden önce bir inceleme talebi oluşturmalısınız.'
              : 'Talebiniz alındı. Şimdi destek ekibiyle iletişime geçebilirsiniz.'}
          </p>
        </div>
      </div>

      {/* In-App Admin Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1a1d21] border border-zinc-700/80 rounded-3xl p-6 max-w-sm w-full text-left shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordInput('');
                setHasError(false);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#d8ff35]/15 border border-[#d8ff35]/30 flex items-center justify-center mb-4 text-[#d8ff35]">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-black text-white tracking-tight mb-1">
              Yönetici Girişi
            </h3>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Yönetici paneline erişmek için şifrenizi girin.
            </p>

            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div>
                <input
                  type="text"
                  autoFocus
                  autoComplete="off"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (hasError) setHasError(false);
                  }}
                  placeholder="Yönetici şifresi..."
                  className={`w-full h-13 px-4 rounded-2xl bg-zinc-900 border text-white text-sm font-semibold placeholder:text-zinc-600 outline-none transition-colors ${
                    hasError ? 'border-red-500 ring-2 ring-red-500/20' : 'border-zinc-700 focus:border-[#d8ff35]'
                  }`}
                />
                {hasError && (
                  <p className="text-xs text-red-400 mt-2 font-semibold flex items-center gap-1.5 animate-shake-reject">
                    <AlertTriangle className="w-3.5 h-3.5" /> Hatalı şifre. Lütfen tekrar deneyin.
                  </p>
                )}
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordInput('');
                    setHasError(false);
                  }}
                  className="flex-1 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs cursor-pointer transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 h-12 rounded-xl bg-[#d8ff35] hover:bg-[#c9f518] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-98"
                >
                  <Check className="w-4 h-4 stroke-[3]" /> Giriş Yap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <div className="absolute bottom-10 text-zinc-600 font-mono text-[10px] tracking-widest uppercase">
        Kinetic Mobility Security System v4.0
      </div>
    </div>
  );
};
