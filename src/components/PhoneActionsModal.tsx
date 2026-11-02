/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Phone,
  MessageSquare,
  Clock,
  Search,
  X,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import {
  phoneAssistantService,
  ContactItem,
  ActiveAlarm,
  ActiveTimer,
} from '../services/phoneAssistantService';

interface PhoneActionsModalProps {
  initialTab: 'call' | 'whatsapp' | 'alarm' | 'youtube';
  onClose: () => void;
  onRequestSimConfirm: (contact: ContactItem) => void;
}

export const PhoneActionsModal: React.FC<PhoneActionsModalProps> = ({
  initialTab,
  onClose,
  onRequestSimConfirm,
}) => {
  const [activeTab, setActiveTab] = useState<'call' | 'whatsapp' | 'alarm' | 'youtube'>(initialTab);
  const [contacts, setContacts] = useState<ContactItem[]>(phoneAssistantService.getContacts());
  const [alarms, setAlarms] = useState<ActiveAlarm[]>(phoneAssistantService.getAlarms());
  const [timers, setTimers] = useState<ActiveTimer[]>(phoneAssistantService.getTimers());

  // Input states
  const [newAlarmTime, setNewAlarmTime] = useState('06:30');
  const [newAlarmLabel, setNewAlarmLabel] = useState('');
  const [timerMinutes, setTimerMinutes] = useState('5');
  const [searchQuery, setSearchQuery] = useState('');
  const [whatsappRecipient, setWhatsappRecipient] = useState('');
  const [whatsappMsg, setWhatsappMsg] = useState('');

  const handleCreateAlarm = () => {
    if (!newAlarmTime) return;
    const item = phoneAssistantService.setAlarm(newAlarmTime, newAlarmLabel || 'অ্যালার্ম');
    setAlarms((prev) => [...prev, item]);
    setNewAlarmLabel('');
  };

  const handleDeleteAlarm = (id: string) => {
    phoneAssistantService.deleteAlarm(id);
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  };

  const handleCreateTimer = () => {
    const mins = parseFloat(timerMinutes);
    if (isNaN(mins) || mins <= 0) return;
    const item = phoneAssistantService.setTimer(mins, `${mins} মিনিট টাইমার`);
    setTimers((prev) => [...prev, item]);
  };

  const handleCancelTimer = (id: string) => {
    phoneAssistantService.cancelTimer(id);
    setTimers((prev) => prev.filter((t) => t.id !== id));
  };

  const handleYouTubeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    phoneAssistantService.searchYouTube(searchQuery.trim());
    onClose();
  };

  const handleWhatsAppSend = (e: React.FormEvent) => {
    e.preventDefault();
    phoneAssistantService.openWhatsApp(whatsappRecipient, whatsappMsg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md h-[80vh] rounded-3xl bg-[#110b14] border border-[#ff2d55]/40 flex flex-col overflow-hidden shadow-2xl text-white">
        {/* Header with Tabs */}
        <div className="p-4 border-b border-[#2d121c] bg-[#140b15] flex items-center justify-between">
          <div className="flex gap-2">
            {[
              { id: 'call' as const, label: 'কল', icon: Phone },
              { id: 'whatsapp' as const, label: 'WhatsApp', icon: MessageSquare },
              { id: 'alarm' as const, label: 'অ্যালার্ম', icon: Clock },
              { id: 'youtube' as const, label: 'সার্চ', icon: Search },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    active
                      ? 'bg-[#ff2d55]/20 text-[#ff4d79] border border-[#ff2d55]/40'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {/* TAB 1: CALLS */}
          {activeTab === 'call' && (
            <div className="space-y-4">
              <div className="text-xs text-zinc-400">
                কাউকে কল করতে স্পর্শ করুন। সুমি আপনাকে SIM 1 নাকি SIM 2 ব্যবহার করবেন তা জিজ্ঞেস করবে।
              </div>

              <div className="space-y-2">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => onRequestSimConfirm(contact)}
                    className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-[#ff2d55]/50 flex items-center justify-between cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#ff2d55]/15 text-[#ff4d79] flex items-center justify-center font-bold text-sm">
                        {contact.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-zinc-100 group-hover:text-white">
                          {contact.name}
                        </div>
                        <div className="text-xs text-zinc-400 font-mono">{contact.phone}</div>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-[#ff1a4b]/15 text-[#ff4d79] group-hover:bg-[#ff1a4b] group-hover:text-white transition">
                      <Phone className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: WHATSAPP */}
          {activeTab === 'whatsapp' && (
            <form onSubmit={handleWhatsAppSend} className="space-y-4">
              <div className="text-xs text-zinc-400">
                হোয়াটসঅ্যাপে দ্রুত বার্তা পাঠান বা যেকোনো চ্যাট খুলুন।
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">প্রাপকের নম্বর (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={whatsappRecipient}
                  onChange={(e) => setWhatsappRecipient(e.target.value)}
                  placeholder="+88017XXXXXXXX"
                  className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#ff2d55]"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">বার্তা (Message)</label>
                <textarea
                  value={whatsappMsg}
                  onChange={(e) => setWhatsappMsg(e.target.value)}
                  placeholder="কী মেসেজ পাঠাতে চাও জান?..."
                  className="w-full h-28 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#ff2d55] resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>WhatsApp-এ খুলুন</span>
              </button>
            </form>
          )}

          {/* TAB 3: ALARMS & TIMERS */}
          {activeTab === 'alarm' && (
            <div className="space-y-5">
              {/* New Alarm creation */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="text-xs font-semibold text-zinc-200">নতুন অ্যালার্ম সেট করুন</div>
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={newAlarmTime}
                    onChange={(e) => setNewAlarmTime(e.target.value)}
                    className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-[#ff2d55]"
                  />
                  <input
                    type="text"
                    value={newAlarmLabel}
                    onChange={(e) => setNewAlarmLabel(e.target.value)}
                    placeholder="লেবেল (যেমন: ঘুম ভাঙা)..."
                    className="flex-1 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-[#ff2d55]"
                  />
                  <button
                    onClick={handleCreateAlarm}
                    className="p-2.5 rounded-xl bg-[#ff1a4b] hover:bg-[#ff2d55] text-white transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Active Alarms */}
              <div>
                <div className="text-xs font-semibold text-zinc-400 mb-2">সংরক্ষিত অ্যালার্ম</div>
                <div className="space-y-2">
                  {alarms.map((alarm) => (
                    <div
                      key={alarm.id}
                      className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-base font-bold text-white font-mono">{alarm.time}</div>
                        <div className="text-xs text-zinc-400">{alarm.label}</div>
                      </div>
                      <button
                        onClick={() => handleDeleteAlarm(alarm.id)}
                        className="text-zinc-500 hover:text-rose-400 p-1.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timers */}
              <div className="pt-2 border-t border-zinc-800">
                <div className="text-xs font-semibold text-zinc-400 mb-2">দ্রুত টাইমার (মিনিট)</div>
                <div className="flex gap-2 mb-3">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(e.target.value)}
                    className="w-24 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-[#ff2d55]"
                  />
                  <button
                    onClick={handleCreateTimer}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition"
                  >
                    টাইমার শুরু করুন
                  </button>
                </div>

                <div className="space-y-2">
                  {timers.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-zinc-900/80 border border-amber-900/40 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-amber-400">{t.label}</span>
                        <div className="text-zinc-300 font-mono mt-0.5">
                          অবশিষ্ট: {Math.floor(t.remainingSeconds / 60)} মি {t.remainingSeconds % 60} সে
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelTimer(t.id)}
                        className="text-xs text-rose-400 hover:underline"
                      >
                        বন্ধ করুন
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: YOUTUBE & SEARCH */}
          {activeTab === 'youtube' && (
            <div className="space-y-4">
              <div className="text-xs text-zinc-400">
                ইউটিউবে গান, নাটক, সিনেমা বা অ্যানিমে ভিডিও খুঁজুন।
              </div>

              <form onSubmit={handleYouTubeSearch} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="যেমন: বাংলা রোমান্টিক গান..."
                    className="flex-1 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#ff2d55]"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 transition"
                  >
                    <Search className="w-4 h-4" />
                    <span>খুঁজুন</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {[
                    'বাংলা রোমান্টিক গান',
                    'নতুন বাংলা নাটক',
                    'অ্যানিমে বাংলা সাবটাইটেল',
                    'বাংলা লাভ সং প্লেলিস্ট',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        phoneAssistantService.searchYouTube(preset);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-[11px] text-zinc-300 transition"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
