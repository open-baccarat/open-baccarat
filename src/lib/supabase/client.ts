// ============================================
// OpenBaccarat - Supabase 客户端
// ============================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Supabase 配置（从环境变量读取）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 检查是否配置了 Supabase
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// 配置检查函数
export function checkSupabaseConfig(): void {
  if (!isSupabaseConfigured) {
    const message = [
      '⚠️ Supabase 未配置！',
      '请在环境变量中设置：',
      '  - NEXT_PUBLIC_SUPABASE_URL',
      '  - NEXT_PUBLIC_SUPABASE_ANON_KEY',
      '当前运行在无数据库模式。',
    ].join('\n');
    console.warn(message);
  }
}

// 在模块加载时检查配置
if (typeof window !== 'undefined') {
  // 客户端只在首次加载时检查一次
  checkSupabaseConfig();
}

// 创建 Supabase 客户端
// 如果未配置，使用空操作客户端避免错误
let supabase: SupabaseClient<Database>;

if (isSupabaseConfigured) {
  supabase = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: false, // 纯观看模式，不需要 session
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
} else {
  // 创建一个带有占位符的客户端（用于类型兼容）
  // 注意：这个客户端的所有请求都会失败
  supabase = createClient<Database>(
    'https://placeholder.supabase.co',
    'placeholder-key',
    {
      auth: {
        persistSession: false,
      },
    }
  );
}

export { supabase };

// 服务端客户端（用于 API 路由）
export const createServerClient = (): SupabaseClient<Database> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.warn('⚠️ 服务端 Supabase 客户端未配置，数据库操作将失败');
    // 返回占位符客户端
    return createClient<Database>(
      'https://placeholder.supabase.co',
      'placeholder-key',
      {
        auth: {
          persistSession: false,
        },
      }
    );
  }
  
  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
    },
  });
};

/**
 * 安全执行 Supabase 查询
 * 如果未配置 Supabase，返回 null 而不是抛出错误
 */
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: Error | null }>
): Promise<T | null> {
  if (!isSupabaseConfigured) {
    console.warn('⚠️ Supabase 未配置，跳过数据库查询');
    return null;
  }
  
  try {
    const { data, error } = await queryFn();
    if (error) {
      console.error('数据库查询错误:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('数据库查询异常:', error);
    return null;
  }
}
