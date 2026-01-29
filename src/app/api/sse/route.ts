// ============================================
// OpenBaccarat - SSE 实时推送端点
// 从数据库读取真实游戏状态，不使用全局变量
// ============================================

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

// SSE 消息类型
interface SSEMessage {
  type: 'countdown' | 'new_round' | 'round_result' | 'shoe_change' | 'heartbeat' | 'state_update';
  data: unknown;
  timestamp: number;
}

// 游戏状态接口
interface GameState {
  currentRound: number;
  currentShoeId: string | null;
  currentShoeNumber: number;
  phase: 'waiting' | 'dealing' | 'result';
  countdown: number;
  lastRoundResult: {
    roundNumber: number;
    result: string;
    playerTotal: number;
    bankerTotal: number;
    playerPair: boolean;
    bankerPair: boolean;
  } | null;
}

// 数据库查询结果类型
interface DbCurrentShoe {
  id: string;
  shoe_number: number;
}

interface DbRound {
  round_number: number;
  result: string;
  player_total: number;
  banker_total: number;
  is_player_pair: boolean;
  is_banker_pair: boolean;
}

// 从数据库获取当前游戏状态
async function getGameStateFromDB(): Promise<GameState> {
  const supabase = createServerClient();
  
  // 获取当前牌靴
  const { data: currentShoeData } = await supabase
    .from('current_shoe')
    .select('id, shoe_number')
    .single();
  
  const currentShoe = currentShoeData as DbCurrentShoe | null;
  
  // 获取最新一局
  const { data: latestRoundData } = await supabase
    .from('rounds_list')
    .select('round_number, result, player_total, banker_total, is_player_pair, is_banker_pair')
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();
  
  const latestRound = latestRoundData as DbRound | null;
  
  // 计算当前阶段和倒计时（基于系统时间）
  const now = new Date();
  const secondsIntoMinute = now.getSeconds();
  const millisIntoSecond = now.getMilliseconds();
  
  // 计算精确的倒计时
  const exactSecondsRemaining = 60 - secondsIntoMinute - (millisIntoSecond / 1000);
  const countdown = Math.ceil(exactSecondsRemaining);
  
  // 确定当前阶段
  // 0-50秒: waiting（等待下一局）
  // 50-55秒: dealing（发牌中）
  // 55-60秒: result（显示结果）
  let phase: 'waiting' | 'dealing' | 'result' = 'waiting';
  if (secondsIntoMinute >= 55) {
    phase = 'result';
  } else if (secondsIntoMinute >= 50) {
    phase = 'dealing';
  }
  
  return {
    currentRound: latestRound?.round_number || 0,
    currentShoeId: currentShoe?.id || null,
    currentShoeNumber: currentShoe?.shoe_number || 0,
    phase,
    countdown,
    lastRoundResult: latestRound ? {
      roundNumber: latestRound.round_number,
      result: latestRound.result,
      playerTotal: latestRound.player_total,
      bankerTotal: latestRound.banker_total,
      playerPair: latestRound.is_player_pair,
      bankerPair: latestRound.is_banker_pair,
    } : null,
  };
}

// 计算基于时间的倒计时（不依赖数据库）
function calculateCountdown(): { countdown: number; phase: 'waiting' | 'dealing' | 'result' } {
  const now = new Date();
  const secondsIntoMinute = now.getSeconds();
  const countdown = 60 - secondsIntoMinute;
  
  let phase: 'waiting' | 'dealing' | 'result' = 'waiting';
  if (secondsIntoMinute >= 55) {
    phase = 'result';
  } else if (secondsIntoMinute >= 50) {
    phase = 'dealing';
  }
  
  return { countdown, phase };
}

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  // 初始获取数据库状态
  let dbState: GameState | null = null;
  try {
    dbState = await getGameStateFromDB();
  } catch (error) {
    console.error('获取初始游戏状态失败:', error);
  }

  const stream = new ReadableStream({
    start(controller) {
      // 发送初始连接消息
      const connectMessage: SSEMessage = {
        type: 'heartbeat',
        data: { status: 'connected', message: 'SSE connection established' },
        timestamp: Date.now(),
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(connectMessage)}\n\n`));

      // 发送初始状态
      if (dbState) {
        const stateMessage: SSEMessage = {
          type: 'state_update',
          data: {
            phase: dbState.phase,
            countdown: dbState.countdown,
            currentRound: dbState.currentRound,
            nextRound: dbState.currentRound + 1,
            currentShoeNumber: dbState.currentShoeNumber,
            lastRoundResult: dbState.lastRoundResult,
          },
          timestamp: Date.now(),
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(stateMessage)}\n\n`));
      }

      // 上一次的局号，用于检测新局
      let lastKnownRound = dbState?.currentRound || 0;

      // 定时发送倒计时更新（每秒）
      const countdownInterval = setInterval(() => {
        const { countdown, phase } = calculateCountdown();

        // 发送倒计时更新
        const countdownMessage: SSEMessage = {
          type: 'countdown',
          data: {
            phase,
            countdown,
            currentRound: lastKnownRound,
            nextRound: lastKnownRound + 1,
          },
          timestamp: Date.now(),
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(countdownMessage)}\n\n`));
      }, 1000);

      // 定期从数据库刷新状态（每10秒）
      const dbRefreshInterval = setInterval(async () => {
        try {
          const newState = await getGameStateFromDB();
          
          // 检测是否有新局
          if (newState.currentRound > lastKnownRound) {
            // 发送新局结果
            if (newState.lastRoundResult) {
              const resultMessage: SSEMessage = {
                type: 'round_result',
                data: newState.lastRoundResult,
                timestamp: Date.now(),
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(resultMessage)}\n\n`));
            }
            
            lastKnownRound = newState.currentRound;
          }
          
          // 检测牌靴变化
          if (dbState && newState.currentShoeNumber !== dbState.currentShoeNumber) {
            const shoeChangeMessage: SSEMessage = {
              type: 'shoe_change',
              data: {
                newShoeNumber: newState.currentShoeNumber,
                newShoeId: newState.currentShoeId,
              },
              timestamp: Date.now(),
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(shoeChangeMessage)}\n\n`));
          }
          
          dbState = newState;
        } catch (error) {
          console.error('刷新游戏状态失败:', error);
        }
      }, 10000);

      // 心跳检测（每30秒）
      const heartbeatInterval = setInterval(() => {
        const heartbeat: SSEMessage = {
          type: 'heartbeat',
          data: { status: 'alive' },
          timestamp: Date.now(),
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(heartbeat)}\n\n`));
      }, 30000);

      // 清理函数
      request.signal.addEventListener('abort', () => {
        clearInterval(countdownInterval);
        clearInterval(dbRefreshInterval);
        clearInterval(heartbeatInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
