// ============================================
// OpenBaccarat - Solana Memo Program 集成
// 将游戏结果记录到 Solana 链上
// ============================================

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  clusterApiUrl,
} from '@solana/web3.js';
import bs58 from 'bs58';
import type { Round, Card } from '@/types';

// Memo Program ID（官方地址，所有人相同）
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

// 网络配置
const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(NETWORK as 'devnet' | 'mainnet-beta');

// 创建连接
const connection = new Connection(RPC_URL, 'confirmed');

// ============================================
// 私钥管理
// ============================================

/**
 * 从 Base58 格式的私钥创建 Keypair
 */
export function getPayerKeypair(): Keypair | null {
  const secretKey = process.env.SOLANA_PAYER_SECRET_KEY;
  
  if (!secretKey) {
    console.warn('⚠️ SOLANA_PAYER_SECRET_KEY 未配置，无法发送链上交易');
    return null;
  }
  
  try {
    const decoded = bs58.decode(secretKey);
    return Keypair.fromSecretKey(decoded);
  } catch (error) {
    console.error('❌ 私钥解析失败:', error);
    return null;
  }
}

/**
 * 检查私钥是否配置
 */
export function isPayerConfigured(): boolean {
  return !!process.env.SOLANA_PAYER_SECRET_KEY;
}

/**
 * 获取付款钱包余额
 */
export async function getPayerBalance(): Promise<number | null> {
  const payer = getPayerKeypair();
  if (!payer) return null;
  
  try {
    const balance = await connection.getBalance(payer.publicKey);
    return balance / 1e9; // 转换为 SOL
  } catch (error) {
    console.error('获取余额失败:', error);
    return null;
  }
}

// ============================================
// Memo 数据格式
// ============================================

export interface GameMemoData {
  version: number;           // 数据格式版本
  roundId: string;           // 回合 ID
  shoeId: string;            // 牌靴 ID
  roundNumber: number;       // 回合编号
  result: string;            // 结果: P(闲赢) / B(庄赢) / T(和)
  playerCards: string;       // 闲家牌，如 "A♠Q♥4♦"
  bankerCards: string;       // 庄家牌，如 "7♥8♠6♣"
  playerTotal: number;       // 闲家点数
  bankerTotal: number;       // 庄家点数
  playerPair: boolean;       // 闲对
  bankerPair: boolean;       // 庄对
  timestamp: number;         // Unix 时间戳
}

/**
 * 格式化卡牌为紧凑字符串
 */
function formatCard(card: Card): string {
  const suitSymbol: Record<string, string> = {
    'spade': '♠',
    'heart': '♥',
    'diamond': '♦',
    'club': '♣',
  };
  return `${card.rank}${suitSymbol[card.suit] || card.suit}`;
}

/**
 * 格式化卡牌数组
 */
function formatCards(cards: Card[]): string {
  return cards.map(formatCard).join('');
}

/**
 * 将回合数据转换为 Memo 格式
 */
export function roundToMemo(round: Round): GameMemoData {
  const resultMap: Record<string, string> = {
    'player_win': 'P',
    'banker_win': 'B',
    'tie': 'T',
  };

  // 注意：completedAtUnix 是毫秒，链上记录使用秒以节省空间和提高可读性
  const timestampSec = Math.floor(round.completedAtUnix / 1000);

  return {
    version: 1,
    roundId: round.id,
    shoeId: round.shoeId,
    roundNumber: round.roundNumber,
    result: resultMap[round.result] || round.result,
    playerCards: formatCards(round.playerCards),
    bankerCards: formatCards(round.bankerCards),
    playerTotal: round.playerTotal,
    bankerTotal: round.bankerTotal,
    playerPair: round.isPair.player,
    bankerPair: round.isPair.banker,
    timestamp: timestampSec,
  };
}

/**
 * 将 Memo 数据序列化为紧凑字符串
 * 格式: OB|v1|roundId|shoeId|rn|result|pCards|bCards|pT|bT|pp|bp|ts
 */
export function serializeMemo(data: GameMemoData): string {
  return [
    'OB',                    // OpenBaccarat 标识
    `v${data.version}`,      // 版本
    data.roundId.slice(-8),  // 回合 ID（取后8位节省空间）
    data.shoeId.slice(-8),   // 牌靴 ID（取后8位）
    data.roundNumber,        // 回合编号
    data.result,             // 结果
    data.playerCards,        // 闲家牌
    data.bankerCards,        // 庄家牌
    data.playerTotal,        // 闲家点数
    data.bankerTotal,        // 庄家点数
    data.playerPair ? 1 : 0, // 闲对
    data.bankerPair ? 1 : 0, // 庄对
    data.timestamp,          // 时间戳
  ].join('|');
}

/**
 * 解析 Memo 字符串
 */
export function parseMemo(memo: string): Partial<GameMemoData> | null {
  try {
    const parts = memo.split('|');
    if (parts[0] !== 'OB' || parts.length < 13) {
      return null;
    }

    return {
      version: parseInt(parts[1]!.replace('v', ''), 10),
      roundId: parts[2]!,
      shoeId: parts[3]!,
      roundNumber: parseInt(parts[4]!, 10),
      result: parts[5]!,
      playerCards: parts[6]!,
      bankerCards: parts[7]!,
      playerTotal: parseInt(parts[8]!, 10),
      bankerTotal: parseInt(parts[9]!, 10),
      playerPair: parts[10] === '1',
      bankerPair: parts[11] === '1',
      timestamp: parseInt(parts[12]!, 10),
    };
  } catch {
    return null;
  }
}

// ============================================
// 发送 Memo 交易
// ============================================

export interface MemoResult {
  success: boolean;
  signature?: string;
  explorerUrl?: string;
  error?: string;
}

/**
 * 发送 Memo 交易
 */
export async function sendMemoTransaction(memo: string): Promise<MemoResult> {
  const payer = getPayerKeypair();
  
  if (!payer) {
    return {
      success: false,
      error: 'SOLANA_PAYER_SECRET_KEY 未配置',
    };
  }

  try {
    // 创建 Memo 指令
    const memoInstruction = new TransactionInstruction({
      keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: true }],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memo, 'utf-8'),
    });

    // 创建交易
    const transaction = new Transaction().add(memoInstruction);

    // 获取最新的 blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = payer.publicKey;

    // 发送并确认交易
    console.log('📤 发送 Memo 交易...');
    const signature = await sendAndConfirmTransaction(connection, transaction, [payer], {
      commitment: 'confirmed',
    });

    // 生成区块浏览器链接
    const cluster = NETWORK === 'devnet' ? '?cluster=devnet' : '';
    const explorerUrl = `https://solscan.io/tx/${signature}${cluster}`;

    console.log(`✅ Memo 交易成功: ${signature}`);
    console.log(`🔗 区块浏览器: ${explorerUrl}`);

    return {
      success: true,
      signature,
      explorerUrl,
    };
  } catch (error) {
    console.error('❌ Memo 交易失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '交易发送失败',
    };
  }
}

/**
 * 记录游戏回合到链上
 */
export async function recordRoundOnChain(round: Round): Promise<MemoResult> {
  // 转换为 Memo 格式
  const memoData = roundToMemo(round);
  const memoString = serializeMemo(memoData);
  
  console.log(`📝 Memo 数据 (${memoString.length} 字节):`, memoString);
  
  // 检查 Memo 长度（Solana Memo 最大约 566 字节）
  if (memoString.length > 500) {
    console.warn('⚠️ Memo 数据过长，可能会失败');
  }
  
  return sendMemoTransaction(memoString);
}

// ============================================
// 工具函数
// ============================================

/**
 * 生成测试私钥（仅用于开发）
 */
export function generateTestKeypair(): { publicKey: string; secretKey: string } {
  const keypair = Keypair.generate();
  return {
    publicKey: keypair.publicKey.toBase58(),
    secretKey: bs58.encode(keypair.secretKey),
  };
}

/**
 * 验证 Memo 交易
 */
export async function verifyMemoTransaction(signature: string): Promise<{
  isValid: boolean;
  memo?: string;
  error?: string;
}> {
  try {
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      return { isValid: false, error: '交易未找到' };
    }

    if (tx.meta?.err) {
      return { isValid: false, error: '交易执行失败' };
    }

    // 从交易日志中提取 Memo
    const logs = tx.meta?.logMessages || [];
    const memoLog = logs.find(log => log.includes('Program log: Memo'));
    
    if (memoLog) {
      // 提取 Memo 内容
      const match = memoLog.match(/Program log: Memo \(len \d+\): "(.+)"/);
      if (match) {
        return { isValid: true, memo: match[1] };
      }
    }

    // 尝试从指令数据中提取
    // @ts-expect-error - 访问原始交易数据
    const memoData = tx.transaction?.message?.instructions?.find(
      (ix: { programId: PublicKey }) => ix.programId?.equals?.(MEMO_PROGRAM_ID)
    );

    if (memoData) {
      return { isValid: true, memo: 'Memo found in transaction' };
    }

    return { isValid: true, memo: undefined };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : '验证失败',
    };
  }
}
