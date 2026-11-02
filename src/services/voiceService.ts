/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Voice & Speech Service for SUMI AI (Bengali-first interaction)

class VoiceService {
  private recognition: any = null;
  private isListening: boolean = false;
  private isWakeWordMode: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private audioCtx: AudioContext | null = null;
  private lastSpokenText: string = '';
  private onResultCallback: ((text: string) => void) | null = null;
  private onStateCallback: ((isListening: boolean) => void) | null = null;
  private onSpeakingCallback: ((isSpeaking: boolean) => void) | null = null;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Web Speech API SpeechRecognition is not supported in this browser.');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'bn-BD'; // Bengali (Bangladesh), fallback 'bn-IN'

      this.recognition.onstart = () => {
        this.isListening = true;
        this.onStateCallback?.(true);
        this.playCuteChime('listen_start');
      };

      this.recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript.trim()) {
          this.playCuteChime('listen_success');
          this.onResultCallback?.(finalTranscript.trim());
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        this.isListening = false;
        this.onStateCallback?.(false);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.onStateCallback?.(false);
        // If wake-word background mode was requested, restart listening
        if (this.isWakeWordMode) {
          setTimeout(() => {
            if (this.isWakeWordMode && !this.isListening) {
              try {
                this.recognition?.start();
              } catch {
                // Ignore restart collisions
              }
            }
          }, 600);
        }
      };
    } catch (e) {
      console.error('Failed to initialize SpeechRecognition:', e);
    }
  }

  // Web Audio procedural sound effects (No external audio file dependencies!)
  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public playCuteChime(type: 'wake' | 'listen_start' | 'listen_success' | 'alert' | 'heart') {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'wake') {
        // High playful dual chime (E6 -> A6)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1318.51, now);
        osc.frequency.exponentialRampToValueAtTime(1760.0, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'listen_start') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'listen_success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.5, now);
        osc.frequency.exponentialRampToValueAtTime(1567.98, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'heart') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(783.99, now);
        osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.22);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch {
      // AudioContext might require user gesture
    }
  }

  public setCallbacks(options: {
    onResult?: (text: string) => void;
    onListeningState?: (isListening: boolean) => void;
    onSpeakingState?: (isSpeaking: boolean) => void;
  }) {
    if (options.onResult) this.onResultCallback = options.onResult;
    if (options.onListeningState) this.onStateCallback = options.onListeningState;
    if (options.onSpeakingState) this.onSpeakingCallback = options.onSpeakingState;
  }

  public startListening() {
    this.stopSpeaking();
    if (!this.recognition) {
      this.initRecognition();
    }
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
      } catch (e) {
        console.warn('Could not start recognition:', e);
      }
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Could not stop recognition:', e);
      }
    }
    this.isListening = false;
    this.onStateCallback?.(false);
  }

  public toggleWakeWord(enabled: boolean) {
    this.isWakeWordMode = enabled;
    if (enabled && !this.isListening) {
      this.startListening();
    }
  }

  // Get available speech synthesis voices
  public getVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    return window.speechSynthesis.getVoices();
  }

  public getBengaliVoices(): SpeechSynthesisVoice[] {
    const all = this.getVoices();
    return all.filter(
      (v) =>
        v.lang.toLowerCase().includes('bn') ||
        v.name.toLowerCase().includes('bangla') ||
        v.name.toLowerCase().includes('bengali')
    );
  }

  // Speak Sumi's sweet Bengali voice
  public speak(
    text: string,
    options?: {
      rate?: number;
      pitch?: number;
      voiceURI?: string;
      onEnd?: () => void;
    }
  ): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        resolve();
        return;
      }

      this.stopSpeaking();
      this.lastSpokenText = text;

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      // Rate & pitch tuned for a cute romantic anime girlfriend tone
      utterance.rate = options?.rate ?? 0.98;
      utterance.pitch = options?.pitch ?? 1.18;
      utterance.lang = 'bn-BD';

      // Pick best Bengali female voice if available
      const voices = this.getVoices();
      let selectedVoice: SpeechSynthesisVoice | undefined;

      if (options?.voiceURI) {
        selectedVoice = voices.find((v) => v.voiceURI === options.voiceURI);
      }

      if (!selectedVoice) {
        // Find best match for Bengali
        selectedVoice =
          voices.find((v) => v.lang.startsWith('bn-BD') && !v.name.toLowerCase().includes('male')) ||
          voices.find((v) => v.lang.startsWith('bn') && !v.name.toLowerCase().includes('male')) ||
          voices.find((v) => v.name.toLowerCase().includes('bangla') || v.name.toLowerCase().includes('bengali')) ||
          voices.find((v) => v.lang.startsWith('bn'));
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => {
        this.onSpeakingCallback?.(true);
      };

      utterance.onend = () => {
        this.onSpeakingCallback?.(false);
        this.currentUtterance = null;
        options?.onEnd?.();
        resolve();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        this.onSpeakingCallback?.(false);
        this.currentUtterance = null;
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      this.onSpeakingCallback?.(false);
      this.currentUtterance = null;
    }
  }

  public repeatLast() {
    if (this.lastSpokenText) {
      this.speak(this.lastSpokenText);
    }
  }

  public getLastSpokenText(): string {
    return this.lastSpokenText;
  }
}

export const voiceService = new VoiceService();
