import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Check, Key, Copy, ArrowRight, ShieldCheck } from 'lucide-react';
import { PlateInput } from '../components/PlateInput';
import { PlateSegments, ScreenType, UserGender } from '../types';
import { MALE_AVATAR_URL, FEMALE_AVATAR_URL } from '../constants/avatars';
import { isValidCityCode, parsePlateToSegments } from '../utils/provinces';

interface AddCarScreenProps {
  onNavigate: (screen: ScreenType) => void;
  onAddCar: (plate: string, code: string) => void;
  initialPlate?: PlateSegments | string;
}

export const AddCarScreen: React.FC<AddCarScreenProps> = ({
  onNavigate,
  onAddCar,
  initialPlate,
}) => {
  const [plate, setPlate] = useState<PlateSegments>(() => {
    if (!initialPlate) return { city: '', letters: '', digits: '' };
    if (typeof initialPlate === 'string') {
      return parsePlateToSegments(initialPlate);
    }
    return initialPlate;
  });

  useEffect(() => {
    if (initialPlate) {
      if (typeof initialPlate === 'string') {
        setPlate(parsePlateToSegments(initialPlate));
      } else {
        setPlate(initialPlate);
      }
    }
  }, [initialPlate]);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [selectedGender, setSelectedGender] = useState<UserGender>(() => {
    try {
      const saved = localStorage.getItem('plakala_user_gender');
      if (saved === 'male' || saved === 'female') return saved;
    } catch {}
    return 'male';
  });

  const handleGenderChange = (g: UserGender) => {
    setSelectedGender(g);
    try {
      localStorage.setItem('plakala_user_gender', g);
      const photoUrl = g === 'male' ? MALE_AVATAR_URL : FEMALE_AVATAR_URL;
      localStorage.setItem('plakala_user_profile_photo', photoUrl);
    } catch {}
  };

  const handleSaveCar = () => {
    const city = plate.city.trim();
    const letters = plate.letters.trim().toUpperCase();
    const digits = plate.digits.trim();

    if (!city || !letters || !digits) {
      alert('Lütfen eksiksiz bir plaka girin (Örn: 31 TR 1001 veya 34 ACM 148)');
      return;
    }

    if (!isValidCityCode(city)) {
      alert('Lütfen geçerli bir il kodu girin! Türkiye\'de il plakaları 01 ile 81 arasındadır (Örn: Hatay için 31, İstanbul için 34).');
      return;
    }

    const formattedCity = city.length === 1 ? `0${city}` : city;
    const fullPlate = `${formattedCity} ${letters} ${digits}`;
    const generatedCode = 'PKLA-' + Math.floor(1000 + Math.random() * 9000);
    setRecoveryCode(generatedCode);
    onAddCar(fullPlate, generatedCode);
  };

  const handleCopyCode = () => {
    if (!recoveryCode) return;
    navigator.clipboard
      .writeText(recoveryCode)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        alert('Kurtarma kodu: ' + recoveryCode);
      });
  };

  return (
    <section className="flex-1 flex flex-col pt-3 pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] px-5">
      <div className="mb-3">
        <button
          onClick={() => onNavigate('welcome')}
          className="text-xs font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-2 hover:text-[#111315] dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Karşılamaya Dön
        </button>
      </div>

      <h2 className="text-3xl font-extrabold text-[#111315] dark:text-white tracking-tight">
        Aracını<br />Ekle
      </h2>

      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed font-normal">
        Kendi plakanı ekle; camında cep telefonu numarası bırakma zorunluluğundan kurtul.
      </p>

      {/* Plate Input */}
      <PlateInput
        value={plate}
        onChange={setPlate}
        onSubmit={handleSaveCar}
        placeholder={{ city: '34', letters: 'TR', digits: '1001' }}
      />

      {/* Cinsiyet / Profil Avatar Çerçeve Seçimi (Yuvarlak) */}
      <div className="my-3 bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 rounded-3xl p-3.5 shadow-xs">
        <div className="text-[11px] font-extrabold text-[#111315] dark:text-white mb-2 flex items-center justify-between">
          <span>Sohbet Profil Avatarın</span>
          <span className="text-[10px] text-slate-400 font-normal">Mavi / Pembe çerçeve</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Erkek */}
          <button
            type="button"
            onClick={() => handleGenderChange('male')}
            className={`p-2.5 rounded-2xl border flex items-center gap-2.5 transition-all cursor-pointer ${
              selectedGender === 'male'
                ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 ring-2 ring-blue-500/20 shadow-xs'
                : 'border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
            }`}
          >
            <div className={`w-10 h-10 rounded-full overflow-hidden border-2 flex items-center justify-center shrink-0 ${
              selectedGender === 'male' ? 'border-blue-500 shadow-sm' : 'border-slate-300 dark:border-zinc-700'
            }`}>
              <img
                src={MALE_AVATAR_URL}
                alt="Erkek"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-left min-w-0">
              <div className="text-xs font-extrabold text-[#111315] dark:text-white truncate">Erkek</div>
              <div className="text-[9px] text-blue-600 dark:text-blue-400 font-semibold truncate">Mavi Çerçeve</div>
            </div>
            {selectedGender === 'male' && (
              <div className="ml-auto w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">✓</div>
            )}
          </button>

          {/* Kadın */}
          <button
            type="button"
            onClick={() => handleGenderChange('female')}
            className={`p-2.5 rounded-2xl border flex items-center gap-2.5 transition-all cursor-pointer ${
              selectedGender === 'female'
                ? 'border-pink-500 bg-pink-50/80 dark:bg-pink-950/40 ring-2 ring-pink-500/20 shadow-xs'
                : 'border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
            }`}
          >
            <div className={`w-10 h-10 rounded-full overflow-hidden border-2 flex items-center justify-center shrink-0 ${
              selectedGender === 'female' ? 'border-pink-500 shadow-sm' : 'border-slate-300 dark:border-zinc-700'
            }`}>
              <img
                src={FEMALE_AVATAR_URL}
                alt="Kadın"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-left min-w-0">
              <div className="text-xs font-extrabold text-[#111315] dark:text-white truncate">Kadın</div>
              <div className="text-[9px] text-pink-600 dark:text-pink-400 font-semibold truncate">Pembe Çerçeve</div>
            </div>
            {selectedGender === 'female' && (
              <div className="ml-auto w-4 h-4 rounded-full bg-pink-500 text-white flex items-center justify-center text-[10px] font-bold">✓</div>
            )}
          </button>
        </div>
      </div>

      <button
        onClick={handleSaveCar}
        className="w-full h-14 bg-[#111315] dark:bg-white text-white dark:text-[#111315] font-extrabold text-sm rounded-full flex items-center justify-between pl-6 pr-2 shadow-md active:scale-[0.98] transition-all cursor-pointer group mt-1"
      >
        <span className="flex items-center gap-3">
          <Plus className="w-4 h-4" />
          Bu Aracı Cihazıma Kaydet
        </span>
        <div className="w-10 h-10 rounded-full bg-[#d8ff35] text-[#111315] flex items-center justify-center font-bold">
          <Check className="w-4 h-4" />
        </div>
      </button>

      <button
        onClick={() => onNavigate('home')}
        className="w-full text-center text-xs font-bold text-slate-500 dark:text-zinc-400 mt-3 py-2 hover:text-[#111315] dark:hover:text-white transition-colors"
      >
        Şimdilik atla, ana sayfaya geç →
      </button>

      {/* Kurtarma Kodu Paneli */}
      {recoveryCode && (
        <div className="bg-[#d8ff35]/15 border-2 border-[#d8ff35] rounded-3xl p-5 mt-5 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#536500] dark:text-[#d8ff35] tracking-wider uppercase">
            <Key className="w-4 h-4" /> Kurtarma Kodunuz (Bir Kez Gösterilir)
          </div>

          <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1.5 leading-relaxed">
            Cihazını değiştirir veya tarayıcını temizlersen aracını bu kod ile geri alabilirsin. Mutlaka bir yere not al!
          </p>

          <div className="flex items-center justify-between bg-white dark:bg-[#111315] border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 my-3.5 shadow-2xs">
            <span className="font-mono-plate text-2xl font-black tracking-widest text-[#111315] dark:text-[#d8ff35]">
              {recoveryCode}
            </span>
            <button
              onClick={handleCopyCode}
              title="Kopyala"
              className="w-10 h-10 rounded-full bg-[#d8ff35] text-black flex items-center justify-center font-bold active:scale-95 transition-transform"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={() => onNavigate('home')}
            className="w-full h-13 bg-[#111315] text-white font-bold text-sm rounded-full flex items-center justify-between pl-5 pr-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>Not Aldım, Uygulamayı Başlat</span>
            <div className="w-10 h-10 rounded-full bg-[#d8ff35] text-[#111315] flex items-center justify-center">
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}
    </section>
  );
};
