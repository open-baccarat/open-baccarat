// ============================================
// OpenBaccarat - 游戏实例锁
// 确保同一时间只有一个游戏实例运行
// ============================================

import { supabase } from '@/lib/supabase/client';

// 实例 ID（每个浏览器标签页唯一）
let instanceId: string | null = null;
let heartbeatInterval: NodeJS.Timeout | null = null;
let isLockAcquired = false;

// 生成唯一实例 ID
function generateInstanceId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

// 获取当前实例 ID
export function getInstanceId(): string {
  if (!instanceId) {
    instanceId = generateInstanceId();
  }
  return instanceId;
}

// 尝试获取游戏锁
export async function acquireGameLock(): Promise<boolean> {
  const id = getInstanceId();
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'server';
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('acquire_game_lock', {
      p_instance_id: id,
      p_hostname: hostname,
    });
    
    if (error) {
      console.error('❌ 获取游戏锁失败:', error);
      return false;
    }
    
    isLockAcquired = data === true;
    
    if (isLockAcquired) {
      console.log(`🔒 游戏锁已获取: ${id}`);
      startHeartbeat();
    } else {
      console.warn('⚠️ 无法获取游戏锁：已有其他实例在运行');
    }
    
    return isLockAcquired;
  } catch (err) {
    console.error('❌ 获取游戏锁异常:', err);
    return false;
  }
}

// 更新心跳
async function updateHeartbeat(): Promise<boolean> {
  if (!instanceId || !isLockAcquired) return false;
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('update_game_heartbeat', {
      p_instance_id: instanceId,
    });
    
    if (error || !data) {
      console.error('❌ 心跳更新失败:', error);
      isLockAcquired = false;
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('❌ 心跳更新异常:', err);
    isLockAcquired = false;
    return false;
  }
}

// 启动心跳
function startHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  
  // 每 30 秒发送一次心跳
  heartbeatInterval = setInterval(async () => {
    const success = await updateHeartbeat();
    if (!success) {
      console.error('❌ 心跳失败，锁已丢失');
      stopHeartbeat();
    }
  }, 30000);
}

// 停止心跳
function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// 释放游戏锁
export async function releaseGameLock(): Promise<boolean> {
  if (!instanceId) return false;
  
  stopHeartbeat();
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('release_game_lock', {
      p_instance_id: instanceId,
    });
    
    if (error) {
      console.error('❌ 释放游戏锁失败:', error);
      return false;
    }
    
    isLockAcquired = false;
    console.log(`🔓 游戏锁已释放: ${instanceId}`);
    return data === true;
  } catch (err) {
    console.error('❌ 释放游戏锁异常:', err);
    return false;
  }
}

// 检查是否持有锁
export function hasGameLock(): boolean {
  return isLockAcquired;
}

// 页面卸载时释放锁
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (isLockAcquired && instanceId) {
      // 使用 sendBeacon 发送释放请求（不会被取消）
      const url = `/api/game/release-lock?instanceId=${instanceId}`;
      navigator.sendBeacon(url);
    }
  });
}
