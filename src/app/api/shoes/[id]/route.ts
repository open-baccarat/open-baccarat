// ============================================
// OpenBaccarat - 单个牌靴详情 API
// 从数据库获取真实牌靴数据
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 数据库牌靴行类型
interface ShoeDbRow {
  id: string;
  shoe_number: number;
  deck_count: number;
  total_cards: number;
  first_card_suit: string | null;
  first_card_rank: string | null;
  burn_start_count: number;
  burn_end_count: number;
  usable_cards: number;
  rounds_played: number;
  shuffle_vrf_proof: string | null;
  started_at: string;
  started_at_unix: number;
  ended_at: string | null;
  ended_at_unix: number | null;
  solana_signature: string | null;
  solana_explorer_url: string | null;
  blockchain_status: string;
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: shoeId } = await params;

    if (!shoeId) {
      return NextResponse.json(
        { success: false, error: '缺少牌靴ID参数' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // 从数据库查询真实牌靴数据
    const { data, error } = await supabase
      .from('shoes')
      .select('*')
      .eq('id', shoeId)
      .single();

    if (error) {
      // 如果未找到
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: '牌靴未找到' },
          { status: 404 }
        );
      }
      console.error('获取牌靴详情失败:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: '牌靴未找到' },
        { status: 404 }
      );
    }

    const row = data as unknown as ShoeDbRow;

    // 获取该牌靴使用的牌数量
    const { count: cardsUsedCount } = await supabase
      .from('used_cards')
      .select('*', { count: 'exact', head: true })
      .eq('shoe_id', shoeId);

    // 转换为前端格式
    const shoe = {
      id: row.id,
      shoeNumber: row.shoe_number,
      deckCount: row.deck_count,
      totalCards: row.total_cards,
      firstCard: row.first_card_suit && row.first_card_rank ? {
        suit: row.first_card_suit,
        rank: row.first_card_rank,
      } : null,
      burnStartCount: row.burn_start_count,
      burnEndCount: row.burn_end_count,
      usableCards: row.usable_cards,
      roundsPlayed: row.rounds_played,
      cardsUsed: cardsUsedCount || 0,
      shuffleVrfProof: row.shuffle_vrf_proof,
      startedAt: row.started_at,
      startedAtUnix: row.started_at_unix,
      endedAt: row.ended_at,
      endedAtUnix: row.ended_at_unix,
      solanaSignature: row.solana_signature,
      solanaExplorerUrl: row.solana_explorer_url,
      blockchainStatus: row.blockchain_status,
      isActive: !row.ended_at,
    };

    return NextResponse.json({
      success: true,
      data: shoe,
    });
  } catch (error) {
    console.error('获取牌靴详情异常:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取牌靴详情失败' },
      { status: 500 }
    );
  }
}
