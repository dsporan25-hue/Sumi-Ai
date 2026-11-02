/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Volume2,
  Sparkles,
  Palette,
  Brain,
  Database,
  Shield,
  Smartphone,
  Lock,
  Wifi,
  Info,
  X,
  Trash2,
  Play,
  Download,
  Check,
  RefreshCw,
} from 'lucide-react';
import { AppSettings, MemoryItem, PermissionStatusMap } from '../types/sumi';
import { voiceService } from '../services/voiceService';
import { memoryService } from '../services/memoryService';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onClose: () => void;
  permissions: PermissionStatusMap;
  onRequestPermission: (perm: keyof PermissionStatusMap) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
  permissions,
  onRequestPermission,
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);
  const [newMemoryInput, setNewMemoryInput] = useState('');
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [connectionPing, setConnectionPing] = useState<number | null>(null);

  useEffect(() => {
    // Load voices
    const updateVoices = () => {
      setAvailableVoices(voiceService.getVoices());
    };
    updateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    // Load memories
    loadMemories();

    // Listen for PWA install event
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Standalone detection
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // Measure connection ping
    checkConnection();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const loadMemories = async () => {
    setLoadingMemories(true);
    const list = await memoryService.getMemories();
    setMemories(list);
    setLoadingMemories(false);
  };

  const handleAddMemory = async () => {
    if (!newMemoryInput.trim()) return;
    const item = await memoryService.addMemory(newMemoryInput.trim());
    if (item) {
      setMemories((prev) => [item, ...prev]);
      setNewMemoryInput('');
    }
  };

  const handleDeleteMemory = async (id: string) => {
    const success = await memoryService.deleteMemory(id);
    if (success) {
      setMemories((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleClearAllMemories = async () => {
    if (window.confirm('জান, তুমি কি সুমির সব স্মৃতি মুছে ফেলতে চাও?')) {
      const success = await memoryService.clearAllMemories();
      if (success) {
        setMemories([]);
      }
    }
  };

  const checkConnection = async () => {
    const t0 = performance.now();
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setConnectionPing(Math.round(performance.now() - t0));
      }
    } catch {
      setConnectionPing(null);
    }
  };

  const handleInstallApp = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setInstallPrompt(null);
      }
    } else {
      alert('ব্রাউজারের মেনু থেকে "Add to Home Screen" বা "Install" সিলেক্ট করুন।');
    }
  };

  const testVoiceSample = () => {
    voiceService.speak('জান, আমি সুমি! তোমার মিষ্টি কণ্ঠ শুনলে আমার মন ভালো হয়ে যায়।', {
      rate: settings.voiceSpeed,
      pitch: settings.voicePitch,
      voiceURI: settings.selectedVoiceURI,
    });
  };

  const navItems = [
    { title: 'কণ্ঠ সেটিংস', icon: Volume2 },
    { title: 'চরিত্র ও রূপ', icon: Sparkles },
    { title: 'থিম ও স্টাইল', icon: Palette },
    { title: 'এআই ব্রেন', icon: Brain },
    { title: 'স্মৃতি ব্যবস্থাপনা', icon: Database },
    { title: 'গোপনীয়তা ও সুরক্ষা', icon: Shield },
    { title: 'ফোন সহকারী', icon: Smartphone },
    { title: 'অনুমতি সমূহ', icon: Lock },
    { title: 'ইন্টারনেট ও নেটওয়ার্ক', icon: Wifi },
    { title: 'SUMI AI সম্পর্কে', icon: Info },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl h-[88vh] rounded-3xl bg-[#110c14] border border-[#ff2d55]/40 flex flex-col overflow-hidden shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d121c] bg-[#140b15]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#ff2d55]/20 flex items-center justify-center text-[#ff4d79]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-base">SUMI AI ড্যাশবোর্ড সেটিংস</h2>
              <p className="text-zinc-400 text-xs">তোমার মনের মতো সুমিকে সাজিয়ে নাও</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body layout: Navigation Tabs + Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-56 bg-[#0c080e] border-b md:border-b-0 md:border-r border-[#26101a] overflow-x-auto md:overflow-y-auto flex md:flex-col p-2 gap-1 shrink-0">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const active = activeTab === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition whitespace-nowrap md:whitespace-normal text-left ${
                    active
                      ? 'bg-[#ff2d55]/20 text-[#ff4d79] font-semibold border border-[#ff2d55]/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.title}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto bg-[#110c14] space-y-6">
            {/* 1. Voice Settings */}
            {activeTab === 0 && (
              <div className="space-y-5">
                <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                  সুমির মিষ্টি কণ্ঠ নির্বাচন
                </h3>

                <div>
                  <label className="text-xs text-zinc-400 mb-2 block">ভয়েস নির্বাচন (Voice List)</label>
                  <select
                    value={settings.selectedVoiceURI}
                    onChange={(e) => onUpdateSettings({ selectedVoiceURI: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-[#ff2d55]"
                  >
                    <option value="">ডিফল্ট মিষ্টি বাংলা কণ্ঠ (Auto Select Bengali Voice)</option>
                    {availableVoices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-zinc-400">কথা বলার গতি (Speed)</span>
                    <span className="text-zinc-200 font-mono">{settings.voiceSpeed}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.75"
                    max="1.3"
                    step="0.05"
                    value={settings.voiceSpeed}
                    onChange={(e) => onUpdateSettings({ voiceSpeed: parseFloat(e.target.value) })}
                    className="w-full accent-[#ff2d55]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-zinc-400">কণ্ঠের সুর / পিচ (Sweetness Pitch)</span>
                    <span className="text-zinc-200 font-mono">{settings.voicePitch}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.9"
                    max="1.4"
                    step="0.05"
                    value={settings.voicePitch}
                    onChange={(e) => onUpdateSettings({ voicePitch: parseFloat(e.target.value) })}
                    className="w-full accent-[#ff2d55]"
                  />
                </div>

                <button
                  type="button"
                  onClick={testVoiceSample}
                  className="py-2.5 px-4 rounded-xl bg-[#ff2d55]/20 border border-[#ff2d55]/40 text-[#ff4d79] text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#ff2d55]/30 transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>কণ্ঠের নমুনা শুনুন</span>
                </button>
              </div>
            )}

            {/* 2. Character & Appearance */}
            {activeTab === 1 && (
              <div className="space-y-5">
                <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                  সুমির পোশাক ও সৌন্দর্য
                </h3>

                <div>
                  <label className="text-xs text-zinc-400 mb-2 block">পোশাকের ধরন (Outfit Style)</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: 'classic_princess', name: 'রাজকুমারী গাউন' },
                      { id: 'modern_gothic', name: 'গথিক প্রিন্সেস' },
                      { id: 'kimono_red', name: 'রোমান্টিক কিমোনো' },
                    ].map((outfit) => (
                      <button
                        key={outfit.id}
                        type="button"
                        onClick={() => onUpdateSettings({ characterOutfit: outfit.id as any })}
                        className={`p-3 rounded-xl border text-center transition ${
                          settings.characterOutfit === outfit.id
                            ? 'bg-[#ff2d55]/20 border-[#ff2d55] text-white font-medium'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        <div className="text-xs font-medium">{outfit.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-zinc-400">লাজুক রক্তিম ভাব (Blush Intensity)</span>
                    <span className="text-zinc-200 font-mono">{settings.blushIntensity * 100}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.5"
                    step="0.1"
                    value={settings.blushIntensity}
                    onChange={(e) => onUpdateSettings({ blushIntensity: parseFloat(e.target.value) })}
                    className="w-full accent-[#ff2d55]"
                  />
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 space-y-1">
                  <div>• চুল: লম্বা সিল্কি রূপালী চুল (Silver/White Twin Hair)</div>
                  <div>• চোখ: মিষ্টি মায়াবী প্রাকৃতিক বাদামী চোখ (Warm Brown Eyes)</div>
                  <div>• উচ্চতা: ৫ ফুট ২ ইঞ্চি অনুপাত</div>
                </div>
              </div>
            )}

            {/* 3. Theme Settings */}
            {activeTab === 2 && (
              <div className="space-y-5">
                <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                  অ্যাপের থিম ও ব্যাকগ্রাউন্ড
                </h3>

                <div className="space-y-2.5">
                  {[
                    { id: 'red_black', title: 'রেড + ব্ল্যাক সাইবার (ডিফল্ট)', desc: 'অনবদ্য লাল নিওন ও ডার্ক নান্দনিকতা' },
                    { id: 'midnight_ruby', title: 'মিডনাইট রুবি', desc: 'গভীর রত্নময় লাল ও ভেলভেট কালো' },
                    { id: 'cyber_crimson', title: 'সাইবার ক্রিমসন', desc: 'ফিউচারিস্টিক অ্যানিমে নিওন গ্লো' },
                  ].map((thm) => (
                    <button
                      key={thm.id}
                      onClick={() => onUpdateSettings({ theme: thm.id as any })}
                      className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition ${
                        settings.theme === thm.id
                          ? 'bg-[#ff2d55]/15 border-[#ff2d55] text-white'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-semibold text-zinc-100">{thm.title}</div>
                        <div className="text-[11px] text-zinc-400">{thm.desc}</div>
                      </div>
                      {settings.theme === thm.id && <Check className="w-4 h-4 text-[#ff2d55]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. AI Settings */}
            {activeTab === 3 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                  গুগল জেমিনি এআই ব্রেন
                </h3>

                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">মডেল:</span>
                    <span className="text-emerald-400 font-mono">Gemini 3.8 Flash</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">ভাষা:</span>
                    <span className="text-zinc-200">বাংলা (Bengali Only)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">সার্ভার ইন্টিগ্রেশন:</span>
                    <span className="text-emerald-400 font-mono">Server-Side Proxy</span>
                  </div>
                </div>

                <div className="text-xs text-zinc-400 leading-relaxed">
                  সুমি গুগল জেমিনির সর্বাধুনিক মাল্টিমোডাল নিউরাল নেটওয়ার্ক ব্যবহার করে বাংলা ভাষা বোঝে, ফটো বিশ্লেষণ করে এবং ফোন কল, মেসেজ বা টাইমারের মতো কাজ নির্ভুলভাবে সম্পাদন করে।
                </div>
              </div>
            )}

            {/* 5. Memory Settings */}
            {activeTab === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                    সুমির স্থায়ী স্মৃতি (Long-Term Memory)
                  </h3>
                  {memories.length > 0 && (
                    <button
                      onClick={handleClearAllMemories}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>সব মুছুন</span>
                    </button>
                  )}
                </div>

                {/* Add new memory input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMemoryInput}
                    onChange={(e) => setNewMemoryInput(e.target.value)}
                    placeholder="নতুন তথ্য যোগ করুন (যেমন: আমার প্রিয় রং লাল)..."
                    className="flex-1 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#ff2d55]"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddMemory()}
                  />
                  <button
                    onClick={handleAddMemory}
                    className="px-4 py-2.5 rounded-xl bg-[#ff1a4b] text-white text-xs font-semibold hover:bg-[#ff2d55] transition"
                  >
                    সংরক্ষণ
                  </button>
                </div>

                {/* Memories list */}
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {loadingMemories ? (
                    <div className="text-center py-6 text-xs text-zinc-500">স্মৃতি লোড হচ্ছে...</div>
                  ) : memories.length === 0 ? (
                    <div className="text-center py-6 text-xs text-zinc-500">
                      এখনো কোনো স্মৃতি জমা হয়নি। কথা বললে সুমি নিজে থেকেই মনে রাখবে!
                    </div>
                  ) : (
                    memories.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="text-xs text-zinc-200">{m.fact}</div>
                          <div className="text-[10px] text-zinc-500 mt-1">{m.category}</div>
                        </div>
                        <button
                          onClick={() => handleDeleteMemory(m.id)}
                          className="text-zinc-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 6. Privacy Settings */}
            {activeTab === 5 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                  নিরাপত্তা ও গোপনীয়তা ড্যাশবোর্ড
                </h3>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">ওয়েক ওয়ার্ড (হাই সুমি)</div>
                      <div className="text-[11px] text-zinc-400">
                        উচ্চারণ করলে সুমি জেগে উঠবে (ডিফল্ট বন্ধ থাকে)
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.wakeWordEnabled}
                      onChange={(e) => onUpdateSettings({ wakeWordEnabled: e.target.checked })}
                      className="w-4 h-4 accent-[#ff2d55] cursor-pointer"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">শব্দ সংকেত ও প্রতিক্রিয়া</div>
                      <div className="text-[11px] text-zinc-400">কথোপকথন শুরুর মিষ্টি চাইম সাউন্ড</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.soundEffects}
                      onChange={(e) => onUpdateSettings({ soundEffects: e.target.checked })}
                      className="w-4 h-4 accent-[#ff2d55] cursor-pointer"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">স্মৃতি সংরক্ষণ অনুমোদন</div>
                      <div className="text-[11px] text-zinc-400">ব্যক্তিগত পছন্দ ক্লাউডে সঞ্চয়</div>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      onChange={(e) => memoryService.setMemoryEnabled(e.target.checked)}
                      className="w-4 h-4 accent-[#ff2d55] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/40 text-emerald-300 text-xs leading-relaxed">
                  🔒 সুমি কোনো অনির্দিষ্ট রেকর্ডিং করে না। আপনার স্পষ্ট ভয়েস কমান্ড ছাড়া কোনো তথ্য কোথাও পাঠানো হয় না।
                </div>
              </div>
            )}

            {/* 7. Phone Assistant Settings */}
            {activeTab === 6 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                  ফোন সহকারী কনফিগারেশন
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-zinc-200">ডুয়াল সিম ডায়াল ডায়ালগ</div>
                      <div className="text-zinc-400 text-[11px]">প্রতিটি কলে সিম ১ নাকি সিম ২ নিশ্চিত করবে</div>
                    </div>
                    <span className="text-emerald-400 font-medium">সক্রিয়</span>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-zinc-200">হোয়াটসঅ্যাপ ও টেলিগ্রাম সংযোগ</div>
                      <div className="text-zinc-400 text-[11px]">মেসেজ পাঠানোর আগে পড়ে শোনাবে</div>
                    </div>
                    <span className="text-emerald-400 font-medium">সক্রিয়</span>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-zinc-200">স্মার্ট অ্যালার্ম ও টাইমার</div>
                      <div className="text-zinc-400 text-[11px]">নোটিফিকেশন ও অ্যালার্ম বাজার সুবিধা</div>
                    </div>
                    <span className="text-emerald-400 font-medium">সক্রিয়</span>
                  </div>
                </div>
              </div>
            )}

            {/* 8. Permissions */}
            {activeTab === 7 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                  ডিভাইস পারমিশন স্ট্যাটাস
                </h3>

                <div className="space-y-2.5">
                  {[
                    { key: 'microphone' as const, title: 'মাইক্রোফোন (Microphone)', desc: 'ভয়েস কমান্ড ও ওয়েক-ওয়ার্ডের জন্য' },
                    { key: 'camera' as const, title: 'ক্যামেরা (Camera)', desc: 'ছবি তোলার জন্য ও জেমিনি ভিশন বিশ্লেষণের জন্য' },
                    { key: 'notifications' as const, title: 'নোটিফিকেশন (Notifications)', desc: 'টাইমার ও অ্যালার্মের সংকেত' },
                    { key: 'geolocation' as const, title: 'লোকেশন (Location)', desc: 'আবহাওয়া ও ম্যাপ নেভিগেশনের জন্য' },
                  ].map((perm) => (
                    <div
                      key={perm.key}
                      className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-zinc-200">{perm.title}</div>
                        <div className="text-[11px] text-zinc-400">{perm.desc}</div>
                      </div>
                      <button
                        onClick={() => onRequestPermission(perm.key)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                          permissions[perm.key] === 'granted'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        {permissions[perm.key] === 'granted' ? 'অনুমোদিত' : 'অনুরোধ করুন'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 9. Internet & Connection */}
            {activeTab === 8 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                  ইন্টারনেট ও সংযোগ স্ট্যাটাস
                </h3>

                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">সংযোগের অবস্থা:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      অনলাইন (Online)
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">সার্ভার লেটেন্সি (Ping):</span>
                    <span className="text-zinc-200 font-mono">
                      {connectionPing ? `${connectionPing} ms` : 'পরিমাপ হচ্ছে...'}
                    </span>
                  </div>

                  <button
                    onClick={checkConnection}
                    className="w-full py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>সংযোগ পুনরায় পরীক্ষা করুন</span>
                  </button>
                </div>
              </div>
            )}

            {/* 10. About SUMI AI */}
            {activeTab === 9 && (
              <div className="space-y-5 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800">
                  <img src="/icon.svg" alt="Sumi Logo" className="w-16 h-16 rounded-2xl shadow-lg shadow-[#ff2d55]/20" />
                  <div>
                    <h4 className="text-base font-bold text-white font-['Outfit']">SUMI AI (সুমি)</h4>
                    <p className="text-xs text-[#ff4d79] font-medium">ভার্সন ১.০.০ — অ্যান্ড্রয়েড প্রিমিয়াম এডিশন</p>
                    <p className="text-zinc-400 text-xs mt-1">৩ডি এআই গার্লফ্রেন্ড ও ব্যক্তিগত ফোন সহকারী</p>
                  </div>
                </div>

                {!isInstalled && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-[#ff1a4b]/20 to-[#881337]/20 border border-[#ff2d55]/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-white">অ্যান্ড্রয়েড ফোনে অ্যাপ হিসেবে ইনস্টল করুন</div>
                      <div className="text-[11px] text-zinc-300">ফুল-স্ক্রিন PWA অ্যাপ্লিকেশন হিসেবে ব্যবহার করুন</div>
                    </div>
                    <button
                      onClick={handleInstallApp}
                      className="px-4 py-2.5 rounded-xl bg-[#ff1a4b] hover:bg-[#ff2d55] text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-[#ff1a4b]/30 shrink-0 transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>ইনস্টল করুন (PWA)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
