import React, { useRef, useEffect, useState } from 'react';
import { X, Camera, MapPin } from 'lucide-react';
import { PlateSegments } from '../types';
import { PlateCameraModal } from './PlateCameraModal';
import { triggerHaptic } from '../utils/haptics';
import { getProvinceName, isValidCityCode } from '../utils/provinces';
import { preloadPlateWorker } from '../utils/plateScanner';

interface PlateInputProps {
  value: PlateSegments;
  onChange: (val: PlateSegments) => void;
  onSubmit?: () => void;
  placeholder?: { city?: string; letters?: string; digits?: string };
  autoFocus?: boolean;
}

export const PlateInput: React.FC<PlateInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = { city: '34', letters: 'ACM', digits: '148' },
}) => {
  const [showCameraModal, setShowCameraModal] = useState(false);

  const cityRef = useRef<HTMLInputElement>(null);
  const lettersRef = useRef<HTMLInputElement>(null);
  const digitsRef = useRef<HTMLInputElement>(null);

  // Keep a synchronous ref of the latest value to avoid React state closure delays
  const latestValueRef = useRef<PlateSegments>(value);
  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => preloadPlateWorker());
    } else {
      setTimeout(preloadPlateWorker, 1200);
    }
  }, []);

  // Soldan başlama mantığı: Nereye basılırsa basılsın sırayla yönlendir
  const focusLeftmostAvailable = () => {
    const current = latestValueRef.current;
    if (!current.city || current.city.length < 2) {
      cityRef.current?.focus();
      return;
    }
    if (!current.letters || current.letters.length < 1) {
      lettersRef.current?.focus();
      return;
    }
    digitsRef.current?.focus();
  };

  // 1. Önce Sayı: İl Kodu (01 - 81)
  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    let digitsOnly = inputVal.replace(/[^0-9]/g, '').slice(0, 2);
    const lettersPart = inputVal.replace(/[^A-Za-z]/g, '').toUpperCase();

    // Kullanıcı sayı yerine harfe basarsa harf grubuna aktar
    if (lettersPart && digitsOnly.length > 0) {
      const nextVal: PlateSegments = {
        city: digitsOnly,
        letters: (lettersPart + latestValueRef.current.letters).slice(0, 3),
        digits: latestValueRef.current.digits,
      };
      latestValueRef.current = nextVal;
      onChange(nextVal);
      setTimeout(() => {
        lettersRef.current?.focus();
      }, 10);
      return;
    }

    // Türkiye'de 81'den büyük il kodu yoktur (01 - 81)
    if (digitsOnly.length === 2) {
      const num = parseInt(digitsOnly, 10);
      if (num > 81 || num === 0) {
        digitsOnly = digitsOnly.slice(0, 1);
      }
    }

    const nextVal: PlateSegments = {
      ...latestValueRef.current,
      city: digitsOnly,
    };
    latestValueRef.current = nextVal;
    onChange(nextVal);

    // 2 rakam girildiğinde ve geçerli bir il kodu olduğunda doğrudan sağdaki harf alanına geç
    if (digitsOnly.length === 2 && isValidCityCode(digitsOnly)) {
      setTimeout(() => {
        lettersRef.current?.focus();
        lettersRef.current?.select();
      }, 10);
    }
  };

  const handleCityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'Enter') {
      if (latestValueRef.current.city.length > 0) {
        e.preventDefault();
        lettersRef.current?.focus();
        lettersRef.current?.select();
      }
    }
  };

  // 2. Sonra Yazı: Harf Grubu (1 - 3 Harf)
  const handleLettersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value
      .replace(/i/g, 'I')
      .replace(/İ/g, 'I')
      .replace(/ı/g, 'I')
      .replace(/ğ/g, 'G')
      .replace(/Ğ/g, 'G')
      .replace(/ü/g, 'U')
      .replace(/Ü/g, 'U')
      .replace(/ş/g, 'S')
      .replace(/Ş/g, 'S')
      .replace(/ö/g, 'O')
      .replace(/Ö/g, 'O')
      .replace(/ç/g, 'C')
      .replace(/Ç/g, 'C')
      .toUpperCase();

    // Harf alanına sayı yazılırsa otomatik olarak tekrar sayı grubuna taşı
    if (/[0-9]/.test(raw)) {
      const digitPart = raw.replace(/[^0-9]/g, '');
      const cleanLetters = raw.replace(/[^A-Z]/g, '').slice(0, 3);
      const nextVal: PlateSegments = {
        ...latestValueRef.current,
        letters: cleanLetters,
        digits: (digitPart + latestValueRef.current.digits).slice(0, 4),
      };
      latestValueRef.current = nextVal;
      onChange(nextVal);
      setTimeout(() => {
        digitsRef.current?.focus();
        digitsRef.current?.select();
      }, 10);
      return;
    }

    const cleanLetters = raw.replace(/[^A-Z]/g, '').slice(0, 3);
    const nextVal: PlateSegments = {
      ...latestValueRef.current,
      letters: cleanLetters,
    };
    latestValueRef.current = nextVal;
    onChange(nextVal);

    // 3 harf dolduğunda otomatik olarak tekrar sayı grubuna geç
    if (cleanLetters.length === 3) {
      setTimeout(() => {
        digitsRef.current?.focus();
        digitsRef.current?.select();
      }, 10);
    }
  };

  const handleLettersKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && latestValueRef.current.letters.length === 0) {
      e.preventDefault();
      cityRef.current?.focus();
    } else if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'Enter') {
      if (latestValueRef.current.letters.length > 0) {
        e.preventDefault();
        digitsRef.current?.focus();
        digitsRef.current?.select();
      }
    }
  };

  // 3. Sonra Tekrar Sayı: Sayı Grubu (2 - 4 Hane)
  const handleDigitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    const nextVal: PlateSegments = {
      ...latestValueRef.current,
      digits: raw,
    };
    latestValueRef.current = nextVal;
    onChange(nextVal);
  };

  const handleDigitsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && latestValueRef.current.digits.length === 0) {
      e.preventDefault();
      lettersRef.current?.focus();
    } else if (e.key === 'Enter' && onSubmit) {
      onSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .toUpperCase()
      .replace(/\s+/g, '');
    const match = pasted.match(/^(\d{2})([A-Z]{1,3})(\d{2,4})$/);
    if (match) {
      const nextVal = {
        city: match[1],
        letters: match[2],
        digits: match[3],
      };
      latestValueRef.current = nextVal;
      onChange(nextVal);
      setTimeout(() => {
        digitsRef.current?.focus();
      }, 10);
    }
  };

  // Harf veya Sayı alanına tıklandığında sol taraf henüz boşsa sola yönlendir
  const handleLettersFocus = () => {
    if (!latestValueRef.current.city || latestValueRef.current.city.length < 2) {
      cityRef.current?.focus();
    }
  };

  const handleDigitsFocus = () => {
    if (!latestValueRef.current.city || latestValueRef.current.city.length < 2) {
      cityRef.current?.focus();
    } else if (!latestValueRef.current.letters || latestValueRef.current.letters.length < 1) {
      lettersRef.current?.focus();
    }
  };

  const handlePlateDetected = (detected: PlateSegments) => {
    latestValueRef.current = detected;
    onChange(detected);
  };

  const hasValue = Boolean(value.city || value.letters || value.digits);

  return (
    <div className="my-3.5 flex flex-col gap-2">
      {/* Plaka Kutusu (Geniş, Dengeli & Ferah) */}
      <div
        onClick={focusLeftmostAvailable}
        className="bg-white border-[3px] border-[#111315] rounded-[28px] sm:rounded-3xl h-[104px] sm:h-[114px] flex items-stretch overflow-hidden shadow-[0_12px_32px_-6px_rgba(0,0,0,0.16)] transition-all focus-within:ring-4 focus-within:ring-[#d8ff35]/90 focus-within:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.22)] relative cursor-text select-none"
      >
        {/* Mavi TR Şeridi */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            cityRef.current?.focus();
          }}
          className="w-16 sm:w-18 bg-[#1e4fc2] flex flex-col items-center justify-between py-3 sm:py-3.5 text-white shrink-0 cursor-pointer select-none"
        >
          <span className="text-[#ffd700] text-xs sm:text-sm tracking-widest font-black leading-none">
            ★★
          </span>
          <span className="font-mono-plate font-black text-[22px] sm:text-[25px] leading-none">
            TR
          </span>
        </div>

        {/* 3 Bölüm: Soldan sağa sırayla Sayı -> Yazı -> Tekrar Sayı */}
        <div
          onPaste={handlePaste}
          className="flex-1 flex items-center justify-between px-2 sm:px-3 bg-white min-w-0"
        >
          {/* Giriş Alanları Kapsayıcısı - Orantılı ve Dengeli Flex Yapısı */}
          <div className="flex-1 flex items-center justify-between min-w-0 gap-1 sm:gap-2">
            {/* 1. Önce Sayı: İl Kodu (Örn: 34) */}
            <div className="flex-[2] min-w-0 flex items-center justify-center">
              <input
                ref={cityRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                value={value.city}
                onChange={handleCityChange}
                onKeyDown={handleCityKeyDown}
                onFocus={(e) => e.target.select()}
                placeholder={placeholder.city}
                aria-label="İl Kodu (Önce Sayı)"
                className="w-full border-none bg-transparent font-mono-plate font-black text-[30px] sm:text-[38px] text-center text-[#111315] uppercase outline-none p-0 placeholder:text-slate-300 select-all leading-none tracking-tight"
              />
            </div>

            {/* Dikey Düzgün Ayraç */}
            <div className="w-[2px] h-8 sm:h-10 bg-slate-200 shrink-0 rounded-full" />

            {/* 2. Sonra Yazı: Harf Grubu (Örn: ACM) */}
            <div className="flex-[3] min-w-0 flex items-center justify-center">
              <input
                ref={lettersRef}
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                maxLength={3}
                value={value.letters}
                onChange={handleLettersChange}
                onKeyDown={handleLettersKeyDown}
                onFocus={handleLettersFocus}
                placeholder={placeholder.letters}
                aria-label="Harf Grubu (Sonra Yazı)"
                className="w-full border-none bg-transparent font-mono-plate font-black text-[30px] sm:text-[38px] text-center text-[#111315] uppercase outline-none p-0 placeholder:text-slate-300 select-all leading-none tracking-wider"
              />
            </div>

            {/* Dikey Düzgün Ayraç */}
            <div className="w-[2px] h-8 sm:h-10 bg-slate-200 shrink-0 rounded-full" />

            {/* 3. Tekrar Sayı: Sayı Grubu (Örn: 148) */}
            <div className="flex-[3.5] min-w-0 flex items-center justify-center">
              <input
                ref={digitsRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={value.digits}
                onChange={handleDigitsChange}
                onKeyDown={handleDigitsKeyDown}
                onFocus={handleDigitsFocus}
                placeholder={placeholder.digits}
                aria-label="Sayı Grubu (Tekrar Sayı)"
                className="w-full border-none bg-transparent font-mono-plate font-black text-[30px] sm:text-[38px] text-center text-[#111315] uppercase outline-none p-0 placeholder:text-slate-300 select-all leading-none tracking-tight"
              />
            </div>
          </div>

          {/* Sağ Aksiyon İkonu: Plaka yazılıysa Temizle (X), boşsa Fotoğraf Çek İkonu */}
          <div className="flex items-center shrink-0 pl-1.5 sm:pl-2">
            {hasValue ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const emptyVal = { city: '', letters: '', digits: '' };
                  latestValueRef.current = emptyVal;
                  onChange(emptyVal);
                  cityRef.current?.focus();
                }}
                aria-label="Plakayı Temizle"
                title="Plakayı Temizle"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-black flex items-center justify-center shrink-0 transition-all cursor-pointer active:scale-90 shadow-2xs"
              >
                <X className="w-5 h-5 shrink-0" />
              </button>
            ) : (
              /* Kullanıcı henüz bir şey yazmamışken Fotoğraf / Kamera İkonu gösterilir */
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('medium');
                  setShowCameraModal(true);
                }}
                aria-label="Fotoğraf Çek ve Plakayı Otomatik Tara"
                title="Fotoğraf Çek ve Plakayı Otomatik Tara"
                className="w-11 h-11 sm:w-12 sm:h-12 min-w-[44px] min-h-[44px] rounded-2xl bg-slate-100 hover:bg-[#d8ff35] text-[#111315] flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 group"
              >
                <Camera className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Şehir Bilgisi & İl Doğrulama Rozeti */}
      {value.city && (
        <div className="flex items-center justify-between px-2 pt-0.5 animate-in fade-in duration-150 text-xs">
          {isValidCityCode(value.city) ? (
            <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-xl">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                {value.city.length === 1 ? `0${value.city}` : value.city} - {getProvinceName(value.city)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 rounded-xl">
              <span>⚠️ Geçerli il kodu 01-81 arasındadır (Hatay: 31, İstanbul: 34)</span>
            </div>
          )}
          {value.city === '31' && (
            <span className="text-[11px] font-extrabold text-[#111315] dark:text-[#d8ff35] bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 rounded-lg">
              Hatay Plakası
            </span>
          )}
        </div>
      )}

      {/* Camera / OCR Modal */}
      <PlateCameraModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onPlateDetected={handlePlateDetected}
      />
    </div>
  );
};
