import React, { useState } from 'react';
import {
  ArrowLeft,
  Shield,
  MessageSquare,
  Car as CarIcon,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Database,
  Lock,
  Unlock,
  Download,
  AlertTriangle,
  Send,
  Eye,
} from 'lucide-react';
import { Car, NotificationItem, ChatMessage, ScreenType } from '../types';
import { getProvinceName, parsePlateToSegments } from '../utils/provinces';
import { triggerHaptic } from '../utils/haptics';

interface AdminScreenProps {
  cars: Car[];
  notifications: NotificationItem[];
  chatRooms: Record<string, ChatMessage[]>;
  recentSearches: string[];
  onNavigate: (screen: ScreenType) => void;
  onOpenRoom: (roomCode: string, targetPlate?: string) => void;
  onBlockUser: () => void;
  onUnblockUser: () => void;
  isCurrentUserBlocked?: boolean;
  unblockRequested?: boolean;
  blockReason?: string;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({
  cars,
  notifications,
  chatRooms,
  recentSearches,
  onNavigate,
  onOpenRoom,
  onBlockUser,
  onUnblockUser,
  isCurrentUserBlocked,
  unblockRequested,
  blockReason,
}) => {
  const [activeTab, setActiveTab] = useState<'chats' | 'cars' | 'spam' | 'blocked' | 'system'>('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Misuse Detection Logic: Find plates receiving > 3 notifications/rooms
  const plateInteractionCounts: Record<string, number> = {};
  notifications.forEach((n) => {
    plateInteractionCounts[n.targetPlate] = (plateInteractionCounts[n.targetPlate] || 0) + 1;
  });

  const suspiciousPlates = Object.entries(plateInteractionCounts)
    .filter(([_, count]) => count >= 3)
    .map(([plate, count]) => ({
      plate,
      count,
      province: getProvinceName(parsePlateToSegments(plate).city) || 'Bilinmiyor',
      notifications: notifications.filter((n) => n.targetPlate === plate),
    }))
    .sort((a, b) => b.count - a.count);

  // Fix: Show Room Inspector regardless of activeTab if selectedRoom is set
  const showRoomInspector = Boolean(selectedRoom);

  // Calculate total messages
  const totalMessagesCount = Object.values(chatRooms).reduce((acc, curr) => acc + curr.length, 0);

  // Room entries
  const roomEntries = Object.entries(chatRooms).map(([roomCode, messages]) => {
    // Find matching notification to get target plate
    const notif = notifications.find((n) => n.roomCode === roomCode);
    const targetPlate = notif?.targetPlate || 'Bilinmiyor';
    const lastMsg = messages[messages.length - 1];
    return {
      roomCode,
      targetPlate,
      messages,
      lastMsg,
      timestamp: lastMsg?.timestamp || 0,
      notification: notif,
    };
  }).sort((a, b) => b.timestamp - a.timestamp);

  // Filtered rooms
  const filteredRooms = roomEntries.filter(
    (r) =>
      r.roomCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.targetPlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.messages.some((m) => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filtered cars
  const filteredCars = cars.filter(
    (c) =>
      c.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Export system data to JSON
  const handleExportData = () => {
    const backupData = {
      cars,
      notifications,
      chatRooms,
      recentSearches,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plakala_admin_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentSelectedRoomData = roomEntries.find((r) => r.roomCode === selectedRoom);

  return (
    <div className="flex-1 flex flex-col px-4 py-3 max-w-[460px] mx-auto w-full pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
        <button
          onClick={() => onNavigate('home')}
          className="text-xs font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 hover:text-[#111315] dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Uygulamaya Dön
        </button>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-black tracking-wide border border-red-500/30 flex items-center gap-1">
            <Shield className="w-3 h-3" /> GELİŞTİRİCİ PANELİ
          </span>
        </div>
      </div>

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="mt-2 p-3 bg-emerald-500 text-white rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Admin Title Card */}
      <div className="mt-3 bg-gradient-to-r from-[#111315] to-[#1c2024] text-white p-4 rounded-3xl shadow-lg border border-zinc-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-[#d8ff35]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-extrabold uppercase text-[#d8ff35] tracking-wider">
              Özel Yönetici &amp; Denetim Alanı
            </div>
            <h1 className="text-xl font-black mt-0.5 tracking-tight">
              Sistem &amp; Mesajlaşma İzleyici
            </h1>
            <p className="text-[11px] text-zinc-400 mt-1">
              Plakalar, aktif sohbet odaları ve kullanıcı mesajlaşmaları canlı listelenmektedir.
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#d8ff35] text-black flex items-center justify-center font-black shrink-0 shadow-md">
            <Lock className="w-5 h-5 text-black" />
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-zinc-800/80">
          <div className="bg-zinc-900/80 rounded-xl p-2 text-center border border-zinc-800">
            <span className="text-[9px] font-bold text-zinc-400 block uppercase">Kayıtlı Araç</span>
            <span className="font-mono text-base font-black text-[#d8ff35]">{cars.length}</span>
          </div>
          <div className="bg-zinc-900/80 rounded-xl p-2 text-center border border-zinc-800">
            <span className="text-[9px] font-bold text-zinc-400 block uppercase">Sohbet Odası</span>
            <span className="font-mono text-base font-black text-white">{Object.keys(chatRooms).length}</span>
          </div>
          <div className="bg-zinc-900/80 rounded-xl p-2 text-center border border-zinc-800">
            <span className="text-[9px] font-bold text-zinc-400 block uppercase">Toplam Mesaj</span>
            <span className="font-mono text-base font-black text-emerald-400">{totalMessagesCount}</span>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mt-3">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Plaka, oda kodu veya mesaj metni ara..."
          className="w-full h-11 pl-10 pr-4 rounded-2xl bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-[#111315] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#d8ff35] dark:focus:border-[#d8ff35] transition-colors shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-black dark:hover:text-white"
          >
            Temizle
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-2xl mt-3 text-xs font-bold">
        <button
          onClick={() => {
            setActiveTab('chats');
            setSelectedRoom(null);
          }}
          className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'chats'
              ? 'bg-white dark:bg-[#111315] text-[#111315] dark:text-white shadow-xs font-black'
              : 'text-slate-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Mesajlar ({Object.keys(chatRooms).length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('cars');
            setSelectedRoom(null);
          }}
          className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'cars'
              ? 'bg-white dark:bg-[#111315] text-[#111315] dark:text-white shadow-xs font-black'
              : 'text-slate-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
          }`}
        >
          <CarIcon className="w-3.5 h-3.5" />
          <span>Plakalar ({cars.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('spam');
            setSelectedRoom(null);
          }}
          className={`px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'spam'
              ? 'bg-white dark:bg-[#111315] text-[#111315] dark:text-white shadow-xs font-black'
              : 'text-slate-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
          }`}
          title="Şüpheli Etkileşim"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Şüpheli ({suspiciousPlates.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('blocked');
            setSelectedRoom(null);
          }}
          className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'blocked'
              ? 'bg-white dark:bg-[#111315] text-[#111315] dark:text-white shadow-xs font-black'
              : 'text-slate-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Kısıtlı ({isCurrentUserBlocked ? 1 : 0})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('system');
            setSelectedRoom(null);
          }}
          className={`px-3 py-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'system'
              ? 'bg-white dark:bg-[#111315] text-[#111315] dark:text-white shadow-xs font-black'
              : 'text-slate-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
          }`}
          title="Sistem Araçları"
        >
          <Database className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Global Room Inspector (Fixes the "Gör" button issue) */}
      {showRoomInspector && currentSelectedRoomData && (
        <div className="mt-3 bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 rounded-3xl p-4 shadow-sm animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
            <button
              onClick={() => setSelectedRoom(null)}
              className="text-xs font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1 hover:text-black dark:hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Kapat
            </button>
            <div className="flex items-center gap-2">
              <span className="font-mono-plate px-2.5 py-0.5 rounded-full bg-[#111315] text-[#d8ff35] text-xs font-black">
                {currentSelectedRoomData.targetPlate}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                {getProvinceName(parsePlateToSegments(currentSelectedRoomData.targetPlate).city) || 'Bilinmiyor'}
              </span>
            </div>
          </div>

          <div className="my-3 space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {currentSelectedRoomData.messages.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Bu odada henüz mesaj bulunmuyor.</p>
            ) : (
              currentSelectedRoomData.messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-2xl text-xs ${
                    m.sender === 'me'
                      ? 'bg-[#111315] text-white ml-6'
                      : m.sender === 'system'
                      ? 'bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-center text-[11px]'
                      : 'bg-slate-100 dark:bg-zinc-800 text-[#111315] dark:text-white mr-6'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] opacity-70 mb-1">
                    <span className="font-extrabold uppercase">
                      {m.sender === 'me' ? 'Sahip' : m.sender === 'system' ? 'Sistem' : 'Diğer'}
                    </span>
                    <span>{m.timeFormatted}</span>
                  </div>
                  <p className="leading-relaxed font-medium">{m.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 1: Chat Messages & Rooms */}
      {activeTab === 'chats' && !showRoomInspector && (
        <div className="mt-3 space-y-2.5">
          {filteredRooms.length === 0 ? (
            <div className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 text-center text-xs text-slate-400">
              Herhangi bir sohbet odası veya mesaj kaydı bulunamadı.
            </div>
          ) : (
            filteredRooms.map((room) => (
              <div
                key={room.roomCode}
                onClick={() => setSelectedRoom(room.roomCode)}
                className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 rounded-2xl p-3.5 shadow-2xs hover:border-[#111315] dark:hover:border-[#d8ff35] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="font-mono-plate bg-[#111315] text-[#d8ff35] px-2.5 py-0.5 rounded-full text-xs font-black">
                      {room.targetPlate}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                      {getProvinceName(parsePlateToSegments(room.targetPlate).city) || '??'}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-zinc-400">
                      Oda #{room.roomCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                      {room.messages.length} Mesaj
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                {/* Last message preview */}
                {room.lastMsg ? (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-300">
                    <span className="truncate max-w-[260px] font-medium">
                      <strong className="text-black dark:text-white mr-1">
                        {room.lastMsg.sender === 'me' ? 'Araç Sahibi:' : 'Bildiren:'}
                      </strong>
                      "{room.lastMsg.text}"
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                      {room.lastMsg.timeFormatted || 'Şimdi'}
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1 italic">Henüz mesajlaşma başlatılmadı</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Registered Cars */}
      {activeTab === 'cars' && (
        <div className="mt-3 space-y-2">
          {filteredCars.length === 0 ? (
            <div className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 text-center text-xs text-slate-400">
              Kayıtlı araç bulunamadı.
            </div>
          ) : (
            filteredCars.map((car) => (
              <div
                key={car.id}
                className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 rounded-2xl p-3.5 shadow-2xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="font-mono-plate bg-[#111315] text-[#d8ff35] px-3 py-1 rounded-full text-sm font-black tracking-wider text-center">
                      {car.plate}
                    </div>
                    <div className="text-[9px] text-center font-bold uppercase text-slate-500 bg-slate-100 dark:bg-zinc-800 rounded py-0.5">
                      {getProvinceName(parsePlateToSegments(car.plate).city) || 'Bilinmiyor'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-black text-[#111315] dark:text-white flex items-center gap-1.5">
                      <span>PIN Kodu:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{car.code}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                      Kayıt Tarihi: {car.addedAt || 'Bilinmiyor'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {car.isPrimary && (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Birincil
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Misuse Detection (Spam Watch) */}
      {activeTab === 'spam' && !showRoomInspector && (
        <div className="mt-3 space-y-3">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
            <div className="flex items-center gap-2 font-black mb-1">
              <AlertTriangle className="w-4 h-4" />
              GÜVENLİK DENETİMİ
            </div>
            Aşağıdaki plakalar 24 saat içinde <strong>3 veya daha fazla</strong> farklı kişiyle iletişime geçmiştir.
          </div>

          {suspiciousPlates.length === 0 ? (
            <div className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 text-center text-xs text-slate-400">
              Şu an için şüpheli etkileşim tespit edilmedi.
            </div>
          ) : (
            suspiciousPlates.map((item) => (
              <div
                key={item.plate}
                className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm border-l-4 border-l-red-500"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-plate bg-[#111315] text-[#d8ff35] px-3 py-1 rounded-full text-sm font-black">
                      {item.plate}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500">
                      {item.province}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] font-black text-red-500 uppercase tracking-tighter">Yoğunluk</span>
                    <span className="text-lg font-black text-[#111315] dark:text-white leading-none">
                      {item.count} <span className="text-xs font-normal text-slate-400">Oda</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {item.notifications.map((n) => (
                    <div key={n.id} className="bg-slate-50 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                      <div className="min-w-0 flex-1 text-[11px]">
                        <div className="font-bold text-[#111315] dark:text-white truncate">{n.reason}</div>
                        <div className="text-slate-500">{n.timeFormatted} · {n.roomCode}</div>
                      </div>
                      <button
                        onClick={() => setSelectedRoom(n.roomCode)}
                        className="ml-3 p-2 rounded-lg bg-white dark:bg-zinc-700 text-slate-400 hover:text-black dark:hover:text-white border border-slate-200 dark:border-zinc-600 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Yan Yana Butonlar: Kısıtlamayı Kaldır (Aç) & Kullanıcıyı Kısıtla */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button
                    type="button"
                    className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
                    onClick={() => {
                      triggerHaptic('success');
                      onUnblockUser();
                      setToastMessage(`${item.plate} plakasının kısıtlaması kaldırıldı.`);
                      setTimeout(() => setToastMessage(null), 3000);
                    }}
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Kısıtlamayı Kaldır (Aç)</span>
                  </button>

                  <button
                    type="button"
                    className="h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
                    onClick={() => {
                      triggerHaptic('warning');
                      onBlockUser();
                      setToastMessage(`${item.plate} kullanıcısı başarıyla kısıtlandı.`);
                      setTimeout(() => setToastMessage(null), 3000);
                    }}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Kullanıcıyı Kısıtla</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 4: Blocked Accounts & Requests */}
      {activeTab === 'blocked' && !showRoomInspector && (
        <div className="mt-3 space-y-3">
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-900 dark:text-red-200 text-xs">
            <div className="flex items-center gap-2 font-black mb-1">
              <Lock className="w-4 h-4" /> KISITLANMIŞ HESAPLAR
            </div>
            Aşağıdaki kullanıcılar uygulama suistimali nedeniyle kısıtlanmıştır.
          </div>

          <div className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isCurrentUserBlocked ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                }`}>
                  {isCurrentUserBlocked ? <Shield className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-xs font-black text-[#111315] dark:text-white">Anonim Kullanıcı</div>
                  <div className="text-[10px] text-slate-500">
                    Durum:{' '}
                    <span className={isCurrentUserBlocked ? 'text-red-500 font-bold' : 'text-emerald-500 font-bold'}>
                      {isCurrentUserBlocked
                        ? (unblockRequested ? 'Kısıtlı (Açılma Talebi Var)' : 'Kısıtlı')
                        : 'Aktif (Kısıtlama Yok)'}
                    </span>
                  </div>
                  {isCurrentUserBlocked && blockReason && (
                    <div className="text-[10px] text-red-500 font-semibold mt-0.5">Sebep: {blockReason}</div>
                  )}
                </div>
              </div>
              {isCurrentUserBlocked && unblockRequested && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[9px] font-black uppercase">Talep Var</span>
              )}
            </div>

            {/* Yan yana (Side-by-side) Aksiyon Butonları */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('success');
                  onUnblockUser();
                  setToastMessage('Kısıtlama başarıyla kaldırıldı (Hesap Açıldı).');
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md cursor-pointer"
              >
                <Unlock className="w-4 h-4 stroke-[2.5]" />
                <span>Kısıtlamayı Kaldır (Aç)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('warning');
                  onBlockUser();
                  setToastMessage('Kullanıcı başarıyla kısıtlandı.');
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md cursor-pointer"
              >
                <Lock className="w-4 h-4 stroke-[2.5]" />
                <span>Kullanıcıyı Kısıtla</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: System & Developer Tools */}
      {activeTab === 'system' && (
        <div className="mt-3 space-y-3">
          <div className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 rounded-3xl p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Yönetici Veri İçe / Dışa Aktarma
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
              Tüm araç plakalarını, mesajlaşma geçmişlerini ve oturum kodlarını JSON formatında bilgisayarınıza veya telefonunuza yedekleyin.
            </p>
            <button
              onClick={handleExportData}
              className="w-full h-11 bg-[#111315] dark:bg-white text-white dark:text-[#111315] rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:opacity-90 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Tüm Verileri JSON Olarak İndir
            </button>
          </div>

          <div className="bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 rounded-3xl p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Son Yapılan Plaka Aramaları
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {recentSearches.length === 0 ? (
                <span className="text-xs text-slate-400">Arama kaydı yok.</span>
              ) : (
                recentSearches.map((s, idx) => (
                  <span
                    key={idx}
                    className="font-mono-plate bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-xl text-xs font-black text-[#111315] dark:text-white"
                  >
                    {s}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
