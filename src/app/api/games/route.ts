// ============================================
// OpenBaccarat - 游戏 API 路由
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { GamesQuerySchema, validateRequest } from '@/lib/validation/schemas';
import { applyRateLimit, addRateLimitHeaders } from '@/lib/middleware/rateLimit';

export const dynamic = 'force-dynamic';

// GET /api/games - 获取游戏历史记录
export async function GET(request: NextRequest) {
  // 应用速率限制
  const rateLimitResponse = await applyRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // 检查 Supabase 配置
    if (!isSupabaseConfigured) {
      return addRateLimitHeaders(
        NextResponse.json(
          { success: false, error: 'Supabase 未配置，无法获取游戏记录' },
          { status: 503 }
        ),
        request
      );
    }

    const { searchParams } = new URL(request.url);
    
    // 使用 Zod 验证分页参数
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('pageSize') || searchParams.get('limit') || '20',
      shoeId: searchParams.get('shoeId') || undefined,
    };

    const validation = validateRequest(GamesQuerySchema, queryParams);
    
    if (!validation.success) {
      return addRateLimitHeaders(
        NextResponse.json(
          { success: false, error: validation.error },
          { status: 400 }
        ),
        request
      );
    }

    const { page, limit: pageSize, shoeId } = validation.data;

    const supabase = createServerClient();
    const offset = (page - 1) * pageSize;

    // 获取总数
    let countQuery = supabase.from('rounds').select('*', { count: 'exact', head: true });
    if (shoeId) {
      countQuery = countQuery.eq('shoe_id', shoeId);
    }
    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('获取游戏记录总数失败:', countError);
      return addRateLimitHeaders(
        NextResponse.json(
          { success: false, error: countError.message },
          { status: 500 }
        ),
        request
      );
    }

    // 获取数据
    let dataQuery = supabase
      .from('rounds_list')
      .select('*')
      .order('completed_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (shoeId) {
      dataQuery = dataQuery.eq('shoe_id', shoeId);
    }

    const { data, error } = await dataQuery;

    if (error) {
      console.error('获取游戏记录失败:', error);
      return addRateLimitHeaders(
        NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        ),
        request
      );
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return addRateLimitHeaders(
      NextResponse.json({
        success: true,
        data: {
          items: data || [],
          total: totalCount,
          page,
          pageSize,
          totalPages,
        },
      }),
      request
    );
  } catch (error) {
    console.error('API 错误:', error);
    return addRateLimitHeaders(
      NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      ),
      request
    );
  }
}
