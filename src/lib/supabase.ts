import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { ChatMessage, UserGender } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

// Multi-tab BroadcastChannel manager with reference counting for leak-free cleanups
interface ManagedBroadcastChannel {
  channel: BroadcastChannel;
  listenerCount: number;
}

const managedChannels: Map<string, ManagedBroadcastChannel> = new Map();

function acquireBroadcastChannel(roomCode: string): BroadcastChannel | null {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return null;
  
  const key = `plakala_room_${roomCode}`;
  let item = managedChannels.get(key);
  if (!item) {
    try {
      const channel = new BroadcastChannel(key);
      item = { channel, listenerCount: 0 };
      managedChannels.set(key, item);
    } catch {
      return null;
    }
  }
  item.listenerCount++;
  return item.channel;
}

function releaseBroadcastChannel(roomCode: string) {
  const key = `plakala_room_${roomCode}`;
  const item = managedChannels.get(key);
  if (!item) return;

  item.listenerCount--;
  if (item.listenerCount <= 0) {
    try {
      item.channel.close();
    } catch {}
    managedChannels.delete(key);
  }
}

/**
 * Subscribes to Realtime messages for a 6-digit room code or plate with guaranteed cleanup.
 */
export function subscribeToRoom(
  roomCode: string,
  callbacks: {
    onMessage: (msg: ChatMessage) => void;
    onStatusUpdate?: (status: 'seen' | 'sending' | 'sent', messageId?: string) => void;
  }
): () => void {
  let isCleanedUp = false;
  let supabaseChannel: RealtimeChannel | null = null;

  if (supabase) {
    const channelName = `room-${roomCode}`;
    supabaseChannel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'new_message' }, (payload) => {
        if (isCleanedUp) return;
        if (payload.payload && payload.payload.message) {
          callbacks.onMessage(payload.payload.message);
        }
      })
      .on('broadcast', { event: 'status_update' }, (payload) => {
        if (isCleanedUp) return;
        if (payload.payload && callbacks.onStatusUpdate) {
          callbacks.onStatusUpdate(payload.payload.status, payload.payload.messageId);
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_code=eq.${roomCode}`,
        },
        (payload) => {
          if (isCleanedUp) return;
          const row = payload.new as any;
          if (row) {
            callbacks.onMessage({
              id: row.id,
              roomCode: row.room_code,
              sender: 'other',
              text: row.text,
              timestamp: new Date(row.created_at).getTime(),
              timeFormatted: new Date(row.created_at).toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              status: row.status || 'seen',
              senderPhoto: row.sender_photo,
              senderGender: row.sender_gender,
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Supabase Realtime] Subscribed to room: ${roomCode}`);
        }
      });
  }

  const localChannel = acquireBroadcastChannel(roomCode);
  const handleLocalMessage = (event: MessageEvent) => {
    if (isCleanedUp) return;
    const data = event.data;
    if (!data) return;
    if (data.type === 'new_message' && data.message) {
      callbacks.onMessage(data.message);
    } else if (data.type === 'status_update' && callbacks.onStatusUpdate) {
      callbacks.onStatusUpdate(data.status, data.messageId);
    }
  };

  if (localChannel) {
    localChannel.addEventListener('message', handleLocalMessage);
  }

  // Cleanup function
  return () => {
    isCleanedUp = true;

    if (supabase && supabaseChannel) {
      try {
        supabase.removeChannel(supabaseChannel);
      } catch (err) {
        console.warn('[Supabase Realtime] Error removing channel:', err);
      }
      supabaseChannel = null;
    }

    if (localChannel) {
      localChannel.removeEventListener('message', handleLocalMessage);
      releaseBroadcastChannel(roomCode);
    }
  };
}

/**
 * Broadcasts a chat message and saves to Supabase database if configured.
 */
export async function sendRealtimeMessage(
  roomCode: string,
  message: ChatMessage
): Promise<void> {
  if (supabase) {
    try {
      const channel = supabase.channel(`room-${roomCode}`);
      await channel.send({
        type: 'broadcast',
        event: 'new_message',
        payload: { message },
      });

      // Persist to Supabase postgres table
      await supabase.from('messages').insert({
        room_code: roomCode,
        plate: message.plate || 'Bilinmiyor',
        sender_id: message.sender,
        sender_photo: message.senderPhoto || null,
        sender_gender: message.senderGender || 'unspecified',
        text: message.text,
        status: message.status || 'sent',
      });
    } catch (err) {
      console.warn('[Supabase Realtime] Send failed:', err);
    }
  }

  // Send to other tabs via local BroadcastChannel
  const key = `plakala_room_${roomCode}`;
  const managed = managedChannels.get(key);
  if (managed) {
    managed.channel.postMessage({
      type: 'new_message',
      message,
    });
  } else if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const tempChannel = new BroadcastChannel(key);
      tempChannel.postMessage({ type: 'new_message', message });
      tempChannel.close();
    } catch {}
  }
}

/**
 * Fetches message history from Supabase
 */
export async function fetchRoomMessagesFromSupabase(
  roomCode: string
): Promise<ChatMessage[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room_code', roomCode)
      .order('created_at', { ascending: true });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      roomCode: row.room_code,
      sender: 'other',
      text: row.text,
      timestamp: new Date(row.created_at).getTime(),
      timeFormatted: new Date(row.created_at).toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: row.status || 'seen',
      senderPhoto: row.sender_photo,
      senderGender: row.sender_gender,
    }));
  } catch {
    return [];
  }
}

/**
 * Registers a car in Supabase
 */
export async function registerCarInSupabase(
  plate: string,
  recoveryCode: string,
  deviceId?: string
): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('cars').upsert({
      plate: plate.toUpperCase().trim(),
      recovery_code: recoveryCode,
      device_id: deviceId || null,
    });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Checks if a plate exists in Supabase
 */
export async function checkPlateInSupabase(
  plate: string
): Promise<{ exists: boolean; car?: any }> {
  if (!supabase) return { exists: false };
  try {
    const cleanPlate = plate.toUpperCase().trim();
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('plate', cleanPlate)
      .maybeSingle();

    if (error || !data) return { exists: false };
    return { exists: true, car: data };
  } catch {
    return { exists: false };
  }
}
