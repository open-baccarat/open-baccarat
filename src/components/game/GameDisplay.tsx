// ============================================
// OpenBaccarat - 增强版 2D 游戏展示区域
// 移动端优化：上下堆叠布局 + 紧凑信息栏
// ============================================

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CardGroup } from '@/components/common/PlayingCard';
import { LocalTime } from '@/components/common/LocalTime';
import { useGameStore } from '@/stores/game-store';
import { cn } from '@/lib/utils';
import type { GameResult } from '@/types';

export function GameDisplay() {
  const t = useTranslations();
  const { 
    currentRound, 
    phase, 
    playerCards, 
    bankerCards, 
    currentShoe
  } = useGameStore();

  // 倒计时状态
  const [countdown, setCountdown] = useState<number>(0);

  // 计算到下一分钟整点的倒计时
  const calculateCountdown = useCallback(() => {
    const now = new Date();
    const seconds = now.getSeconds();
    const milliseconds = now.getMilliseconds();
    // 距离下一个整分钟还有多少秒
    return 60 - seconds - milliseconds / 1000;
  }, []);

  // 每秒更新倒计时
  useEffect(() => {
    const updateCountdown = () => {
      setCountdown(Math.floor(calculateCountdown()));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [calculateCountdown]);

  // 格式化倒计时显示
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 结果标签翻译
  const getResultLabel = (result: GameResult) => {
    switch (result) {
      case 'banker_win': return t('game.bankerWin');
      case 'player_win': return t('game.playerWin');
      case 'tie': return t('game.tie');
    }
  };

  return (
    <Card className="bg-zinc-900/80 border-zinc-800 overflow-hidden">
      <CardContent className="p-0">
        {/* 游戏牌桌主区域 - 仿真赌桌设计 */}
        <div className="relative rounded-t-xl min-h-[360px] sm:min-h-[340px] md:min-h-[360px] overflow-hidden flex flex-col">
          {/* 赌桌背景 - 多层渐变 */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]" />
          
          {/* 赌桌纹理 */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          {/* 金色边框 - 移动端简化 */}
          <div className="absolute inset-0 border-2 md:border-4 border-yellow-600/30 rounded-t-xl pointer-events-none" />
          <div className="absolute inset-1 md:inset-2 border border-yellow-700/20 rounded-lg pointer-events-none hidden md:block" />

          {/* ===== 移动端顶部信息栏：左右分布 ===== */}
          <div className="sm:hidden absolute top-0 left-0 right-0 z-20 pt-2.5 px-3">
            <div className="flex items-start justify-between">
              {/* 左侧：时间 + 对子 */}
              <div className="flex flex-col gap-1">
                <LocalTime showTimezone={false} size="sm" />
                {(currentRound?.isPair.player || currentRound?.isPair.banker) && (
                  <div className="flex flex-col gap-0.5">
                    {currentRound?.isPair.player && (
                      <Badge className="bg-blue-500/30 text-blue-300 border border-blue-500/50 text-[10px] px-1.5 py-0 w-fit">
                        {t('game.playerPair')}
                      </Badge>
                    )}
                    {currentRound?.isPair.banker && (
                      <Badge className="bg-red-500/30 text-red-300 border border-red-500/50 text-[10px] px-1.5 py-0 w-fit">
                        {t('game.bankerPair')}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              {/* 右侧：状态标签垂直排列 */}
              <div className="flex flex-col items-end gap-1">
                {currentRound && (
                  <BlockchainStatusBadge 
                    status={currentRound.blockchainStatus} 
                    explorerUrl={currentRound.solanaExplorerUrl}
                    compact
                  />
                )}
                <PhaseIndicator phase={phase} compact />
              </div>
            </div>
          </div>

          {/* ===== 桌面端顶部信息栏：单行 ===== */}
          <div className="hidden sm:flex relative z-20 pt-3 md:pt-4 px-3 md:px-4 items-center justify-between shrink-0">
            <LocalTime showTimezone size="sm" />
            <div className="flex items-center gap-2">
              {currentRound?.isPair.player && (
                <Badge className="bg-blue-500/30 text-blue-300 border border-blue-500/50 text-xs px-2 py-0.5">
                  {t('game.playerPair')}
                </Badge>
              )}
              {currentRound?.isPair.banker && (
                <Badge className="bg-red-500/30 text-red-300 border border-red-500/50 text-xs px-2 py-0.5">
                  {t('game.bankerPair')}
                </Badge>
              )}
              {currentRound && (
                <BlockchainStatusBadge 
                  status={currentRound.blockchainStatus} 
                  explorerUrl={currentRound.solanaExplorerUrl}
                />
              )}
              <PhaseIndicator phase={phase} />
            </div>
          </div>

          {/* ===== 桌面端布局：左右并排 ===== */}
          <div className="hidden sm:flex relative z-10 items-center justify-center min-h-[280px] md:min-h-[300px] px-4 py-4">
            {/* 闲家区域 - 左侧 */}
            <div className="flex flex-col items-center flex-1 max-w-[280px] relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-lg">
                  {t('game.player')}
                </div>
                <span className="text-blue-300/80 text-sm font-medium tracking-widest uppercase">
                  Player
                </span>
              </div>
              <div className="flex justify-center mb-2">
                {playerCards.length > 0 ? (
                  <CardGroup cards={playerCards} size="lg" animate={phase === 'dealing'} />
                ) : (
                  <PlaceholderCards count={2} size="lg" />
                )}
              </div>
              {currentRound && (
                <PointsBadge 
                  points={currentRound.playerTotal} 
                  isWinner={currentRound.result === 'player_win'} 
                  color="blue"
                />
              )}
            </div>

            {/* 中央 VS */}
            <div className="flex flex-col items-center justify-center mx-4 md:mx-8">
              <div className="h-12 w-px bg-gradient-to-b from-transparent via-yellow-500/50 to-transparent mb-2" />
              <span className="text-yellow-500/80 font-bold text-xl">VS</span>
              <div className="h-12 w-px bg-gradient-to-b from-transparent via-yellow-500/50 to-transparent mt-2" />
            </div>

            {/* 庄家区域 - 右侧 */}
            <div className="flex flex-col items-center flex-1 max-w-[280px] relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-base shadow-lg">
                  {t('game.banker')}
                </div>
                <span className="text-red-300/80 text-sm font-medium tracking-widest uppercase">
                  Banker
                </span>
              </div>
              <div className="flex justify-center mb-2">
                {bankerCards.length > 0 ? (
                  <CardGroup cards={bankerCards} size="lg" animate={phase === 'dealing'} />
                ) : (
                  <PlaceholderCards count={2} size="lg" />
                )}
              </div>
              {currentRound && (
                <PointsBadge 
                  points={currentRound.bankerTotal} 
                  isWinner={currentRound.result === 'banker_win'} 
                  color="red"
                />
              )}
            </div>
          </div>

          {/* ===== 移动端布局：真正垂直居中 ===== */}
          <div className="sm:hidden relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-8">
            {/* 闲家区域 */}
            <div className="flex items-center w-full max-w-sm mb-4">
              {/* 左侧：标签 + 点数 */}
              <div className="flex flex-col items-center w-16 shrink-0">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/30">
                  {t('game.player')}
                </div>
                {currentRound && (
                  <PointsBadge 
                    points={currentRound.playerTotal} 
                    isWinner={currentRound.result === 'player_win'} 
                    color="blue"
                    size="sm"
                  />
                )}
              </div>
              {/* 牌面 */}
              <div className="flex-1 flex justify-center">
                {playerCards.length > 0 ? (
                  <CardGroup cards={playerCards} size="md" animate={phase === 'dealing'} />
                ) : (
                  <PlaceholderCards count={2} size="md" />
                )}
              </div>
            </div>

            {/* 中央 VS 分隔线 */}
            <div className="relative flex items-center justify-center w-full max-w-sm py-3 my-2">
              <div className="absolute inset-x-12 top-1/2 h-px bg-gradient-to-r from-transparent via-yellow-500/60 to-transparent" />
              <span className="relative z-10 text-yellow-500/90 font-bold text-sm bg-emerald-800/95 px-4 py-1 rounded-full shadow-lg">VS</span>
            </div>

            {/* 庄家区域 */}
            <div className="flex items-center w-full max-w-sm mt-4">
              {/* 左侧：标签 + 点数 */}
              <div className="flex flex-col items-center w-16 shrink-0">
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-red-500/30">
                  {t('game.banker')}
                </div>
                {currentRound && (
                  <PointsBadge 
                    points={currentRound.bankerTotal} 
                    isWinner={currentRound.result === 'banker_win'} 
                    color="red"
                    size="sm"
                  />
                )}
              </div>
              {/* 牌面 */}
              <div className="flex-1 flex justify-center">
                {bankerCards.length > 0 ? (
                  <CardGroup cards={bankerCards} size="md" animate={phase === 'dealing'} />
                ) : (
                  <PlaceholderCards count={2} size="md" />
                )}
              </div>
            </div>

            {/* 移动端结果显示 - 居中 */}
            {currentRound && phase === 'result' && (
              <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                <ResultBadge result={currentRound.result} label={getResultLabel(currentRound.result)} size="sm" />
              </div>
            )}
          </div>

          {/* ===== 桌面端结果提示 - 使用响应式定位 ===== */}
          <div className="hidden sm:block">
            {/* 闲赢标志 - 使用 vw 单位适配不同屏幕 */}
            {currentRound && phase === 'result' && currentRound.result === 'player_win' && (
              <div className="absolute top-1/2 z-30" style={{ left: '5vw', transform: 'translateY(-50%)' }}>
                <ResultBadge result="player_win" label={getResultLabel('player_win')} />
              </div>
            )}

            {/* 庄赢标志 - 使用 vw 单位适配不同屏幕 */}
            {currentRound && phase === 'result' && currentRound.result === 'banker_win' && (
              <div className="absolute top-1/2 z-30" style={{ right: '5vw', transform: 'translateY(-50%)' }}>
                <ResultBadge result="banker_win" label={getResultLabel('banker_win')} />
              </div>
            )}

            {/* 平局标志 - 固定中央上方 */}
            {currentRound && phase === 'result' && currentRound.result === 'tie' && (
              <div className="absolute left-1/2 top-16 z-30" style={{ transform: 'translateX(-50%)' }}>
                <ResultBadge result="tie" label={getResultLabel('tie')} />
              </div>
            )}

          </div>
        </div>

        {/* 底部信息栏 - 移动端紧凑布局 */}
        <div className="bg-zinc-800/50 rounded-b-xl px-3 md:px-6 py-2 md:py-3">
          {/* 移动端：两行布局 */}
          <div className="sm:hidden flex flex-col gap-1.5">
            {/* 第一行：倒计时（大） + 局号 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">⏱️</span>
                <span className={cn(
                  "font-mono font-bold text-lg tabular-nums",
                  countdown <= 10 ? "text-yellow-400 animate-pulse" : "text-white"
                )}>
                  {formatCountdown(countdown)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-zinc-500">{t('game.round')}</span>
                <span className="font-mono font-bold text-white">
                  #{currentRound?.roundNumber || (currentShoe?.roundsPlayed ? currentShoe.roundsPlayed + 1 : 1)}
                </span>
                {currentShoe && (
                  <>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-500">{t('game.shoe')}</span>
                    <span className="font-mono text-emerald-400">#{currentShoe.shoeNumber}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 桌面端：单行布局 */}
          <div className="hidden sm:flex items-center justify-center gap-6 md:gap-8 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">⏱️</span>
              <span className="text-zinc-400">{t('game.nextRound')}:</span>
              <span className={cn(
                "font-mono font-bold text-base tabular-nums",
                countdown <= 10 ? "text-yellow-400 animate-pulse" : "text-white"
              )}>
                {formatCountdown(countdown)}
              </span>
            </div>

            <div className="w-px h-5 bg-zinc-700" />

            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <span className="text-zinc-400">{t('game.currentRound')}:</span>
              <span className="font-mono font-bold text-base text-white">
                #{currentRound?.roundNumber || (currentShoe?.roundsPlayed ? currentShoe.roundsPlayed + 1 : 1)}
              </span>
            </div>

            {currentShoe && (
              <>
                <div className="w-px h-5 bg-zinc-700" />
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎴</span>
                  <span className="text-zinc-400">{t('game.shoe')}:</span>
                  <span className="font-mono text-base text-emerald-400">
                    #{currentShoe.shoeNumber}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PhaseIndicator({ phase, compact = false }: { phase: string; compact?: boolean }) {
  const t = useTranslations('phase');
  
  const defaultConfig = { label: t('idle'), color: 'bg-zinc-500', icon: '⏸️' };
  const phaseLabels: Record<string, { label: string; color: string; icon: string }> = {
    idle: defaultConfig,
    shuffling: { label: t('shuffling'), color: 'bg-yellow-500', icon: '🔀' },
    burning: { label: t('burning'), color: 'bg-orange-500', icon: '🔥' },
    clearing: { label: t('clearing'), color: 'bg-amber-500', icon: '🧹' },
    dealing: { label: t('dealing'), color: 'bg-blue-500', icon: '🃏' },
    result: { label: t('result'), color: 'bg-emerald-500', icon: '🎉' },
    waiting: { label: t('waiting'), color: 'bg-purple-500', icon: '⏳' },
  };

  const config = phaseLabels[phase] ?? defaultConfig;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "border-zinc-600 bg-zinc-800/80",
        compact ? "px-2 py-0.5 text-[10px]" : "px-3"
      )}
    >
      <span className={compact ? "mr-1 text-xs" : "mr-1.5"}>{config.icon}</span>
      <div className={cn(
        'rounded-full', 
        compact ? 'w-1.5 h-1.5 mr-1' : 'w-2 h-2 mr-1.5', 
        config.color, 
        phase !== 'idle' && 'animate-pulse'
      )} />
      <span className="text-zinc-300">{config.label}</span>
    </Badge>
  );
}

function PlaceholderCards({ count, size = 'lg' }: { count: number; size?: 'md' | 'lg' }) {
  const sizeClasses = {
    md: 'w-14 h-20',
    lg: 'w-20 h-28',
  };
  const iconSizes = {
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <div className="flex -space-x-3 md:-space-x-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            sizeClasses[size],
            "rounded-lg",
            "border-2 border-dashed border-white/20",
            "bg-gradient-to-br from-white/10 to-white/5",
            "flex items-center justify-center",
            "backdrop-blur-sm shadow-lg",
            "transition-all duration-300 hover:border-white/30"
          )}
        >
          <span className={cn("text-white/30", iconSizes[size])}>🃏</span>
        </div>
      ))}
    </div>
  );
}

function PointsBadge({ 
  points, 
  isWinner, 
  color,
  size = 'md'
}: { 
  points: number; 
  isWinner: boolean; 
  color: 'red' | 'blue';
  size?: 'sm' | 'md';
}) {
  const colorConfig = {
    red: {
      winner: 'bg-gradient-to-br from-red-500 to-red-600 ring-red-400 shadow-red-500/50',
      normal: 'bg-red-900/50 text-red-200 border-red-700/50'
    },
    blue: {
      winner: 'bg-gradient-to-br from-blue-500 to-blue-600 ring-blue-400 shadow-blue-500/50',
      normal: 'bg-blue-900/50 text-blue-200 border-blue-700/50'
    }
  };

  const sizeConfig = {
    sm: {
      winner: 'w-8 h-8 text-sm mt-1',
      normal: 'w-7 h-7 text-xs mt-1',
    },
    md: {
      winner: 'w-12 h-12 text-xl',
      normal: 'w-10 h-10 text-lg',
    }
  };

  const config = colorConfig[color];
  const sizes = sizeConfig[size];

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full font-bold transition-all duration-300',
        isWinner 
          ? `${sizes.winner} text-white ring-2 shadow-lg ${config.winner} scale-110 animate-pulse` 
          : `${sizes.normal} border ${config.normal}`
      )}
    >
      {points}
    </div>
  );
}

// 结果徽章 - 显示在牌桌两侧或中央
function ResultBadge({ result, label, size = 'md' }: { result: GameResult; label: string; size?: 'sm' | 'md' }) {
  const resultConfig = {
    banker_win: { emoji: '🏆', bg: 'bg-gradient-to-r from-red-500 to-red-600', border: 'border-red-400' },
    player_win: { emoji: '🏆', bg: 'bg-gradient-to-r from-blue-500 to-blue-600', border: 'border-blue-400' },
    tie: { emoji: '🤝', bg: 'bg-gradient-to-r from-green-500 to-green-600', border: 'border-green-400' }
  };

  const config = resultConfig[result];

  return (
    <div
      className={cn(
        'rounded-lg font-bold shadow-xl',
        'flex items-center gap-1.5 border-2',
        config.bg, config.border,
        'text-white animate-result-pop backdrop-blur-sm',
        size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-base'
      )}
      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
    >
      <span className={size === 'sm' ? 'text-base' : 'text-lg'}>{config.emoji}</span>
      <span>{label}</span>
    </div>
  );
}

// 区块链状态徽章 - 与 PhaseIndicator 样式一致
function BlockchainStatusBadge({ 
  status, 
  explorerUrl,
  compact = false
}: { 
  status: string; 
  explorerUrl: string | null;
  compact?: boolean;
}) {
  const t = useTranslations('common');
  
  const defaultConfig = { label: t('confirming'), color: 'bg-yellow-500', icon: '⏳' };
  const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    pending: defaultConfig,
    confirmed: { label: t('confirmed'), color: 'bg-emerald-500', icon: '✅' },
    failed: { label: t('failed'), color: 'bg-red-500', icon: '❌' },
  };

  const config = statusConfig[status] ?? defaultConfig;

  const badge = (
    <Badge 
      variant="outline" 
      className={cn(
        "border-zinc-600 bg-zinc-800/80 cursor-pointer transition-colors",
        compact ? "px-2 py-0.5 text-[10px]" : "px-3",
        explorerUrl && "hover:bg-zinc-700/80 hover:border-zinc-500"
      )}
    >
      <span className={compact ? "mr-1 text-xs" : "mr-1.5"}>{config.icon}</span>
      <div className={cn(
        'rounded-full', 
        compact ? 'w-1.5 h-1.5 mr-1' : 'w-2 h-2 mr-1.5', 
        config.color, 
        status === 'pending' && 'animate-pulse'
      )} />
      <span className="text-zinc-300">{config.label}</span>
    </Badge>
  );

  if (explorerUrl) {
    return (
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="View on Solana Explorer"
      >
        {badge}
      </a>
    );
  }

  return badge;
}
