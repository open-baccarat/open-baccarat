// ============================================
// OpenBaccarat - 灵活查询 API
// API & AI Friendly: 支持多种查询方式
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { CardSuit, CardRank } from '@/types';

export const dynamic = 'force-dynamic';

// 缓存配置
const CACHE_CONTROL = 'public, s-maxage=30, stale-while-revalidate=600';

interface RoundsListRow {
  id: string;
  shoe_id: string;
  shoe_number: number;
  round_number: number;
  result: string;
  player_total: number;
  banker_total: number;
  winning_total: number;
  is_player_pair: boolean;
  is_banker_pair: boolean;
  started_at: string;
  started_at_unix: number;
  completed_at: string;
  completed_at_unix: number;
  solana_signature: string | null;
  solana_explorer_url: string | null;
  blockchain_status: string;
  player_cards: { suit: string; rank: string }[];
  banker_cards: { suit: string; rank: string }[];
}

/**
 * GET /api/rounds - 灵活查询游戏记录
 * 
 * Query Parameters:
 * - roundNumber: 精确查询局号 (e.g., ?roundNumber=42)
 * - roundFrom, roundTo: 局号范围 (e.g., ?roundFrom=1&roundTo=100)
 * - shoeNumber: 按牌靴号查询 (e.g., ?shoeNumber=3)
 * - result: 按结果筛选 (banker_win | player_win | tie)
 * - limit: 返回数量 (default: 20, max: 100)
 * - offset: 偏移量 (default: 0)
 * - order: 排序方式 (asc | desc, default: desc)
 * - format: 响应格式 (full | compact | minimal, default: full)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);

  try {
    // 解析查询参数
    const roundNumber = searchParams.get('roundNumber');
    const roundFrom = searchParams.get('roundFrom');
    const roundTo = searchParams.get('roundTo');
    const shoeNumber = searchParams.get('shoeNumber');
    const result = searchParams.get('result');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const order = searchParams.get('order') === 'asc' ? true : false;
    const format = (searchParams.get('format') || 'full') as 'full' | 'compact' | 'minimal';

    // 构建查询
    let query = supabase
      .from('rounds_list')
      .select('*', { count: 'exact' });

    // 精确局号查询
    if (roundNumber) {
      query = query.eq('round_number', parseInt(roundNumber));
    }

    // 局号范围查询
    if (roundFrom) {
      query = query.gte('round_number', parseInt(roundFrom));
    }
    if (roundTo) {
      query = query.lte('round_number', parseInt(roundTo));
    }

    // 牌靴号查询
    if (shoeNumber) {
      query = query.eq('shoe_number', parseInt(shoeNumber));
    }

    // 结果筛选
    if (result && ['banker_win', 'player_win', 'tie'].includes(result)) {
      query = query.eq('result', result);
    }

    // 排序和分页
    query = query
      .order('round_number', { ascending: order })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'QUERY_ERROR',
            message: error.message,
          },
          meta: {
            requestId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            latencyMs: Date.now() - startTime,
          },
        },
        { status: 500 }
      );
    }

    // 根据 format 转换数据
    const rows = (data || []) as unknown as RoundsListRow[];
    const items = rows.map(row => formatRound(row, format));

    return NextResponse.json(
      {
        success: true,
        data: {
          items,
          pagination: {
            total: count || 0,
            limit,
            offset,
            hasMore: (count || 0) > offset + limit,
          },
        },
        query: {
          roundNumber: roundNumber ? parseInt(roundNumber) : null,
          roundFrom: roundFrom ? parseInt(roundFrom) : null,
          roundTo: roundTo ? parseInt(roundTo) : null,
          shoeNumber: shoeNumber ? parseInt(shoeNumber) : null,
          result: result || null,
          order: order ? 'asc' : 'desc',
          format,
        },
        meta: {
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          latencyMs: Date.now() - startTime,
          apiVersion: '1.0',
        },
        links: {
          docs: '/api/docs',
          self: request.url,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': CACHE_CONTROL,
        },
      }
    );
  } catch (error) {
    console.error('Rounds API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
        meta: {
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          latencyMs: Date.now() - startTime,
        },
      },
      { status: 500 }
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

function formatRound(row: RoundsListRow, format: 'full' | 'compact' | 'minimal') {
  // Minimal: 只返回核心数据
  if (format === 'minimal') {
    return {
      roundNumber: row.round_number,
      result: row.result,
      playerTotal: row.player_total,
      bankerTotal: row.banker_total,
      completedAt: row.completed_at,
    };
  }

  // Compact: 返回重要字段，但不包含详细牌面
  if (format === 'compact') {
    return {
      id: row.id,
      roundNumber: row.round_number,
      shoeNumber: row.shoe_number,
      result: row.result,
      playerTotal: row.player_total,
      bankerTotal: row.banker_total,
      isPlayerPair: row.is_player_pair,
      isBankerPair: row.is_banker_pair,
      isNatural: row.player_total >= 8 || row.banker_total >= 8,
      completedAt: row.completed_at,
      blockchainStatus: row.blockchain_status,
      solanaSignature: row.solana_signature,
    };
  }

  // Full: 返回所有详细信息
  return {
    id: row.id,
    roundNumber: row.round_number,
    shoeId: row.shoe_id,
    shoeNumber: row.shoe_number,
    result: row.result,
    resultLabel: {
      en: row.result === 'banker_win' ? 'Banker Win' : row.result === 'player_win' ? 'Player Win' : 'Tie',
      zh: row.result === 'banker_win' ? '庄赢' : row.result === 'player_win' ? '闲赢' : '和局',
    },
    player: {
      cards: row.player_cards.map(c => ({
        suit: c.suit as CardSuit,
        rank: c.rank as CardRank,
        display: `${c.rank}${getSuitSymbol(c.suit)}`,
      })),
      total: row.player_total,
      isPair: row.is_player_pair,
    },
    banker: {
      cards: row.banker_cards.map(c => ({
        suit: c.suit as CardSuit,
        rank: c.rank as CardRank,
        display: `${c.rank}${getSuitSymbol(c.suit)}`,
      })),
      total: row.banker_total,
      isPair: row.is_banker_pair,
    },
    isNatural: row.player_total >= 8 || row.banker_total >= 8,
    timing: {
      startedAt: row.started_at,
      completedAt: row.completed_at,
      startedAtUnix: row.started_at_unix,
      completedAtUnix: row.completed_at_unix,
    },
    blockchain: {
      status: row.blockchain_status,
      solanaSignature: row.solana_signature,
      explorerUrl: row.solana_explorer_url,
    },
    links: {
      self: `/api/games/${row.round_number}`,
      html: `/round/${row.round_number}`,
    },
  };
}
