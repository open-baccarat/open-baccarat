// ============================================
// OpenBaccarat - Next.js 中间件
// 包含 API 速率限制
// ============================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 速率限制配置
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

// 请求记录
interface RequestRecord {
  count: number;
  resetTime: number;
}

// 内存存储
const requestStore = new Map<string, RequestRecord>();

// 默认配置
const rateLimitConfigs: Record<string, RateLimitConfig> = {
  '/api/memo': { windowMs: 60000, maxRequests: 5 },
  '/api/verify': { windowMs: 60000, maxRequests: 30 },
  '/api/stats': { windowMs: 60000, maxRequests: 60 },
  '/api/games': { windowMs: 60000, maxRequests: 60 },
  '/api/shoes': { windowMs: 60000, maxRequests: 60 },
  '/api/sse': { windowMs: 60000, maxRequests: 10 },
  default: { windowMs: 60000, maxRequests: 60 },
};

// 定期清理（每分钟）
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requestStore.entries()) {
      if (record.resetTime < now) {
        requestStore.delete(key);
      }
    }
  }, 60000);
}

// 获取客户端 IP
function getClientId(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0];
    return firstIp ? firstIp.trim() : 'unknown';
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  
  return 'unknown';
}

// 默认配置
const defaultConfig: RateLimitConfig = {
  windowMs: 60000,
  maxRequests: 60,
};

// 获取匹配的路由配置
function getConfig(pathname: string): RateLimitConfig {
  // 精确匹配
  const exactMatch = rateLimitConfigs[pathname];
  if (exactMatch) {
    return exactMatch;
  }
  
  // 前缀匹配
  for (const [path, config] of Object.entries(rateLimitConfigs)) {
    if (path !== 'default' && pathname.startsWith(path)) {
      return config;
    }
  }
  
  return rateLimitConfigs.default || defaultConfig;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 只对 API 路由应用速率限制
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  const clientId = getClientId(request);
  const config = getConfig(pathname);
  const key = `${clientId}:${pathname}`;
  
  const now = Date.now();
  let record = requestStore.get(key);
  
  // 创建或重置记录
  if (!record || record.resetTime < now) {
    record = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    requestStore.set(key, record);
    
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(config.maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(config.maxRequests - 1));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(record.resetTime / 1000)));
    return response;
  }
  
  // 增加计数
  record.count++;
  const remaining = Math.max(0, config.maxRequests - record.count);
  
  // 检查是否超限
  if (record.count > config.maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: '请求过于频繁，请稍后重试',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(record.resetTime / 1000)),
        },
      }
    );
  }
  
  // 添加速率限制头部
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(config.maxRequests));
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(record.resetTime / 1000)));
  
  return response;
}

// 配置中间件匹配路径
export const config = {
  matcher: '/api/:path*',
};
