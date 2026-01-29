// ============================================
// OpenBaccarat - SSE Hook
// 使用 useRef 存储回调以避免内存泄漏
// ============================================

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface SSEMessage {
  type: 'countdown' | 'new_round' | 'round_result' | 'shoe_change' | 'heartbeat' | 'state_update';
  data: unknown;
  timestamp: number;
}

interface UseSSEOptions {
  onCountdown?: (data: {
    phase: string;
    countdown: number;
    currentRound: number;
    nextRound: number;
  }) => void;
  onNewRound?: (data: { roundNumber: number; phase: string }) => void;
  onRoundResult?: (data: {
    roundNumber: number;
    result: string;
    playerTotal: number;
    bankerTotal: number;
    playerPair: boolean;
    bankerPair: boolean;
  }) => void;
  onShoeChange?: (data: unknown) => void;
  onStateUpdate?: (data: unknown) => void;
  onError?: (error: Error) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxRetries?: number;
}

interface SSEState {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  retryCount: number;
}

export function useSSE(options: UseSSEOptions = {}) {
  const {
    autoReconnect = true,
    reconnectInterval = 3000,
    maxRetries = 5,
  } = options;

  // 使用 ref 存储回调函数，避免重新创建连接
  const callbacksRef = useRef<UseSSEOptions>(options);
  
  // 每次 options 变化时更新 ref（不会触发重连）
  useEffect(() => {
    callbacksRef.current = options;
  }, [options]);

  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const [state, setState] = useState<SSEState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    retryCount: 0,
  });

  // 消息处理函数，使用 ref 中的回调
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: SSEMessage = JSON.parse(event.data);
      const callbacks = callbacksRef.current;

      switch (message.type) {
        case 'countdown':
          callbacks.onCountdown?.(message.data as {
            phase: string;
            countdown: number;
            currentRound: number;
            nextRound: number;
          });
          break;
        case 'new_round':
          callbacks.onNewRound?.(message.data as { roundNumber: number; phase: string });
          break;
        case 'round_result':
          callbacks.onRoundResult?.(message.data as {
            roundNumber: number;
            result: string;
            playerTotal: number;
            bankerTotal: number;
            playerPair: boolean;
            bankerPair: boolean;
          });
          break;
        case 'shoe_change':
          callbacks.onShoeChange?.(message.data);
          break;
        case 'state_update':
          callbacks.onStateUpdate?.(message.data);
          break;
        case 'heartbeat':
          // 心跳消息，不需要特别处理
          break;
      }
    } catch (error) {
      console.error('SSE message parse error:', error);
    }
  }, []); // 空依赖，因为使用 ref

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (isMountedRef.current) {
      setState({
        isConnected: false,
        isConnecting: false,
        error: null,
        retryCount: 0,
      });
    }
  }, []);

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!isMountedRef.current) return;

    // 如果已经连接，先断开
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      eventSourceRef.current = new EventSource('/api/sse');

      eventSourceRef.current.onopen = () => {
        if (!isMountedRef.current) return;
        setState({
          isConnected: true,
          isConnecting: false,
          error: null,
          retryCount: 0,
        });
        retryCountRef.current = 0;
      };

      eventSourceRef.current.onmessage = handleMessage;

      eventSourceRef.current.onerror = (event) => {
        console.error('SSE error:', event);
        const error = new Error('SSE connection error');

        if (!isMountedRef.current) return;

        setState((prev) => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          error,
        }));

        callbacksRef.current.onError?.(error);

        // 关闭当前连接
        eventSourceRef.current?.close();
        eventSourceRef.current = null;

        // 自动重连
        if (autoReconnect && retryCountRef.current < maxRetries && isMountedRef.current) {
          retryCountRef.current++;
          setState((prev) => ({ ...prev, retryCount: retryCountRef.current }));

          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              connect();
            }
          }, reconnectInterval);
        }
      };
    } catch (error) {
      if (!isMountedRef.current) return;
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error as Error,
      }));
      callbacksRef.current.onError?.(error as Error);
    }
  }, [handleMessage, autoReconnect, reconnectInterval, maxRetries]);

  // 组件挂载时连接，卸载时清理
  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, []); // 只在挂载和卸载时执行

  return {
    ...state,
    connect,
    disconnect,
  };
}
