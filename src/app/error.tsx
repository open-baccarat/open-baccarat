// ============================================
// OpenBaccarat - 500 错误页面
// ============================================

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 可以在这里记录错误到日志服务
    console.error('应用错误:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
      <div className="text-center px-4">
        {/* 错误图标 */}
        <div className="mb-8">
          <span className="text-8xl">💥</span>
        </div>

        {/* 扑克牌装饰 - 翻转的牌 */}
        <div className="flex justify-center gap-4 mb-8">
          <div className="w-16 h-24 bg-red-900 rounded-lg shadow-lg flex items-center justify-center text-3xl transform -rotate-12 border-2 border-red-700">
            ⚠️
          </div>
          <div className="w-16 h-24 bg-red-900 rounded-lg shadow-lg flex items-center justify-center text-3xl border-2 border-red-700">
            500
          </div>
          <div className="w-16 h-24 bg-red-900 rounded-lg shadow-lg flex items-center justify-center text-3xl transform rotate-12 border-2 border-red-700">
            ⚠️
          </div>
        </div>

        {/* 标题和描述 */}
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
          发生了一些错误
        </h1>
        <p className="text-zinc-400 mb-4 max-w-md mx-auto">
          看起来牌靴出了点问题。我们正在努力修复。
        </p>

        {/* 错误摘要 */}
        {error.digest && (
          <p className="text-zinc-500 text-sm mb-8 font-mono">
            错误代码: {error.digest}
          </p>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={reset}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
          >
            重试
          </Button>
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto border-zinc-600 text-zinc-300 hover:bg-zinc-800">
              返回首页
            </Button>
          </Link>
        </div>

        {/* 帮助信息 */}
        <div className="mt-12 text-sm text-zinc-500">
          <p>如果问题持续存在，请：</p>
          <ul className="mt-2 space-y-1">
            <li>• 刷新页面重试</li>
            <li>• 清除浏览器缓存</li>
            <li>
              • 在{' '}
              <a
                href="https://github.com/open-baccarat/OpenBaccarat/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline"
              >
                GitHub
              </a>{' '}
              报告问题
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
