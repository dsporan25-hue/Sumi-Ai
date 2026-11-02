/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MemoryItem } from '../types/sumi';

class MemoryService {
  private localCacheKey = 'sumi_ai_memories_cache';
  private memoryEnabledKey = 'sumi_ai_memory_enabled';

  public isMemoryEnabled(): boolean {
    if (typeof window === 'undefined') return true;
    const val = localStorage.getItem(this.memoryEnabledKey);
    return val !== 'false';
  }

  public setMemoryEnabled(enabled: boolean) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.memoryEnabledKey, String(enabled));
  }

  public async getMemories(): Promise<MemoryItem[]> {
    try {
      const res = await fetch('/api/memories');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.memories)) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(this.localCacheKey, JSON.stringify(data.memories));
          }
          return data.memories;
        }
      }
    } catch {
      // Fallback to local storage if network glitch
    }

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(this.localCacheKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {}
      }
    }

    return [];
  }

  public async addMemory(fact: string, category: string = 'Personal Fact'): Promise<MemoryItem | null> {
    if (!this.isMemoryEnabled()) return null;

    try {
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fact, category }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.memory;
      }
    } catch (e) {
      console.warn('Failed to add memory to server:', e);
    }
    return null;
  }

  public async deleteMemory(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/memories/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async clearAllMemories(): Promise<boolean> {
    try {
      const res = await fetch('/api/memories/clear', {
        method: 'POST',
      });
      if (res.ok && typeof window !== 'undefined') {
        localStorage.removeItem(this.localCacheKey);
      }
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const memoryService = new MemoryService();
