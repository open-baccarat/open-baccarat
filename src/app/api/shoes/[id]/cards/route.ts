// ============================================
// OpenBaccarat - 牌靴已用牌 API
// 获取指定牌靴中所有已使用的牌
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getUsedCardsByShoe } from '@/lib/supabase/queries';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = 'force-dynamic';

// GET /api/shoes/[id]/cards - 获取指定牌靴的已用牌
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: shoeId } = await params;

    if (!shoeId) {
      return NextResponse.json(
        { success: false, error: '缺少牌靴ID参数' },
        { status: 400 }
      );
    }

    const usedCards = await getUsedCardsByShoe(shoeId);

    // 按点数统计
    const cardCounts: Record<string, number> = {};
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    // 初始化
    ranks.forEach(rank => {
      cardCounts[rank] = 0;
    });
    
    // 统计已用牌
    usedCards.forEach(card => {
      const count = cardCounts[card.rank];
      if (count !== undefined) {
        cardCounts[card.rank] = count + 1;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        shoeId,
        totalUsed: usedCards.length,
        cards: usedCards,
        counts: cardCounts,
      },
    });
  } catch (error) {
    console.error('获取已用牌失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '获取已用牌失败' 
      },
      { status: 500 }
    );
  }
}
