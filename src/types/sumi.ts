export type SumiExpression =
  | 'idle'
  | 'happy'
  | 'shy'
  | 'speaking'
  | 'thinking'
  | 'listening'
  | 'sulky'
  | 'loving';

export type AssistantActionType =
  | 'call'
  | 'whatsapp'
  | 'telegram'
  | 'youtube_search'
  | 'google_search'
  | 'set_alarm'
  | 'set_timer'
  | 'set_reminder'
  | 'open_app'
  | 'battery_status'
  | 'device_info'
  | 'camera'
  | 'gallery'
  | 'maps'
  | 'sms'
  | 'settings';

export interface AssistantAction {
  type: AssistantActionType;
  contactName?: string;
  phoneNumber?: string;
  message?: string;
  query?: string;
  time?: string;
  minutes?: number;
  text?: string;
  label?: string;
  appName?: string;
  promptSim?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'sumi';
  text: string;
  timestamp: string;
  action?: AssistantAction | null;
  expression?: SumiExpression;
}

export interface MemoryItem {
  id: string;
  category: string;
  fact: string;
  createdAt: string;
}

export interface DeviceStatus {
  batteryLevel: number;
  isCharging: boolean;
  isOnline: boolean;
  networkType: string;
  platform: string;
  screenResolution: string;
}

export interface AppSettings {
  voiceSpeed: number; // 0.8 - 1.2
  voicePitch: number; // 0.8 - 1.4
  selectedVoiceURI: string;
  wakeWordEnabled: boolean; // default false as required
  backgroundListening: boolean; // default false
  hapticFeedback: boolean;
  theme: 'red_black' | 'midnight_ruby' | 'cyber_crimson';
  characterOutfit: 'classic_princess' | 'modern_gothic' | 'kimono_red';
  blushIntensity: number;
  soundEffects: boolean;
}

export interface PermissionStatusMap {
  microphone: 'granted' | 'denied' | 'prompt';
  camera: 'granted' | 'denied' | 'prompt';
  notifications: 'granted' | 'denied' | 'prompt';
  geolocation: 'granted' | 'denied' | 'prompt';
  contacts: 'granted' | 'denied' | 'prompt';
  phone: 'granted' | 'denied' | 'prompt';
}
