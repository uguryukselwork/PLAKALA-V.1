import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  UserX,
  Send,
  MessageCircle,
  Phone,
  Copy,
  Check,
  CheckCheck,
  Shield,
  Sun,
  Moon,
  Plus,
  X,
  Trash2,
  RotateCcw,
  Sparkles,
  Zap,
  User,
  Car,
  Megaphone,
  ArrowRightLeft,
} from 'lucide-react';
import { ChatMessage, ChatPatternType, UserGender, ChatFontWeight } from '../types';
import { ChatBackgroundPattern } from '../components/ChatBackgroundPattern';
import { PROFILE_PHOTO_STORAGE_KEY, PROFILE_GENDER_STORAGE_KEY, STORAGE_FONT_WEIGHT_KEY } from './ProfileScreen';
import { MALE_AVATAR_URL, FEMALE_AVATAR_URL } from '../constants/avatars';
import { realtimeService } from '../services/realtime';

interface ChatScreenProps {
  plate: string;
  roomCode: string;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onBlockRoom: () => void;
  onClose: () => void;
  userPhone: string;
  currentTheme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  isCarOwner?: boolean;
}

const STORAGE_OWNER_QUICK_REPLIES_KEY = 'parkla_owner_quick_replies_v2';
const STORAGE_REPORTER_QUICK_REPLIES_KEY = 'parkla_reporter_quick_replies_v2';
const STORAGE_LEGACY_QUICK_REPLIES_KEY = 'parkla_chat_quick_replies';
const STORAGE_PATTERN_KEY = 'plakala_chat_bg_pattern';
const STORAGE_OPACITY_KEY = 'plakala_chat_bg_opacity';
const STORAGE_COUNTERPART_GENDER_KEY = 'plakala_counterpart_gender';

// Araç Sahibine Özel Hazır Metinler (Kısa & Öz)
export const DEFAULT_OWNER_QUICK_REPLIES = [
  '2 dk\'ya geliyorum 🏃‍♂️',
  '5 dk\'ya araç başındayım ⏱️',
  'Hemen geliyorum, dörtyolları yaktım 🚨',
  'Hemen çekiyorum, kusura bakmayın 🚗',
  'Anahtarı güvenliğe bıraktım 🔑',
  'Aracı çektim, iyi günler ✅',
  'Kusura bakmayın, geldim 🙏',
  'Araç başındayım, neredesiniz? 👀',
  'Kilit açık, çekebilirsiniz 🔓',
  'Acil durum, 10 dk\'ya geliyorum ⚠️',
];

// Araç Sahibine Ulaşan Kişilere Özel Hazır Metinler (Kısa & Öz)
export const DEFAULT_REPORTER_QUICK_REPLIES = [
  'Çıkışım kapalı, aracı çeker misiniz? 🚗',
  'Acelem var, lütfen alabilir misiniz? ⏱️',
  'Camınız / sunroof açık kalmış 🪟',
  'Farlarınız açık kalmış 💡',
  'Araca temas oldu, bakar mısınız? ⚠️',
  'Alarmınız çalıyor 🔊',
  'Lastiğiniz inik görünüyor 🛞',
  'Garaj çıkışı kapalı 🚪',
  'Araç başındayım, bekliyorum 👀',
  'Tamamdır, bekliyorum 👍',
  'Çözüldü, teşekkürler 🙏',
];

export const ChatScreen: React.FC<ChatScreenProps> = ({
  plate,
  roomCode,
  messages,
  onSendMessage,
  onBlockRoom,
  onClose,
  userPhone,
  currentTheme = 'light',
  onToggleTheme,
  isCarOwner = false,
}) => {
  const [inputText, setInputText] = useState('');
  const [copied, setCopied] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [newReplyText, setNewReplyText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [contactPhone, setContactPhone] = useState(userPhone || '0532 000 00 00');

  // Full-size avatar preview modal state
  const [avatarPreview, setAvatarPreview] = useState<{
    photo: string | null;
    name: string;
    gender: UserGender;
    role: 'me' | 'other';
  } | null>(null);

  // Background pattern & texture state (configured in Profile screen)
  const [pattern] = useState<ChatPatternType>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PATTERN_KEY);
      if (saved === 'doodle' || saved === 'dots' || saved === 'grid' || saved === 'waves' || saved === 'none') {
        return saved;
      }
    } catch {}
    return 'doodle';
  });

  const [patternOpacity] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_OPACITY_KEY);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0.02 && parsed <= 0.3) return parsed;
      }
    } catch {}
    return 0.08;
  });

  // Profile photo & gender states for avatar borders (blue = male, pink = female)
  const [myPhoto] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(PROFILE_PHOTO_STORAGE_KEY);
      if (saved && !saved.includes('photo-1500648767791')) return saved;
    } catch {}
    return MALE_AVATAR_URL;
  });

  const [myGender] = useState<UserGender>(() => {
    try {
      const saved = localStorage.getItem(PROFILE_GENDER_STORAGE_KEY);
      if (saved === 'male' || saved === 'female' || saved === 'unspecified') return saved;
    } catch {}
    return 'male';
  });

  const [counterpartGender] = useState<UserGender>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_COUNTERPART_GENDER_KEY);
      if (saved === 'male' || saved === 'female' || saved === 'unspecified') return saved;
    } catch {}
    return 'female'; // default counterpart is female to show pink border vs male blue border
  });

  // Chat font weight
  const [fontWeight] = useState<ChatFontWeight>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FONT_WEIGHT_KEY);
      if (saved === 'light' || saved === 'normal' || saved === 'medium' || saved === 'bold') {
        return saved;
      }
    } catch {}
    return 'normal';
  });

  const fontWeightClass =
    fontWeight === 'light'
      ? 'font-light'
      : fontWeight === 'medium'
      ? 'font-medium'
      : fontWeight === 'bold'
      ? 'font-bold'
      : 'font-normal';

  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  const toastTimeoutRef = useRef<any>(null);
  const copyTimeoutRef = useRef<any>(null);
  const focusTimeoutRef = useRef<any>(null);

  // Clean up all pending timeouts when unmounting
  useEffect(() => {
    return () => {
      clearTimeout(typingTimeoutRef.current);
      clearTimeout(toastTimeoutRef.current);
      clearTimeout(copyTimeoutRef.current);
      clearTimeout(focusTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const unsubTyping = realtimeService.onTyping((data) => {
      if (data.roomCode === roomCode && data.senderId !== 'me') {
        setIsOtherTyping(data.isTyping);
        if (data.isTyping) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setIsOtherTyping(false);
          }, 3000);
        }
      }
    });

    return () => {
      unsubTyping();
      clearTimeout(typingTimeoutRef.current);
    };
  }, [roomCode]);

  // Quick replies list from localStorage or defaults based on real car ownership
  const [ownerReplies, setOwnerReplies] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_OWNER_QUICK_REPLIES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_OWNER_QUICK_REPLIES;
  });

  const [reporterReplies, setReporterReplies] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_REPORTER_QUICK_REPLIES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_REPORTER_QUICK_REPLIES;
  });

  const currentReplies = isCarOwner ? ownerReplies : reporterReplies;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveCurrentReplies = (updated: string[]) => {
    if (isCarOwner) {
      setOwnerReplies(updated);
      try {
        localStorage.setItem(STORAGE_OWNER_QUICK_REPLIES_KEY, JSON.stringify(updated));
      } catch {}
    } else {
      setReporterReplies(updated);
      try {
        localStorage.setItem(STORAGE_REPORTER_QUICK_REPLIES_KEY, JSON.stringify(updated));
      } catch {}
    }
  };

  const showToast = (text: string) => {
    setToastMessage(text);
    clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInputText('');
  };

  const handleInsertQuickReply = (text: string) => {
    setInputText(text);
    setShowDrawer(false);
    showToast('Mesaj metin alanına eklendi');
    clearTimeout(focusTimeoutRef.current);
    focusTimeoutRef.current = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
  };

  const handleSendQuickReplyDirectly = (text: string) => {
    onSendMessage(text);
    setShowDrawer(false);
    showToast('Mesaj gönderildi');
  };

  const handleAddCustomReply = () => {
    const trimmed = newReplyText.trim();
    if (!trimmed) return;
    if (currentReplies.includes(trimmed)) {
      showToast('Bu mesaj zaten listenizde var');
      return;
    }
    const updated = [trimmed, ...currentReplies];
    saveCurrentReplies(updated);
    setNewReplyText('');
    setShowAddForm(false);
    showToast('Yeni hızlı yanıt eklendi');
  };

  const handleDeleteReply = (index: number) => {
    const updated = currentReplies.filter((_, i) => i !== index);
    saveCurrentReplies(updated);
    showToast('Hızlı yanıt silindi');
  };

  const handleResetDefaults = () => {
    const defaults =
      isCarOwner ? DEFAULT_OWNER_QUICK_REPLIES : DEFAULT_REPORTER_QUICK_REPLIES;
    saveCurrentReplies(defaults);
    showToast('Varsayılan hazır mesajlar yüklendi');
  };

  // WhatsApp & Phone Contact Card Sender
  const handleSendWhatsAppCard = (phoneToUse?: string) => {
    const targetPhone = phoneToUse || contactPhone || userPhone || '0532 000 00 00';
    const clean = targetPhone.replace(/[^0-9]/g, '');
    const standardClean = clean.startsWith('90')
      ? clean.slice(2)
      : clean.startsWith('0')
      ? clean.slice(1)
      : clean;

    const messageText = `📱 WhatsApp & İletişim Kartı Paylaşıldı: ${targetPhone}\nhttps://wa.me/90${standardClean}\ntel:0${standardClean}`;
    onSendMessage(messageText);
    setShowDrawer(false);
    showToast('WhatsApp ve arama kartı sohbete iletildi');
  };

  const handleCopyRoomCode = () => {
    navigator.clipboard
      .writeText(roomCode)
      .then(() => {
        setCopied(true);
        clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => alert('Oda Kodu: ' + roomCode));
  };

  // Helper to parse messages for rich interactive cards (Location & WhatsApp/Call)
  const renderMessageContent = (text: string, isMe: boolean) => {
    // 1. WhatsApp & Phone Contact Card
    const isContactMsg =
      text.includes('wa.me') ||
      text.includes('WhatsApp & İletişim') ||
      text.includes('WhatsApp numaram');

    if (isContactMsg) {
      // Extract phone digits
      const digitsMatch = text.match(/90([0-9]{10})/) || text.match(/tel:(?:0)?([0-9]{10})/);
      const rawNumber = digitsMatch ? digitsMatch[1] : '5320000000';
      const cleanPhone = `90${rawNumber}`;
      const telNumber = `0${rawNumber}`;
      const formattedDisplay = `0${rawNumber.slice(0, 3)} ${rawNumber.slice(3, 6)} ${rawNumber.slice(6, 8)} ${rawNumber.slice(8, 10)}`;

      return (
        <div className="flex flex-col gap-2.5 min-w-[240px]">
          {/* Header */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-xs">
              <MessageCircle className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="font-extrabold text-xs flex items-center gap-1.5">
                <span>İletişim & WhatsApp Kartı</span>
              </div>
              <div className="font-mono font-bold text-xs opacity-90">
                {formattedDisplay}
              </div>
            </div>
          </div>

          <div
            className={`text-[11px] leading-tight ${
              isMe ? 'text-black/80' : 'text-slate-600 dark:text-zinc-300'
            }`}
          >
            {isMe
              ? 'Karşı tarafa WhatsApp ve arama butonları iletildi.'
              : 'Araç sahibiyle aşağıdaki butonları kullanarak hemen iletişime geçebilirsiniz:'}
          </div>

          {/* Action Buttons: "WhatsApp ile İletişime Geç" and "Ara" */}
          <div className="flex flex-col gap-1.5 pt-1">
            <a
              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                'Merhaba, Parkla üzerinden aracınızla ilgili ulaşıyorum.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs shadow-xs transition-transform active:scale-95 text-center cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white shrink-0" />
              <span>WhatsApp ile İletişime Geç</span>
            </a>

            <a
              href={`tel:${telNumber}`}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-extrabold text-xs shadow-xs transition-transform active:scale-95 text-center cursor-pointer ${
                isMe
                  ? 'bg-black text-white hover:bg-neutral-800'
                  : 'bg-[#111315] hover:bg-neutral-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black'
              }`}
            >
              <Phone className="w-3.5 h-3.5 fill-current shrink-0" />
              <span>Ara</span>
            </a>
          </div>
        </div>
      );
    }

    // Default text
    return <div className="whitespace-pre-wrap break-words">{text}</div>;
  };

  // Filter out any duplicate messages to guarantee single message bubble
  const uniqueMessages = React.useMemo(() => {
    const seenIds = new Set<string>();
    const result: ChatMessage[] = [];
    for (const msg of messages) {
      if (seenIds.has(msg.id)) continue;
      seenIds.add(msg.id);
      result.push(msg);
    }
    return result;
  }, [messages]);

  return (
    <div className="fixed inset-0 z-50 bg-[#f7f9fc] dark:bg-[#14171a] flex flex-col max-w-[440px] mx-auto shadow-2xl overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-60 bg-[#111315] dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-xs font-bold shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2 pointer-events-none">
          <Sparkles className="w-3.5 h-3.5 text-[#d8ff35] dark:text-[#536500]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Safe Area support */}
      <header className="pt-[env(safe-area-inset-top,0px)] h-[calc(4rem+env(safe-area-inset-top,0px))] px-4 flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#1e2226] sticky top-0 z-10 shrink-0">
        <button
          onClick={onClose}
          aria-label="Geri"
          className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div
          onClick={handleCopyRoomCode}
          className="text-center cursor-pointer select-none"
          title="Kodu Kopyala"
        >
          <div className="font-mono-plate font-black text-base text-[#111315] dark:text-white">
            {plate}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold flex items-center justify-center gap-1">
            <span>ODA:</span>
            <span className="text-[#111315] dark:text-[#d8ff35] underline decoration-dotted">
              {roomCode}
            </span>
            {copied ? (
              <Check className="w-3 h-3 text-[#536500] dark:text-[#d8ff35]" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Night / Day Theme Toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              aria-label={currentTheme === 'dark' ? 'Gündüz Moduna Geç' : 'Gece Moduna Geç'}
              title={currentTheme === 'dark' ? 'Gündüz Moduna Geç' : 'Gece Moduna Geç'}
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-transform active:scale-95 cursor-pointer"
            >
              {currentTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#d8ff35]" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
          )}

          {/* Block Room Button */}
          <button
            onClick={onBlockRoom}
            aria-label="Engelle"
            title="Odayı Engelle"
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-200 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
          >
            <UserX className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Messages Feed Container with Customizable Background Pattern */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {/* Subtle Background Pattern */}
        <ChatBackgroundPattern
          pattern={pattern}
          opacity={patternOpacity}
          className="text-slate-900 dark:text-white"
        />

        {/* Scrollable Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 relative z-10">
          {/* Ephemeral Privacy Notice */}
          <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-[#1e2226]/90 backdrop-blur-xs border border-slate-200/80 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 text-center text-xs leading-relaxed max-w-[92%] mx-auto shadow-2xs">
            <Shield className="w-4 h-4 text-[#536500] dark:text-[#d8ff35] inline mr-1.5" />
            Bu sohbet odası uçtan uca anonimdir. Kişisel veri saklanmaz ve oda 24
            saat sonra imha edilir.
          </div>

          {uniqueMessages.map((msg) => {
            const isMe = msg.sender === 'me';
            const isSeen = msg.status === 'seen';

            // Gender styling: Male = Blue frame, Female = Pink frame, Unspecified = Neutral
            const msgGender: UserGender = isMe
              ? (msg.senderGender || myGender)
              : (msg.senderGender || counterpartGender);

            const borderClass =
              msgGender === 'male'
                ? 'border-2 border-blue-500 ring-2 ring-blue-500/25 shadow-blue-500/10'
                : msgGender === 'female'
                ? 'border-2 border-pink-500 ring-2 ring-pink-500/25 shadow-pink-500/10'
                : 'border-2 border-slate-300 dark:border-zinc-700';

            const genderBadgeBg =
              msgGender === 'male' ? 'bg-blue-500' : msgGender === 'female' ? 'bg-pink-500' : 'bg-slate-500';

            const avatarPhoto = isMe ? (msg.senderPhoto || myPhoto) : msg.senderPhoto;

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 transition-all ${
                  isMe ? 'justify-end self-end max-w-[92%]' : 'justify-start self-start max-w-[92%]'
                }`}
              >
                {/* Diğer Sürücünün Profil Resmi (Solda) */}
                {!isMe && (
                  <button
                    type="button"
                    onClick={() =>
                      setAvatarPreview({
                        photo: avatarPhoto || null,
                        name: `${plate} Sürücüsü`,
                        gender: msgGender,
                        role: 'other',
                      })
                    }
                    className="shrink-0 mb-0.5 relative group select-none cursor-pointer focus:outline-none"
                    title="Profil resmini görüntüle"
                    aria-label="Profil resmini görüntüle"
                  >
                    <div
                      className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-white dark:bg-zinc-800 shadow-xs transition-transform group-hover:scale-115 active:scale-90 ${borderClass}`}
                    >
                      {avatarPhoto ? (
                        <img src={avatarPhoto} alt="Diğer Sürücü" className="w-full h-full object-cover" />
                      ) : (
                        <User className={`w-4 h-4 ${msgGender === 'female' ? 'text-pink-500' : 'text-blue-500'}`} />
                      )}
                    </div>
                    {/* Küçük cinsiyet rozeti */}
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${genderBadgeBg} text-white text-[7px] font-black flex items-center justify-center border border-white dark:border-[#14171a] shadow-xs`}
                    >
                      {msgGender === 'female' ? '♀' : '♂'}
                    </div>
                  </button>
                )}

                {/* Mesaj Balonu */}
                <div
                  className={`p-3.5 rounded-2xl text-xs ${fontWeightClass} shadow-xs leading-relaxed transition-all min-w-[70px] ${
                    isMe
                      ? 'rounded-br-xs bg-[#d8ff35] text-black shadow-black/5'
                      : 'rounded-bl-xs bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 text-[#111315] dark:text-white'
                  }`}
                >
                  {renderMessageContent(msg.text, isMe)}
                  <div
                    className={`text-[9px] mt-1.5 flex items-center justify-end gap-1.5 font-medium ${
                      isMe ? 'text-black/60' : 'text-slate-400 dark:text-zinc-500'
                    }`}
                  >
                    <span>{msg.timeFormatted}</span>
                    {isMe && (
                      <span
                        className={`inline-flex items-center gap-0.5 transition-all duration-300 select-none ${
                          isSeen
                            ? 'text-blue-700 font-extrabold scale-100'
                            : 'text-black/40 font-medium scale-95'
                        }`}
                        title={isSeen ? 'Görüldü' : 'İletildi'}
                      >
                        {isSeen ? (
                          <span className="inline-flex items-center gap-0.5 animate-in fade-in zoom-in-90 duration-300">
                            <CheckCheck className="w-3.5 h-3.5 stroke-[2.8] text-blue-700 drop-shadow-xs" />
                            <span className="text-[8px] uppercase tracking-wider font-black text-blue-800">
                              Görüldü
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5">
                            <Check className="w-3.5 h-3.5 stroke-[2]" />
                            <span className="text-[8px] text-black/50">İletildi</span>
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Kendi Profil Resmim (Sağda) */}
                {isMe && (
                  <button
                    type="button"
                    onClick={() =>
                      setAvatarPreview({
                        photo: avatarPhoto || null,
                        name: 'Sen (Profilin)',
                        gender: msgGender,
                        role: 'me',
                      })
                    }
                    className="shrink-0 mb-0.5 relative group select-none cursor-pointer focus:outline-none"
                    title="Profil resmini görüntüle"
                    aria-label="Profil resmini görüntüle"
                  >
                    <div
                      className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-white dark:bg-zinc-800 shadow-xs transition-transform group-hover:scale-115 active:scale-90 ${borderClass}`}
                    >
                      {avatarPhoto ? (
                        <img src={avatarPhoto} alt="Sen" className="w-full h-full object-cover" />
                      ) : (
                        <User className={`w-4 h-4 ${msgGender === 'female' ? 'text-pink-500' : 'text-blue-500'}`} />
                      )}
                    </div>
                    {/* Küçük cinsiyet rozeti */}
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${genderBadgeBg} text-white text-[7px] font-black flex items-center justify-center border border-white dark:border-[#14171a] shadow-xs`}
                    >
                      {msgGender === 'female' ? '♀' : '♂'}
                    </div>
                  </button>
                )}
              </div>
            );
          })}

          {/* Real-time typing bubble */}
          {isOtherTyping && (
            <div className="flex items-center gap-2 max-w-[85%] self-start animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center border-2 border-pink-500 shrink-0">
                <span className="text-[10px] font-bold">...</span>
              </div>
              <div className="bg-slate-100 dark:bg-zinc-800/90 text-slate-500 dark:text-zinc-400 text-xs px-3.5 py-2 rounded-2xl rounded-bl-sm flex items-center gap-1.5 shadow-xs border border-slate-200/50 dark:border-zinc-700/50">
                <span className="font-semibold text-[11px]">Sürücü yazıyor</span>
                <span className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-zinc-400 rounded-full animate-bounce"></span>
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Replies & Actions Drawer Overlay & Sheet */}
      {showDrawer && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          {/* Dismiss backdrop */}
          <div
            className="flex-1"
            onClick={() => setShowDrawer(false)}
            aria-label="Kapat"
          />

          <div className="bg-white dark:bg-[#1e2226] border-t border-slate-200 dark:border-zinc-800 rounded-t-3xl shadow-2xl flex flex-col max-h-[78vh] animate-in slide-in-from-bottom duration-250">
            {/* Drawer Handle & Header */}
            <div className="pt-3 pb-2 px-5 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#d8ff35] animate-pulse" />
                <h3 className="font-extrabold text-sm text-[#111315] dark:text-white">
                  Hızlı Eylemler & Yanıtlar
                </h3>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
                aria-label="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              {/* 1. WHATSAPP & CALL CARD */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border border-emerald-500/30 flex flex-col gap-2.5 shadow-2xs">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-xs">
                      <MessageCircle className="w-5 h-5 fill-white" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
                        WhatsApp & Arama Butonları Gönder
                        <span className="text-[9px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase">
                          Hızlı İletişim
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80 mt-0.5">
                        Telefon numaranızı ve doğrudan WhatsApp sohbet bağlantınızı karşı tarafa iletin.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleSendWhatsAppCard()}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm cursor-pointer"
                >
                  <Send className="w-4 h-4 fill-current" />
                  <span>WhatsApp & Arama Butonlarını Gönder</span>
                </button>
              </div>

              {/* 2. CUSTOMIZABLE PREDEFINED MESSAGES */}
              {showAddForm ? (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 space-y-2.5">
                  <div className="text-xs font-bold text-[#111315] dark:text-white flex items-center justify-between">
                    <span>Yeni Hazır Mesaj Ekle</span>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    >
                      Vazgeç
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newReplyText}
                      onChange={(e) => setNewReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCustomReply()}
                      placeholder="Örn: 2 dakikaya geliyorum, asansördeyim..."
                      maxLength={140}
                      className="flex-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-[#111315] dark:text-white outline-none focus:border-[#d8ff35]"
                    />
                    <button
                      onClick={handleAddCustomReply}
                      className="px-4 py-2 bg-[#d8ff35] text-black font-extrabold text-xs rounded-xl hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                    >
                      Ekle
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                    <span>Hazır Mesaj Şablonları</span>
                    <span className="text-slate-300 dark:text-zinc-600">•</span>
                    <span>{currentReplies.length}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="text-[11px] font-bold text-slate-700 dark:text-zinc-200 hover:text-[#536500] dark:hover:text-[#d8ff35] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Yeni Ekle
                    </button>
                    <button
                      onClick={handleResetDefaults}
                      title="Varsayılan Şablonları Geri Yükle"
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Predefined Messages List */}
              <div className="space-y-2">
                {currentReplies.map((reply, idx) => (
                  <div
                    key={idx}
                    className="group flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-100 dark:border-zinc-800 transition-all text-xs"
                  >
                    <button
                      onClick={() => handleSendQuickReplyDirectly(reply)}
                      title="Otomatik Gönder"
                      className="flex-1 flex items-center justify-between text-left font-medium text-[#111315] dark:text-white hover:text-emerald-700 dark:hover:text-[#d8ff35] transition-colors pr-2 cursor-pointer active:scale-[0.99]"
                    >
                      <span>{reply}</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0 text-[#536500] dark:text-[#d8ff35]">
                        <Send className="w-3 h-3 fill-current" />
                      </span>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleSendQuickReplyDirectly(reply)}
                        title="Otomatik Gönder"
                        className="px-2.5 py-1 rounded-lg bg-[#d8ff35] text-black font-extrabold text-[10px] hover:brightness-105 active:scale-95 transition-transform cursor-pointer flex items-center gap-1"
                      >
                        <Send className="w-2.5 h-2.5 fill-current" />
                        <span>Gönder</span>
                      </button>
                      <button
                        onClick={() => handleDeleteReply(idx)}
                        title="Sil"
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Drawer Bottom Note */}
            <div className="p-3 bg-slate-50 dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 text-center text-[10px] text-slate-400 dark:text-zinc-500">
              Hazır mesaja dokunduğunuzda anında otomatik olarak sohbete gönderilir.
            </div>
          </div>
        </div>
      )}

      {/* Profil Resmi Büyütme & Önizleme Modalı */}
      {avatarPreview && (
        <div
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setAvatarPreview(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 max-w-xs w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Kapat Butonu */}
            <button
              onClick={() => setAvatarPreview(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Kapat"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Cinsiyet Rozeti */}
            <div className="flex items-center gap-2 mb-4">
              <span
                className={`text-xs font-black uppercase px-3.5 py-1 rounded-full ${
                  avatarPreview.gender === 'male'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                    : avatarPreview.gender === 'female'
                    ? 'bg-pink-100 text-pink-700 dark:bg-pink-950/80 dark:text-pink-300 border border-pink-300 dark:border-pink-800'
                    : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                {avatarPreview.gender === 'male' ? 'Erkek' : 'Kadın'}
              </span>
            </div>

            {/* Büyük Profil Fotoğrafı Alanı */}
            <div
              className={`w-44 h-44 rounded-full overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-zinc-900 shadow-2xl transition-all relative ${
                avatarPreview.gender === 'male'
                  ? 'border-4 border-blue-500 ring-4 ring-blue-500/30 shadow-blue-500/25'
                  : avatarPreview.gender === 'female'
                  ? 'border-4 border-pink-500 ring-4 ring-pink-500/30 shadow-pink-500/25'
                  : 'border-4 border-slate-300 dark:border-zinc-700'
              }`}
            >
              {avatarPreview.photo ? (
                <img
                  src={avatarPreview.photo}
                  alt={avatarPreview.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User
                  className={`w-24 h-24 ${
                    avatarPreview.gender === 'female' ? 'text-pink-500' : 'text-blue-500'
                  }`}
                />
              )}
            </div>

            {/* Bilgi Yazıları */}
            <h4 className="mt-4 text-base font-black text-[#111315] dark:text-white">
              {avatarPreview.name}
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              {avatarPreview.role === 'me'
                ? 'Kendi sürücü profil fotoğrafınız ve çerçeveniz'
                : `${plate} plakasının doğrulanmış sürücüsü`}
            </p>

            {/* Kapat Butonu */}
            <button
              onClick={() => setAvatarPreview(null)}
              className="mt-5 w-full py-2.5 px-4 rounded-xl bg-[#111315] dark:bg-white text-white dark:text-black font-extrabold text-xs active:scale-95 transition-transform cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* Input & Quick Replies Bar */}
      <div className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#1e2226] p-3 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] shrink-0">
        {/* Horizontal Quick Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 no-scrollbar select-none">
          {/* Quick Preset Templates */}
          {currentReplies.slice(0, 6).map((reply, i) => (
            <button
              key={i}
              onClick={() => handleSendQuickReplyDirectly(reply)}
              className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-[#111315] dark:text-white text-xs font-semibold whitespace-nowrap hover:bg-slate-200 dark:hover:bg-zinc-700 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              {reply}
            </button>
          ))}
        </div>

        {/* Text Input Row */}
        <div className="flex items-center gap-2 mt-1">
          {/* Quick Actions Mini Lightning Bolt Icon */}
          <button
            onClick={() => setShowDrawer(true)}
            aria-label="Tüm Hızlı Eylemler & Hazır Mesajlar"
            title="Tüm Hızlı Eylemler & Hazır Mesajlar"
            className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 flex items-center justify-center shrink-0 hover:bg-slate-200 dark:hover:bg-zinc-700 active:scale-90 transition-all cursor-pointer"
          >
            <Zap className="w-5 h-5 fill-current stroke-[2.5]" />
          </button>

          {/* Chat text input */}
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => {
              const val = e.target.value;
              setInputText(val);
              realtimeService.sendTyping({
                roomCode,
                plate,
                isTyping: val.length > 0,
                senderId: 'me',
              });
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Mesaj yazın..."
            className="flex-1 h-12 bg-slate-100 dark:bg-zinc-800 rounded-full px-5 text-sm font-medium text-[#111315] dark:text-white outline-none focus:ring-2 focus:ring-[#111315] dark:focus:ring-[#d8ff35] transition-all"
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            aria-label="Gönder"
            className="w-12 h-12 rounded-full bg-[#d8ff35] text-black flex items-center justify-center font-bold active:scale-95 transition-all shadow-sm hover:brightness-105 shrink-0 disabled:opacity-40 disabled:scale-100 cursor-pointer"
          >
            <Send className="w-5 h-5 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};
