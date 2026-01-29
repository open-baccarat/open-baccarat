// ============================================
// OpenBaccarat - Memo 交易 API
// 服务端发送 Solana Memo 交易
// 使用数据库检查防止重复提交（适用于 Serverless 环境）
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { recordRoundOnChain, isPayerConfigured, getPayerBalance } from '@/lib/solana/memo';
import { MemoRequestSchema, validateRequest } from '@/lib/validation/schemas';
import { supabase } from '@/lib/supabase/client';
import type { Round, Card } from '@/types';

// 将验证后的请求体转换为 Round 对象
function parseRoundFromRequest(body: {
  id: string;
  shoeId: string;
  shoeNumber?: number;
  roundNumber: number;
  result: 'player_win' | 'banker_win' | 'tie';
  playerCards: Array<{ suit: string; rank: string }>;
  bankerCards: Array<{ suit: string; rank: string }>;
  playerTotal: number;
  bankerTotal: number;
  isPair: { player: boolean; banker: boolean };
  completedAtUnix: number;
}): Round {
  const parseCards = (cards: Array<{ suit: string; rank: string }>): Card[] =>
    cards.map((c) => ({
      suit: c.suit as Card['suit'],
      rank: c.rank as Card['rank'],
    }));

  // 注意：completedAtUnix 是毫秒时间戳（与数据库保持一致）
  return {
    id: body.id,
    shoeId: body.shoeId,
    shoeNumber: body.shoeNumber || 0,
    roundNumber: body.roundNumber,
    result: body.result,
    playerCards: parseCards(body.playerCards),
    bankerCards: parseCards(body.bankerCards),
    playerTotal: body.playerTotal,
    bankerTotal: body.bankerTotal,
    winningTotal: body.result === 'player_win' ? body.playerTotal : body.result === 'banker_win' ? body.bankerTotal : body.playerTotal,
    isPair: body.isPair,
    startedAt: new Date(body.completedAtUnix - 10000), // 毫秒
    startedAtUnix: body.completedAtUnix - 10000, // 毫秒
    completedAt: new Date(body.completedAtUnix), // 毫秒，直接使用
    completedAtUnix: body.completedAtUnix, // 毫秒
    solanaSignature: null,
    solanaExplorerUrl: null,
    blockchainStatus: 'pending',
  };
}

export async function POST(request: NextRequest) {
  try {
    // 检查私钥是否配置
    if (!isPayerConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'SOLANA_PAYER_SECRET_KEY 未配置',
        },
        { status: 500 }
      );
    }

    // 解析请求体
    const rawBody = await request.json();
    
    // 使用 Zod 验证请求体
    const validation = validateRequest(MemoRequestSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: `请求验证失败: ${validation.error}`,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }
    
    const body = validation.data;
    
    // 防重放检查：使用数据库检查该回合是否已有链上签名
    // 注意：在 Serverless 环境中，模块级变量不可靠，必须使用持久化存储
    try {
      const { data: existingRound } = await supabase
        .from('rounds')
        .select('id, solana_signature')
        .eq('id', body.id)
        .single<{ id: string; solana_signature: string | null }>();
      
      if (existingRound?.solana_signature) {
        console.log(`⚠️ 回合 ${body.id} 已有链上签名，跳过: ${existingRound.solana_signature}`);
        return NextResponse.json({
          success: true,
          signature: existingRound.solana_signature,
          explorerUrl: `https://solscan.io/tx/${existingRound.solana_signature}`,
          cached: true,
        });
      }
    } catch {
      // 数据库查询失败时继续处理（可能是新回合还未写入数据库）
      console.log(`⚠️ 检查回合 ${body.id} 时数据库查询失败，继续处理`);
    }

    // 验证请求时间戳（不接受过旧的请求）
    // 注意：completedAtUnix 是毫秒时间戳（与数据库保持一致）
    const now = Date.now();
    const requestAgeMs = now - body.completedAtUnix;
    const requestAgeSec = requestAgeMs / 1000;
    
    // 允许最多5分钟前的请求（考虑网络延迟和重试）
    if (requestAgeSec > 300) {
      console.log(`⚠️ 请求时间戳过旧: ${requestAgeSec}秒前`);
      return NextResponse.json(
        {
          success: false,
          error: `请求时间戳过旧（${Math.floor(requestAgeSec)}秒前，超过5分钟），拒绝处理`,
          code: 'STALE_REQUEST',
        },
        { status: 400 }
      );
    }
    // 不接受未来的时间戳（允许1分钟时钟偏差）
    if (requestAgeSec < -60) {
      console.log(`⚠️ 请求时间戳异常: 来自${Math.abs(requestAgeSec)}秒后的未来`);
      return NextResponse.json(
        {
          success: false,
          error: '请求时间戳异常（来自未来），拒绝处理',
          code: 'FUTURE_TIMESTAMP',
        },
        { status: 400 }
      );
    }
    
    console.log(`📝 处理回合 ${body.id}，时间偏差: ${requestAgeSec.toFixed(1)}秒`);

    const round = parseRoundFromRequest(body);

    // 发送 Memo 交易
    const result = await recordRoundOnChain(round);

    if (result.success) {
      console.log(`✅ 回合 ${body.id} 链上记录成功: ${result.signature}`);
      return NextResponse.json({
        success: true,
        signature: result.signature,
        explorerUrl: result.explorerUrl,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Memo API 错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

// 检查状态
export async function GET() {
  const configured = isPayerConfigured();
  let balance = null;

  if (configured) {
    balance = await getPayerBalance();
  }

  return NextResponse.json({
    configured,
    balance,
    network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet',
  });
}
