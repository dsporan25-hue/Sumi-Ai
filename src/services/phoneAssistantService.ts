/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AssistantAction, DeviceStatus } from '../types/sumi';

export interface ContactItem {
  id: string;
  name: string;
  phone: string;
  relationship?: string;
}

export interface ActiveAlarm {
  id: string;
  time: string; // HH:mm
  label: string;
  active: boolean;
}

export interface ActiveTimer {
  id: string;
  durationMinutes: number;
  remainingSeconds: number;
  label: string;
  running: boolean;
}

class PhoneAssistantService {
  private contacts: ContactItem[] = [
    { id: '1', name: 'ফরহান', phone: '+8801712345678', relationship: 'বন্ধু' },
    { id: '2', name: 'মা', phone: '+8801812345678', relationship: 'পরিবার' },
    { id: '3', name: 'বাবা', phone: '+8801912345678', relationship: 'পরিবার' },
    { id: '4', name: 'অফিস', phone: '+8801512345678', relationship: 'কাজের জায়গা' },
  ];

  private alarms: ActiveAlarm[] = [
    { id: '1', time: '07:00', label: 'সকালের ঘুম ভাঙা', active: true },
  ];

  private timers: ActiveTimer[] = [];
  private timerInterval: any = null;
  private onTimerUpdateCallback: ((timers: ActiveTimer[]) => void) | null = null;
  private onAlarmTriggerCallback: ((alarm: ActiveAlarm) => void) | null = null;

  constructor() {
    this.startTimerTicker();
  }

  // --- Contacts & Calling ---
  public getContacts(): ContactItem[] {
    return [...this.contacts];
  }

  public addContact(contact: Omit<ContactItem, 'id'>): ContactItem {
    const newContact = { ...contact, id: Date.now().toString() };
    this.contacts.push(newContact);
    return newContact;
  }

  public findContact(query: string): ContactItem | undefined {
    const clean = query.trim().toLowerCase();
    return this.contacts.find(
      (c) =>
        c.name.toLowerCase().includes(clean) ||
        (c.relationship && c.relationship.toLowerCase().includes(clean)) ||
        c.phone.includes(clean)
    );
  }

  public makeCall(phoneNumber: string, _simSlot: 1 | 2 = 1) {
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    window.location.href = `tel:${cleanNumber}`;
  }

  // --- WhatsApp & Telegram ---
  public openWhatsApp(phoneNumber?: string, message?: string) {
    const encoded = message ? encodeURIComponent(message) : '';
    if (phoneNumber) {
      const clean = phoneNumber.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${clean}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    }
  }

  public openTelegram(usernameOrPhone?: string, message?: string) {
    const encoded = message ? encodeURIComponent(message) : '';
    if (usernameOrPhone && !usernameOrPhone.includes('+')) {
      window.open(`https://t.me/${usernameOrPhone}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://t.me/share/url?url=&text=${encoded}`, '_blank');
    }
  }

  // --- SMS ---
  public sendSMS(phoneNumber?: string, message?: string) {
    const clean = phoneNumber ? phoneNumber.replace(/[^0-9+]/g, '') : '';
    const encoded = message ? encodeURIComponent(message) : '';
    window.location.href = `sms:${clean}?body=${encoded}`;
  }

  // --- YouTube & Google Search ---
  public searchYouTube(query: string) {
    const encoded = encodeURIComponent(query);
    window.open(`https://www.youtube.com/results?search_query=${encoded}`, '_blank');
  }

  public searchGoogle(query: string) {
    const encoded = encodeURIComponent(query);
    window.open(`https://www.google.com/search?q=${encoded}`, '_blank');
  }

  // --- Maps ---
  public openMaps(query: string) {
    const encoded = encodeURIComponent(query);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
  }

  // --- Alarms & Timers ---
  public setAlarm(time: string, label: string = 'অ্যালার্ম'): ActiveAlarm {
    const alarm: ActiveAlarm = {
      id: Date.now().toString(),
      time,
      label,
      active: true,
    };
    this.alarms.push(alarm);
    return alarm;
  }

  public getAlarms(): ActiveAlarm[] {
    return [...this.alarms];
  }

  public toggleAlarm(id: string) {
    this.alarms = this.alarms.map((a) => (a.id === id ? { ...a, active: !a.active } : a));
  }

  public deleteAlarm(id: string) {
    this.alarms = this.alarms.filter((a) => a.id !== id);
  }

  public setTimer(minutes: number, label: string = 'টাইমার'): ActiveTimer {
    const timer: ActiveTimer = {
      id: Date.now().toString(),
      durationMinutes: minutes,
      remainingSeconds: Math.round(minutes * 60),
      label,
      running: true,
    };
    this.timers.push(timer);
    this.onTimerUpdateCallback?.(this.timers);
    return timer;
  }

  public getTimers(): ActiveTimer[] {
    return [...this.timers];
  }

  public cancelTimer(id: string) {
    this.timers = this.timers.filter((t) => t.id !== id);
    this.onTimerUpdateCallback?.(this.timers);
  }

  private startTimerTicker() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      let changed = false;
      this.timers = this.timers
        .map((timer) => {
          if (!timer.running) return timer;
          if (timer.remainingSeconds <= 1) {
            changed = true;
            this.triggerTimerAlarm(timer);
            return null;
          }
          changed = true;
          return { ...timer, remainingSeconds: timer.remainingSeconds - 1 };
        })
        .filter(Boolean) as ActiveTimer[];

      if (changed) {
        this.onTimerUpdateCallback?.(this.timers);
      }
    }, 1000);
  }

  private triggerTimerAlarm(timer: ActiveTimer) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('SUMI AI — টাইমার শেষ!', {
        body: `জান, তোমার "${timer.label}" টাইমার শেষ হয়েছে।`,
        icon: '/icon.svg',
      });
    }
  }

  public setCallbacks(options: {
    onTimerUpdate?: (timers: ActiveTimer[]) => void;
    onAlarmTrigger?: (alarm: ActiveAlarm) => void;
  }) {
    if (options.onTimerUpdate) this.onTimerUpdateCallback = options.onTimerUpdate;
    if (options.onAlarmTrigger) this.onAlarmTriggerCallback = options.onAlarmTrigger;
  }

  // --- Device Information API ---
  public async getDeviceStatus(): Promise<DeviceStatus> {
    let batteryLevel = 0.85;
    let isCharging = false;

    if (typeof navigator !== 'undefined' && (navigator as any).getBattery) {
      try {
        const battery = await (navigator as any).getBattery();
        batteryLevel = battery.level;
        isCharging = battery.charging;
      } catch {
        // Fallback
      }
    }

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const networkType =
      typeof navigator !== 'undefined' && (navigator as any).connection
        ? (navigator as any).connection.effectiveType || '4G'
        : 'Wi-Fi / 4G';

    const screenResolution =
      typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '1080x2400';

    return {
      batteryLevel,
      isCharging,
      isOnline,
      networkType,
      platform: 'Android / Web PWA',
      screenResolution,
    };
  }

  // --- Flashlight / Torch ---
  public async toggleFlashlight(enable: boolean): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        const track = stream.getVideoTracks()[0];
        const capabilities = (track.getCapabilities as any)?.();
        if (capabilities?.torch) {
          await (track as any).applyConstraints({
            advanced: [{ torch: enable }],
          });
          return true;
        }
      }
    } catch {
      // Hardware torch not accessible
    }
    return false;
  }
}

export const phoneAssistantService = new PhoneAssistantService();
