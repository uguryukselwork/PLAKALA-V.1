import { ChatMessage, UserGender } from '../types';

export interface RealtimeServerMessage {
  id: string;
  roomCode: string;
  plate: string;
  senderId: string;
  senderPhoto?: string;
  senderGender?: UserGender;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface RealtimeServerNotification {
  id: string;
  targetPlate: string;
  reason: string;
  note?: string;
  roomCode: string;
  senderId?: string;
  timestamp: number;
  timeFormatted: string;
  status: string;
  isIncoming?: boolean;
}

type MessageCallback = (msg: RealtimeServerMessage) => void;
type NotificationCallback = (notif: RealtimeServerNotification) => void;
type TypingCallback = (data: { roomCode: string; plate: string; isTyping: boolean; senderId: string }) => void;

class RealtimeService {
  private eventSource: EventSource | null = null;
  private messageListeners: Set<MessageCallback> = new Set();
  private notificationListeners: Set<NotificationCallback> = new Set();
  private typingListeners: Set<TypingCallback> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private currentPlate: string | null = null;
  private currentPlates: string[] = [];
  private currentRoomCode: string | null = null;
  private currentDeviceId: string | null = null;
  private reconnectTimer: any = null;
  private isDestroyed = false;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('plakala_realtime_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (this.isDestroyed) return;
          const { type, data } = event.data || {};
          if (type === 'new_message' && data) {
            this.notifyMessageListeners(data);
          } else if (type === 'incoming_notification' && data) {
            this.notifyNotificationListeners(data);
          } else if (type === 'typing_status' && data) {
            this.notifyTypingListeners(data);
          }
        };
      } catch {}
    }
  }

  public connect(params: {
    plate?: string;
    plates?: string[];
    roomCode?: string;
    deviceId?: string;
  }): () => void {
    this.isDestroyed = false;
    this.currentPlate = params.plate || null;
    this.currentPlates = params.plates || (params.plate ? [params.plate] : []);
    this.currentRoomCode = params.roomCode || null;
    this.currentDeviceId = params.deviceId || null;

    if (typeof window === 'undefined') {
      return () => {};
    }

    this.disconnect();

    const query = new URLSearchParams();
    if (this.currentPlates.length > 0) {
      query.set('plates', this.currentPlates.join(','));
    } else if (params.plate) {
      query.set('plate', params.plate);
    }
    if (params.roomCode) query.set('roomCode', params.roomCode);
    if (params.deviceId) query.set('deviceId', params.deviceId);

    try {
      const url = `/api/realtime/events?${query.toString()}`;
      const es = new EventSource(url);

      const onNewMessage = (e: MessageEvent) => {
        if (this.isDestroyed) return;
        try {
          const parsed: RealtimeServerMessage = JSON.parse(e.data);
          this.notifyMessageListeners(parsed);
          this.broadcastChannel?.postMessage({ type: 'new_message', data: parsed });
        } catch {}
      };

      const onIncomingNotification = (e: MessageEvent) => {
        if (this.isDestroyed) return;
        try {
          const parsed: RealtimeServerNotification = JSON.parse(e.data);
          this.notifyNotificationListeners(parsed);
          this.broadcastChannel?.postMessage({ type: 'incoming_notification', data: parsed });
        } catch {}
      };

      const onTypingStatus = (e: MessageEvent) => {
        if (this.isDestroyed) return;
        try {
          const parsed = JSON.parse(e.data);
          this.notifyTypingListeners(parsed);
          this.broadcastChannel?.postMessage({ type: 'typing_status', data: parsed });
        } catch {}
      };

      es.addEventListener('new_message', onNewMessage);
      es.addEventListener('incoming_notification', onIncomingNotification);
      es.addEventListener('typing_status', onTypingStatus);

      es.onopen = () => {
        if (this.isDestroyed) return;
        // On successful connection/reconnection, fetch history to catch up on missed messages
        if (this.currentRoomCode) {
          this.fetchHistory(this.currentRoomCode).then((msgs) => {
            msgs.forEach((m) => this.notifyMessageListeners(m));
          });
        }
      };

      es.onerror = () => {
        es.close();
        if (this.eventSource === es) {
          this.eventSource = null;
        }
        if (this.isDestroyed) return;

        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          if (!this.isDestroyed && (this.currentPlates.length > 0 || this.currentRoomCode)) {
            this.connect({
              plates: this.currentPlates,
              roomCode: this.currentRoomCode || undefined,
              deviceId: this.currentDeviceId || undefined,
            });
          }
        }, 1500); // Reduced from 3500 to 1500 for faster recovery
      };

      this.eventSource = es;
    } catch {
      // Fallback gracefully
    }

    return () => {
      this.disconnect();
    };
  }

  public disconnect() {
    clearTimeout(this.reconnectTimer);
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {}
      this.eventSource = null;
    }
  }

  public onMessage(cb: MessageCallback): () => void {
    this.messageListeners.add(cb);
    return () => {
      this.messageListeners.delete(cb);
    };
  }

  public onNotification(cb: NotificationCallback): () => void {
    this.notificationListeners.add(cb);
    return () => {
      this.notificationListeners.delete(cb);
    };
  }

  public onTyping(cb: TypingCallback): () => void {
    this.typingListeners.add(cb);
    return () => {
      this.typingListeners.delete(cb);
    };
  }

  private notifyMessageListeners(msg: RealtimeServerMessage) {
    this.messageListeners.forEach((cb) => {
      try {
        cb(msg);
      } catch {}
    });
  }

  private notifyNotificationListeners(notif: RealtimeServerNotification) {
    this.notificationListeners.forEach((cb) => {
      try {
        cb(notif);
      } catch {}
    });
  }

  private notifyTypingListeners(data: { roomCode: string; plate: string; isTyping: boolean; senderId: string }) {
    this.typingListeners.forEach((cb) => {
      try {
        cb(data);
      } catch {}
    });
  }

  public async sendMessage(payload: {
    id?: string;
    roomCode: string;
    plate: string;
    senderId: string;
    senderPhoto?: string;
    senderGender?: UserGender;
    text: string;
  }): Promise<RealtimeServerMessage | null> {
    try {
      const response = await fetch('/api/realtime/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Mesaj gönderilemedi');
      const data = await response.json();
      return data.message;
    } catch (err) {
      // Local fallback in case network drops
      const fallbackMsg: RealtimeServerMessage = {
        id: payload.id || `local_${Date.now()}`,
        roomCode: payload.roomCode,
        plate: payload.plate,
        senderId: payload.senderId,
        senderPhoto: payload.senderPhoto,
        senderGender: payload.senderGender,
        text: payload.text,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        read: false,
      };
      this.notifyMessageListeners(fallbackMsg);
      this.broadcastChannel?.postMessage({ type: 'new_message', data: fallbackMsg });
      return fallbackMsg;
    }
  }

  public async sendNotification(payload: {
    id?: string;
    targetPlate: string;
    reason: string;
    note?: string;
    roomCode: string;
    senderId?: string;
  }): Promise<RealtimeServerNotification | null> {
    try {
      const response = await fetch('/api/realtime/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Bildirim gönderilemedi');
      const data = await response.json();
      return data.notification;
    } catch {
      const fallbackNotif: RealtimeServerNotification = {
        id: payload.id || `notif_${Date.now()}`,
        targetPlate: payload.targetPlate,
        reason: payload.reason,
        note: payload.note,
        roomCode: payload.roomCode,
        senderId: payload.senderId,
        timestamp: Date.now(),
        timeFormatted: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
        isIncoming: true,
      };
      this.notifyNotificationListeners(fallbackNotif);
      this.broadcastChannel?.postMessage({ type: 'incoming_notification', data: fallbackNotif });
      return fallbackNotif;
    }
  }

  public async sendTyping(payload: { roomCode: string; plate: string; isTyping: boolean; senderId: string }) {
    try {
      await fetch('/api/realtime/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {}
  }

  public async registerCar(plate: string, recoveryCode: string, deviceId: string) {
    try {
      const res = await fetch('/api/realtime/cars/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plate, recoveryCode, deviceId }),
      });
      return await res.json();
    } catch {
      return null;
    }
  }

  public async fetchHistory(roomCode?: string, plate?: string): Promise<RealtimeServerMessage[]> {
    try {
      const query = new URLSearchParams();
      if (roomCode) query.set('roomCode', roomCode);
      if (plate) query.set('plate', plate);
      const res = await fetch(`/api/realtime/messages?${query.toString()}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.messages || [];
    } catch {
      return [];
    }
  }
}

export const realtimeService = new RealtimeService();
