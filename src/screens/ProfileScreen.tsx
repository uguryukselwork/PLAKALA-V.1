import React, { useState, useRef } from 'react';
import {
  User,
  Volume2,
  Bell,
  Smartphone,
  ChevronRight,
  AlertTriangle,
  Moon,
  Sun,
  Pencil,
  Trash2,
  Palette,
  Sparkles,
  X,
  Check,
  Lock,
  Type,
} from 'lucide-react';
import { ScreenType, UserGender, ChatPatternType, ChatFontWeight, SoundTone } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { ChatBackgroundPattern } from '../components/ChatBackgroundPattern';
import { playSynthTone } from '../utils/audio';
import { MALE_AVATAR_URL, FEMALE_AVATAR_URL } from '../constants/avatars';

interface ProfileScreenProps {
  deviceId: string;
  onNavigate: (screen: ScreenType) => void;
  onTestPush: () => void;
  onResetDevice: () => void;
  currentTheme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const PROFILE_PHOTO_STORAGE_KEY = 'plakala_user_profile_photo';
export const PROFILE_GENDER_STORAGE_KEY = 'plakala_user_gender';
export const PROFILE_GENDER_LOCKED_KEY = 'plakala_user_gender_locked';
export const STORAGE_PATTERN_KEY = 'plakala_chat_bg_pattern';
export const STORAGE_OPACITY_KEY = 'plakala_chat_bg_opacity';
export const STORAGE_COUNTERPART_GENDER_KEY = 'plakala_counterpart_gender';
export const STORAGE_FONT_WEIGHT_KEY = 'plakala_chat_font_weight';

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  deviceId,
  onNavigate,
  onTestPush,
  onResetDevice,
  currentTheme = 'light',
  onToggleTheme,
}) => {
  const [profilePhoto, setProfilePhoto] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(PROFILE_PHOTO_STORAGE_KEY);
      if (saved && !saved.includes('photo-1500648767791')) {
        return saved;
      }
    } catch {}
    return MALE_AVATAR_URL;
  });

  const [gender, setGender] = useState<UserGender>(() => {
    try {
      const saved = localStorage.getItem(PROFILE_GENDER_STORAGE_KEY);
      if (saved === 'male' || saved === 'female' || saved === 'unspecified') {
        return saved;
      }
    } catch {}
    return 'male'; // default to male
  });

  const [isGenderLocked, setIsGenderLocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PROFILE_GENDER_LOCKED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [fontWeight, setFontWeight] = useState<ChatFontWeight>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FONT_WEIGHT_KEY);
      if (saved === 'light' || saved === 'normal' || saved === 'medium' || saved === 'bold') {
        return saved;
      }
    } catch {}
    return 'normal';
  });

  // Chat appearance & customization modal state
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  const [pattern, setPattern] = useState<ChatPatternType>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PATTERN_KEY);
      if (saved === 'doodle' || saved === 'none') {
        return saved;
      }
    } catch {}
    return 'doodle';
  });

  const [patternOpacity, setPatternOpacity] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_OPACITY_KEY);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0.02 && parsed <= 0.3) return parsed;
      }
    } catch {}
    return 0.08;
  });

  const [soundTone, setSoundTone] = useState<SoundTone>(() => {
    try {
      const saved = localStorage.getItem('plakala_sound_tone');
      if (saved) return saved as SoundTone;
    } catch {}
    return 'classic';
  });

  const handleSoundToneChange = (tone: SoundTone) => {
    setSoundTone(tone);
    try {
      localStorage.setItem('plakala_sound_tone', tone);
    } catch {}
    playSynthTone(tone, 0.8);
    triggerHaptic('selection');
  };

  const handleGenderSelect = (newGender: UserGender) => {
    if (isGenderLocked) {
      alert('Sohbet profil cinsiyetiniz daha önce belirlenmiştir ve yalnızca bir kez seçilebilir.');
      return;
    }
    const confirmed = window.confirm(
      `Cinsiyetinizi "${newGender === 'male' ? 'Erkek' : 'Kadın'}" olarak belirlemek istiyor musunuz? Bu seçim yalnızca bir kez yapılabilir ve daha sonra değiştirilemez.`
    );
    if (!confirmed) return;

    setGender(newGender);
    setIsGenderLocked(true);
    const photoUrl = newGender === 'male' ? MALE_AVATAR_URL : FEMALE_AVATAR_URL;
    setProfilePhoto(photoUrl);
    try {
      localStorage.setItem(PROFILE_GENDER_STORAGE_KEY, newGender);
      localStorage.setItem(PROFILE_GENDER_LOCKED_KEY, 'true');
      localStorage.setItem(PROFILE_PHOTO_STORAGE_KEY, photoUrl);
    } catch {}
    triggerHaptic('selection');
  };

  const handlePatternChange = (newPattern: ChatPatternType) => {
    setPattern(newPattern);
    try {
      localStorage.setItem(STORAGE_PATTERN_KEY, newPattern);
    } catch {}
    triggerHaptic('selection');
  };

  const handleOpacityChange = (newOpacity: number) => {
    setPatternOpacity(newOpacity);
    try {
      localStorage.setItem(STORAGE_OPACITY_KEY, String(newOpacity));
    } catch {}
    triggerHaptic('selection');
  };

  const handleFontWeightChange = (newWeight: ChatFontWeight) => {
    setFontWeight(newWeight);
    try {
      localStorage.setItem(STORAGE_FONT_WEIGHT_KEY, newWeight);
    } catch {}
    triggerHaptic('selection');
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Lütfen 5MB boyutundan küçük bir fotoğraf seçin.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      // Resize/optimize image on a canvas to keep localStorage light
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 400;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const optimized = canvas.toDataURL('image/jpeg', 0.85);
            setProfilePhoto(optimized);
            localStorage.setItem(PROFILE_PHOTO_STORAGE_KEY, optimized);
          } else {
            setProfilePhoto(dataUrl);
            localStorage.setItem(PROFILE_PHOTO_STORAGE_KEY, dataUrl);
          }
          triggerHaptic('selection');
        } catch {
          setProfilePhoto(dataUrl);
          localStorage.setItem(PROFILE_PHOTO_STORAGE_KEY, dataUrl);
          triggerHaptic('selection');
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Profil fotoğrafını kaldırmak istiyor musunuz?')) {
      setProfilePhoto(null);
      try {
        localStorage.removeItem(PROFILE_PHOTO_STORAGE_KEY);
      } catch {}
      triggerHaptic('medium');
    }
  };

  return (
    <section className="flex-1 flex flex-col pt-3 pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] px-5">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoSelect}
      />

      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-5">
        {/* Avatar Container with Small Pencil Icon Badge */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative group cursor-pointer select-none"
          title="Fotoğraf ekle veya değiştir"
          aria-label="Profil fotoğrafı yükle"
        >
          <div
            className={`w-18 h-18 rounded-full bg-[#d8ff35] text-black font-extrabold flex items-center justify-center text-2xl shadow-md shrink-0 overflow-hidden group-hover:opacity-95 active:scale-95 transition-all ${
              gender === 'male'
                ? 'border-3 border-blue-500 ring-2 ring-blue-500/40 shadow-blue-500/10'
                : gender === 'female'
                ? 'border-3 border-pink-500 ring-2 ring-pink-500/40 shadow-pink-500/10'
                : 'border-2 border-black dark:border-white/20'
            }`}
          >
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Profil Fotoğrafı"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-9 h-9" />
            )}
          </div>

          {/* Gender Indicator Dot on Avatar */}
          {gender !== 'unspecified' && (
            <div
              className={`absolute top-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-[#14171a] shadow-xs flex items-center justify-center text-[8px] font-black text-white ${
                gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'
              }`}
              title={gender === 'male' ? 'Erkek' : 'Kadın'}
            >
              {gender === 'male' ? '♂' : '♀'}
            </div>
          )}

          {/* Ufak Kalem İkonu (Resim alanının kenarında) */}
          <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-[#111315] dark:bg-white text-white dark:text-black flex items-center justify-center shadow-md border-2 border-white dark:border-[#14171a] group-hover:scale-110 active:scale-90 transition-transform">
            <Pencil className="w-3 h-3" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold tracking-tight text-[#111315] dark:text-white truncate">
              Sürücü Profili
            </h2>
            {profilePhoto && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                title="Fotoğrafı Kaldır"
                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[11px] text-[#536500] dark:text-[#d8ff35] font-extrabold hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
          >
            <Pencil className="w-3 h-3" />
            {profilePhoto ? 'Fotoğrafı Değiştir' : 'Fotoğraf Ekle'}
          </button>
          <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono-plate mt-0.5">
            ID: <span className="text-[#111315] dark:text-zinc-200">{deviceId}</span>
          </div>
        </div>
      </div>

      {/* 1. Sohbeti Kişiselleştir */}
      <button
        type="button"
        onClick={() => setShowCustomizeModal(true)}
        className="w-full p-4 mb-3 rounded-3xl bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 shadow-xs hover:border-[#536500] dark:hover:border-[#d8ff35] flex items-center justify-between group active:scale-[0.99] transition-all cursor-pointer text-left"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#d8ff35] text-black flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-[#111315] dark:text-white">
                Sohbeti Kişiselleştir
              </span>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-[#536500] dark:text-[#d8ff35] border border-slate-200 dark:border-zinc-700">
                Görünüm
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              Arka plan deseni, doku opaklığı ve profil çerçevesi
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
              gender === 'male'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                : 'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200 dark:border-pink-900'
            }`}
          >
            {gender === 'male' ? 'Erkek' : 'Kadın'} • {pattern === 'doodle' ? 'Motifler' : 'Sade'}
          </span>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </button>

      {/* 2. Bildirim Ayarları (Sadece Ses Bildirimi ile Alakalı) */}
      <div className="w-full p-4 mb-3 rounded-3xl bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center gap-3.5 mb-3">
          <div className="w-11 h-11 rounded-2xl bg-[#111315] text-[#d8ff35] flex items-center justify-center shadow-xs shrink-0">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-[#111315] dark:text-white">
                Bildirim Ayarları (Ses Bildirimi)
              </span>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Zil Sesi
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              Bildirim uyarısı geldiğinde çalacak ses tonunu seçin ve test edin
            </p>
          </div>
        </div>

        {/* Sound Tones Selector */}
        <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
          {(
            [
              { id: 'classic', label: 'Klasik' },
              { id: 'horn', label: 'Korna' },
              { id: 'gentle', label: 'Kibar' },
              { id: 'radar', label: 'Radar' },
              { id: 'emergency', label: 'Acil' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSoundToneChange(t.id)}
              className={`py-2 px-1 rounded-2xl text-[10px] font-extrabold transition-all cursor-pointer flex flex-col items-center justify-center ${
                soundTone === t.id
                  ? 'bg-[#111315] text-[#d8ff35] shadow-xs border border-black dark:border-[#d8ff35]'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
              }`}
            >
              <span>{t.label}</span>
              <span className="text-[8px] opacity-70 mt-0.5">Dinle 🔊</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Uygulamayı İndir (Kurulum Rehberi) */}
      <button
        type="button"
        onClick={() => onNavigate('install')}
        className="w-full p-4 mb-4 rounded-3xl bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 shadow-xs hover:border-[#536500] dark:hover:border-[#d8ff35] flex items-center justify-between group active:scale-[0.99] transition-all cursor-pointer text-left"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-[#111315] dark:text-white">
                Uygulamayı İndir (Kurulum Rehberi)
              </span>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                PWA / Kısayol
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              Telefonuna ana ekran uygulaması olarak yükle
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Reset Device Action */}
      <button
        onClick={onResetDevice}
        className="w-full text-center text-xs font-bold text-red-500 hover:text-red-600 py-3 mt-4 active:scale-95 transition-transform cursor-pointer"
      >
        <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
        Bu Cihazı Sıfırla (Çıkış Yap)
      </button>

      {/* Sohbeti Kişiselleştir Modal / Sheet */}
      {showCustomizeModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="flex-1"
            onClick={() => setShowCustomizeModal(false)}
            aria-label="Kapat"
          />

          <div className="bg-white dark:bg-[#1e2226] border-t border-slate-200 dark:border-zinc-800 rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-250">
            {/* Header */}
            <div className="pt-4 pb-3 px-5 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#d8ff35] text-black flex items-center justify-center shadow-xs">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#111315] dark:text-white">
                    Sohbeti Kişiselleştir
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                    Arka plan deseni, doku opaklığı ve profil çerçeveleri
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
                aria-label="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              {/* Canlı Önizleme Kutusu */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-900 p-3 shadow-inner">
                <div className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#536500] dark:text-[#d8ff35]" />
                  <span>Canlı Sohbet Önizlemesi</span>
                </div>
                {/* Background Pattern */}
                <ChatBackgroundPattern
                  pattern={pattern}
                  opacity={patternOpacity * 1.2}
                  className="text-slate-900 dark:text-white"
                />
                {/* Mini Message Mockup */}
                <div className="space-y-2 relative z-10">
                  {/* Diğer Sürücü Mesajı */}
                  <div className="flex items-end gap-2 justify-start max-w-[92%]">
                    <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center bg-white dark:bg-zinc-800 shadow-xs shrink-0 border-2 border-slate-300 dark:border-zinc-600">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div
                      className={`p-2 rounded-xl rounded-bl-xs bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 text-[11px] text-[#111315] dark:text-white shadow-xs ${
                        fontWeight === 'light'
                          ? 'font-light'
                          : fontWeight === 'medium'
                          ? 'font-medium'
                          : fontWeight === 'bold'
                          ? 'font-bold'
                          : 'font-normal'
                      }`}
                    >
                      Merhaba, araç başında mısınız?
                    </div>
                  </div>

                  {/* Kendi Mesajım */}
                  <div className="flex items-end gap-2 justify-end max-w-[92%] ml-auto">
                    <div
                      className={`p-2 rounded-xl rounded-br-xs bg-[#d8ff35] text-[11px] text-black shadow-xs ${
                        fontWeight === 'light'
                          ? 'font-light'
                          : fontWeight === 'medium'
                          ? 'font-medium'
                          : fontWeight === 'bold'
                          ? 'font-bold'
                          : 'font-normal'
                      }`}
                    >
                      Evet, hemen geliyorum! 👍
                    </div>
                    <div
                      className={`w-7 h-7 rounded-full overflow-hidden flex items-center justify-center bg-white dark:bg-zinc-800 shadow-xs shrink-0 ${
                        gender === 'male'
                          ? 'border-2 border-blue-500 ring-1 ring-blue-500/30'
                          : 'border-2 border-pink-500 ring-1 ring-pink-500/30'
                      }`}
                    >
                      {profilePhoto ? (
                        <img src={profilePhoto} alt="Sen" className="w-full h-full object-cover" />
                      ) : (
                        <User className={`w-3.5 h-3.5 ${gender === 'female' ? 'text-pink-500' : 'text-blue-500'}`} />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 1. Arka Plan Deseni (Sadece 2 Seçenek: 🚗 Motifler ve ⬛ Sade) */}
              <div>
                <label className="block text-xs font-black text-[#111315] dark:text-white mb-2">
                  Arka Plan Deseni & Dokusu
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Option: Doodle / Motifler */}
                  <button
                    type="button"
                    onClick={() => handlePatternChange('doodle')}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 overflow-hidden ${
                      pattern === 'doodle'
                        ? 'border-[#536500] dark:border-[#d8ff35] bg-slate-50 dark:bg-zinc-800/90 ring-2 ring-[#d8ff35]/30'
                        : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-[#1a1d20]'
                    }`}
                  >
                    <div className="h-12 w-full rounded-xl bg-slate-100 dark:bg-zinc-900 relative overflow-hidden flex items-center justify-center border border-slate-200/50 dark:border-zinc-800">
                      <ChatBackgroundPattern pattern="doodle" opacity={0.3} className="text-[#111315] dark:text-white" />
                      <span className="text-[11px] font-black z-10 px-2 py-0.5 rounded-md bg-white/90 dark:bg-black/90 shadow-xs">
                        🚗 Motifler
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#111315] dark:text-white">Araç & İletişim</span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight">
                      Direksiyon, araba, anahtar
                    </span>
                  </button>

                  {/* Option: None / Sade */}
                  <button
                    type="button"
                    onClick={() => handlePatternChange('none')}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 overflow-hidden ${
                      pattern === 'none'
                        ? 'border-[#536500] dark:border-[#d8ff35] bg-slate-50 dark:bg-zinc-800/90 ring-2 ring-[#d8ff35]/30'
                        : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-[#1a1d20]'
                    }`}
                  >
                    <div className="h-12 w-full rounded-xl bg-slate-100 dark:bg-zinc-900 relative overflow-hidden flex items-center justify-center border border-slate-200/50 dark:border-zinc-800">
                      <span className="text-[11px] font-black z-10 px-2 py-0.5 rounded-md bg-white/90 dark:bg-black/90 shadow-xs">
                        ⬛ Sade
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#111315] dark:text-white">Düz / Minimal</span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight">
                      Desensiz pürüzsüz
                    </span>
                  </button>
                </div>
              </div>

              {/* 2. Doku Belirginliği (Opaklık - Yalnızca Motifler seçiliyse) */}
              {pattern === 'doodle' && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#111315] dark:text-white">
                      Doku Belirginliği (Opaklık)
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200">
                      %{Math.round(patternOpacity * 100)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpacityChange(0.04)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        patternOpacity <= 0.05
                          ? 'border-[#536500] dark:border-[#d8ff35] bg-[#d8ff35]/20 text-[#111315] dark:text-[#d8ff35]'
                          : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                      }`}
                    >
                      Hafif (%4)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpacityChange(0.08)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        patternOpacity > 0.05 && patternOpacity < 0.12
                          ? 'border-[#536500] dark:border-[#d8ff35] bg-[#d8ff35]/20 text-[#111315] dark:text-[#d8ff35]'
                          : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                      }`}
                    >
                      Standart (%8)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpacityChange(0.15)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        patternOpacity >= 0.12
                          ? 'border-[#536500] dark:border-[#d8ff35] bg-[#d8ff35]/20 text-[#111315] dark:text-[#d8ff35]'
                          : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                      }`}
                    >
                      Belirgin (%15)
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Yazı Fontu & Kalınlığı (İnce, Normal, Orta, Kalın) */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1a1d20] border border-slate-200 dark:border-zinc-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-200">
                      <Type className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-black text-[#111315] dark:text-white">
                      Mesaj Yazı Fontu Kalınlığı
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                    {fontWeight === 'light'
                      ? 'İnce'
                      : fontWeight === 'medium'
                      ? 'Orta'
                      : fontWeight === 'bold'
                      ? 'Kalın'
                      : 'Normal'}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleFontWeightChange('light')}
                    className={`py-2 px-1 rounded-xl text-xs border text-center transition-all cursor-pointer ${
                      fontWeight === 'light'
                        ? 'border-[#536500] dark:border-[#d8ff35] bg-[#d8ff35]/20 text-[#111315] dark:text-[#d8ff35] ring-2 ring-[#d8ff35]/30'
                        : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <span className="block text-sm font-light">Aa</span>
                    <span className="text-[10px] font-light">İnce</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFontWeightChange('normal')}
                    className={`py-2 px-1 rounded-xl text-xs border text-center transition-all cursor-pointer ${
                      fontWeight === 'normal'
                        ? 'border-[#536500] dark:border-[#d8ff35] bg-[#d8ff35]/20 text-[#111315] dark:text-[#d8ff35] ring-2 ring-[#d8ff35]/30'
                        : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <span className="block text-sm font-normal">Aa</span>
                    <span className="text-[10px] font-normal">Normal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFontWeightChange('medium')}
                    className={`py-2 px-1 rounded-xl text-xs border text-center transition-all cursor-pointer ${
                      fontWeight === 'medium'
                        ? 'border-[#536500] dark:border-[#d8ff35] bg-[#d8ff35]/20 text-[#111315] dark:text-[#d8ff35] ring-2 ring-[#d8ff35]/30'
                        : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <span className="block text-sm font-medium">Aa</span>
                    <span className="text-[10px] font-medium">Orta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFontWeightChange('bold')}
                    className={`py-2 px-1 rounded-xl text-xs border text-center transition-all cursor-pointer ${
                      fontWeight === 'bold'
                        ? 'border-[#536500] dark:border-[#d8ff35] bg-[#d8ff35]/20 text-[#111315] dark:text-[#d8ff35] ring-2 ring-[#d8ff35]/30'
                        : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <span className="block text-sm font-bold">Aa</span>
                    <span className="text-[10px] font-bold">Kalın</span>
                  </button>
                </div>
              </div>

              {/* 4. Sohbet Profil Cinsiyeti (Tek Seferlik Seçim & Sadece Kendisi İçin) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500/5 via-pink-500/5 to-purple-500/5 border border-slate-200 dark:border-zinc-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center font-black text-xs">
                      ♂
                    </div>
                    <div className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-600 flex items-center justify-center font-black text-xs">
                      ♀
                    </div>
                    <span className="text-xs font-black text-[#111315] dark:text-white">
                      Sohbet Profil Cinsiyeti
                    </span>
                  </div>

                  {isGenderLocked ? (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      Kilitli (Tek Seferlik)
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400">
                      Tek Seferlik Seçim
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
                  {isGenderLocked
                    ? 'Profil cinsiyetiniz belirlenmiştir ve güvenliğiniz için kilitlenmiştir (değiştirilemez).'
                    : 'Cinsiyetinizi belirleyin. Bu seçim yalnızca bir kez yapılabilir ve daha sonra değiştirilemez.'}
                </p>

                {/* Sadece Kendisi İçin Cinsiyet Seçimi */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>Senin Profilin:</span>
                    <span
                      className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md ${
                        gender === 'male'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300'
                      }`}
                    >
                      {gender === 'male' ? 'Erkek' : 'Kadın'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleGenderSelect('male')}
                      disabled={isGenderLocked && gender !== 'male'}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                        gender === 'male'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                          : isGenderLocked
                          ? 'opacity-40 border-slate-200 dark:border-zinc-800 text-slate-400 cursor-not-allowed'
                          : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-blue-500 shrink-0">
                        <img
                          src={MALE_AVATAR_URL}
                          alt="Erkek"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span>Erkek</span>
                      {isGenderLocked && gender === 'male' && (
                        <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ml-1" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGenderSelect('female')}
                      disabled={isGenderLocked && gender !== 'female'}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                        gender === 'female'
                          ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 ring-2 ring-pink-500/20 shadow-xs'
                          : isGenderLocked
                          ? 'opacity-40 border-slate-200 dark:border-zinc-800 text-slate-400 cursor-not-allowed'
                          : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-pink-500 shrink-0">
                        <img
                          src={FEMALE_AVATAR_URL}
                          alt="Kadın"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span>Kadın</span>
                      {isGenderLocked && gender === 'female' && (
                        <Check className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400 ml-1" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sheet Footer */}
            <div className="p-3.5 bg-slate-50 dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                Seçimleriniz anında kaydedilir ve sohbete uygulanır.
              </span>
              <button
                type="button"
                onClick={() => setShowCustomizeModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#111315] dark:bg-white text-white dark:text-black font-extrabold text-xs active:scale-95 transition-transform cursor-pointer"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
