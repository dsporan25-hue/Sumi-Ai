/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  RotateCcw,
  Phone,
  MessageSquare,
  Clock,
  Camera,
  Search,
  ChevronDown,
  ChevronUp,
  Battery,
  Wifi,
  Sparkles,
  Send,
} from 'lucide-react';
import { SumiExpression, DeviceStatus } from '../types/sumi';

interface HUDOverlayProps {
  expression: SumiExpression;
  isListening: boolean;
  isThinking: boolean;
  isSpeaking: boolean;
  latestTranscript: string;
  latestSumiResponse: string;
  deviceStatus: DeviceStatus | null;
  wakeWordEnabled: boolean;
  onToggleMic: () => void;
  onRepeatVoice: () => void;
  onOpenSettings: () => void;
  onOpenAction: (actionType: string) => void;
  onSendTextMessage: (text: string) => void;
}

export const HUDOverlay: React.FC<HUDOverlayProps> = ({
  expression,
  isListening,
  isThinking,
  isSpeaking,
  latestTranscript,
  latestSumiResponse,
  deviceStatus,
  wakeWordEnabled,
  onToggleMic,
  onRepeatVoice,
  onOpenSettings,
  onOpenAction,
  onSendTextMessage,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('bn-BD', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    onSendTextMessage(textInput.trim());
    setTextInput('');
    setShowTextInput(false);
  };

  const expressionLabels: Record<SumiExpression, string> = {
    idle: 'মিষ্টি হাসি',
    happy: 'খুশি',
    shy: 'লাজুক ও মায়াবী',
    speaking: 'কথা বলছে...',
    thinking: 'ভাবছে...',
    listening: 'মন দিয়ে শুনছে...',
    sulky: 'আদুরে অভিমান',
    loving: 'গভীর ভালোবাসা',
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-3 sm:p-5">
      {/* 1. TOP STATUS BAR (Minimal, clean, static status indicators) */}
      <header className="flex items-center justify-between w-full max-w-4xl mx-auto pointer-events-auto">
        {/* Left: Sumi AI Brand & Mood Badge */}
        <div className="flex items-center gap-2.5 bg-black/60 border border-zinc-800/80 rounded-2xl px-3.5 py-2 backdrop-blur-md">
          <img src="/icon.svg" alt="Sumi" className="w-6 h-6 rounded-full object-cover" />
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-wide text-white font-['Outfit']">SUMI AI</span>
            <div className="flex items-center gap-1.5 text-[11px] text-[#ff4d79]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff2d55]" />
              <span>{expressionLabels[expression] || 'মিষ্টি হাসি'}</span>
            </div>
          </div>
        </div>

        {/* Center: Wake-Word Badge */}
        <div className="hidden sm:flex items-center gap-2 bg-black/60 border border-zinc-800/80 rounded-2xl px-3.5 py-2 backdrop-blur-md text-xs">
          <span className="text-zinc-400">ওয়েক ওয়ার্ড:</span>
          <span className="text-zinc-200 font-medium">"হাই সুমি"</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              wakeWordEnabled
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {wakeWordEnabled ? 'চালু' : 'বন্ধ'}
          </span>
        </div>

        {/* Right: Device Telemetry & Actions */}
        <div className="flex items-center gap-2 bg-black/60 border border-zinc-800/80 rounded-2xl px-3 py-1.5 backdrop-blur-md text-xs text-zinc-300">
          {/* Time */}
          <span className="font-mono text-zinc-200 text-xs hidden xs:inline">{currentTime}</span>

          {/* Battery */}
          {deviceStatus && (
            <div className="flex items-center gap-1 text-zinc-400 pl-1">
              <Battery className="w-3.5 h-3.5" />
              <span className="text-[11px]">{Math.round(deviceStatus.batteryLevel * 100)}%</span>
            </div>
          )}

          {/* Voice Repeat */}
          <button
            onClick={onRepeatVoice}
            disabled={!latestSumiResponse}
            className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-300 hover:text-white transition disabled:opacity-40"
            title="সুমির শেষ কথা আবার শুনুন"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-300 hover:text-white transition"
            title="সেটিংস ড্যাশবোর্ড"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. CENTER: 100% UNOBSTRUCTED VIEWPORT (Subtitles appear dynamically near lower-middle) */}
      <div className="flex-1 flex flex-col items-center justify-end pb-3 pointer-events-none">
        {/* User Speech Transcription Pill */}
        {latestTranscript && (
          <div className="pointer-events-auto max-w-md w-full px-4 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3 backdrop-blur-md text-right text-xs text-zinc-300 shadow-lg">
              <span className="text-[10px] text-zinc-500 block mb-0.5">আপনি বলেছেন:</span>
              <p className="text-sm text-zinc-100 font-medium">"{latestTranscript}"</p>
            </div>
          </div>
        )}

        {/* Sumi's Spoken Bengali Subtitle Bubble */}
        {latestSumiResponse && (
          <div className="pointer-events-auto max-w-lg w-full px-4 mb-2 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="bg-[#140a13]/90 border border-[#ff2d55]/40 rounded-2xl p-4 backdrop-blur-md text-left shadow-2xl relative">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#ff4d79]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>সুমি (Sumi)</span>
                </div>
                {isSpeaking && (
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-[#ff2d55]" />
                    <span>কথা বলছে...</span>
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-100 leading-relaxed font-normal">
                {latestSumiResponse}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. COLLAPSIBLE BOTTOM CONTROL DOCK (Zero Viewport Occlusion Discipline) */}
      <div className="w-full max-w-2xl mx-auto pointer-events-auto flex flex-col items-center">
        {/* Collapse / Expand Toggle Tab */}
        <button
          onClick={() => setIsDockCollapsed((prev) => !prev)}
          className="mb-1.5 px-4 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-[11px] text-zinc-400 hover:text-zinc-200 backdrop-blur-md flex items-center gap-1 shadow-md hover:bg-zinc-800 transition"
        >
          {isDockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>নিয়ন্ত্রণ প্যানেল দেখান</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>লুকান (Zen Mode)</span>
            </>
          )}
        </button>

        {/* Dock Container */}
        {!isDockCollapsed && (
          <div className="w-full bg-[#120a14]/90 border border-[#ff2d55]/30 rounded-3xl p-3.5 sm:p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-200 flex flex-col gap-3">
            {/* Quick Action Assistant Buttons */}
            <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => onOpenAction('call')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-[#ff2d55]/50 text-zinc-300 hover:text-white transition shrink-0"
              >
                <Phone className="w-3.5 h-3.5 text-[#ff2d55]" />
                <span>কল করো</span>
              </button>

              <button
                onClick={() => onOpenAction('whatsapp')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-[#ff2d55]/50 text-zinc-300 hover:text-white transition shrink-0"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={() => onOpenAction('alarm')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-[#ff2d55]/50 text-zinc-300 hover:text-white transition shrink-0"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>অ্যালার্ম / টাইমার</span>
              </button>

              <button
                onClick={() => onOpenAction('camera')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-[#ff2d55]/50 text-zinc-300 hover:text-white transition shrink-0"
              >
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span>ক্যামেরা ভিশন</span>
              </button>

              <button
                onClick={() => onOpenAction('youtube')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-[#ff2d55]/50 text-zinc-300 hover:text-white transition shrink-0"
              >
                <Search className="w-3.5 h-3.5 text-rose-400" />
                <span>ইউটিউব সার্চ</span>
              </button>
            </div>

            {/* Central Interaction Bar: Big Microphone Button + Optional Text input */}
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-zinc-800/80">
              {/* Optional Text input toggle */}
              <button
                onClick={() => setShowTextInput((prev) => !prev)}
                className="p-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-medium transition"
                title="টেক্সট মেসেজ লিখুন"
              >
                {showTextInput ? 'কণ্ঠ মোড' : 'কীবোর্ড'}
              </button>

              {/* Main Microphone Button */}
              {!showTextInput ? (
                <div className="flex-1 flex flex-col items-center">
                  <button
                    onClick={onToggleMic}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg ${
                      isListening
                        ? 'bg-[#ff1a4b] text-white shadow-[#ff1a4b]/50 scale-105 border-2 border-white'
                        : isThinking
                        ? 'bg-cyan-600 text-white shadow-cyan-500/40'
                        : isSpeaking
                        ? 'bg-[#e11d48] text-white shadow-[#e11d48]/40'
                        : 'bg-zinc-900 border border-zinc-700 text-zinc-200 hover:border-[#ff2d55]'
                    }`}
                    title={isListening ? 'শোনা বন্ধ করুন' : 'কথা বলুন'}
                  >
                    {isListening ? (
                      <Mic className="w-6 h-6 animate-pulse" />
                    ) : (
                      <Mic className="w-6 h-6" />
                    )}
                  </button>
                  <span className="text-[11px] text-zinc-400 mt-1.5 font-medium">
                    {isListening
                      ? 'শুনছি... বলুন'
                      : isThinking
                      ? 'সুমি ভাবছে...'
                      : isSpeaking
                      ? 'সুমি বলছে...'
                      : 'কথা বলতে ট্যাপ করুন'}
                  </span>
                </div>
              ) : (
                <form onSubmit={handleTextSubmit} className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="সুমিকে কিছু বলুন (যেমন: সুমি, কেমন আছো?)..."
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#ff2d55]"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="p-2.5 rounded-2xl bg-[#ff1a4b] hover:bg-[#ff2d55] text-white transition shadow-md shadow-[#ff1a4b]/30"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Status / Quick Action info */}
              <div className="text-right text-[11px] text-zinc-500 hidden sm:block">
                <div>বাংলা সহকারী</div>
                <div className="text-zinc-400">Gemini 3.8 Flash</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
