// ============================================
// OpenBaccarat - Solana 客户端
// ============================================

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

// Solana 网络配置
const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(NETWORK as 'devnet' | 'mainnet-beta');

// 创建 Solana 连接
export const connection = new Connection(RPC_URL, 'confirmed');

// Solana 区块浏览器 URL
export const EXPLORER_URLS = {
  devnet: 'https://solscan.io/tx/',
  'mainnet-beta': 'https://solscan.io/tx/',
};

/**
 * 获取交易的区块浏览器链接
 */
export function getExplorerUrl(signature: string): string {
  const baseUrl = EXPLORER_URLS[NETWORK as keyof typeof EXPLORER_URLS] || EXPLORER_URLS.devnet;
  const cluster = NETWORK === 'devnet' ? '?cluster=devnet' : '';
  return `${baseUrl}${signature}${cluster}`;
}

/**
 * 验证交易签名
 */
export async function verifyTransaction(signature: string): Promise<{
  isValid: boolean;
  slot?: number;
  blockTime?: number;
  error?: string;
}> {
  try {
    const result = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!result) {
      return {
        isValid: false,
        error: '交易未找到',
      };
    }

    if (result.meta?.err) {
      return {
        isValid: false,
        error: '交易执行失败',
      };
    }

    return {
      isValid: true,
      slot: result.slot,
      blockTime: result.blockTime || undefined,
    };
  } catch (error) {
    console.error('验证交易失败:', error);
    return {
      isValid: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

/**
 * 获取最新区块信息
 */
export async function getLatestBlockInfo(): Promise<{
  slot: number;
  blockHeight: number;
  blockTime: number;
}> {
  const slot = await connection.getSlot();
  const blockHeight = await connection.getBlockHeight();
  const blockTime = await connection.getBlockTime(slot);

  return {
    slot,
    blockHeight,
    blockTime: blockTime || Date.now() / 1000,
  };
}

/**
 * 检查 Solana 网络状态
 */
export async function checkNetworkHealth(): Promise<{
  isHealthy: boolean;
  version?: string;
  error?: string;
}> {
  try {
    const version = await connection.getVersion();
    return {
      isHealthy: true,
      version: version['solana-core'],
    };
  } catch (error) {
    return {
      isHealthy: false,
      error: error instanceof Error ? error.message : '无法连接到 Solana 网络',
    };
  }
}

// ============================================
// 交易状态轮询
// ============================================

export type TransactionStatus = 
  | 'pending'      // 等待确认
  | 'processing'   // 处理中
  | 'confirmed'    // 已确认
  | 'finalized'    // 已最终确定
  | 'failed'       // 失败
  | 'timeout';     // 超时

export interface TransactionPollResult {
  status: TransactionStatus;
  confirmations?: number;
  slot?: number;
  blockTime?: number;
  error?: string;
}

export interface PollOptions {
  maxAttempts?: number;
  intervalMs?: number;
  onStatusChange?: (status: TransactionStatus, attempt: number) => void;
}

/**
 * 轮询交易状态直到确认或超时
 */
export async function pollTransactionStatus(
  signature: string,
  options: PollOptions = {}
): Promise<TransactionPollResult> {
  const {
    maxAttempts = 60,
    intervalMs = 2000,
    onStatusChange,
  } = options;

  let attempt = 0;
  let lastStatus: TransactionStatus = 'pending';

  const notifyStatusChange = (status: TransactionStatus) => {
    if (status !== lastStatus) {
      lastStatus = status;
      onStatusChange?.(status, attempt);
    }
  };

  notifyStatusChange('pending');

  while (attempt < maxAttempts) {
    attempt++;

    try {
      const status = await connection.getSignatureStatus(signature, {
        searchTransactionHistory: true,
      });

      if (!status.value) {
        // 交易还未被处理
        notifyStatusChange('pending');
        await sleep(intervalMs);
        continue;
      }

      if (status.value.err) {
        notifyStatusChange('failed');
        return {
          status: 'failed',
          error: JSON.stringify(status.value.err),
        };
      }

      const confirmations = status.value.confirmations;
      const confirmationStatus = status.value.confirmationStatus;

      if (confirmationStatus === 'finalized') {
        notifyStatusChange('finalized');
        return {
          status: 'finalized',
          confirmations: confirmations || 32,
          slot: status.context.slot,
        };
      }

      if (confirmationStatus === 'confirmed') {
        notifyStatusChange('confirmed');
        return {
          status: 'confirmed',
          confirmations: confirmations || 1,
          slot: status.context.slot,
        };
      }

      // 处理中
      notifyStatusChange('processing');
      await sleep(intervalMs);

    } catch (error) {
      console.error(`轮询失败 (尝试 ${attempt}/${maxAttempts}):`, error);
      await sleep(intervalMs);
    }
  }

  notifyStatusChange('timeout');
  return {
    status: 'timeout',
    error: `交易确认超时 (${maxAttempts} 次尝试)`,
  };
}

// ============================================
// 重试机制
// ============================================

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
  onRetry?: (error: Error, attempt: number, delayMs: number) => void;
}

/**
 * 带指数退避的重试机制
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    retryableErrors = ['429', 'ECONNRESET', 'ETIMEDOUT', 'Network Error'],
    onRetry,
  } = options;

  let lastError: Error;
  let delay = initialDelayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 检查是否是可重试的错误
      const isRetryable = retryableErrors.some(
        (pattern) => lastError.message.includes(pattern)
      );

      if (attempt >= maxRetries || !isRetryable) {
        throw lastError;
      }

      // 通知重试
      onRetry?.(lastError, attempt + 1, delay);

      // 等待后重试
      await sleep(delay);

      // 指数退避
      delay = Math.min(delay * backoffMultiplier, maxDelayMs);
    }
  }

  throw lastError!;
}

/**
 * 带重试的交易确认
 */
export async function confirmTransactionWithRetry(
  signature: string,
  options?: {
    retryOptions?: RetryOptions;
    pollOptions?: PollOptions;
  }
): Promise<TransactionPollResult> {
  return withRetry(
    () => pollTransactionStatus(signature, options?.pollOptions),
    {
      maxRetries: 3,
      initialDelayMs: 2000,
      ...options?.retryOptions,
    }
  );
}

// ============================================
// 批量操作
// ============================================

/**
 * 批量验证多个交易
 */
export async function batchVerifyTransactions(
  signatures: string[],
  options?: { concurrency?: number }
): Promise<Map<string, TransactionPollResult>> {
  const { concurrency = 5 } = options || {};
  const results = new Map<string, TransactionPollResult>();
  
  // 分批处理
  for (let i = 0; i < signatures.length; i += concurrency) {
    const batch = signatures.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (sig) => {
        try {
          const result = await pollTransactionStatus(sig, { maxAttempts: 10 });
          return { signature: sig, result };
        } catch (error) {
          return {
            signature: sig,
            result: {
              status: 'failed' as TransactionStatus,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          };
        }
      })
    );

    batchResults.forEach(({ signature, result }) => {
      results.set(signature, result);
    });
  }

  return results;
}

// ============================================
// 工具函数
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
