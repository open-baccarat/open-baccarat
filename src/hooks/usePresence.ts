// ============================================
// OpenBaccarat - 在线人数追踪 Hook
// 使用 Supabase Realtime Presence 追踪在线用户
// ============================================

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceState {
  onlineCount: number;
  isConnected: boolean;
  userId: string | null;
}

// 生成唯一用户 ID（基于浏览器会话）
function generateUserId(): string {
  if (typeof window === 'undefined') return '';
  
  // 尝试从 sessionStorage 获取已有的 ID
  const existingId = sessionStorage.getItem('openbaccarat_user_id');
  if (existingId) return existingId;
  
  // 生成新的 ID
  const newId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  sessionStorage.setItem('openbaccarat_user_id', newId);
  return newId;
}

export function usePresence() {
  const [state, setState] = useState<PresenceState>({
    onlineCount: 0,
    isConnected: false,
    userId: null,
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const userIdRef = useRef<string | null>(null);

  // 同步 presence 状态
  const syncPresence = useCallback((presenceState: Record<string, unknown[]>) => {
    // presenceState 的结构是 { [key]: [{ user_id, ... }, ...] }
    // 我们需要统计所有唯一用户
    const allPresences = Object.values(presenceState).flat();
    const uniqueUsers = new Set(allPresences.map((p: unknown) => (p as { user_id: string }).user_id));
    
    setState(prev => ({
      ...prev,
      onlineCount: uniqueUsers.size,
    }));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // 如果 Supabase 未配置，使用模拟值
    if (!isSupabaseConfigured) {
      setState({
        onlineCount: 1, // 至少显示自己
        isConnected: true,
        userId: 'demo_user',
      });
      return;
    }

    const userId = generateUserId();
    userIdRef.current = userId;

    // 创建 presence channel
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channelRef.current = channel;

    // 订阅 presence 事件
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        syncPresence(presenceState);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('👋 用户加入:', newPresences.length);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('👋 用户离开:', leftPresences.length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // 追踪当前用户
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          });

          setState(prev => ({
            ...prev,
            isConnected: true,
            userId,
          }));

          console.log('✅ Presence 已连接，用户 ID:', userId);
        }
      });

    // 清理函数
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [syncPresence]);

  return state;
}
