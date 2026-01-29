// ============================================
// OpenBaccarat - 主页面
// 布局设计：顶部游戏展示区 + 底部左右并列面板
// 移动端优化：融合式 Tab 面板
// ============================================

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { GameDisplay } from '@/components/game/GameDisplay';
import { HistoryPanel } from '@/components/history/HistoryPanel';
import { ShoeTracker } from '@/components/shoe/ShoeTracker';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useGameStore } from '@/stores/game-store';
import { getRoundsHistory } from '@/lib/supabase/queries';
import { Badge } from '@/components/ui/badge';
import { CardGroup } from '@/components/common/PlayingCard';
import { TimestampDisplay } from '@/components/common/LocalTime';
import { cn } from '@/lib/utils';
import type { Round, GameResult } from '@/types';

export default function HomePage() {
  const t = useTranslations();
  const { startGameLoop } = useGameLoop();
  const hasStarted = useRef(false);

  // 启动游戏循环
  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      // 稍微延迟启动，等待组件挂载完成
      const timer = setTimeout(() => {
        startGameLoop();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [startGameLoop]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      {/* 顶部横幅 - 仅桌面端显示 */}
      <div className="hidden sm:block bg-gradient-to-r from-emerald-900/20 via-emerald-800/30 to-emerald-900/20 border-b border-emerald-800/30 py-2">
        <div className="container mx-auto px-4 flex items-center justify-center gap-4 text-sm">
          <span className="text-zinc-400 text-center">
            {t('home.banner.description')}
          </span>
          <a 
            href="https://github.com/open-baccarat/OpenBaccarat"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline whitespace-nowrap shrink-0"
          >
            {t('home.banner.viewSource')}
          </a>
        </div>
      </div>

      {/* 主内容区 - 移动端紧凑间距 */}
      <div className="container mx-auto px-3 md:px-4 py-2 md:py-4 space-y-2 md:space-y-4">
        {/* ==================== */}
        {/* 🎰 顶部：2D 游戏展示区 */}
        {/* ==================== */}
        <section className="w-full">
          <GameDisplay />
        </section>

        {/* ======================== */}
        {/* 📜👟 底部：历史记录 + 牌靴追踪 */}
        {/* ======================== */}
        
        {/* 桌面和平板布局：两列并列 */}
        <section className="hidden md:grid md:grid-cols-2 gap-4 items-start">
          <div className="h-[66vh]">
            <HistoryPanel />
          </div>
          <div className="h-[66vh]">
            <ShoeTracker />
          </div>
        </section>

        {/* 手机布局：融合式 Tab 面板 */}
        <section className="md:hidden">
          <MobileTabPanel />
        </section>
      </div>

      {/* 底部特性介绍 - 移动端优化 */}
      <footer className="container mx-auto px-3 md:px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
          <FeatureCard
            icon="🔓"
            title={t('home.features.openSource.title')}
            description={t('home.features.openSource.description')}
          />
          <FeatureCard
            icon="🔗"
            title={t('home.features.blockchain.title')}
            description={t('home.features.blockchain.description')}
          />
          <FeatureCard
            icon="🎲"
            title={t('home.features.fairRandom.title')}
            description={t('home.features.fairRandom.description')}
          />
        </div>
      </footer>
    </div>
  );
}

// 移动端融合式 Tab 面板
function MobileTabPanel() {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<'history' | 'shoe'>('history');

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden" style={{ height: '70vh' }}>
      {/* Tab 切换器 */}
      <div className="grid grid-cols-2 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-all",
            activeTab === 'history'
              ? "text-emerald-400 bg-emerald-500/10 border-b-2 border-emerald-500"
              : "text-zinc-500 border-b-2 border-transparent"
          )}
        >
          <span>📊</span>
          <span>{t('home.tabs.history')}</span>
        </button>
        <button
          onClick={() => setActiveTab('shoe')}
          className={cn(
            "flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-all",
            activeTab === 'shoe'
              ? "text-emerald-400 bg-emerald-500/10 border-b-2 border-emerald-500"
              : "text-zinc-500 border-b-2 border-transparent"
          )}
        >
          <span>👟</span>
          <span>{t('home.tabs.shoe')}</span>
        </button>
      </div>

      {/* 内容区 - 使用固定高度和 overflow-y-scroll */}
      <div 
        className="overflow-y-scroll overscroll-contain"
        style={{ 
          height: 'calc(70vh - 44px)',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {activeTab === 'history' ? (
          <MobileHistoryList />
        ) : (
          <ShoeTracker hideHeader />
        )}
      </div>
    </div>
  );
}

// 移动端专用历史记录面板 - 完全独立组件
function MobileHistoryList() {
  const t = useTranslations('history');
  const tGame = useTranslations('game');
  const tCommon = useTranslations('common');
  const { 
    history, 
    historyPage, 
    historyTotalPages, 
    appendToHistory,
    roadmapData,
    roadmapViewType,
    setRoadmapViewType,
    currentShoe, // 获取当前牌靴
  } = useGameStore();
  const [viewType, setViewType] = useState<'list' | 'roadmap'>('list');
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (isLoading || historyPage >= historyTotalPages) return;
    setIsLoading(true);
    try {
      const nextPage = historyPage + 1;
      // 传入当前牌靴 ID 以保持数据一致性
      const result = await getRoundsHistory(nextPage, 20, currentShoe?.id);
      appendToHistory(result.items, result.page, result.totalPages);
    } catch (error) {
      console.error('加载更多失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [historyPage, historyTotalPages, isLoading, appendToHistory, currentShoe?.id]);

  const hasMore = historyPage < historyTotalPages;

  const getResultLabel = (result: GameResult) => {
    switch (result) {
      case 'banker_win': return tGame('bankerWin');
      case 'player_win': return tGame('playerWin');
      case 'tie': return tGame('tie');
    }
  };

  const RESULT_COLORS: Record<GameResult, string> = {
    'banker_win': '#dc2626',
    'player_win': '#2563eb',
    'tie': '#16a34a',
  };

  return (
    <div className="h-full flex flex-col">
      {/* 列表/路单 切换按钮 */}
      <div className="flex items-center px-3 py-1.5 border-b border-zinc-800/30 shrink-0">
        <div className="flex gap-1">
          <button
            onClick={() => setViewType('list')}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded transition-all",
              viewType === 'list'
                ? "text-emerald-400 bg-emerald-500/15"
                : "text-zinc-500"
            )}
          >
            {t('viewList')}
          </button>
          <button
            onClick={() => setViewType('roadmap')}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded transition-all",
              viewType === 'roadmap'
                ? "text-emerald-400 bg-emerald-500/15"
                : "text-zinc-500"
            )}
          >
            {t('viewRoadmap')}
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div 
        className="flex-1 overflow-y-scroll overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {viewType === 'list' ? (
          // 列表视图
          history.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🎴</div>
                <p className="text-zinc-400 text-sm">{t('noHistory')}</p>
                <p className="text-zinc-600 text-xs mt-1">{t('waitingForGame')}</p>
              </div>
            </div>
          ) : (
            <div className="p-2 space-y-2">
      {history.map((round) => (
        <Link
          key={round.id}
          href={`/round/${round.roundNumber}`}
          className="block bg-zinc-800/50 rounded-lg p-3 active:bg-zinc-700/50 transition-colors"
        >
          {/* 头部：局号 + 结果 + 时间 */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-zinc-300 font-mono text-sm">#{round.roundNumber}</span>
              <Badge 
                style={{ backgroundColor: RESULT_COLORS[round.result] }} 
                className="text-white text-[10px] px-1.5 py-0"
              >
                {getResultLabel(round.result)}
              </Badge>
            </div>
            <span className="text-zinc-500 text-xs">
              <TimestampDisplay timestamp={round.completedAtUnix} format="short" />
            </span>
          </div>
          
          {/* 牌面对比 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-blue-400 text-xs w-4">{tGame('player')}</span>
              <CardGroup cards={round.playerCards} size="xs" />
              <span className="text-blue-400 font-bold text-sm">{round.playerTotal}</span>
            </div>
            <span className="text-zinc-600 text-xs">{tCommon('vs')}</span>
            <div className="flex items-center gap-2">
              <span className="text-red-400 font-bold text-sm">{round.bankerTotal}</span>
              <CardGroup cards={round.bankerCards} size="xs" />
              <span className="text-red-400 text-xs w-4">{tGame('banker')}</span>
            </div>
          </div>
          
          {/* 链上状态 */}
          {round.solanaSignature && (
            <div className="mt-2 pt-2 border-t border-zinc-700/50">
              <span className="text-emerald-400 text-xs flex items-center gap-1">
                ✅ {t('viewTransaction')} ↗
              </span>
            </div>
          )}
        </Link>
              ))}
              
              {/* 加载更多 */}
              {hasMore && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    loadMore();
                  }}
                  disabled={isLoading}
                  className="w-full py-3 text-center text-emerald-400 text-sm bg-emerald-500/10 rounded-lg disabled:opacity-50"
                >
                  {isLoading ? t('loading') : t('loadMore')}
                </button>
              )}
            </div>
          )
        ) : (
          // 路单视图
          <MobileRoadmapView 
            data={roadmapData} 
            viewType={roadmapViewType}
            onViewChange={setRoadmapViewType}
          />
        )}
      </div>
    </div>
  );
}

// 移动端路单视图
function MobileRoadmapView({ 
  data, 
  viewType, 
  onViewChange 
}: { 
  data: import('@/types').RoadmapPoint[];
  viewType: import('@/types').RoadmapViewType;
  onViewChange: (type: import('@/types').RoadmapViewType) => void;
}) {
  const t = useTranslations('history.roadmaps');
  const tGame = useTranslations('game');
  const tHistory = useTranslations('history');
  const { generateAllRoadmaps } = require('@/lib/game/roadmap');

  const roadmapTypes: { value: import('@/types').RoadmapViewType; label: string }[] = [
    { value: 'big_road', label: t('bigRoad') },
    { value: 'big_eye_boy', label: t('bigEyeBoy') },
    { value: 'small_road', label: t('smallRoad') },
    { value: 'cockroach_road', label: t('cockroachRoad') },
    { value: 'bead_plate', label: t('beadPlate') },
  ];

  const roadmaps = data.length > 0 ? generateAllRoadmaps(data) : null;

  if (!roadmaps || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-zinc-400 text-sm">{tHistory('noRoadmapData')}</p>
        </div>
      </div>
    );
  }

  // 获取当前路单数据
  const getCurrentRoadmap = () => {
    switch (viewType) {
      case 'big_road': return roadmaps.bigRoad;
      case 'big_eye_boy': return roadmaps.bigEyeBoy;
      case 'small_road': return roadmaps.smallRoad;
      case 'cockroach_road': return roadmaps.cockroachRoad;
      case 'bead_plate': return roadmaps.beadPlate;
    }
  };

  const currentData = getCurrentRoadmap();
  const isDerived = viewType !== 'big_road' && viewType !== 'bead_plate';
  const isBeadPlate = viewType === 'bead_plate';

  return (
    <div className="p-2">
      {/* 路单类型切换 */}
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
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

      {/* 路单网格 */}
      <div className="mt-2 overflow-x-auto">
        <div 
          className="grid gap-px"
          style={{ 
            gridTemplateColumns: `repeat(${isBeadPlate ? 12 : isDerived ? 20 : 30}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(6, 1fr)`,
          }}
        >
          {Array.from({ length: 6 }).map((_, rowIndex) =>
            Array.from({ length: isBeadPlate ? 12 : isDerived ? 20 : 30 }).map((_, colIndex) => {
              const cell = currentData[colIndex]?.[rowIndex];
              if (!cell || !cell.result) {
                return (
                  <div 
                    key={`${rowIndex}-${colIndex}`}
                    className={cn(
                      "rounded-full bg-white/10 mx-auto",
                      isBeadPlate ? "w-4 h-4" : isDerived ? "w-2.5 h-2.5" : "w-3 h-3"
                    )}
                  />
                );
              }
              
              const colorMap: Record<string, string> = {
                banker_win: 'bg-red-500 border-red-700',
                player_win: 'bg-blue-500 border-blue-700',
                tie: 'bg-green-500 border-green-700',
              };

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={cn(
                    "rounded-full mx-auto border flex items-center justify-center text-white font-bold",
                    colorMap[cell.result as string],
                    isBeadPlate ? "w-4 h-4 text-[8px]" : isDerived ? "w-2.5 h-2.5" : "w-3 h-3"
                  )}
                >
                  {isBeadPlate && (cell.result === 'banker_win' ? tGame('banker') : cell.result === 'player_win' ? tGame('player') : tGame('tie'))}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: string; 
  title: string; 
  description: string; 
}) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 md:p-6 text-center hover:border-emerald-800/50 transition-colors active:scale-[0.99]">
      <div className="text-3xl md:text-4xl mb-2 md:mb-3">{icon}</div>
      <h3 className="text-base md:text-lg font-semibold text-white mb-1 md:mb-2">{title}</h3>
      <p className="text-xs md:text-sm text-zinc-400 line-clamp-2">{description}</p>
    </div>
  );
}
