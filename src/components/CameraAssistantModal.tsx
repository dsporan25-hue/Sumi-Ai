/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Camera, RotateCw, X, Sparkles, AlertCircle } from 'lucide-react';
import { voiceService } from '../services/voiceService';

interface CameraAssistantModalProps {
  onClose: () => void;
  onAnalysisComplete: (text: string) => void;
}

export const CameraAssistantModal: React.FC<CameraAssistantModalProps> = ({
  onClose,
  onAnalysisComplete,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function initCamera() {
      try {
        setCameraError(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setIsStreaming(true);
        }
      } catch (err: any) {
        console.error('Camera access error:', err);
        setCameraError('ক্যামেরা চালু করা সম্ভব হয়নি। অনুমতি প্রদান করুন।');
        setIsStreaming(false);
      }
    }

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);

    // Analyze immediately with Gemini AI
    analyzeWithGemini(dataUrl);
  };

  const analyzeWithGemini = async (imageBase64: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const res = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType: 'image/jpeg',
          prompt: 'এই ছবিতে কী আছে তা সুমি হয়ে মিষ্টি ও ভালোবেসে বাংলায় জানাও।',
        }),
      });

      const data = await res.json();
      if (data.success && data.description) {
        setAnalysisResult(data.description);
        voiceService.speak(data.description);
        onAnalysisComplete(data.description);
      } else {
        const fallback = 'জান, ছবিটি সম্পূর্ণ পরিষ্কার নয়। আবার একটু চেষ্টা করো তো!';
        setAnalysisResult(fallback);
        voiceService.speak(fallback);
      }
    } catch {
      const errText = 'জান, নেটওয়ার্কের কারণে ছবি বিশ্লেষণ করা যায়নি।';
      setAnalysisResult(errText);
      voiceService.speak(errText);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md h-[85vh] rounded-3xl bg-[#0e0a12] border border-[#ff2d55]/40 flex flex-col overflow-hidden shadow-2xl">
        {/* Top bar */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent z-10">
          <div className="flex items-center gap-2 text-white">
            <Camera className="w-5 h-5 text-[#ff2d55]" />
            <span className="font-semibold text-sm">সুমি ভিশন ও ক্যামেরা সহকারী</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-900/80 text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Image view */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center text-zinc-400 max-w-xs">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
              <p className="text-sm">{cameraError}</p>
            </div>
          ) : capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {/* Analyzing overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-14 h-14 rounded-full border-3 border-[#ff2d55] border-t-transparent animate-spin mb-4" />
              <div className="flex items-center gap-2 text-white font-medium text-base mb-1">
                <Sparkles className="w-5 h-5 text-[#ff4d79] animate-pulse" />
                <span>সুমি ছবিটি দেখছে ও ভাবছে...</span>
              </div>
              <p className="text-zinc-400 text-xs">জেমিনি এআই দিয়ে বিশ্লেষণ চলছে</p>
            </div>
          )}

          {/* AI Result Card */}
          {analysisResult && !isAnalyzing && (
            <div className="absolute bottom-4 left-4 right-4 bg-[#140b15]/95 border border-[#ff2d55]/50 p-4 rounded-2xl shadow-xl backdrop-blur-md animate-in slide-in-from-bottom duration-300 max-h-48 overflow-y-auto">
              <div className="flex items-center gap-2 text-[#ff4d79] text-xs font-semibold mb-1">
                <Sparkles className="w-4 h-4" />
                <span>সুমির মতামত (Sumi's Sight)</span>
              </div>
              <p className="text-zinc-100 text-sm leading-relaxed">{analysisResult}</p>
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div className="p-5 bg-[#0e0a12] border-t border-zinc-800/80 flex items-center justify-around">
          {capturedImage ? (
            <>
              <button
                onClick={retakePhoto}
                className="py-2.5 px-5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm font-medium hover:bg-zinc-800 transition"
              >
                আবার তোলো
              </button>
              <button
                onClick={onClose}
                className="py-2.5 px-5 rounded-xl bg-[#ff1a4b] text-white text-sm font-semibold hover:bg-[#ff2d55] transition shadow-lg shadow-[#ff1a4b]/30"
              >
                সম্পন্ন
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleCamera}
                className="p-3 rounded-full bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
                title="ক্যামেরা পরিবর্তন"
              >
                <RotateCw className="w-5 h-5" />
              </button>

              <button
                onClick={capturePhoto}
                disabled={!isStreaming}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#ff1a4b] to-[#ff4d79] p-1 shadow-lg shadow-[#ff1a4b]/40 hover:scale-105 active:scale-95 transition disabled:opacity-50"
                title="ছবি তুলুন"
              >
                <div className="w-full h-full rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-white" />
                </div>
              </button>

              <div className="w-11 h-11" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
