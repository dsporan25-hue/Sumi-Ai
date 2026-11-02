/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sumi3DCanvas } from './components/Sumi3DCanvas';
import { HUDOverlay } from './components/HUDOverlay';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SettingsModal } from './components/SettingsModal';
import { CameraAssistantModal } from './components/CameraAssistantModal';
import { PhoneActionsModal } from './components/PhoneActionsModal';
import { ActionConfirmDialog } from './components/ActionConfirmDialog';
import {
  SumiExpression,
  AssistantAction,
  ChatMessage,
  AppSettings,
  DeviceStatus,
  PermissionStatusMap,
} from './types/sumi';
import { voiceService } from './services/voiceService';
import { phoneAssistantService, ContactItem } from './services/phoneAssistantService';
import { memoryService } from './services/memoryService';
import { WifiOff } from 'lucide-react';

const DEFAULT_SETTINGS: AppSettings = {
  voiceSpeed: 0.98,
  voicePitch: 1.18,
  selectedVoiceURI: '',
  wakeWordEnabled: false,
  backgroundListening: false,
  hapticFeedback: true,
  theme: 'red_black',
  characterOutfit: 'classic_princess',
  blushIntensity: 1.0,
  soundEffects: true,
};

export default function App() {
  // App state
  const [hasWelcomed, setHasWelcomed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('sumi_ai_welcomed') === 'true';
  });

  const [expression, setExpression] = useState<SumiExpression>('idle');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const [latestTranscript, setLatestTranscript] = useState<string>('');
  const [latestSumiResponse, setLatestSumiResponse] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Settings & Permissions
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    const saved = localStorage.getItem('sumi_ai_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {}
    }
    return DEFAULT_SETTINGS;
  });

  const [permissions, setPermissions] = useState<PermissionStatusMap>({
    microphone: 'prompt',
    camera: 'prompt',
    notifications: 'prompt',
    geolocation: 'prompt',
    contacts: 'granted',
    phone: 'granted',
  });

  // Modals
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [actionsModalTab, setActionsModalTab] = useState<'call' | 'whatsapp' | 'alarm' | 'youtube' | null>(null);
  const [pendingConfirmAction, setPendingConfirmAction] = useState<AssistantAction | null>(null);

  const pendingSimContact = useRef<ContactItem | null>(null);

  // Initialize Voice and Device state
  useEffect(() => {
    // 1. Device status
    phoneAssistantService.getDeviceStatus().then(setDeviceStatus);

    // 2. Online/offline listener
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 3. Setup voice callbacks
    voiceService.setCallbacks({
      onListeningState: (listening) => {
        setIsListening(listening);
        if (listening) {
          setExpression('listening');
        } else if (!isThinking && !isSpeaking) {
          setExpression('idle');
        }
      },
      onSpeakingState: (speaking) => {
        setIsSpeaking(speaking);
        if (speaking) {
          setExpression('speaking');
        } else if (!isListening && !isThinking) {
          setExpression('idle');
        }
      },
      onResult: (transcript) => {
        handleUserSpeech(transcript);
      },
    });

    // 4. Check initial permission states
    checkPermissions();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkPermissions = async () => {
    if (typeof navigator !== 'undefined' && (navigator as any).permissions) {
      try {
        const mic = await (navigator as any).permissions.query({ name: 'microphone' });
        const cam = await (navigator as any).permissions.query({ name: 'camera' });
        const geo = await (navigator as any).permissions.query({ name: 'geolocation' });
        setPermissions((prev) => ({
          ...prev,
          microphone: mic.state || 'prompt',
          camera: cam.state || 'prompt',
          geolocation: geo.state || 'prompt',
          notifications: 'Notification' in window ? (Notification.permission as any) : 'prompt',
        }));
      } catch {}
    }
  };

  const handleRequestPermission = async (perm: keyof PermissionStatusMap) => {
    try {
      if (perm === 'microphone') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        setPermissions((prev) => ({ ...prev, microphone: 'granted' }));
      } else if (perm === 'camera') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((t) => t.stop());
        setPermissions((prev) => ({ ...prev, camera: 'granted' }));
      } else if (perm === 'notifications') {
        if ('Notification' in window) {
          const res = await Notification.requestPermission();
          setPermissions((prev) => ({ ...prev, notifications: res as any }));
        }
      } else if (perm === 'geolocation') {
        navigator.geolocation.getCurrentPosition(
          () => setPermissions((prev) => ({ ...prev, geolocation: 'granted' })),
          () => setPermissions((prev) => ({ ...prev, geolocation: 'denied' }))
        );
      }
    } catch {
      setPermissions((prev) => ({ ...prev, [perm]: 'denied' }));
    }
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...newSettings };
      if (typeof window !== 'undefined') {
        localStorage.setItem('sumi_ai_settings', JSON.stringify(merged));
      }
      return merged;
    });

    if (typeof newSettings.wakeWordEnabled !== 'undefined') {
      voiceService.toggleWakeWord(newSettings.wakeWordEnabled);
    }
  };

  // Process user speech or text through Gemini AI backend
  const handleUserSpeech = async (transcript: string) => {
    // Wake word check if enabled
    const cleanLower = transcript.toLowerCase();
    if (settings.wakeWordEnabled) {
      if (cleanLower.includes('হাই সুমি') || cleanLower.includes('সুমি') || cleanLower.includes('hi sumi')) {
        voiceService.playCuteChime('wake');
      }
    }

    setLatestTranscript(transcript);
    setIsThinking(true);
    setExpression('thinking');

    // Add user message to history
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: transcript,
      timestamp: new Date().toISOString(),
    };
    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: transcript,
          history: updatedHistory.slice(-6),
          deviceInfo: deviceStatus || {},
        }),
      });

      const resData = await res.json();
      setIsThinking(false);

      if (resData.success && resData.data) {
        const { text, expression: newExpr, action } = resData.data;

        setLatestSumiResponse(text);
        setExpression(newExpr || 'loving');

        // Add Sumi message to history
        const sumiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'sumi',
          text,
          timestamp: new Date().toISOString(),
          action,
          expression: newExpr,
        };
        setChatHistory((prev) => [...prev, sumiMsg]);

        // Speak Sumi's sweet Bengali voice
        await voiceService.speak(text, {
          rate: settings.voiceSpeed,
          pitch: settings.voicePitch,
          voiceURI: settings.selectedVoiceURI,
        });

        // Handle assistant actions if requested
        if (action) {
          executeAssistantAction(action);
        }
      } else {
        const fallbackText = 'জান, ইন্টারনেটের সংযোগে সমস্যা হচ্ছে। দয়া করে আবার বলো, আমি শুনছি।';
        setLatestSumiResponse(fallbackText);
        setExpression('sulky');
        voiceService.speak(fallbackText, {
          rate: settings.voiceSpeed,
          pitch: settings.voicePitch,
        });
      }
    } catch (err) {
      console.error('Chat error:', err);
      setIsThinking(false);
      setExpression('sulky');
      const errText = 'জান, আমি তোমার কথা শুনতে পাচ্ছি কিন্তু উত্তর পেতে সমস্যা হচ্ছে।';
      setLatestSumiResponse(errText);
      voiceService.speak(errText);
    }
  };

  // Execute Assistant Actions
  const executeAssistantAction = (action: AssistantAction) => {
    if (action.type === 'call') {
      // Find contact if only name was provided
      if (action.contactName && !action.phoneNumber) {
        const found = phoneAssistantService.findContact(action.contactName);
        if (found) {
          action.phoneNumber = found.phone;
        }
      }
      setPendingConfirmAction(action);
    } else if (action.type === 'whatsapp' || action.type === 'telegram' || action.type === 'sms') {
      setPendingConfirmAction(action);
    } else if (action.type === 'youtube_search' && action.query) {
      phoneAssistantService.searchYouTube(action.query);
    } else if (action.type === 'google_search' && action.query) {
      phoneAssistantService.searchGoogle(action.query);
    } else if (action.type === 'set_alarm' && action.time) {
      phoneAssistantService.setAlarm(action.time, action.label || 'অ্যালার্ম');
    } else if (action.type === 'set_timer' && action.minutes) {
      phoneAssistantService.setTimer(action.minutes, action.label || 'টাইমার');
    } else if (action.type === 'camera') {
      setShowCamera(true);
    } else if (action.type === 'maps' && action.query) {
      phoneAssistantService.openMaps(action.query);
    } else if (action.type === 'battery_status') {
      // Battery info already reported verbally
    } else if (action.type === 'settings') {
      setShowSettings(true);
    }
  };

  const handleConfirmAction = (payload?: any) => {
    if (!pendingConfirmAction) return;

    if (pendingConfirmAction.type === 'call') {
      const simSlot = payload?.simSlot || 1;
      const numberToDial = pendingConfirmAction.phoneNumber || '+8801712345678';
      phoneAssistantService.makeCall(numberToDial, simSlot);
    } else if (pendingConfirmAction.type === 'whatsapp') {
      phoneAssistantService.openWhatsApp(
        pendingConfirmAction.phoneNumber,
        payload?.message || pendingConfirmAction.message
      );
    } else if (pendingConfirmAction.type === 'telegram') {
      phoneAssistantService.openTelegram(
        pendingConfirmAction.phoneNumber,
        payload?.message || pendingConfirmAction.message
      );
    } else if (pendingConfirmAction.type === 'sms') {
      phoneAssistantService.sendSMS(
        pendingConfirmAction.phoneNumber,
        payload?.message || pendingConfirmAction.message
      );
    }

    setPendingConfirmAction(null);
  };

  const handleToggleMic = () => {
    if (isListening) {
      voiceService.stopListening();
    } else {
      voiceService.startListening();
    }
  };

  const handleRepeatVoice = () => {
    voiceService.repeatLast();
  };

  const handleOpenActionModal = (actionType: string) => {
    if (actionType === 'camera') {
      setShowCamera(true);
    } else if (actionType === 'call') {
      setActionsModalTab('call');
    } else if (actionType === 'whatsapp') {
      setActionsModalTab('whatsapp');
    } else if (actionType === 'alarm') {
      setActionsModalTab('alarm');
    } else if (actionType === 'youtube') {
      setActionsModalTab('youtube');
    }
  };

  const handleRequestSimConfirmFromContact = (contact: ContactItem) => {
    setActionsModalTab(null);
    setPendingConfirmAction({
      type: 'call',
      contactName: contact.name,
      phoneNumber: contact.phone,
      promptSim: true,
    });
  };

  const handleWelcomeComplete = () => {
    localStorage.setItem('sumi_ai_welcomed', 'true');
    setHasWelcomed(true);
    // As per instruction 6: Sumi waits for user to speak, does NOT start speaking automatically.
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0a0a0f] text-white">
      {/* 1. Offline Banner if internet disconnected */}
      {!isOnline && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-600/90 text-white text-xs font-medium shadow-lg backdrop-blur-md">
          <WifiOff className="w-3.5 h-3.5" />
          <span>ইন্টারনেট সংযোগ বিচ্ছিন্ন — সুমির সাথে কথা বলতে ইন্টারনেট সংযোগ প্রয়োজন।</span>
        </div>
      )}

      {/* 2. Full-Screen 3D Anime Girl (Sumi) Canvas */}
      <Sumi3DCanvas
        expression={expression}
        isSpeaking={isSpeaking}
        isListening={isListening}
        isThinking={isThinking}
        blushIntensity={settings.blushIntensity}
        outfitVariant={settings.characterOutfit}
      />

      {/* 3. Full-Screen HUD Overlay with Collapsible Bottom Dock */}
      <HUDOverlay
        expression={expression}
        isListening={isListening}
        isThinking={isThinking}
        isSpeaking={isSpeaking}
        latestTranscript={latestTranscript}
        latestSumiResponse={latestSumiResponse}
        deviceStatus={deviceStatus}
        wakeWordEnabled={settings.wakeWordEnabled}
        onToggleMic={handleToggleMic}
        onRepeatVoice={handleRepeatVoice}
        onOpenSettings={() => setShowSettings(true)}
        onOpenAction={handleOpenActionModal}
        onSendTextMessage={handleUserSpeech}
      />

      {/* 4. First Launch Anime Welcome Screen */}
      {!hasWelcomed && <WelcomeScreen onStart={handleWelcomeComplete} />}

      {/* 5. Complete 10-Tab Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={updateSettings}
          onClose={() => setShowSettings(false)}
          permissions={permissions}
          onRequestPermission={handleRequestPermission}
        />
      )}

      {/* 6. Live Camera Vision Modal */}
      {showCamera && (
        <CameraAssistantModal
          onClose={() => setShowCamera(false)}
          onAnalysisComplete={(desc) => {
            setLatestSumiResponse(desc);
            setExpression('loving');
          }}
        />
      )}

      {/* 7. Phone Actions Modal (Calls, WhatsApp, Alarms, YouTube) */}
      {actionsModalTab && (
        <PhoneActionsModal
          initialTab={actionsModalTab}
          onClose={() => setActionsModalTab(null)}
          onRequestSimConfirm={handleRequestSimConfirmFromContact}
        />
      )}

      {/* 8. Action Confirm Dialog (SIM 1 vs SIM 2 & WhatsApp message confirmation) */}
      {pendingConfirmAction && (
        <ActionConfirmDialog
          action={pendingConfirmAction}
          onConfirm={handleConfirmAction}
          onCancel={() => setPendingConfirmAction(null)}
        />
      )}
    </main>
  );
}
