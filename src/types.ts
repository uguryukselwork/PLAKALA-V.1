export type ScreenType =
  | 'welcome'
  | 'home'
  | 'add-car'
  | 'reason'
  | 'status'
  | 'incoming'
  | 'chat'
  | 'park'
  | 'my-cars'
  | 'profile'
  | 'settings'
  | 'faq'
  | 'info'
  | 'mission'
  | 'about'
  | 'install'
  | 'admin';

export type SoundTone = 'classic' | 'horn' | 'gentle' | 'radar' | 'emergency';

export interface Car {
  id: string;
  plate: string;
  code: string;
  addedAt: string;
  isPrimary?: boolean;
}

export interface ParkLocation {
  lat: number;
  lng: number;
  note: string;
  time: string;
  date: string;
}

export interface NotificationItem {
  id: string;
  targetPlate: string;
  senderPlate?: string;
  reason: string;
  note?: string;
  timestamp: number;
  timeFormatted: string;
  roomCode: string;
  status: 'sent' | 'seen' | 'replied';
  replyText?: string;
  isIncoming?: boolean;
}

export type UserGender = 'male' | 'female' | 'unspecified';

export type ChatPatternType = 'doodle' | 'dots' | 'grid' | 'waves' | 'none';

export type ChatFontWeight = 'light' | 'normal' | 'medium' | 'bold';

export interface ChatMessage {
  id: string;
  roomCode: string;
  plate?: string;
  sender: 'me' | 'other' | 'system';
  text: string;
  timestamp: number;
  timeFormatted: string;
  status?: 'sending' | 'sent' | 'seen';
  senderPhoto?: string | null;
  senderGender?: UserGender;
}

export interface AppSettings {
  soundEnabled: boolean;
  soundTone: SoundTone;
  volume: number; // 0 to 1
  theme: 'light' | 'dark';
  phone: string;
  isBlocked?: boolean;
  unblockRequested?: boolean;
  blockReason?: string;
}

export interface PlateSegments {
  city: string;
  letters: string;
  digits: string;
}
