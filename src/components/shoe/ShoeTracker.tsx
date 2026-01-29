// ============================================
// OpenBaccarat - 牌靴追踪器
// 从数据库获取已用牌数据
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayingCard } from '@/components/common/PlayingCard';
import { useGameStore } from '@/stores/game-store';
import { TOTAL_CARDS, DECK_COUNT } from '@/lib/game/constants';
import { cn } from '@/lib/utils';
import type { CardRank } from '@/types';

// 牌靴追踪视图类型
type ShoeViewType = 'tracker' | 'counter';

// 记牌器数据接口
interface CardCountData {
  counts: Record<CardRank, number>;
  totalPerRank: number;
  ranks: CardRank[];
  isLoading: boolean;
}

// 简易进度条组件（如果 shadcn 没有的话）
function ProgressBar({ value, max, className }: { value: number; max: number; className?: string }) {
  const percentage = Math.round((value / max) * 100);
  return (
    <div className={cn('w-full bg-zinc-700 rounded-full h-2', className)}>
      <div
        className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

interface ShoeTrackerProps {
  hideHeader?: boolean;
}

export function ShoeTracker({ hideHeader = false }: ShoeTrackerProps) {
  const t = useTranslations('shoe');
  const tGame = useTranslations('game');
  const { currentShoe, stats, history } = useGameStore();
  const [viewType, setViewType] = useState<ShoeViewType>('tracker');
  
  // 记牌器数据状态（从数据库获取）
  const [cardCount, setCardCount] = useState<CardCountData>(() => {
    const totalPerRank = 4 * DECK_COUNT; // 32
    const ranks: CardRank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const counts = {} as Record<CardRank, number>;
    ranks.forEach(rank => {
      counts[rank] = totalPerRank;
    });
    return { counts, totalPerRank, ranks, isLoading: true };
  });

  // 从数据库获取已用牌数据
  const fetchUsedCards = useCallback(async (shoeId: string) => {
    try {
      const response = await fetch(`/api/shoes/${shoeId}/cards`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const totalPerRank = 4 * DECK_COUNT;
        const ranks: CardRank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const counts = {} as Record<CardRank, number>;
        
        // 初始化
        ranks.forEach(rank => {
          counts[rank] = totalPerRank;
        });
        
        // 从数据库结果扣除已用牌
        const dbCounts = result.data.counts as Record<string, number>;
        ranks.forEach(rank => {
          if (dbCounts[rank]) {
            counts[rank] = totalPerRank - dbCounts[rank];
          }
        });
        
        setCardCount({ counts, totalPerRank, ranks, isLoading: false });
      }
    } catch (error) {
      console.error('获取已用牌失败:', error);
      setCardCount(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // 当牌靴ID变化或历史记录更新时，重新获取数据
  useEffect(() => {
    if (currentShoe?.id) {
      fetchUsedCards(currentShoe.id);
    }
  }, [currentShoe?.id, history.length, fetchUsedCards]);

  // 等待牌靴加载
  if (!currentShoe) {
    if (hideHeader) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-800/50 mb-3">
              <span className="text-2xl animate-pulse">👟</span>
            </div>
            <p className="text-zinc-400 font-medium mb-1 text-sm">{t('waitingForShoe')}</p>
            <p className="text-zinc-600 text-xs">{t('shoeLoading')}</p>
          </div>
        </div>
      );
    }
    return (
      <Card className="bg-zinc-900/80 border-zinc-800 h-full flex flex-col max-h-[80vh] md:max-h-none py-0 gap-0">
        <CardHeader className="pb-2 md:pb-3 flex-shrink-0 px-3 md:px-6 pt-3 md:pt-4">
          <CardTitle className="text-base md:text-lg text-white flex items-center gap-2">
            <span>👟</span>
            <span>{t('title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center px-3 md:px-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-zinc-800/50 mb-3 md:mb-4">
              <span className="text-2xl md:text-3xl animate-pulse">👟</span>
            </div>
            <p className="text-zinc-400 font-medium mb-1 text-sm md:text-base">{t('waitingForShoe')}</p>
            <p className="text-zinc-600 text-xs md:text-sm">{t('shoeLoading')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 计算使用进度
  const usedCards = TOTAL_CARDS - currentShoe.usableCards;

  // 隐藏头部时的简化渲染（移动端首页使用）
  if (hideHeader) {
    return (
      <div className="h-full flex flex-col">
        {/* 紧凑的内部头部 */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800/30 shrink-0">
          <span className="text-emerald-400 text-xs font-medium">
            牌靴 #{currentShoe.shoeNumber}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setViewType('tracker')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-all",
                viewType === 'tracker'
                  ? "text-emerald-400 bg-emerald-500/15"
                  : "text-zinc-500"
              )}
            >
              {t('tracker')}
            </button>
            <button
              onClick={() => setViewType('counter')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-all",
                viewType === 'counter'
                  ? "text-emerald-400 bg-emerald-500/15"
                  : "text-zinc-500"
              )}
            >
              {t('counter')}
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 py-1" style={{ WebkitOverflowScrolling: 'touch' }}>
          {viewType === 'tracker' ? (
            <TrackerView 
              currentShoe={currentShoe} 
              stats={stats} 
              usedCards={usedCards} 
            />
          ) : (
            <CardCounterView 
              cardCount={cardCount} 
              burnedCards={currentShoe.burnStartCount + 1 + currentShoe.burnEndCount}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-zinc-900/80 border-zinc-800 h-full flex flex-col max-h-[80vh] md:max-h-none py-0 gap-0">
      <CardHeader className="pb-2 md:pb-3 flex-shrink-0 px-3 md:px-6 pt-3 md:pt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CardTitle className="text-base md:text-lg text-white shrink-0 flex items-center gap-2">
              <span>👟</span>
              <span>{t('title')}</span>
            </CardTitle>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px] md:text-xs shrink-0">
              #{currentShoe.shoeNumber}
            </Badge>
          </div>
          <Tabs value={viewType} onValueChange={(v) => setViewType(v as ShoeViewType)}>
            <TabsList className="bg-zinc-800 border border-zinc-700/50 h-9 p-1 rounded-lg gap-1">
              <TabsTrigger 
                value="tracker" 
                className="text-xs px-3 h-7 rounded-md transition-all data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=inactive]:text-zinc-400"
              >
                {t('tracker')}
              </TabsTrigger>
              <TabsTrigger 
                value="counter" 
                className="text-xs px-3 h-7 rounded-md transition-all data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=inactive]:text-zinc-400"
              >
                {t('counter')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-3 md:pb-4 overflow-hidden px-3 md:px-6">
        {viewType === 'tracker' ? (
          <TrackerView 
            currentShoe={currentShoe} 
            stats={stats} 
            usedCards={usedCards} 
          />
        ) : (
          <CardCounterView 
            cardCount={cardCount} 
            burnedCards={currentShoe.burnStartCount + 1 + currentShoe.burnEndCount}
          />
        )}
      </CardContent>
    </Card>
  );
}

// 追踪视图
function TrackerView({ 
  currentShoe, 
  stats, 
  usedCards 
}: { 
  currentShoe: import('@/types').Shoe; 
  stats: import('@/types').GameStats | null;
  usedCards: number;
}) {
  const t = useTranslations('shoe');

  return (
    <div className="h-full flex flex-col">
      {/* 牌靴进度 */}
      <div className="space-y-1.5 md:space-y-2 shrink-0 pb-5 md:pb-6">
        <div className="flex justify-between text-xs md:text-sm">
          <span className="text-zinc-400">{t('usageProgress')}</span>
          <span className="text-white font-mono">
            {usedCards} / {TOTAL_CARDS}
          </span>
        </div>
        <ProgressBar value={usedCards} max={TOTAL_CARDS} />
        <div className="text-[10px] md:text-xs text-zinc-500 text-right">
          {t('remainingCards')}: {currentShoe.usableCards} {t('cards')}
        </div>
      </div>

      <Separator className="bg-zinc-800 shrink-0" />

      {/* 统计信息 - 可拉伸填充空间 */}
      {stats && (
        <div className="flex-1 flex flex-col gap-2 md:gap-3 min-h-0 py-5 md:py-6">
          <div className="text-xs md:text-sm text-zinc-400 shrink-0">{t('shoeStats')}</div>
          <div className="grid grid-cols-3 gap-1.5 md:gap-2 text-center flex-[3]">
            <StatItem 
              label={t('bankerWins')} 
              value={stats.bankerWins} 
              color="text-red-400" 
              bgColor="bg-red-500/10"
              stretch
            />
            <StatItem 
              label={t('playerWins')} 
              value={stats.playerWins} 
              color="text-blue-400" 
              bgColor="bg-blue-500/10"
              stretch
            />
            <StatItem 
              label={t('ties')} 
              value={stats.ties} 
              color="text-green-400" 
              bgColor="bg-green-500/10"
              stretch
            />
          </div>
          <div className="grid grid-cols-2 gap-1.5 md:gap-2 text-center flex-[2]">
            <StatItem 
              label={t('bankerPairs')} 
              value={stats.bankerPairs} 
              color="text-red-300" 
              bgColor="bg-red-500/5"
              small
              stretch
            />
            <StatItem 
              label={t('playerPairs')} 
              value={stats.playerPairs} 
              color="text-blue-300" 
              bgColor="bg-blue-500/5"
              small
              stretch
            />
          </div>
        </div>
      )}

      <Separator className="bg-zinc-800 shrink-0" />

      {/* 烧牌信息 - 移动端压缩 */}
      <div className="space-y-2 md:space-y-3 shrink-0 pt-5 md:pt-6">
        <div className="text-xs md:text-sm text-zinc-400">{t('burnDetails')}</div>
        
        {/* 开局烧牌 */}
        <div className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-2 md:p-3">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="text-orange-400 text-base md:text-lg">🔥</div>
            <div>
              <div className="text-xs md:text-sm text-white">{t('openingBurn')}</div>
              <div className="text-[10px] md:text-xs text-zinc-500 hidden sm:block">
                {t('openingBurnDesc')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            {currentShoe.firstCard && (
              <div className="hidden sm:block">
                <PlayingCard card={currentShoe.firstCard} size="sm" />
              </div>
            )}
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px] md:text-xs px-1.5 md:px-2">
              {currentShoe.burnStartCount} {t('cards')}
            </Badge>
          </div>
        </div>

        {/* 结束烧牌 */}
        <div className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-2 md:p-3">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="text-purple-400 text-base md:text-lg">🃏</div>
            <div>
              <div className="text-xs md:text-sm text-white">{t('cutCardReserve')}</div>
              <div className="text-[10px] md:text-xs text-zinc-500 hidden sm:block">
                {t('cutCardDesc')}
              </div>
            </div>
          </div>
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px] md:text-xs px-1.5 md:px-2">
            {currentShoe.burnEndCount} {t('cards')}
          </Badge>
        </div>
      </div>

      {/* 区块链验证链接 */}
      {currentShoe.solanaExplorerUrl && (
        <a
          href={currentShoe.solanaExplorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-xs md:text-sm text-emerald-400 hover:underline py-1.5 md:py-2 mt-auto min-h-[36px] flex items-center justify-center"
        >
          {t('verifyOnSolana')}
        </a>
      )}
    </div>
  );
}

// 记牌器视图
function CardCounterView({ 
  cardCount,
  burnedCards
}: { 
  cardCount: { 
    counts: Record<CardRank, number>; 
    totalPerRank: number; 
    ranks: CardRank[]; 
  };
  burnedCards: number;
}) {
  const t = useTranslations('shoe');
  const { counts, totalPerRank, ranks } = cardCount;
  
  // 计算总剩余
  const totalRemaining = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const totalCards = totalPerRank * 13;
  const totalUsed = totalCards - totalRemaining;
  
  return (
    <div className="h-full flex flex-col">
      {/* 使用统计 */}
      <div className="mb-3 md:mb-4">
        <div className="flex justify-between text-xs md:text-sm mb-1.5 md:mb-2">
          <span className="text-zinc-400">{t('used')}</span>
          <span className="text-white font-mono">{totalUsed} / {totalCards}</span>
        </div>
        <ProgressBar value={totalUsed} max={totalCards} />
      </div>
      
      {/* 点数表格 - 移动端 4 列，桌面端 5 列 */}
      <div className="flex-1 grid grid-cols-4 sm:grid-cols-5 gap-1.5 md:gap-2">
        {ranks.map((rank) => {
          const remaining = counts[rank];
          const percentage = (remaining / totalPerRank) * 100;
          
          // 根据剩余百分比设置颜色
          let bgColor = 'bg-emerald-500/20';
          let textColor = 'text-emerald-400';
          if (percentage <= 25) {
            bgColor = 'bg-red-500/20';
            textColor = 'text-red-400';
          } else if (percentage <= 50) {
            bgColor = 'bg-orange-500/20';
            textColor = 'text-orange-400';
          } else if (percentage <= 75) {
            bgColor = 'bg-yellow-500/20';
            textColor = 'text-yellow-400';
          }
          
          return (
            <div 
              key={rank}
              className={cn(
                'rounded-lg p-1.5 md:p-2 text-center transition-colors',
                'flex flex-col justify-center min-h-[50px] md:min-h-[60px]',
                bgColor
              )}
            >
              <div className="text-white font-bold text-sm md:text-lg">{rank}</div>
              <div className={cn('text-lg md:text-2xl font-bold', textColor)}>
                {remaining}
              </div>
              <div className="text-[8px] md:text-[10px] text-zinc-500">
                /{totalPerRank}
              </div>
            </div>
          );
        })}
        
        {/* 烧牌/未知牌 - 移动端占2格，桌面端占2格 */}
        <div 
          className={cn(
            'rounded-lg p-1.5 md:p-2 text-center transition-colors col-span-2 sm:col-span-2',
            'bg-zinc-700/30 border border-zinc-600/50',
            'flex flex-col justify-center min-h-[50px] md:min-h-[60px]'
          )}
        >
          <div className="text-zinc-400 font-bold text-sm md:text-lg flex items-center justify-center gap-1">
            <span>🔥</span>
            <span className="hidden sm:inline">{t('unknownCards')}</span>
          </div>
          <div className="text-lg md:text-2xl font-bold text-zinc-400">
            {burnedCards}
          </div>
          <div className="text-[8px] md:text-[10px] text-zinc-500 line-clamp-1">
            {t('burnedNotVisible')}
          </div>
        </div>
      </div>
      
      {/* 图例 - 移动端 2x2 网格 */}
      <div className="mt-3 md:mt-4">
        {/* 桌面端：单行 */}
        <div className="hidden sm:flex justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-500/20" />
            <span className="text-zinc-500">&gt;75%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-500/20" />
            <span className="text-zinc-500">50-75%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-500/20" />
            <span className="text-zinc-500">25-50%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500/20" />
            <span className="text-zinc-500">&lt;25%</span>
          </div>
        </div>
        
        {/* 移动端：2x2 网格 */}
        <div className="sm:hidden grid grid-cols-4 gap-2 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-emerald-500/20" />
            <span className="text-zinc-500">&gt;75</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-yellow-500/20" />
            <span className="text-zinc-500">50-75</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-orange-500/20" />
            <span className="text-zinc-500">25-50</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-red-500/20" />
            <span className="text-zinc-500">&lt;25</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ 
  label, 
  value, 
  color, 
  bgColor,
  small = false,
  stretch = false
}: { 
  label: string; 
  value: number; 
  color: string; 
  bgColor: string;
  small?: boolean;
  stretch?: boolean;
}) {
  return (
    <div className={cn(
      'rounded-lg p-1.5 md:p-2 flex flex-col justify-center', 
      bgColor,
      stretch && 'h-full'
    )}>
      <div className={cn(color, small ? 'text-lg md:text-xl' : 'text-2xl md:text-3xl', 'font-bold')}>
        {value}
      </div>
      <div className="text-[10px] md:text-xs text-zinc-500">{label}</div>
    </div>
  );
}
