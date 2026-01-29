// ============================================
// OpenBaccarat - 交易验证 API
// 从 Solana 链上获取交易数据并与数据库对比
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { createServerClient } from '@/lib/supabase/client';
import { parseMemo } from '@/lib/solana/memo';

// Solana 连接配置
const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(NETWORK as 'devnet' | 'mainnet-beta');

// 链上数据接口
interface ChainData {
  signature: string;
  slot: number;
  blockTime: number;
  confirmations: number | null;
  roundId: string;
  shoeId: string;
  roundNumber: number;
  result: string;
  playerCards: string;
  bankerCards: string;
  playerTotal: number;
  bankerTotal: number;
  playerPair: boolean;
  bankerPair: boolean;
  timestamp: number;
  rawMemo: string;
}

// 数据库数据接口
interface DbData {
  id: string;
  roundNumber: number;
  shoeId: string;
  result: string;
  playerCards: Array<{ suit: string; rank: string }>;
  bankerCards: Array<{ suit: string; rank: string }>;
  playerTotal: number;
  bankerTotal: number;
  isPlayerPair: boolean;
  isBankerPair: boolean;
  completedAt: string;
  solanaSignature: string | null;
}

// 对比结果接口
interface ComparisonResult {
  match: boolean;
  differences: string[];
  details: {
    field: string;
    chainValue: string;
    dbValue: string;
    match: boolean;
  }[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const signature = searchParams.get('signature');

  if (!signature) {
    return NextResponse.json(
      { success: false, error: '缺少交易签名参数' },
      { status: 400 }
    );
  }

  try {
    // 1. 从 Solana 获取交易数据
    const connection = new Connection(RPC_URL, 'confirmed');
    
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      return NextResponse.json(
        { success: false, error: '交易未找到，请检查签名是否正确' },
        { status: 404 }
      );
    }

    if (tx.meta?.err) {
      return NextResponse.json(
        { success: false, error: '交易执行失败' },
        { status: 400 }
      );
    }

    // 2. 从交易日志中提取 Memo 数据
    const logs = tx.meta?.logMessages || [];
    let memoContent: string | null = null;

    for (const log of logs) {
      // Memo 程序的日志格式: "Program log: Memo (len N): "..."
      const memoMatch = log.match(/Program log: Memo \(len \d+\): "(.+)"/);
      if (memoMatch && memoMatch[1]) {
        memoContent = memoMatch[1];
        break;
      }
    }

    if (!memoContent) {
      // 尝试从指令数据中提取
      // 这需要解析交易的指令数据
      return NextResponse.json(
        { success: false, error: '无法从交易中提取 Memo 数据' },
        { status: 400 }
      );
    }

    // 3. 解析 Memo 数据
    const parsedMemo = parseMemo(memoContent);
    
    if (!parsedMemo) {
      return NextResponse.json(
        { success: false, error: '无法解析 Memo 数据，可能不是 OpenBaccarat 交易' },
        { status: 400 }
      );
    }

    // 获取当前 slot 用于计算确认数
    const currentSlot = await connection.getSlot();
    const confirmations = tx.slot ? currentSlot - tx.slot : null;

    // 构建链上数据
    const chainData: ChainData = {
      signature,
      slot: tx.slot || 0,
      blockTime: tx.blockTime || 0,
      confirmations,
      roundId: parsedMemo.roundId || '',
      shoeId: parsedMemo.shoeId || '',
      roundNumber: parsedMemo.roundNumber || 0,
      result: parsedMemo.result || '',
      playerCards: parsedMemo.playerCards || '',
      bankerCards: parsedMemo.bankerCards || '',
      playerTotal: parsedMemo.playerTotal || 0,
      bankerTotal: parsedMemo.bankerTotal || 0,
      playerPair: parsedMemo.playerPair || false,
      bankerPair: parsedMemo.bankerPair || false,
      timestamp: parsedMemo.timestamp || 0,
      rawMemo: memoContent,
    };

    // 4. 从数据库获取对应记录
    const supabase = createServerClient();
    
    // 数据库记录类型
    interface DbRoundRecord {
      id: string;
      round_number: number;
      shoe_id: string;
      result: string;
      player_cards: Array<{ suit: string; rank: string }>;
      banker_cards: Array<{ suit: string; rank: string }>;
      player_total: number;
      banker_total: number;
      is_player_pair: boolean;
      is_banker_pair: boolean;
      completed_at: string;
      solana_signature: string | null;
    }
    
    // 通过签名查找数据库记录
    const { data: dbRecordData, error: dbError } = await supabase
      .from('rounds_list')
      .select('*')
      .eq('solana_signature', signature)
      .single();
    
    const dbRecord = dbRecordData as DbRoundRecord | null;

    let dbData: DbData | null = null;
    
    if (dbRecord && !dbError) {
      dbData = {
        id: dbRecord.id,
        roundNumber: dbRecord.round_number,
        shoeId: dbRecord.shoe_id,
        result: dbRecord.result,
        playerCards: dbRecord.player_cards,
        bankerCards: dbRecord.banker_cards,
        playerTotal: dbRecord.player_total,
        bankerTotal: dbRecord.banker_total,
        isPlayerPair: dbRecord.is_player_pair,
        isBankerPair: dbRecord.is_banker_pair,
        completedAt: dbRecord.completed_at,
        solanaSignature: dbRecord.solana_signature,
      };
    }

    // 5. 对比数据
    let comparison: ComparisonResult | null = null;
    
    if (dbData) {
      const differences: string[] = [];
      const details: ComparisonResult['details'] = [];

      // 对比局号
      const roundMatch = chainData.roundNumber === dbData.roundNumber;
      details.push({
        field: 'roundNumber',
        chainValue: String(chainData.roundNumber),
        dbValue: String(dbData.roundNumber),
        match: roundMatch,
      });
      if (!roundMatch) differences.push('局号不匹配');

      // 对比结果
      // 链上存储的是简写 (P/B/T)，数据库是完整的 (player_win/banker_win/tie)
      const resultMap: Record<string, string> = { 'P': 'player_win', 'B': 'banker_win', 'T': 'tie' };
      const chainResult = resultMap[chainData.result] || chainData.result;
      const resultMatch = chainResult === dbData.result;
      details.push({
        field: 'result',
        chainValue: chainResult,
        dbValue: dbData.result,
        match: resultMatch,
      });
      if (!resultMatch) differences.push('结果不匹配');

      // 对比闲家点数
      const playerTotalMatch = chainData.playerTotal === dbData.playerTotal;
      details.push({
        field: 'playerTotal',
        chainValue: String(chainData.playerTotal),
        dbValue: String(dbData.playerTotal),
        match: playerTotalMatch,
      });
      if (!playerTotalMatch) differences.push('闲家点数不匹配');

      // 对比庄家点数
      const bankerTotalMatch = chainData.bankerTotal === dbData.bankerTotal;
      details.push({
        field: 'bankerTotal',
        chainValue: String(chainData.bankerTotal),
        dbValue: String(dbData.bankerTotal),
        match: bankerTotalMatch,
      });
      if (!bankerTotalMatch) differences.push('庄家点数不匹配');

      // 对比闲对
      const playerPairMatch = chainData.playerPair === dbData.isPlayerPair;
      details.push({
        field: 'playerPair',
        chainValue: String(chainData.playerPair),
        dbValue: String(dbData.isPlayerPair),
        match: playerPairMatch,
      });
      if (!playerPairMatch) differences.push('闲对不匹配');

      // 对比庄对
      const bankerPairMatch = chainData.bankerPair === dbData.isBankerPair;
      details.push({
        field: 'bankerPair',
        chainValue: String(chainData.bankerPair),
        dbValue: String(dbData.isBankerPair),
        match: bankerPairMatch,
      });
      if (!bankerPairMatch) differences.push('庄对不匹配');

      comparison = {
        match: differences.length === 0,
        differences,
        details,
      };
    }

    // 6. 返回验证结果
    return NextResponse.json({
      success: true,
      chainData,
      dbData,
      comparison,
      network: NETWORK,
      explorerUrl: `https://solscan.io/tx/${signature}${NETWORK === 'devnet' ? '?cluster=devnet' : ''}`,
    });

  } catch (error) {
    console.error('验证交易失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '验证过程中发生错误' 
      },
      { status: 500 }
    );
  }
}
