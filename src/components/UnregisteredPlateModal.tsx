import React from 'react';
import { AlertCircle, PlusCircle, Share2, X, ShieldAlert, ArrowRight } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface UnregisteredPlateModalProps {
  isOpen: boolean;
  plate: string;
  onClose: () => void;
  onRegisterThisPlate: () => void;
}

export const UnregisteredPlateModal: React.FC<UnregisteredPlateModalProps> = ({
  isOpen,
  plate,
  onClose,
  onRegisterThisPlate,
}) => {
  if (!isOpen) return null;

  const handleShareInvite = () => {
    triggerHaptic('selection');
    const shareText = `Merhaba, ${plate} plakalı aracınız için Plakala üzerinden iletişime geçmeye çalıştım. Bildirimleri almak ve ücretsiz anonim odaya katılmak için aracınızı Plakala'ya ekleyebilirsiniz: ${window.location.origin}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Plakala - Araç Bildirimi',
        text: shareText,
        url: window.location.origin,
      }).catch(() => {});
    } else {
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#181b1e] rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 pb-3 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#111315] dark:text-white">
                Kayıtlı Araç Bulunamadı
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Doğrulama Sonucu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center justify-center text-slate-500 dark:text-zinc-400 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col items-center text-center">
          <div className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800/80 border-2 border-slate-300 dark:border-zinc-700 font-mono-plate font-black text-2xl text-[#111315] dark:text-white tracking-widest my-2 shadow-inner">
            {plate}
          </div>

          <div className="mt-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-3.5 text-left text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
            <div className="font-bold mb-1 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Bu plaka henüz Plakala'ya eklenmemiş</span>
            </div>
            <p className="text-[11px] opacity-90">
              Sistemimiz yalnızca plakasını kaydeden gerçek araç sahiplerine anlık bildirim iletir. Sahte ya da yanıtsız oda açılmasını önlemek amacıyla bu araca doğrudan bildirim gönderilemiyor.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-2.5 mt-5">
            {/* Invite / Share via WhatsApp */}
            <button
              onClick={handleShareInvite}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp ile Araç Sahibini Davet Et</span>
            </button>

            {/* This is my car -> Register */}
            <button
              onClick={() => {
                triggerHaptic('medium');
                onRegisterThisPlate();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#111315] dark:bg-white text-white dark:text-[#111315] font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#d8ff35] dark:text-[#111315]" />
              <span>Bu Araç Benim (Plakamı Sisteme Kaydet)</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              Farklı Plaka Ara
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
