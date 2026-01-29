// ============================================
// OpenBaccarat - 重试工具函数
// ============================================

/**
 * 带重试的异步函数执行器
 * @param fn 要执行的异步函数
 * @param options 重试选项
 * @returns 函数执行结果
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: Error, nextDelayMs: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 20,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 1.5,
    onRetry,
  } = options;

  let lastError: Error | null = null;
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt >= maxRetries) {
        break;
      }

      // 计算下次延迟
      const nextDelay = Math.min(delay, maxDelayMs);
      
      // 回调通知
      if (onRetry) {
        onRetry(attempt, lastError, nextDelay);
      } else {
        console.warn(`⚠️ 重试 ${attempt}/${maxRetries}，${nextDelay}ms 后重试:`, lastError.message);
      }

      // 等待
      await new Promise(resolve => setTimeout(resolve, nextDelay));
      
      // 指数退避
      delay = Math.min(delay * backoffMultiplier, maxDelayMs);
    }
  }

  throw lastError || new Error('重试失败');
}

/**
 * 带重试的数据库写入专用函数
 * 配置为最多20次重试，适合1分钟间隔的游戏场景
 */
export async function withDatabaseRetry<T>(
  fn: () => Promise<T>,
  operationName: string = '数据库操作'
): Promise<T> {
  return withRetry(fn, {
    maxRetries: 20,
    initialDelayMs: 500,
    maxDelayMs: 10000,
    backoffMultiplier: 1.5,
    onRetry: (attempt, error, nextDelayMs) => {
      console.warn(
        `⚠️ ${operationName} 失败 (尝试 ${attempt}/20)，` +
        `${Math.round(nextDelayMs / 1000)}秒后重试: ${error.message}`
      );
    },
  });
}

/**
 * 带重试的区块链操作专用函数
 */
export async function withBlockchainRetry<T>(
  fn: () => Promise<T>,
  operationName: string = '区块链操作'
): Promise<T> {
  return withRetry(fn, {
    maxRetries: 10,
    initialDelayMs: 2000,
    maxDelayMs: 20000,
    backoffMultiplier: 2,
    onRetry: (attempt, error, nextDelayMs) => {
      console.warn(
        `⚠️ ${operationName} 失败 (尝试 ${attempt}/10)，` +
        `${Math.round(nextDelayMs / 1000)}秒后重试: ${error.message}`
      );
    },
  });
}
