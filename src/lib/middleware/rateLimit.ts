// ============================================
// OpenBaccarat - API 速率限制中间件
// 基于内存的简单速率限制（适合单实例部署）
// ============================================

import { NextRequest, NextResponse } from 'next/server';

// 速率限制配置
interface RateLimitConfig {
  windowMs: number;      // 时间窗口（毫秒）
  maxRequests: number;   // 窗口内最大请求数
}

// 请求记录
interface RequestRecord {
  count: number;
  resetTime: number;
}

// 内存存储（生产环境建议使用 Redis）
const requestStore = new Map<string, RequestRecord>();

// 定期清理过期记录（每分钟）
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requestStore.entries()) {
      if (record.resetTime < now) {
        requestStore.delete(key);
      }
    }
  }, 60000);
}

// 获取客户端标识
function getClientId(request: NextRequest): string {
  // 优先使用 X-Forwarded-For（反向代理后的真实 IP）
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0];
    return firstIp ? firstIp.trim() : 'unknown';
  }
  
  // 使用 X-Real-IP
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // 回退到连接 IP（在 Edge Runtime 可能不可用）
  return 'unknown';
}

// 默认配置
const defaultConfigs: Record<string, RateLimitConfig> = {
  // API 路由默认配置
  default: {
    windowMs: 60000,      // 1 分钟
    maxRequests: 60,      // 每分钟 60 次
  },
  // Memo API（更严格，已有 45 秒限制）
  '/api/memo': {
    windowMs: 60000,
    maxRequests: 5,
  },
  // 验证 API
  '/api/verify': {
    windowMs: 60000,
    maxRequests: 30,
  },
  // 统计 API
  '/api/stats': {
    windowMs: 60000,
    maxRequests: 60,
  },
  // 游戏历史
  '/api/games': {
    windowMs: 60000,
    maxRequests: 60,
  },
  // 牌靴 API
  '/api/shoes': {
    windowMs: 60000,
    maxRequests: 60,
  },
  // SSE 连接
  '/api/sse': {
    windowMs: 60000,
    maxRequests: 10,      // SSE 连接数限制
  },
};

/**
 * 速率限制检查（异步版本，用于兼容性）
 * @returns null 如果未超限，否则返回错误响应
 */
export async function applyRateLimit(
  request: NextRequest,
  customConfig?: RateLimitConfig
): Promise<NextResponse | null> {
  return checkRateLimit(request, customConfig);
}

/**
 * 速率限制检查
 * @returns null 如果未超限，否则返回错误响应
 */
export function checkRateLimit(
  request: NextRequest,
  customConfig?: RateLimitConfig
): NextResponse | null {
  // 启动清理定时器
  startCleanup();
  
  const pathname = new URL(request.url).pathname;
  const clientId = getClientId(request);
  
  // 获取配置（确保有默认值）
  const config = customConfig || defaultConfigs[pathname] || defaultConfigs.default!;
  
  // 生成存储 key
  const key = `${clientId}:${pathname}`;
  
  const now = Date.now();
  let record = requestStore.get(key);
  
  // 如果记录不存在或已过期，创建新记录
  if (!record || record.resetTime < now) {
    record = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    requestStore.set(key, record);
    return null;
  }
  
  // 增加计数
  record.count++;
  
  // 检查是否超限
  if (record.count > config.maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    
    return NextResponse.json(
      {
        success: false,
        error: '请求过于频繁，请稍后重试',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(record.resetTime / 1000)),
        },
      }
    );
  }
  
  return null;
}

/**
 * 添加速率限制头部到响应
 */
export function addRateLimitHeaders(
  response: NextResponse,
  request: NextRequest,
  customConfig?: RateLimitConfig
): NextResponse {
  const pathname = new URL(request.url).pathname;
  const clientId = getClientId(request);
  const key = `${clientId}:${pathname}`;
  
  const config = customConfig || defaultConfigs[pathname] || defaultConfigs.default!;
  const record = requestStore.get(key);
  
  if (record && config) {
    const remaining = Math.max(0, config.maxRequests - record.count);
    response.headers.set('X-RateLimit-Limit', String(config.maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(record.resetTime / 1000)));
  }
  
  return response;
}

/**
 * 速率限制包装器 - 用于 API 路由
 */
export function withRateLimit(
  handler: (request: NextRequest, context?: unknown) => Promise<NextResponse>,
  customConfig?: RateLimitConfig
) {
  return async (request: NextRequest, context?: unknown): Promise<NextResponse> => {
    // 检查速率限制
    const rateLimitResponse = checkRateLimit(request, customConfig);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // 执行原始处理器
    const response = await handler(request, context);
    
    // 添加速率限制头部
    return addRateLimitHeaders(response, request, customConfig);
  };
}
