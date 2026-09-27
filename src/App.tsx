import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SideDrawer } from './components/SideDrawer';
import { BottomNav } from './components/BottomNav';
import { OfflineBanner } from './components/OfflineBanner';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { HomeScreen } from './screens/HomeScreen';
import { AddCarScreen } from './screens/AddCarScreen';
import { ReasonScreen } from './screens/ReasonScreen';
import { StatusScreen } from './screens/StatusScreen';
import { IncomingScreen } from './screens/IncomingScreen';
import { ChatScreen } from './screens/ChatScreen';
import { ParkScreen } from './screens/ParkScreen';
import { MyCarsScreen } from './screens/MyCarsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { FaqScreen } from './screens/FaqScreen';
import { InfoScreen } from './screens/InfoScreen';
import { MissionScreen } from './screens/MissionScreen';
import { AboutScreen } from './screens/AboutScreen';
import { InstallScreen } from './screens/InstallScreen';
import { AdminScreen } from './screens/AdminScreen';
import { playSynthTone } from './utils/audio';
import { subscribeToRoom, sendRealtimeMessage, checkPlateInSupabase, registerCarInSupabase, fetchRoomMessagesFromSupabase } from './lib/supabase';
import { realtimeService } from './services/realtime';
import { UnregisteredPlateModal } from './components/UnregisteredPlateModal';
import { BlockedUserModal } from './components/BlockedUserModal';
import { FullSizeEmergencyModal } from './components/FullSizeEmergencyModal';
import { isValidCityCode, parsePlateToSegments } from './utils/provinces';
import { triggerHaptic } from './utils/haptics';
import { recordDailyContact, MAX_ROOM_MESSAGES } from './utils/dailyLimits';
import {
  AppSettings,
  Car,
  ChatMessage,
  NotificationItem,
  ParkLocation,
  PlateSegments,
  ScreenType,
  SoundTone,
} from './types';

const STORAGE_KEY = 'plakala_v2_kinetic_state';

export default function App() {
  // Screen & Navigation
  const [screen, setScreen] = useState<ScreenType>('welcome');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // User Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Automatically lift restriction for ticket 0MHQ1
        if (parsed.isBlocked) {
          const unblocked = {
            ...parsed,
            isBlocked: false,
            unblockRequested: false,
            blockReason: undefined,
          };
          try {
            localStorage.setItem(STORAGE_KEY + '_settings', JSON.stringify(unblocked));
            localStorage.removeItem('plakala_daily_contacts_store');
          } catch {}
          return unblocked;
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return {
      soundEnabled: true,
      soundTone: 'classic',
      volume: 0.8,
      theme: 'light',
      phone: '0532 123 45 67',
      isBlocked: false,
    };
  });

  // Device ID
  const [deviceId] = useState(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY + '_devid');
      if (savedId) return savedId;
      const newId = 'dev_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem(STORAGE_KEY + '_devid', newId);
      return newId;
    } catch {
      return 'dev_8f12a9c1';
    }
  });

  // User's Registered Cars
  const [cars, setCars] = useState<Car[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_cars');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // Park History
  const [parkHistory, setParkHistory] = useState<ParkLocation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_park_history');
      if (saved) return JSON.parse(saved);
      // Fallback for migration from single parkLocation
      const singleSaved = localStorage.getItem(STORAGE_KEY + '_park');
      if (singleSaved) return [JSON.parse(singleSaved)];
    } catch {
      // ignore
    }
    return [];
  });

  const parkLocation = parkHistory[0] || null;

  // Query Plate Input State - Başlangıçta boş başlar, placeholder gösterilir
  const [plateInput, setPlateInput] = useState<PlateSegments>({
    city: '',
    letters: '',
    digits: '',
  });

  const [currentTargetPlate, setCurrentTargetPlate] = useState('');

  // Recent Searches History (Max 3)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_recent_searches');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // Notifications History
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_notifs');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [currentNotification, setCurrentNotification] = useState<NotificationItem | null>(null);

  // Chat message stores per room code
  const [chatRooms, setChatRooms] = useState<Record<string, ChatMessage[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_chatrooms');
      if (saved) {
        const parsed = JSON.parse(saved);
        const clean: Record<string, ChatMessage[]> = {};
        for (const room of Object.keys(parsed)) {
          const list = parsed[room] || [];
          const seen = new Set<string>();
          clean[room] = list.filter((m: ChatMessage) => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
          });
        }
        return clean;
      }
    } catch {}
    return {};
  });

  const [roomEntryCounts, setRoomEntryCounts] = useState<Record<string, number>>({});

  // State for verifying if plate is registered before allowing notification
  const [isCheckingPlate, setIsCheckingPlate] = useState(false);
  const [unregisteredModalPlate, setUnregisteredModalPlate] = useState<string | null>(null);
  const [addCarInitialPlate, setAddCarInitialPlate] = useState<string | PlateSegments | undefined>(undefined);

  // Live incoming car notification signal & active list for owned cars
  const [hasCarSignal, setHasCarSignal] = useState(false);
  const [incomingCarNotifications, setIncomingCarNotifications] = useState<NotificationItem[]>([]);
  const [topAlertToast, setTopAlertToast] = useState<{ plate: string; reason: string; note?: string; roomCode: string } | null>(null);

  // Realtime room subscription & server SSE stream for real-time messages & car notifications
  useEffect(() => {
    const allCarPlates = cars.map((c) => c.plate);
    const activePlate = currentTargetPlate || (cars.length > 0 ? cars[0].plate : undefined);

    realtimeService.connect({
      plate: activePlate,
      plates: allCarPlates,
      roomCode: currentNotification?.roomCode,
      deviceId,
    });

    const unsubscribeNotification = realtimeService.onNotification((notif) => {
      // Check if this incoming notification belongs to any of my registered cars
      const isMyCar = cars.some(
        (c) => c.plate.replace(/\s+/g, '').toUpperCase() === notif.targetPlate.replace(/\s+/g, '').toUpperCase()
      );
      const isFromMe = notif.senderId === deviceId;

      if (isMyCar && !isFromMe) {
        setHasCarSignal(true);
        const notifItem: NotificationItem = {
          id: notif.id,
          targetPlate: notif.targetPlate,
          reason: notif.reason,
          note: notif.note,
          roomCode: notif.roomCode,
          timestamp: notif.timestamp || Date.now(),
          timeFormatted: notif.timeFormatted || 'Şimdi',
          status: 'sent',
          isIncoming: true,
        };

        setIncomingCarNotifications((prev) => {
          if (prev.some((n) => n.id === notif.id || n.roomCode === notif.roomCode)) return prev;
          return [notifItem, ...prev];
        });

        // Play loud sound and vibrate
        playSynthTone('emergency', settings.volume);
        triggerHaptic('error');

        // Show full-screen emergency takeover modal & banner toast
        setTopAlertToast({
          plate: notif.targetPlate,
          reason: notif.reason,
          note: notif.note,
          roomCode: notif.roomCode,
        });
      }
    });

    const unsubscribeRealtime = realtimeService.onMessage((msg) => {
      const isMe = msg.senderId === deviceId;
      const chatMsg: ChatMessage = {
        id: msg.id,
        roomCode: msg.roomCode,
        sender: isMe ? 'me' : 'other',
        text: msg.text,
        timestamp: Date.now(),
        timeFormatted: msg.timestamp || new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        status: isMe ? 'sent' : 'seen',
        senderPhoto: msg.senderPhoto,
        senderGender: msg.senderGender,
      };

      setChatRooms((prev) => {
        const list = prev[msg.roomCode] || [];
        // Prevent duplicate bubbles by exact id
        const existingIdx = list.findIndex((m) => m.id === msg.id);

        if (existingIdx !== -1) {
          // Update existing message status if needed
          const updatedList = [...list];
          updatedList[existingIdx] = { ...updatedList[existingIdx], status: 'seen' };
          return {
            ...prev,
            [msg.roomCode]: updatedList,
          };
        }

        return {
          ...prev,
          [msg.roomCode]: [...list, chatMsg],
        };
      });

      if (!isMe) {
        // If it's a message for my car, also trigger car signal
        const isForMyCar = cars.some(
          (c) => c.plate.replace(/\s+/g, '').toUpperCase() === (msg.plate || '').replace(/\s+/g, '').toUpperCase()
        );
        if (isForMyCar) {
          setHasCarSignal(true);
        }
        playSynthTone(settings.soundTone, settings.volume);
      }
    });

    if (!currentNotification) {
      return () => {
        unsubscribeNotification();
        unsubscribeRealtime();
      };
    }

    const roomCode = currentNotification.roomCode;
    const unsubscribeSupabase = subscribeToRoom(roomCode, {
      onMessage: (msg) => {
        setChatRooms((prev) => {
          const existing = prev[roomCode] || [];
          if (existing.some((m) => m.id === msg.id)) return prev;
          return {
            ...prev,
            [roomCode]: [...existing, msg],
          };
        });
        if (msg.sender !== 'me') {
          playSynthTone('classic', settings.volume);
        }
      },
      onStatusUpdate: (status, messageId) => {
        setChatRooms((prev) => {
          const list = prev[roomCode] || [];
          return {
            ...prev,
            [roomCode]: list.map((m) =>
              messageId && m.id !== messageId ? m : { ...m, status }
            ),
          };
        });
      },
    });

    return () => {
      unsubscribeRealtime();
      unsubscribeSupabase();
    };
  }, [currentNotification, currentTargetPlate, cars, deviceId, settings.soundTone, settings.volume]);

  // Sync theme attribute
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', settings.theme);
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEY + '_settings', JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Persist cars & park
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + '_cars', JSON.stringify(cars));
    } catch {
      // ignore
    }
  }, [cars]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + '_park_history', JSON.stringify(parkHistory));
    } catch {
      // ignore
    }
  }, [parkHistory]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + '_notifs', JSON.stringify(notifications));
    } catch {
      // ignore
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + '_chatrooms', JSON.stringify(chatRooms));
    } catch {
      // ignore
    }
  }, [chatRooms]);

  // Handle Search Plate (Only allows registered cars in database or local state)
  const handleSearchPlate = async () => {
    const city = plateInput.city.trim();
    const letters = plateInput.letters.trim().toUpperCase();
    const digits = plateInput.digits.trim();

    if (!city || !letters || !digits) {
      alert('Lütfen geçerli bir plaka girin (Örn: 31 TR 1001 veya 34 ACM 148)');
      return;
    }

    if (!isValidCityCode(city)) {
      alert('Lütfen geçerli bir il kodu girin! Türkiye\'de il plakaları 01 ile 81 arasındadır (Örn: Hatay için 31, İstanbul için 34).');
      return;
    }

    const formattedCity = city.length === 1 ? `0${city}` : city;
    const fullPlate = `${formattedCity} ${letters} ${digits}`;
    setIsCheckingPlate(true);

    try {
      const normalizedQuery = fullPlate.replace(/\s+/g, '').toUpperCase();

      // 1. Check local cars on this browser
      const isLocal = cars.some(
        (c) => c.plate.replace(/\s+/g, '').toUpperCase() === normalizedQuery
      );

      // 2. Check Supabase 'cars' table
      let existsInDb = false;
      if (!isLocal) {
        const dbCheck = await checkPlateInSupabase(fullPlate);
        existsInDb = dbCheck.exists;
      }

      // 3. Check Realtime Express Backend
      if (!isLocal && !existsInDb) {
        try {
          const res = await fetch(`/api/realtime/cars/check?plate=${encodeURIComponent(fullPlate)}`);
          if (res.ok) {
            const data = await res.json();
            existsInDb = Boolean(data.exists);
          }
        } catch {}
      }

      // If NOT registered, prevent opening fake room and show modal
      if (!isLocal && !existsInDb) {
        setUnregisteredModalPlate(fullPlate);
        playSynthTone('emergency', settings.volume);
        setIsCheckingPlate(false);
        return;
      }

      setCurrentTargetPlate(fullPlate);

      // Save to recent searches (up to 3 unique plates)
      setRecentSearches((prev) => {
        const filtered = prev.filter((p) => p !== fullPlate);
        const updated = [fullPlate, ...filtered].slice(0, 3);
        try {
          localStorage.setItem(STORAGE_KEY + '_recent_searches', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      playSynthTone('gentle', settings.volume);
      setScreen('reason');
    } catch (err) {
      console.error('Plaka doğrulama hatası:', err);
    } finally {
      setIsCheckingPlate(false);
    }
  };

  const handleSelectRecentPlate = (fullPlate: string) => {
    const parts = fullPlate.trim().split(/\s+/);
    if (parts.length >= 3) {
      setPlateInput({
        city: parts[0],
        letters: parts[1],
        digits: parts.slice(2).join(''),
      });
    } else {
      const match = fullPlate.replace(/\s+/g, '').match(/^(\d{2})([A-Z]{1,3})(\d{2,4})$/);
      if (match) {
        setPlateInput({
          city: match[1],
          letters: match[2],
          digits: match[3],
        });
      }
    }
  };

  // Handle Send Notification (Real Real-Time Broadcast Only)
  const handleSendNotification = (reason: string, note?: string) => {
    // Enforce Rule 1: Max 3 people per day
    const contactResult = recordDailyContact(currentTargetPlate);
    if (!contactResult.allowed) {
      setSettings((s) => ({
        ...s,
        isBlocked: true,
        unblockRequested: false,
        blockReason: 'Günlük en fazla 3 kişiyle iletişim kurabilirsiniz. Bu sınırı aştığınız için hesabınız kısıtlandı.',
      }));
      playSynthTone('emergency', settings.volume);
      triggerHaptic('error');
      return;
    }

    // 6-digit numeric room code
    const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      targetPlate: currentTargetPlate,
      reason,
      note,
      timestamp: Date.now(),
      timeFormatted: 'Şimdi',
      roomCode,
      status: 'sent',
    };

    setNotifications((prev) => [newNotif, ...prev]);
    setCurrentNotification(newNotif);

    const initMsg: ChatMessage = {
      id: 'init-' + Date.now(),
      roomCode,
      plate: currentTargetPlate,
      sender: 'me',
      text: `Merhaba, ${currentTargetPlate} plakalı araç için bildirim gönderildi. Sebep: ${reason}${note ? ` (${note})` : ''}`,
      timestamp: Date.now(),
      timeFormatted: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };

    // Initialize real chat room & broadcast
    setChatRooms((prev) => ({
      ...prev,
      [roomCode]: [initMsg],
    }));

    sendRealtimeMessage(roomCode, initMsg);
    realtimeService.sendMessage({
      roomCode,
      plate: currentTargetPlate,
      senderId: deviceId,
      text: initMsg.text,
    });
    realtimeService.sendNotification({
      id: newNotif.id,
      targetPlate: currentTargetPlate,
      reason,
      note,
      roomCode,
      senderId: deviceId,
    });

    playSynthTone(settings.soundTone, settings.volume);
    setScreen('status');

    // 1 saniye sonra bildirim durumu 'görüldü' olarak güncellenir ve Görüldü aşamasında kalır
    setTimeout(() => {
      setCurrentNotification((prev) => (prev && prev.id === newNotif.id ? { ...prev, status: 'seen' } : prev));
      setNotifications((prev) =>
        prev.map((n) => (n.id === newNotif.id ? { ...n, status: 'seen' } : n))
      );
    }, 1200);
  };

  // Open Room
  const handleOpenRoom = async (item: NotificationItem) => {
    setCurrentNotification(item);
    setCurrentTargetPlate(item.targetPlate);

    if (!chatRooms[item.roomCode] || chatRooms[item.roomCode].length === 0) {
      const dbMsgs = await fetchRoomMessagesFromSupabase(item.roomCode);
      if (dbMsgs.length > 0) {
        setChatRooms((prev) => ({
          ...prev,
          [item.roomCode]: dbMsgs,
        }));
      } else {
        const history = await realtimeService.fetchHistory(item.roomCode);
        if (history.length > 0) {
          setChatRooms((prev) => ({
            ...prev,
            [item.roomCode]: history.map((m) => ({
              id: m.id,
              roomCode: m.roomCode,
              plate: m.plate,
              sender: m.senderId === deviceId ? 'me' : 'other',
              text: m.text,
              timestamp: Date.now(),
              timeFormatted: m.timestamp,
              status: 'seen',
              senderPhoto: m.senderPhoto,
              senderGender: m.senderGender,
            })),
          }));
        }
      }
    }

    setScreen('chat');
  };

  // Send message in Chat
  const handleSendChatMessage = (text: string) => {
    if (!currentNotification) return;
    const roomCode = currentNotification.roomCode;

    // Enforce Rule 2: Max messages per room (Limit is 20, kept confidential)
    const currentMyMsgs = (chatRooms[roomCode] || []).filter((m) => m.sender === 'me').length;
    if (currentMyMsgs >= MAX_ROOM_MESSAGES) {
      setSettings((s) => ({
        ...s,
        isBlocked: true,
        unblockRequested: false,
        blockReason: 'Aşırı mesajlaşma ve sistem kuralları ihlali nedeniyle hesabınız kısıtlandı.',
      }));
      playSynthTone('emergency', settings.volume);
      triggerHaptic('error');
      return;
    }

    // Enforce Rule 1: Max 3 people per day
    const targetPlateKey = currentTargetPlate || currentNotification.targetPlate;
    const contactResult = recordDailyContact(targetPlateKey);
    if (!contactResult.allowed) {
      setSettings((s) => ({
        ...s,
        isBlocked: true,
        unblockRequested: false,
        blockReason: 'Günlük en fazla 3 kişiyle iletişim kurabilirsiniz. Bu sınırı aştığınız için hesabınız kısıtlandı.',
      }));
      playSynthTone('emergency', settings.volume);
      triggerHaptic('error');
      return;
    }

    const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const msgId = 'msg-' + Date.now();

    const userGender = (localStorage.getItem('plakala_user_gender') as any) || 'male';
    const userPhoto = localStorage.getItem('plakala_user_profile_photo');
    const counterpartGender = (localStorage.getItem('plakala_counterpart_gender') as any) || 'female';

    const newMsg: ChatMessage = {
      id: msgId,
      roomCode,
      sender: 'me',
      text,
      timestamp: Date.now(),
      timeFormatted: nowStr,
      status: 'sent',
      senderPhoto: userPhoto,
      senderGender: userGender,
    };

    setChatRooms((prev) => ({
      ...prev,
      [roomCode]: [...(prev[roomCode] || []), newMsg],
    }));

    sendRealtimeMessage(roomCode, newMsg);
    realtimeService.sendMessage({
      id: msgId,
      roomCode,
      plate: currentTargetPlate || currentNotification.targetPlate,
      senderId: deviceId,
      senderPhoto: userPhoto || undefined,
      senderGender: userGender,
      text,
    });
    playSynthTone('gentle', settings.volume);
  };

  // Owner ETA Response
  const handleSendOwnerEta = (mins: number) => {
    const activePlate = cars[0]?.plate || currentTargetPlate;
    const roomCode = currentNotification?.roomCode || '842915';

    // Enforce Rule 2: Max messages per room (Limit is 20, kept confidential)
    const currentMyMsgs = (chatRooms[roomCode] || []).filter((m) => m.sender === 'me').length;
    if (currentMyMsgs >= MAX_ROOM_MESSAGES) {
      setSettings((s) => ({
        ...s,
        isBlocked: true,
        unblockRequested: false,
        blockReason: 'Aşırı mesajlaşma ve sistem kuralları ihlali nedeniyle hesabınız kısıtlandı.',
      }));
      playSynthTone('emergency', settings.volume);
      triggerHaptic('error');
      return;
    }

    playSynthTone('classic', settings.volume);
    alert(`${mins} dakika içinde geleceğiniz araç sahibine bildirildi!`);

    const etaMsg: ChatMessage = {
      id: 'eta-' + Date.now(),
      roomCode,
      plate: activePlate,
      sender: 'me',
      text: `Geliyorum, ${mins} dakika içinde araç başındayım!`,
      timestamp: Date.now(),
      timeFormatted: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      status: 'seen',
    };

    setChatRooms((prev) => ({
      ...prev,
      [roomCode]: [...(prev[roomCode] || []), etaMsg],
    }));

    sendRealtimeMessage(roomCode, etaMsg);
    realtimeService.sendMessage({
      id: etaMsg.id,
      roomCode,
      plate: activePlate,
      senderId: deviceId,
      text: etaMsg.text,
    });

    const notifItem: NotificationItem = {
      id: 'notif-eta-' + Date.now(),
      targetPlate: activePlate,
      reason: 'Önümü kapattı',
      timestamp: Date.now(),
      timeFormatted: 'Şimdi',
      roomCode,
      status: 'replied',
      replyText: `${mins} dk içinde geliyorum`,
      isIncoming: true,
    };

    setCurrentNotification(notifItem);
    setScreen('chat');
  };

  const handleAddCar = (plate: string, code: string) => {
    const newCar: Car = {
      id: 'car-' + Date.now(),
      plate,
      code,
      addedAt: 'Şimdi',
    };
    setCars((prev) => [newCar, ...prev]);
    realtimeService.registerCar(plate, code, deviceId);
    registerCarInSupabase(plate, code, deviceId);
    playSynthTone('gentle', settings.volume);
  };

  const handleRemoveCar = (id: string) => {
    setCars((prev) => prev.filter((c) => c.id !== id));
  };

  const handleResetDevice = () => {
    if (window.confirm('Bu cihazı sıfırlamak istiyor musunuz? Tüm yerel veriler temizlenecektir.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleRequestPushPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          playSynthTone('classic', settings.volume);
          alert('Bildirimler başarıyla açıldı! 🎉');
        } else {
          alert('Bildirim izni verilmedi.');
        }
      });
    } else {
      alert('Tarayıcınız push bildirimlerini doğrudan desteklemiyor. Lütfen ana ekrana ekleyin.');
    }
  };

  const handleTestPush = () => {
    alert("🔔 Bildirim ses ve osilatör sentez tonu çalındı.");
  };

  return (
    <div className="flex justify-center min-h-[100dvh] bg-[#eef2f6] dark:bg-[#101215]">
      {/* App Container Frame */}
      <div
        id="app-container"
        className="w-full max-w-[440px] bg-[#f7f9fc] dark:bg-[#16191e] min-h-[100dvh] relative flex flex-col shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] overflow-x-clip selection:bg-[#d8ff35] selection:text-black"
      >
        {/* Offline Banner */}
        <OfflineBanner />

        {/* Top Header */}
        {screen !== 'chat' && (
          <Header
            currentTheme={settings.theme}
            onToggleTheme={() =>
              setSettings((s) => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }))
            }
            onOpenMenu={() => setIsDrawerOpen(true)}
            onNavigate={(scr) => setScreen(scr)}
          />
        )}

        {/* Side Drawer */}
        <SideDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onNavigate={(scr) => setScreen(scr)}
          currentTheme={settings.theme}
          onToggleTheme={() =>
            setSettings((s) => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }))
          }
        />

        {/* Screen Routing */}
        <main className="flex-1 flex flex-col">
          {screen === 'welcome' && (
            <WelcomeScreen
              plateInput={plateInput}
              onPlateChange={setPlateInput}
              onSearchPlate={handleSearchPlate}
              onNavigate={setScreen}
            />
          )}

          {screen === 'home' && (
            <HomeScreen
              plateInput={plateInput}
              onPlateChange={setPlateInput}
              onSearchPlate={handleSearchPlate}
              onNavigate={setScreen}
              parkLocation={parkLocation}
              notifications={notifications}
              onOpenRoom={handleOpenRoom}
              onSimulateIncoming={() => setScreen('incoming')}
              recentSearches={recentSearches}
              onSelectRecentPlate={handleSelectRecentPlate}
              isSearching={isCheckingPlate}
            />
          )}

          {screen === 'add-car' && (
            <AddCarScreen
              initialPlate={addCarInitialPlate}
              onNavigate={(s) => {
                setScreen(s);
              }}
              onAddCar={(plate, code) => {
                handleAddCar(plate, code);
                setAddCarInitialPlate(undefined);
              }}
            />
          )}

          {screen === 'reason' && (
            <ReasonScreen
              targetPlate={currentTargetPlate}
              onNavigate={setScreen}
              onSendNotification={handleSendNotification}
            />
          )}

          {screen === 'status' && (
            <StatusScreen
              notification={currentNotification}
              onNavigate={setScreen}
              onOpenChat={() => {
                if (currentNotification) {
                  setScreen('chat');
                }
              }}
            />
          )}

          {screen === 'incoming' && (
            <IncomingScreen
              plate={cars[0]?.plate || '34 ACM 148'}
              reason="Önümü kapattı"
              onSendEta={handleSendOwnerEta}
              onReject={() => {
                alert("Bildirim 'Araç benim değil' olarak işaretlendi.");
                setScreen('home');
              }}
              onOpenChat={() => {
                const dummy: NotificationItem = {
                  id: 'incoming-' + Date.now(),
                  targetPlate: cars[0]?.plate || '34 ACM 148',
                  reason: 'Önümü kapattı',
                  timestamp: Date.now(),
                  timeFormatted: 'Şimdi',
                  roomCode: 'PKL-882',
                  status: 'replied',
                };
                setCurrentNotification(dummy);
                setScreen('chat');
              }}
              onNavigate={setScreen}
            />
          )}

          {screen === 'chat' && (
            <ChatScreen
              plate={currentNotification?.targetPlate || currentTargetPlate}
              roomCode={currentNotification?.roomCode || 'PKL-882'}
              messages={chatRooms[currentNotification?.roomCode || 'PKL-882'] || []}
              onSendMessage={handleSendChatMessage}
              onBlockRoom={() => {
                if (window.confirm('Bu odayı engellemek istiyor musunuz?')) {
                  alert('Oda engellendi.');
                  setScreen('home');
                }
              }}
              onClose={() => setScreen('status')}
              userPhone={settings.phone}
              currentTheme={settings.theme}
              onToggleTheme={() =>
                setSettings((s) => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }))
              }
              isCarOwner={Boolean(
                currentNotification?.isIncoming ||
                cars.some(
                  (c) =>
                    c.plate.replace(/\s+/g, '').toUpperCase() ===
                    (currentNotification?.targetPlate || currentTargetPlate).replace(/\s+/g, '').toUpperCase()
                )
              )}
            />
          )}

          {screen === 'park' && (
            <ParkScreen
              parkHistory={parkHistory}
              onSaveParkLocation={(loc) => setParkHistory((prev) => [loc, ...prev])}
              onClearParkLocation={() => setParkHistory([])}
              onRemoveParkItem={(index) => setParkHistory((prev) => prev.filter((_, i) => i !== index))}
            />
          )}

          {screen === 'my-cars' && (
            <MyCarsScreen
              cars={cars}
              onRemoveCar={handleRemoveCar}
              onNavigate={setScreen}
              incomingNotifications={incomingCarNotifications}
              onOpenNotification={(item) => {
                setHasCarSignal(false);
                setIncomingCarNotifications((prev) => prev.filter((n) => n.id !== item.id));
                handleOpenRoom(item);
              }}
              onSendEta={(mins, item) => {
                setHasCarSignal(false);
                setIncomingCarNotifications((prev) => prev.filter((n) => n.id !== item.id));
                setCurrentNotification(item);
                handleSendOwnerEta(mins);
              }}
            />
          )}

          {screen === 'profile' && (
            <ProfileScreen
              deviceId={deviceId}
              onNavigate={setScreen}
              onTestPush={handleTestPush}
              onResetDevice={handleResetDevice}
              currentTheme={settings.theme}
              onToggleTheme={() =>
                setSettings((s) => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }))
              }
            />
          )}

          {screen === 'settings' && (
            <SettingsScreen
              settings={settings}
              onUpdateSettings={(newVals) => setSettings((s) => ({ ...s, ...newVals }))}
              onPlayTone={(tone: SoundTone) => playSynthTone(tone, settings.volume)}
              onNavigate={setScreen}
            />
          )}

          {screen === 'faq' && <FaqScreen onNavigate={setScreen} />}

          {screen === 'info' && <InfoScreen onNavigate={setScreen} />}

          {screen === 'mission' && <MissionScreen onNavigate={setScreen} />}

          {screen === 'about' && <AboutScreen onNavigate={setScreen} />}

          {screen === 'install' && (
            <InstallScreen
              onNavigate={setScreen}
              onRequestNotificationPermission={handleRequestPushPermission}
            />
          )}

          {screen === 'admin' && (
            <AdminScreen
              cars={cars}
              notifications={notifications}
              chatRooms={chatRooms}
              recentSearches={recentSearches}
              onNavigate={setScreen}
              onOpenRoom={(roomCode, targetPlate) => {
                const existingNotif = notifications.find((n) => n.roomCode === roomCode);
                const item: NotificationItem = existingNotif || {
                  id: 'admin-room-' + roomCode,
                  targetPlate: targetPlate || '34 ACM 148',
                  reason: 'Yönetici İncelemesi',
                  timestamp: Date.now(),
                  timeFormatted: 'Şimdi',
                  roomCode: roomCode,
                  status: 'replied',
                };
                handleOpenRoom(item);
              }}
              onBlockUser={() => setSettings(s => ({ ...s, isBlocked: true, unblockRequested: false, blockReason: 'Yönetici tarafından manuel olarak kısıtlandı.' }))}
              onUnblockUser={() => setSettings(s => ({ ...s, isBlocked: false, unblockRequested: false, blockReason: undefined }))}
              isCurrentUserBlocked={settings.isBlocked}
              unblockRequested={settings.unblockRequested}
              blockReason={settings.blockReason}
            />
          )}
        </main>

        {/* Floating Top Alert Toast for Incoming Car Notification */}
        {topAlertToast && (
          <div
            onClick={() => {
              const found = incomingCarNotifications.find((n) => n.roomCode === topAlertToast.roomCode);
              if (found) {
                setHasCarSignal(false);
                setIncomingCarNotifications((prev) => prev.filter((n) => n.roomCode !== topAlertToast.roomCode));
                handleOpenRoom(found);
              } else {
                setScreen('my-cars');
              }
              setTopAlertToast(null);
            }}
            className="fixed top-3 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[400px] z-60 bg-linear-to-r from-red-600 via-red-500 to-amber-500 text-white p-3.5 rounded-3xl shadow-[0_10px_30px_rgba(239,68,68,0.45)] flex items-center justify-between cursor-pointer animate-in slide-in-from-top-4 duration-200 border-2 border-white/30 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-white"></span>
              </span>
              <div>
                <div className="font-mono-plate font-black text-sm tracking-wide">{topAlertToast.plate} için bildirim!</div>
                <div className="text-[11px] text-white/95 font-medium leading-tight">"{topAlertToast.reason}" • Dokunup Odaya Girin</div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">→</span>
            </div>
          </div>
        )}

        {/* Floating Bottom Nav */}
        <BottomNav activeScreen={screen} onNavigate={setScreen} hasCarSignal={hasCarSignal} />

        {/* Full Size Emergency Takeover Modal */}
        <FullSizeEmergencyModal
          isOpen={Boolean(topAlertToast)}
          notification={topAlertToast}
          onClose={() => setTopAlertToast(null)}
          onOpenRoom={(roomCode) => {
            const found = incomingCarNotifications.find((n) => n.roomCode === roomCode);
            if (found) {
              setHasCarSignal(false);
              setIncomingCarNotifications((prev) => prev.filter((n) => n.roomCode !== roomCode));
              handleOpenRoom(found);
            } else {
              setScreen('my-cars');
            }
            setTopAlertToast(null);
          }}
          onSendEta={(mins, roomCode) => {
            const found = incomingCarNotifications.find((n) => n.roomCode === roomCode);
            if (found) {
              setHasCarSignal(false);
              setIncomingCarNotifications((prev) => prev.filter((n) => n.roomCode !== roomCode));
              setCurrentNotification(found);
              handleSendOwnerEta(mins);
            }
            setTopAlertToast(null);
          }}
        />

        {/* Unregistered Plate Warning & Invite Modal */}
        <UnregisteredPlateModal
          isOpen={Boolean(unregisteredModalPlate)}
          plate={unregisteredModalPlate || ''}
          onClose={() => setUnregisteredModalPlate(null)}
          onRegisterThisPlate={() => {
            if (unregisteredModalPlate) {
              setAddCarInitialPlate(unregisteredModalPlate);
              handleSelectRecentPlate(unregisteredModalPlate);
            }
            setUnregisteredModalPlate(null);
            setScreen('add-car');
          }}
        />

        {/* Full-Page Account Blocked Modal */}
        <BlockedUserModal 
          isOpen={Boolean(settings.isBlocked) && screen !== 'admin'} 
          unblockRequested={settings.unblockRequested}
          blockReason={settings.blockReason}
          ticketNo="0MHQ1"
          onRequestUnblock={() => setSettings(s => ({ ...s, unblockRequested: true }))}
          onSecretUnblock={() => {
            const cleanSettings = {
              ...settings,
              isBlocked: false,
              unblockRequested: false,
              blockReason: undefined,
            };
            setSettings(cleanSettings);
            try {
              localStorage.setItem(STORAGE_KEY + '_settings', JSON.stringify(cleanSettings));
              localStorage.removeItem('plakala_daily_contacts_store');
            } catch {}
            setScreen('home');
          }}
        />
      </div>
    </div>
  );
}
