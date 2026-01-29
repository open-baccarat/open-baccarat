// ============================================
// OpenBaccarat - 牌靴 API 路由
// ============================================

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

// GET /api/shoes - 获取牌靴列表或当前牌靴
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const current = searchParams.get('current') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    const supabase = createServerClient();

    if (current) {
      // 获取当前活动的牌靴
      const { data, error } = await supabase
        .from('current_shoe')
        .select('*')
        .single();

      if (error) {
        // 如果没有当前牌靴，返回 null
        if (error.code === 'PGRST116') {
          return NextResponse.json({
            success: true,
            data: null,
          });
        }
        console.error('获取当前牌靴失败:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data,
      });
    }

    // 获取牌靴列表
    const offset = (page - 1) * pageSize;

    const { count } = await supabase
      .from('shoes')
      .select('*', { count: 'exact', head: true });

    const { data, error } = await supabase
      .from('shoes')
      .select('*')
      .order('started_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('获取牌靴列表失败:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        items: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error('API 错误:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
