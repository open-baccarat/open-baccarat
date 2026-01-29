// ============================================
// OpenBaccarat - 404 页面
// ============================================

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
      <div className="text-center px-4">
        {/* 大号 404 */}
        <div className="mb-8">
          <span className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
            404
          </span>
        </div>

        {/* 扑克牌装饰 */}
        <div className="flex justify-center gap-4 mb-8">
          <div className="w-16 h-24 bg-white rounded-lg shadow-lg flex items-center justify-center text-3xl transform -rotate-12">
            🃏
          </div>
          <div className="w-16 h-24 bg-white rounded-lg shadow-lg flex items-center justify-center text-3xl">
            ❓
          </div>
          <div className="w-16 h-24 bg-white rounded-lg shadow-lg flex items-center justify-center text-3xl transform rotate-12">
            🃏
          </div>
        </div>

        {/* 标题和描述 */}
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
          页面未找到
        </h1>
        <p className="text-zinc-400 mb-8 max-w-md mx-auto">
          看起来这张牌不在牌靴里。您访问的页面可能已经移动或不存在。
        </p>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
              返回首页
            </Button>
          </Link>
          <Link href="/about">
            <Button variant="outline" className="w-full sm:w-auto border-zinc-600 text-zinc-300 hover:bg-zinc-800">
              了解更多
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
