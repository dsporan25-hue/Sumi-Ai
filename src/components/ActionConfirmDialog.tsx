/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AssistantAction } from '../types/sumi';
import { Phone, MessageSquare, Send, CheckCircle2, X } from 'lucide-react';

interface ActionConfirmDialogProps {
  action: AssistantAction;
  onConfirm: (payload?: any) => void;
  onCancel: () => void;
}

export const ActionConfirmDialog: React.FC<ActionConfirmDialogProps> = ({
  action,
  onConfirm,
  onCancel,
}) => {
  const [selectedSim, setSelectedSim] = useState<1 | 2>(1);
  const [editedMessage, setEditedMessage] = useState(action.message || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-[#140b12] border border-[#ff2d55]/40 p-5 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2d121c]">
          <div className="flex items-center gap-2 text-[#ff4d79] font-semibold">
            {action.type === 'call' && <Phone className="w-5 h-5" />}
            {action.type === 'whatsapp' && <MessageSquare className="w-5 h-5" />}
            {action.type === 'telegram' && <Send className="w-5 h-5" />}
            <span>সুমি সহকারী নিশ্চিতকরণ</span>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Content */}
        <div className="py-4 space-y-4">
          {action.type === 'call' && (
            <div>
              <p className="text-zinc-300 text-sm mb-3">
                জান, <span className="text-[#ff4d79] font-medium">{action.contactName || 'নম্বরে'}</span> কল করতে চাও? কোন SIM ব্যবহার করবে?
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedSim(1)}
                  className={`p-3 rounded-xl border text-center transition ${
                    selectedSim === 1
                      ? 'bg-[#ff2d55]/20 border-[#ff2d55] text-white font-medium shadow-sm shadow-[#ff2d55]/20'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="text-xs text-zinc-400">স্লট ১</div>
                  <div className="text-sm font-semibold">SIM 1 (Grameenphone)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSim(2)}
                  className={`p-3 rounded-xl border text-center transition ${
                    selectedSim === 2
                      ? 'bg-[#ff2d55]/20 border-[#ff2d55] text-white font-medium shadow-sm shadow-[#ff2d55]/20'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="text-xs text-zinc-400">স্লট ২</div>
                  <div className="text-sm font-semibold">SIM 2 (Robi / Banglalink)</div>
                </button>
              </div>

              {action.phoneNumber && (
                <div className="mt-3 text-xs text-zinc-400 bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                  নম্বর: <span className="text-zinc-200 font-mono">{action.phoneNumber}</span>
                </div>
              )}
            </div>
          )}

          {(action.type === 'whatsapp' || action.type === 'telegram' || action.type === 'sms') && (
            <div>
              <p className="text-zinc-300 text-sm mb-2">
                জান, <span className="text-[#ff4d79] font-medium">{action.contactName || 'প্রাপককে'}</span> এই বার্তাটি পাঠাব?
              </p>

              <textarea
                value={editedMessage}
                onChange={(e) => setEditedMessage(e.target.value)}
                className="w-full h-24 p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#ff2d55] resize-none"
                placeholder="মেসেজ লিখুন..."
              />
            </div>
          )}

          {(action.type === 'set_alarm' || action.type === 'set_timer') && (
            <div className="text-center py-2">
              <p className="text-zinc-300 text-sm">
                জান, {action.type === 'set_alarm' ? `সকাল ${action.time}-এ অ্যালার্ম` : `${action.minutes} মিনিটের টাইমার`} চালু করতে চাও?
              </p>
              <div className="mt-2 text-2xl font-bold text-[#ff4d79] tracking-wider">
                {action.type === 'set_alarm' ? action.time : `${action.minutes} মিনিট`}
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-sm font-medium transition"
          >
            বাতিল
          </button>
          <button
            onClick={() => {
              if (action.type === 'call') {
                onConfirm({ simSlot: selectedSim });
              } else if (action.type === 'whatsapp' || action.type === 'telegram' || action.type === 'sms') {
                onConfirm({ message: editedMessage });
              } else {
                onConfirm();
              }
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#ff1a4b] to-[#e60049] hover:from-[#ff2d55] hover:to-[#f43f5e] text-white text-sm font-semibold shadow-lg shadow-[#ff1a4b]/30 flex items-center justify-center gap-2 transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>হ্যাঁ, নিশ্চিত করো</span>
          </button>
        </div>
      </div>
    </div>
  );
};
