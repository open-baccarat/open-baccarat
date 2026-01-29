// ============================================
// OpenBaccarat - 单局详情 API
// API & AI Friendly: 返回纯 JSON，支持缓存
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getRoundByNumber, getRoundById } from '@/lib/supabase/queries';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 缓存配置：60 秒内可使用缓存，1 小时内可使用陈旧缓存
const CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=3600';

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const startTime = Date.now();

  try {
    // 尝试作为局号（数字）查询
    const roundNumber = parseInt(id);
    let round = null;

    if (!isNaN(roundNumber) && roundNumber > 0) {
      round = await getRoundByNumber(roundNumber);
    }

    // 如果按局号找不到，尝试按 ID (UUID) 查询
    if (!round && id.includes('-')) {
      round = await getRoundById(id);
    }

    if (!round) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ROUND_NOT_FOUND',
            message: `Round "${id}" not found`,
            suggestion: 'Use GET /api/games to list available rounds',
          },
          meta: {
            requestId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            latencyMs: Date.now() - startTime,
          },
        },
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        }
      );
    }

    // 构建响应数据 - 扁平化结构，方便 AI 解析
    const responseData = {
      // 基础信息
      id: round.id,
      roundNumber: round.roundNumber,
      shoeId: round.shoeId,
      shoeNumber: round.shoeNumber,
      
      // 游戏结果
      result: round.result,
      resultLabel: {
        en: round.result === 'banker_win' ? 'Banker Win' : round.result === 'player_win' ? 'Player Win' : 'Tie',
        zh: round.result === 'banker_win' ? '庄赢' : round.result === 'player_win' ? '闲赢' : '和局',
      },
      
      // 闲家信息
      player: {
        cards: round.playerCards.map(c => ({
          suit: c.suit,
          rank: c.rank,
          display: `${c.rank}${getSuitSymbol(c.suit)}`,
        })),
        total: round.playerTotal,
        isPair: round.isPair.player,
      },
      
      // 庄家信息
      banker: {
        cards: round.bankerCards.map(c => ({
          suit: c.suit,
          rank: c.rank,
          display: `${c.rank}${getSuitSymbol(c.suit)}`,
        })),
        total: round.bankerTotal,
        isPair: round.isPair.banker,
      },
      
      // 特殊结果
      isNatural: round.playerTotal >= 8 || round.bankerTotal >= 8,
      winningTotal: round.result === 'tie' ? round.playerTotal : 
                    round.result === 'player_win' ? round.playerTotal : round.bankerTotal,
      
      // 时间信息
      timing: {
        startedAt: round.startedAt.toISOString(),
        completedAt: round.completedAt.toISOString(),
        startedAtUnix: round.startedAtUnix,
        completedAtUnix: round.completedAtUnix,
      },
      
      // 区块链验证信息
      blockchain: {
        status: round.blockchainStatus,
        solanaSignature: round.solanaSignature,
        explorerUrl: round.solanaExplorerUrl,
        isVerified: round.blockchainStatus === 'confirmed',
      },
      
      // 相关链接
      links: {
        self: `/api/games/${round.roundNumber}`,
        html: `/round/${round.roundNumber}`,
        shoe: `/api/shoes/${round.shoeId}`,
        history: `/api/games?page=1&limit=20`,
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        meta: {
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          latencyMs: Date.now() - startTime,
          apiVersion: '1.0',
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': CACHE_CONTROL,
          'X-Request-Id': crypto.randomUUID(),
        },
      }
    );
  } catch (error) {
    console.error('获取单局详情失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch round data',
        },
        meta: {
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          latencyMs: Date.now() - startTime,
        },
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

function getSuitSymbol(suit: string): string {
  const symbols: Record<string, string> = {
    spade: '♠',
    heart: '♥',
    diamond: '♦',
    club: '♣',
  };
  return symbols[suit] || suit;
}
