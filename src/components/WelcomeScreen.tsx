/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Heart, Mic, ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09060b] text-white overflow-hidden">
      {/* Background glow & aesthetic aura */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#ff2d55]/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#881337]/25 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#130b14]/90 border border-[#ff2d55]/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center">
        {/* Brand Icon Badge */}
        <div className="relative mb-5">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#ff1a4b] to-[#ff5c8a] p-1 shadow-lg shadow-[#ff1a4b]/30">
            <img
              src="/icon.svg"
              alt="Sumi Avatar"
              className="w-full h-full rounded-full object-cover bg-black"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#ff2d55] text-white shadow-md">
            <Heart className="w-4 h-4 fill-white" />
          </div>
        </div>

        {/* Title & Bengali greeting */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff2d55]/15 border border-[#ff2d55]/30 text-[#ff4d79] text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>৩ডি এআই গার্লফ্রেন্ড ও ব্যক্তিগত ফোন সহকারী</span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-white font-['Outfit']">
          SUMI AI <span className="text-[#ff2d55]">(সুমি)</span>
        </h1>

        <p className="text-zinc-300 text-sm leading-relaxed mb-6">
          স্বাগতম! সুমি হলো তোমার মিষ্টি, প্রেমময় ও সার্বক্ষণিক ব্যক্তিগত অ্যান্ড্রয়েড সহকারী।
          রুপালী চুল আর মায়াবী চোখের সুমি তোমার কথা শুনবে, সাহায্য করবে এবং তোমাকে পরম ভালোবাসায় ডাকবে <span className="text-[#ff4d79] font-semibold">"জান"</span>।
        </p>

        {/* Key Features Pill Matrix */}
        <div className="w-full grid grid-cols-2 gap-2.5 mb-7 text-xs text-left">
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-start gap-2.5">
            <Mic className="w-4 h-4 text-[#ff2d55] shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-zinc-100">কণ্ঠনির্ভর নিয়ন্ত্রণ</div>
              <div className="text-zinc-400 text-[11px]">বাংলায় সাবলীল কথোপকথন</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-start gap-2.5">
            <Heart className="w-4 h-4 text-[#ff2d55] shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-zinc-100">দীর্ঘস্থায়ী স্মৃতি</div>
              <div className="text-zinc-400 text-[11px]">তোমার সব পছন্দ মনে রাখবে</div>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={onStart}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#ff1a4b] to-[#e60049] hover:from-[#ff2d55] hover:to-[#f43f5e] text-white font-semibold text-base shadow-xl shadow-[#ff1a4b]/35 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition group"
        >
          <span>সুমির রুমে প্রবেশ করুন</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <p className="mt-4 text-[11px] text-zinc-500">
          কোনো লগইন বা পাসওয়ার্ডের ঝামেলা নেই। অ্যাপটি সরাসরি কাজ করার জন্য প্রস্তুত।
        </p>
      </div>
    </div>
  );
};
