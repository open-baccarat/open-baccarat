// ============================================
// 释放游戏锁 API
// 用于页面卸载时通过 sendBeacon 释放锁
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const instanceId = searchParams.get('instanceId');
  
  if (!instanceId) {
    return NextResponse.json({ success: false, error: 'Missing instanceId' }, { status: 400 });
  }
  
  try {
    const supabase = createServerClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('release_game_lock', {
      p_instance_id: instanceId,
    });
    
    if (error) {
      console.error('释放游戏锁失败:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    console.log(`🔓 游戏锁已释放 (via API): ${instanceId}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('释放游戏锁异常:', err);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

// POST 方法用于 sendBeacon
export async function POST(request: NextRequest) {
  return GET(request);
}
