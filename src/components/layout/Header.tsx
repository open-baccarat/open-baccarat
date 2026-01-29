// ============================================
// OpenBaccarat - 头部导航
// 移动端优化：汉堡菜单 + 抽屉导航 + 遮罩层
// ============================================

'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { formatShortTime, getUserTimezone } from '@/lib/utils/time';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { SoundControl } from '@/components/common/SoundControl';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePresence } from '@/hooks/usePresence';
import { cn } from '@/lib/utils';

// 全屏图标组件
function FullscreenIcon({ isFullscreen }: { isFullscreen: boolean }) {
  if (isFullscreen) {
    // 退出全屏图标
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3v3a2 2 0 0 1-2 2H3" />
        <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
        <path d="M3 16h3a2 2 0 0 1 2 2v3" />
        <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
      </svg>
    );
  }
  // 进入全屏图标
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

export function Header() {
  const t = useTranslations();
  const pathname = usePathname();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [timezone, setTimezone] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // 在线人数追踪
  const { onlineCount, isConnected } = usePresence();

  useEffect(() => {
    // 初始化
    setTimezone(getUserTimezone());
    setCurrentTime(formatShortTime(new Date()));

    // 每秒更新时间
    const interval = setInterval(() => {
      setCurrentTime(formatShortTime(new Date()));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 切换全屏
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('全屏切换失败:', error);
    }
  }, []);

  // 路由变化时关闭菜单
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // 菜单打开时锁定背景滚动
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // 切换菜单
  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  // 关闭菜单
  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md supports-[backdrop-filter]:bg-zinc-950/80">
        <div className="container mx-auto flex h-12 sm:h-14 items-center justify-between px-3 sm:px-4">
          {/* 左侧：Logo + 标题 */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group min-h-[44px]" onClick={closeMenu}>
              <span className="text-xl sm:text-2xl group-hover:scale-110 transition-transform">🎴</span>
              <span className="text-base sm:text-xl font-bold tracking-tight text-white">
                Open<span className="text-emerald-400">Baccarat</span>
              </span>
            </Link>
            
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs hidden md:inline-flex bg-emerald-500/5">
              {t('common.transparentVerifiable')}
            </Badge>

            {/* Solana 状态 - 桌面端显示 */}
            <div className="items-center gap-1.5 text-sm px-2 py-1 rounded-full bg-zinc-800/50 hidden lg:flex">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
              <span className="text-zinc-400 text-xs">{t('header.solana')}</span>
            </div>

            {/* 在线人数 - 桌面端显示 */}
            <OnlineIndicator count={onlineCount} isConnected={isConnected} />
          </div>

          {/* 右侧导航 - 桌面端 */}
          <nav className="hidden md:flex items-center gap-2">
            <Link 
              href="/history" 
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all min-h-[44px]",
                pathname === '/history' 
                  ? "text-white bg-zinc-800" 
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/80"
              )}
            >
              <span>📊</span>
              <span>{t('header.history')}</span>
            </Link>

            <Link 
              href="/round" 
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all min-h-[44px]",
                pathname === '/round' || pathname.startsWith('/round/')
                  ? "text-white bg-zinc-800" 
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/80"
              )}
            >
              <span>🔍</span>
              <span>{t('header.roundLookup')}</span>
            </Link>

            <Link 
              href="/about" 
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all min-h-[44px]",
                pathname === '/about'
                  ? "text-white bg-zinc-800" 
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/80"
              )}
            >
              <span>ℹ️</span>
              <span>{t('header.about')}</span>
            </Link>

            <div className="w-px h-5 bg-zinc-700/50 mx-1" />

            <SoundControl />

            {/* 全屏按钮 */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="hidden lg:flex w-9 h-9 text-zinc-400 hover:text-white hover:bg-zinc-800"
                  >
                    <FullscreenIcon isFullscreen={isFullscreen} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-sm">
                    {isFullscreen ? t('header.exitFullscreen') : t('header.fullscreen')}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <LanguageSwitcher />

            <div className="hidden lg:flex flex-col items-end text-sm pl-2 ml-1 border-l border-zinc-700/50">
              <span className="font-mono text-white tabular-nums text-sm">{currentTime}</span>
              <span className="text-[10px] text-zinc-500">{timezone}</span>
            </div>
          </nav>

          {/* 右侧 - 移动端 */}
          <div className="flex md:hidden items-center gap-0.5">
            {/* Solana 状态指示灯 */}
            <div className="flex items-center justify-center w-9 h-9 rounded-lg">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
            </div>

            {/* 在线人数 - 移动端简化版 */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-zinc-800/50">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isConnected && onlineCount > 0 
                  ? "bg-emerald-500 animate-pulse" 
                  : "bg-zinc-500"
              )} />
              <span className={cn(
                "text-xs font-medium tabular-nums",
                onlineCount > 0 ? "text-emerald-400" : "text-zinc-500"
              )}>
                {onlineCount}
              </span>
            </div>

            {/* 声音控制 */}
            <SoundControl />

            {/* 汉堡菜单按钮 */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              className="w-10 h-10 sm:w-11 sm:h-11 text-zinc-400 hover:text-white hover:bg-zinc-800 ml-0.5"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
            >
              <div className="relative w-5 h-5 flex flex-col justify-center items-center">
                <span className={cn(
                  "absolute w-5 h-0.5 bg-current transition-all duration-300 ease-out",
                  isMenuOpen ? "rotate-45" : "-translate-y-1.5"
                )} />
                <span className={cn(
                  "absolute w-5 h-0.5 bg-current transition-all duration-200",
                  isMenuOpen ? "opacity-0 scale-0" : "opacity-100 scale-100"
                )} />
                <span className={cn(
                  "absolute w-5 h-0.5 bg-current transition-all duration-300 ease-out",
                  isMenuOpen ? "-rotate-45" : "translate-y-1.5"
                )} />
              </div>
            </Button>
          </div>
        </div>

        {/* 移动端抽屉菜单 */}
        <div className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-out",
          isMenuOpen 
            ? "max-h-[500px] opacity-100 border-t border-zinc-800/50" 
            : "max-h-0 opacity-0"
        )}>
          <nav className="container mx-auto px-3 py-3 space-y-1.5 bg-zinc-950">
            {/* 导航链接 */}
            <MobileNavLink 
              href="/" 
              icon="🏠" 
              label={t('header.home')} 
              isActive={pathname === '/'} 
              onClick={closeMenu}
            />
            <MobileNavLink 
              href="/history" 
              icon="📊" 
              label={t('header.history')} 
              isActive={pathname === '/history'} 
              onClick={closeMenu}
            />
            <MobileNavLink 
              href="/round" 
              icon="🔍" 
              label={t('header.roundLookup')} 
              isActive={pathname === '/round' || pathname.startsWith('/round/')} 
              onClick={closeMenu}
            />
            <MobileNavLink 
              href="/verify" 
              icon="✅" 
              label={t('header.verify')} 
              isActive={pathname === '/verify'} 
              onClick={closeMenu}
            />
            <MobileNavLink 
              href="/about" 
              icon="ℹ️" 
              label={t('header.about')} 
              isActive={pathname === '/about'} 
              onClick={closeMenu}
            />

            {/* 分隔线 */}
            <div className="border-t border-zinc-800/70 my-2 pt-2" />

            {/* 底部工具栏 */}
            <div className="flex items-center justify-between py-1.5 px-1">
              <div className="flex items-center gap-2">
                {/* Solana 状态 */}
                <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full bg-zinc-800/60">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-400">{t('header.solana')}</span>
                </div>
                
                {/* 语言切换 */}
                <LanguageSwitcher />
              </div>

              {/* 当前时间 */}
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono text-white tabular-nums">{currentTime}</span>
                <span className="text-zinc-500">{timezone}</span>
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* 移动端遮罩层 */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300",
          isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={closeMenu}
        aria-hidden="true"
        style={{ top: 'var(--header-height, 48px)' }}
      />
    </>
  );
}

// 在线人数指示器 - 桌面端
function OnlineIndicator({ count, isConnected }: { count: number; isConnected: boolean }) {
  const t = useTranslations('game');
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "items-center gap-1.5 text-sm px-2 py-1 rounded-full bg-zinc-800/50 hidden lg:flex",
            "cursor-help transition-colors hover:bg-zinc-700/50"
          )}>
            {/* 在线状态指示灯 */}
            <div className={cn(
              "w-2 h-2 rounded-full",
              isConnected && count > 0 
                ? "bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" 
                : "bg-zinc-500"
            )} />
            {/* 在线人数 */}
            <span className={cn(
              "font-medium tabular-nums text-xs",
              count > 0 ? "text-emerald-400" : "text-zinc-500"
            )}>
              {count}
            </span>
            <span className="text-zinc-400 text-xs">
              {t('online')}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-center">
          <p className="text-sm font-medium mb-1">
            {count > 0 
              ? `${count} ${t('viewers')}` 
              : t('noViewers')
            }
          </p>
          <p className="text-xs text-zinc-400">
            {t('onlineNotice')}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// 移动端导航链接组件
function MobileNavLink({ 
  href, 
  icon, 
  label, 
  isActive, 
  onClick 
}: { 
  href: string; 
  icon: string; 
  label: string; 
  isActive: boolean; 
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[15px] transition-all min-h-[44px]",
        "active:scale-[0.98] active:opacity-80",
        isActive 
          ? "text-white bg-emerald-600/20 border border-emerald-500/30 shadow-sm shadow-emerald-500/10" 
          : "text-zinc-300 hover:text-white hover:bg-zinc-800/60"
      )}
    >
      <span className="text-lg w-6 text-center">{icon}</span>
      <span className="font-medium flex-1">{label}</span>
      {isActive && (
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      )}
    </Link>
  );
}
