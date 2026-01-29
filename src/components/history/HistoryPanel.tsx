// ============================================
// OpenBaccarat - 历史记录面板
// ============================================

'use client';

import { useMemo, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CardGroup } from '@/components/common/PlayingCard';
import { TimestampDisplay } from '@/components/common/LocalTime';
import { useGameStore } from '@/stores/game-store';
import { getRoundsHistory } from '@/lib/supabase/queries';
import { generateAllRoadmaps, type RoadmapCell } from '@/lib/game/roadmap';
import { cn } from '@/lib/utils';
import type { Round, HistoryViewType, RoadmapViewType, GameResult } from '@/types';

interface HistoryPanelProps {
  hideHeader?: boolean;
}

export function HistoryPanel({ hideHeader = false }: HistoryPanelProps) {
  const t = useTranslations('history');
  const { 
    history, 
    historyPage, 
    historyTotalPages, 
    historyViewType, 
    setHistoryViewType, 
    roadmapViewType, 
    setRoadmapViewType,
    appendToHistory,
    currentShoe, // 获取当前牌靴
  } = useGameStore();
  
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // 加载更多历史记录
  const loadMore = useCallback(async () => {
    if (isLoadingMore || historyPage >= historyTotalPages) return;
    
    setIsLoadingMore(true);
    try {
      const nextPage = historyPage + 1;
      // 传入当前牌靴 ID 以保持数据一致性
      const result = await getRoundsHistory(nextPage, 20, currentShoe?.id);
      appendToHistory(result.items, result.page, result.totalPages);
    } catch (error) {
      console.error('加载更多历史记录失败:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [historyPage, historyTotalPages, isLoadingMore, appendToHistory, currentShoe?.id]);
  
  const hasMore = historyPage < historyTotalPages;

  // 隐藏头部时的简化渲染（移动端首页使用）
  if (hideHeader) {
    return (
      <div className="h-full flex flex-col">
        {/* 紧凑的内部 Tab */}
        <div className="flex items-center px-3 py-1.5 border-b border-zinc-800/30 shrink-0">
          <div className="flex gap-1">
            <button
              onClick={() => setHistoryViewType('list')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-all",
                historyViewType === 'list'
                  ? "text-emerald-400 bg-emerald-500/15"
                  : "text-zinc-500"
              )}
            >
              {t('viewList')}
            </button>
            <button
              onClick={() => setHistoryViewType('roadmap')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-all",
                historyViewType === 'roadmap'
                  ? "text-emerald-400 bg-emerald-500/15"
                  : "text-zinc-500"
              )}
            >
              {t('viewRoadmap')}
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 py-1" style={{ WebkitOverflowScrolling: 'touch' }}>
          {historyViewType === 'list' ? (
            <HistoryList 
              rounds={history} 
              hasMore={hasMore} 
              isLoading={isLoadingMore} 
              onLoadMore={loadMore} 
            />
          ) : (
            <RoadmapView 
              viewType={roadmapViewType} 
              onViewChange={setRoadmapViewType}
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
          <CardTitle className="text-base md:text-lg text-white flex items-center gap-2">
            <span>📊</span>
            <span>{t('title')}</span>
          </CardTitle>
          <Tabs value={historyViewType} onValueChange={(v) => setHistoryViewType(v as HistoryViewType)}>
            <TabsList className="bg-zinc-800 border border-zinc-700/50 h-9 p-1 rounded-lg gap-1">
              <TabsTrigger 
                value="list" 
                className="text-xs px-3 h-7 rounded-md transition-all data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=inactive]:text-zinc-400"
              >
                {t('viewList')}
              </TabsTrigger>
              <TabsTrigger 
                value="roadmap" 
                className="text-xs px-3 h-7 rounded-md transition-all data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=inactive]:text-zinc-400"
              >
                {t('viewRoadmap')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden pb-4 px-3 md:px-6">
        {historyViewType === 'list' ? (
          <HistoryList 
            rounds={history} 
            hasMore={hasMore} 
            isLoading={isLoadingMore} 
            onLoadMore={loadMore} 
          />
        ) : (
          <RoadmapView 
            viewType={roadmapViewType} 
            onViewChange={setRoadmapViewType}
          />
        )}
      </CardContent>
    </Card>
  );
}

interface HistoryListProps {
  rounds: Round[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

function HistoryList({ rounds, hasMore, isLoading, onLoadMore }: HistoryListProps) {
  const t = useTranslations('history');
  const tGame = useTranslations('game');

  // 结果标签
  const getResultLabel = (result: GameResult) => {
    switch (result) {
      case 'banker_win': return tGame('bankerWin');
      case 'player_win': return tGame('playerWin');
      case 'tie': return tGame('tie');
    }
  };

  if (rounds.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-zinc-800/50 mb-3 md:mb-4">
            <span className="text-2xl md:text-3xl animate-pulse">🎴</span>
          </div>
          <p className="text-zinc-400 font-medium mb-1 text-sm md:text-base">{t('noHistory')}</p>
          <p className="text-zinc-600 text-xs md:text-sm">{t('waitingForGame')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full md:contents">
      {/* 移动端：卡片列表（无 ScrollArea，由父容器控制滚动） */}
      <div className="md:hidden space-y-2 pb-4">
        {rounds.map((round) => (
          <MobileHistoryCard 
            key={round.id} 
            round={round} 
            getResultLabel={getResultLabel}
          />
        ))}
        
        {/* 加载更多 */}
        {hasMore && (
          <div className="flex justify-center py-3">
            <button
              onClick={onLoadMore}
              disabled={isLoading}
              className="px-4 py-2 text-xs text-emerald-400 bg-emerald-500/10 rounded-lg disabled:opacity-50"
            >
              {isLoading ? t('loading') : t('loadMore')}
            </button>
          </div>
        )}
      </div>

      {/* 桌面端：表格（使用 ScrollArea） */}
      <ScrollArea className="hidden md:block h-full">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800">
              <TableHead className="text-zinc-400 w-16">{t('roundNumber')}</TableHead>
              <TableHead className="text-zinc-400">{t('result')}</TableHead>
              <TableHead className="text-zinc-400">{t('playerHand')}</TableHead>
              <TableHead className="text-zinc-400">{t('bankerHand')}</TableHead>
              <TableHead className="text-zinc-400">{t('time')}</TableHead>
              <TableHead className="text-zinc-400">{t('shoeNumber')}</TableHead>
              <TableHead className="text-zinc-400 w-20">{t('onChain')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rounds.map((round) => (
              <TableRow key={round.id} className="border-zinc-800 hover:bg-zinc-800/50 h-[60px]">
                <TableCell className="font-mono text-white py-1 text-sm">#{round.roundNumber}</TableCell>
                <TableCell className="py-1">
                  <ResultBadge result={round.result} label={getResultLabel(round.result)} />
                </TableCell>
                <TableCell className="py-1">
                  <div className="flex items-center gap-1">
                    <CardGroup cards={round.playerCards} size="sm" overlap={false} />
                    <span className="text-white font-bold text-sm">{round.playerTotal}</span>
                    {round.isPair.player && (
                      <Badge variant="outline" className="border-blue-500 text-blue-400 text-[10px] px-1 py-0">{t('pair')}</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-1">
                  <div className="flex items-center gap-1">
                    <CardGroup cards={round.bankerCards} size="sm" overlap={false} />
                    <span className="text-white font-bold text-sm">{round.bankerTotal}</span>
                    {round.isPair.banker && (
                      <Badge variant="outline" className="border-red-500 text-red-400 text-[10px] px-1 py-0">{t('pair')}</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-zinc-400 text-xs py-1">
                  <TimestampDisplay timestamp={round.completedAt} format="short" />
                </TableCell>
                <TableCell className="text-zinc-400 text-xs py-1">
                  #{round.shoeNumber}
                </TableCell>
                <TableCell className="py-1">
                  {round.solanaExplorerUrl ? (
                    <a
                      href={round.solanaExplorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:underline text-xs"
                    >
                      {t('viewTransaction')} ↗
                    </a>
                  ) : (
                    <span className="text-zinc-600 text-xs">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      
        {/* 桌面端加载更多按钮 */}
        {hasMore && (
          <div className="py-3 md:py-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onLoadMore}
              disabled={isLoading}
              className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 min-h-[40px] px-6"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin mr-2" />
                  {t('loading')}
                </>
              ) : (
                t('loadMore')
              )}
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// 移动端历史记录卡片
function MobileHistoryCard({ 
  round, 
  getResultLabel 
}: { 
  round: Round; 
  getResultLabel: (result: GameResult) => string;
}) {
  const t = useTranslations('history');

  const RESULT_COLORS: Record<GameResult, string> = {
    'banker_win': 'border-l-red-500',
    'player_win': 'border-l-blue-500',
    'tie': 'border-l-green-500',
  };

  return (
    <div className={cn(
      "bg-zinc-800/40 rounded-lg p-3 border-l-4",
      RESULT_COLORS[round.result]
    )}>
      {/* 顶部：局号 + 结果 + 时间 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-white text-sm font-bold">#{round.roundNumber}</span>
          <ResultBadge result={round.result} label={getResultLabel(round.result)} size="sm" />
        </div>
        <div className="text-zinc-500 text-[10px]">
          <TimestampDisplay timestamp={round.completedAt} format="short" />
        </div>
      </div>

      {/* 中间：牌面信息 */}
      <div className="flex items-center justify-between gap-2">
        {/* 闲家 */}
        <div className="flex items-center gap-1.5 flex-1">
          <span className="text-blue-400 text-xs font-medium w-5">{t('playerHand').charAt(0)}</span>
          <CardGroup cards={round.playerCards} size="xs" overlap={false} />
          <span className="text-blue-400 font-bold text-sm">{round.playerTotal}</span>
          {round.isPair.player && (
            <span className="text-blue-400 text-[10px]">🔷</span>
          )}
        </div>

        <span className="text-zinc-600 text-xs">vs</span>

        {/* 庄家 */}
        <div className="flex items-center gap-1.5 flex-1 justify-end">
          {round.isPair.banker && (
            <span className="text-red-400 text-[10px]">🔶</span>
          )}
          <span className="text-red-400 font-bold text-sm">{round.bankerTotal}</span>
          <CardGroup cards={round.bankerCards} size="xs" overlap={false} />
          <span className="text-red-400 text-xs font-medium w-5 text-right">{t('bankerHand').charAt(0)}</span>
        </div>
      </div>

      {/* 底部：链上状态 */}
      {round.solanaExplorerUrl && (
        <div className="mt-2 pt-2 border-t border-zinc-700/50">
          <a
            href={round.solanaExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 text-[11px] flex items-center gap-1"
          >
            <span>✅</span>
            <span>{t('viewTransaction')} ↗</span>
          </a>
        </div>
      )}
    </div>
  );
}

function ResultBadge({ result, label, size = 'md' }: { result: Round['result']; label: string; size?: 'sm' | 'md' }) {
  const RESULT_COLORS: Record<GameResult, string> = {
    'banker_win': '#dc2626',
    'player_win': '#2563eb',
    'tie': '#16a34a',
  };

  const color = RESULT_COLORS[result];

  return (
    <Badge
      style={{ backgroundColor: color }}
      className={cn(
        "text-white font-medium",
        size === 'sm' ? 'text-[10px] px-1.5 py-0' : ''
      )}
    >
      {label}
    </Badge>
  );
}

function RoadmapView({ 
  viewType, 
  onViewChange 
}: { 
  viewType: RoadmapViewType; 
  onViewChange: (type: RoadmapViewType) => void;
}) {
  const t = useTranslations('history.roadmaps');
  const { roadmapData } = useGameStore();

  const roadmapTypes: { value: RoadmapViewType; label: string }[] = [
    { value: 'bead_plate', label: t('beadPlate') },
    { value: 'big_road', label: t('bigRoad') },
    { value: 'big_eye_boy', label: t('bigEyeBoy') },
    { value: 'small_road', label: t('smallRoad') },
    { value: 'cockroach_road', label: t('cockroachRoad') },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* 移动端：紧凑的水平滚动按钮 */}
      <div className="md:hidden flex-shrink-0 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 pb-1">
          {roadmapTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => onViewChange(type.value)}
              className={cn(
                "px-2.5 py-1 text-[11px] font-medium rounded whitespace-nowrap transition-all",
                viewType === type.value
                  ? "text-emerald-400 bg-emerald-500/15"
                  : "text-zinc-500"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* 桌面端：单行 */}
      <Tabs value={viewType} onValueChange={(v) => onViewChange(v as RoadmapViewType)} className="flex-shrink-0 hidden md:block">
        <TabsList className="bg-zinc-800 w-full grid-cols-5 grid">
          <TabsTrigger value="bead_plate" className="text-xs">{t('beadPlate')}</TabsTrigger>
          <TabsTrigger value="big_road" className="text-xs">{t('bigRoad')}</TabsTrigger>
          <TabsTrigger value="big_eye_boy" className="text-xs">{t('bigEyeBoy')}</TabsTrigger>
          <TabsTrigger value="small_road" className="text-xs">{t('smallRoad')}</TabsTrigger>
          <TabsTrigger value="cockroach_road" className="text-xs">{t('cockroachRoad')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 路单网格 */}
      <ScrollArea className="flex-1 mt-1 md:mt-4">
        <RoadmapGrid viewType={viewType} data={roadmapData} />
      </ScrollArea>
    </div>
  );
}

function RoadmapGrid({ viewType, data }: { viewType: RoadmapViewType; data: import('@/types').RoadmapPoint[] }) {
  const t = useTranslations('history');
  
  // 使用路单算法库生成各类路单
  const roadmaps = useMemo(() => {
    if (data.length === 0) return null;
    return generateAllRoadmaps(data);
  }, [data]);

  if (!roadmaps || data.length === 0) {
    return (
      <div className="text-center text-zinc-500 py-8">
        {t('noRoadmapData')}
      </div>
    );
  }

  // 根据视图类型获取对应的网格数据和配置
  const getGridConfig = () => {
    switch (viewType) {
      case 'bead_plate':
        return { grid: roadmaps.beadPlate, rows: 6, columns: 12, showLabel: true };
      case 'big_road':
        return { grid: roadmaps.bigRoad, rows: 6, columns: 30, showLabel: false };
      case 'big_eye_boy':
        return { grid: roadmaps.bigEyeBoy, rows: 6, columns: 30, showLabel: false };
      case 'small_road':
        return { grid: roadmaps.smallRoad, rows: 6, columns: 30, showLabel: false };
      case 'cockroach_road':
        return { grid: roadmaps.cockroachRoad, rows: 6, columns: 30, showLabel: false };
      default:
        return { grid: roadmaps.bigRoad, rows: 6, columns: 30, showLabel: false };
    }
  };

  const { grid, rows, columns, showLabel } = getGridConfig();
  
  return (
    <div className="overflow-x-auto">
      <div 
        className="grid gap-1 p-2 bg-zinc-800/50 rounded-lg"
        style={{ 
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          minHeight: viewType === 'bead_plate' ? '200px' : '120px',
        }}
      >
        {/* 按行渲染：先遍历列，再遍历行 */}
        {Array.from({ length: rows }).map((_, rowIndex) =>
          Array.from({ length: columns }).map((_, colIndex) => {
            const cell = grid[colIndex]?.[rowIndex];
            return (
              <RoadmapCellComponent 
                key={`${rowIndex}-${colIndex}`} 
                cell={cell || null}
                viewType={viewType}
                showLabel={showLabel}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function RoadmapCellComponent({ 
  cell, 
  viewType, 
  showLabel 
}: { 
  cell: RoadmapCell | null; 
  viewType: RoadmapViewType;
  showLabel: boolean;
}) {
  const tGame = useTranslations('game');
  const tDerived = useTranslations('history.derived');

  // 结果标签
  const getResultLabel = (result: GameResult) => {
    switch (result) {
      case 'banker_win': return tGame('bankerWin');
      case 'player_win': return tGame('playerWin');
      case 'tie': return tGame('tie');
    }
  };

  if (!cell || !cell.result) {
    return (
      <div className={cn(
        'rounded-full bg-zinc-700/30',
        viewType === 'bead_plate' ? 'w-7 h-7' : 'w-4 h-4',
        'mx-auto'
      )} />
    );
  }

  // 衍生路（大眼仔、小路、蟑螂路）使用红/蓝表示"齐/不齐"
  const isDerivedRoad = viewType === 'big_eye_boy' || viewType === 'small_road' || viewType === 'cockroach_road';
  
  const colorMap = {
    banker_win: 'bg-red-500',
    player_win: 'bg-blue-500',
    tie: 'bg-green-500',
  };

  // 获取 tooltip 文字
  const getTooltip = () => {
    if (isDerivedRoad) {
      return cell.result === 'banker_win' ? tDerived('match') : tDerived('noMatch');
    }
    if (!cell.result) return '';
    return cell.roundNumber ? `#${cell.roundNumber} - ${getResultLabel(cell.result)}` : getResultLabel(cell.result);
  };

  return (
    <div
      className={cn(
        'rounded-full mx-auto relative',
        viewType === 'bead_plate' ? 'w-7 h-7' : 'w-4 h-4',
        colorMap[cell.result],
        'flex items-center justify-center text-white font-bold',
        viewType === 'bead_plate' ? 'text-xs' : 'text-[6px]',
        'cursor-pointer hover:ring-2 hover:ring-white/50 transition-all'
      )}
      title={getTooltip()}
    >
      {showLabel && (
        cell.result === 'banker_win' ? tGame('banker') : cell.result === 'player_win' ? tGame('player') : tGame('tie')
      )}
      {/* 和局标记（大路中和局叠加显示） */}
      {cell.tieCount > 0 && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full text-[6px] flex items-center justify-center">
          {cell.tieCount}
        </div>
      )}
    </div>
  );
}
