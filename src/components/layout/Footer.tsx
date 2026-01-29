// ============================================
// OpenBaccarat - 页脚
// 移动端优化：紧凑布局 + 触控友好 + safe-area
// ============================================

'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="border-t border-zinc-800/50 bg-zinc-950/80 py-4 md:py-5 pb-safe">
      <div className="container mx-auto px-3 md:px-4">
        {/* 桌面端布局 - 单行紧凑设计 */}
        <div className="hidden md:flex items-center justify-center flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-500">
          {/* 品牌 */}
          <div className="flex items-center gap-1.5">
            <span>🎴</span>
            <span className="text-zinc-400">OpenBaccarat</span>
          </div>
          
          <span className="text-zinc-700">|</span>
          
          {/* 链接 */}
          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/open-baccarat/OpenBaccarat"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              GitHub
            </Link>
            <Link
              href="https://solscan.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Solana
            </Link>
            <Link
              href="/about"
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {t('about')}
            </Link>
          </div>
          
          <span className="text-zinc-700">|</span>
          
          {/* MIT License */}
          <span className="text-zinc-600">MIT License</span>
          
          <span className="text-zinc-700">|</span>
          
          {/* 警告提示 */}
          <div className="flex items-center gap-1.5 text-zinc-500">
            <span className="text-amber-500/60">⚠</span>
            <span>{t('warning.content')}</span>
            <span className="text-amber-400/70">{t('warning.scammer')}</span>
          </div>
        </div>

        {/* 移动端布局 - 触控友好 */}
        <div className="md:hidden flex flex-col items-center gap-3">
          {/* 链接行 - 增大触摸区域 */}
          <div className="flex items-center justify-center flex-wrap gap-1">
            <span className="text-base mr-1">🎴</span>
            <FooterLink href="https://github.com/open-baccarat/OpenBaccarat" external>
              GitHub
            </FooterLink>
            <span className="text-zinc-700 mx-1">·</span>
            <FooterLink href="https://solscan.io" external>
              Solana
            </FooterLink>
            <span className="text-zinc-700 mx-1">·</span>
            <FooterLink href="/about">
              {t('about')}
            </FooterLink>
            <span className="text-zinc-700 mx-1">·</span>
            <span className="text-zinc-600 text-xs py-1.5 px-1">MIT</span>
          </div>
          
          {/* 警告提示 */}
          <div className="text-[11px] text-zinc-500 leading-relaxed text-center px-4">
            <span className="text-amber-500/60">⚠</span>
            {' '}{t('warning.content')}
            {' · '}
            <span className="text-amber-400/70">{t('warning.scammer')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// 移动端链接组件 - 触控优化
function FooterLink({ 
  href, 
  children, 
  external = false 
}: { 
  href: string; 
  children: React.ReactNode; 
  external?: boolean;
}) {
  const linkProps = external ? {
    target: "_blank" as const,
    rel: "noopener noreferrer"
  } : {};

  return (
    <Link
      href={href}
      {...linkProps}
      className="text-zinc-500 hover:text-zinc-300 transition-colors text-xs py-1.5 px-1.5 min-h-[32px] inline-flex items-center active:opacity-70"
    >
      {children}
      {external && <span className="text-[10px] ml-0.5 opacity-50">↗</span>}
    </Link>
  );
}
