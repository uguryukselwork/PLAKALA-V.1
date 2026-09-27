import React, { useState } from 'react';
import { ArrowLeft, Play, Check, Sun, Moon } from 'lucide-react';
import { AppSettings, ScreenType, SoundTone } from '../types';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onPlayTone: (tone: SoundTone) => void;
  onNavigate: (screen: ScreenType) => void;
}

const TONES: { id: SoundTone; label: string; desc: string }[] = [
  { id: 'classic', label: 'Klasik Melodi', desc: 'D5 - A5 iki tonlu bildirim' },
  { id: 'horn', label: 'Sempatik Korna', desc: 'Kinetic yumuşak çift ses' },
  { id: 'gentle', label: 'Nazik Uyarı', desc: 'Akustik üçgen çan tonu' },
  { id: 'radar', label: 'Radar Bip', desc: 'Keskin yüksek frekans kare dalga' },
  { id: 'emergency', label: 'Acil İkaz Tonu', desc: 'Hızlı uyarı siren taraması' },
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onPlayTone,
  onNavigate,
}) => {
  const [phone, setPhone] = useState(settings.phone);
  const [phoneSaved, setPhoneSaved] = useState(false);

  const handleSavePhone = () => {
    onUpdateSettings({ phone });
    setPhoneSaved(true);
    setTimeout(() => setPhoneSaved(false), 2000);
  };

  return (
    <section className="flex-1 flex flex-col pt-3 pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] px-5">
      <div className="mb-2">
        <button
          onClick={() => onNavigate('profile')}
          className="text-xs font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-2 hover:text-[#111315] dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Profile Dön
        </button>
      </div>

      <h2 className="text-3xl font-extrabold tracking-tight text-[#111315] dark:text-white">
        Ayarlar
      </h2>
      <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4 font-normal">
        Uygulama görünümü ve ses bildirim tercihlerinizi buradan yönetin.
      </p>

      {/* Tema & Görünüm (Gece Teması & Gündüz Teması) */}
      <div className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 mb-4 shadow-xs">
        <div className="font-extrabold text-sm text-[#111315] dark:text-white mb-1">
          Tema & Görünüm
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3.5 leading-relaxed">
          Göz yormayan Gece Teması (Karanlık Mod) veya net Gündüz Teması seçin:
        </p>

        <div className="grid grid-cols-2 gap-3">
          {/* Gündüz Teması */}
          <div
            onClick={() => onUpdateSettings({ theme: 'light' })}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col items-center gap-2 text-center select-none ${
              settings.theme === 'light'
                ? 'border-2 border-[#111315] bg-slate-50 shadow-xs'
                : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 hover:border-slate-300'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#111315] dark:text-white">
                Gündüz Teması
              </div>
              <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                Aydınlık & Net
              </div>
            </div>
          </div>

          {/* Gece Teması */}
          <div
            onClick={() => onUpdateSettings({ theme: 'dark' })}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col items-center gap-2 text-center select-none ${
              settings.theme === 'dark'
                ? 'border-2 border-[#d8ff35] bg-[#111315] text-white shadow-xs'
                : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 hover:border-slate-300'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#d8ff35]">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#111315] dark:text-white">
                Gece Teması
              </div>
              <div className="text-[10px] text-slate-400 dark:text-zinc-400">
                Karanlık & Rahat
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Phone Card */}
      <div className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 mb-4 shadow-xs">
        <div className="font-extrabold text-sm text-[#111315] dark:text-white mb-1">
          WhatsApp İletişim Numarası
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3 leading-relaxed">
          Sadece sohbet içinde "WhatsApp'ımı Gönder" butonuna bastığınızda kullanılır. Asla sunucuda saklanmaz.
        </p>

        <input
          type="tel"
          maxLength={11}
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="05XX XXX XX XX"
          className="w-full h-12 bg-slate-100 dark:bg-zinc-800 rounded-2xl px-4 text-sm font-semibold text-[#111315] dark:text-white outline-none focus:ring-2 focus:ring-[#111315] dark:focus:ring-[#d8ff35] mb-2 font-mono-plate"
        />

        <button
          onClick={handleSavePhone}
          className="w-full h-11 rounded-xl bg-[#111315] dark:bg-white text-white dark:text-[#111315] text-xs font-bold hover:bg-black dark:hover:bg-slate-200 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          {phoneSaved ? (
            <>
              <Check className="w-4 h-4 text-[#d8ff35]" /> Kaydedildi!
            </>
          ) : (
            'Numaramı Yerel Hafızaya Kaydet'
          )}
        </button>
      </div>

      {/* Web Audio Synthesizer Tones */}
      <div className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs">
        <div className="font-extrabold text-sm text-[#111315] dark:text-white mb-1">
          Bildirim Sesi & Tonu
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3.5 leading-relaxed">
          Web Audio API ile sentezlenen 5 özel otomotiv tonu:
        </p>

        <div className="space-y-2">
          {TONES.map((tone) => {
            const isSelected = settings.soundTone === tone.id;
            return (
              <div
                key={tone.id}
                onClick={() => onUpdateSettings({ soundTone: tone.id })}
                className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#d8ff35]/20 border-2 border-[#d8ff35]'
                    : 'bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="sound-tone"
                    checked={isSelected}
                    onChange={() => onUpdateSettings({ soundTone: tone.id })}
                    className="accent-[#111315] dark:accent-[#d8ff35] w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-[#111315] dark:text-white">
                      {tone.label}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                      {tone.desc}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayTone(tone.id);
                  }}
                  title="Dinle"
                  className="w-8 h-8 rounded-full bg-white dark:bg-zinc-700 shadow-2xs flex items-center justify-center text-xs text-[#111315] dark:text-white hover:scale-105 active:scale-95 transition-transform"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Volume Slider */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-zinc-800">
          <div className="flex justify-between text-xs font-bold mb-2">
            <span className="text-[#111315] dark:text-white">Ses Seviyesi</span>
            <span className="text-[#536500] dark:text-[#d8ff35] font-mono-plate font-extrabold">
              %{Math.round(settings.volume * 100)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(settings.volume * 100)}
            onChange={(e) =>
              onUpdateSettings({ volume: Number(e.target.value) / 100 })
            }
            className="w-full accent-[#111315] dark:accent-[#d8ff35] cursor-pointer h-2 bg-slate-200 dark:bg-zinc-700 rounded-lg"
          />
        </div>
      </div>
    </section>
  );
};
