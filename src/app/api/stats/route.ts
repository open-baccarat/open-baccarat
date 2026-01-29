// ============================================
// OpenBaccarat - 统计 API 路由
// ============================================

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

// GET /api/stats - 获取游戏统计
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shoeId = searchParams.get('shoeId');

    const supabase = createServerClient();

    if (shoeId) {
      // 获取特定牌靴的统计
      const { data, error } = await supabase
        .from('rounds')
        .select('result, is_player_pair, is_banker_pair')
        .eq('shoe_id', shoeId);

      if (error) {
        console.error('获取牌靴统计失败:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      const rounds = data || [];
      const stats = {
        totalRounds: rounds.length,
        bankerWins: rounds.filter((r: { result: string }) => r.result === 'banker_win').length,
        playerWins: rounds.filter((r: { result: string }) => r.result === 'player_win').length,
        ties: rounds.filter((r: { result: string }) => r.result === 'tie').length,
        bankerPairs: rounds.filter((r: { is_banker_pair: boolean }) => r.is_banker_pair).length,
        playerPairs: rounds.filter((r: { is_player_pair: boolean }) => r.is_player_pair).length,
      };

      return NextResponse.json({
        success: true,
        data: stats,
      });
    }

    // 获取全局统计
    const { data, error } = await supabase
      .from('game_stats')
      .select('*')
      .single();

    if (error) {
      // 如果视图为空，返回默认值
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          data: {
            totalRounds: 0,
            bankerWins: 0,
            playerWins: 0,
            ties: 0,
            bankerPairs: 0,
            playerPairs: 0,
          },
        });
      }
      console.error('获取统计失败:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 类型断言
    const statsData = data as {
      total_rounds?: number;
      banker_wins?: number;
      player_wins?: number;
      ties?: number;
      banker_pairs?: number;
      player_pairs?: number;
    } | null;

    return NextResponse.json({
      success: true,
      data: {
        totalRounds: statsData?.total_rounds || 0,
        bankerWins: statsData?.banker_wins || 0,
        playerWins: statsData?.player_wins || 0,
        ties: statsData?.ties || 0,
        bankerPairs: statsData?.banker_pairs || 0,
        playerPairs: statsData?.player_pairs || 0,
      },
    });
  } catch (error) {
    console.error('API 错误:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
