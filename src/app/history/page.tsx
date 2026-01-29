// ============================================
// OpenBaccarat - 历史记录详情页
// ============================================

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CardGroup } from '@/components/common/PlayingCard';
import { TimestampDisplay } from '@/components/common/LocalTime';
import { PageTransition } from '@/components/common/PageTransition';
import { generateAllRoadmaps, type RoadmapCell } from '@/lib/game/roadmap';
import { getRoundsHistory, getRoadmapData, getShoesList, getGameStats, getCurrentShoe } from '@/lib/supabase/queries';
import { cn } from '@/lib/utils';
import type { Round, Shoe, GameStats, RoadmapPoint, GameResult } from '@/types';

type FilterMode = 'current_shoe' | 'all';
type ResultFilter = 'all' | 'banker_win' | 'player_win' | 'tie';

export default function HistoryPage() {
  const t = useTranslations('history');
  const tGame = useTranslations('game');
  
  // 数据状态
  const [rounds, setRounds] = useState<Round[]>([]);
  const [roadmapData, setRoadmapData] = useState<RoadmapPoint[]>([]);
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [currentShoe, setCurrentShoe] = useState<Shoe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 筛选状态
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedShoeId, setSelectedShoeId] = useState<string>('');
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 结果标签
  const getResultLabel = (result: GameResult) => {
    switch (result) {
      case 'banker_win': return tGame('bankerWin');
      case 'player_win': return tGame('playerWin');
      case 'tie': return tGame('tie');
    }
  };

  // 加载数据
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 加载牌靴列表
      const shoesResult = await getShoesList(1, 50);
      setShoes(shoesResult.items);

      // 加载当前牌靴
      const currentShoeData = await getCurrentShoe();
      setCurrentShoe(currentShoeData);

      // 根据筛选模式加载数据
      let shoeIdFilter: string | undefined;
      if (filterMode === 'current_shoe' && currentShoeData) {
        shoeIdFilter = currentShoeData.id;
        setSelectedShoeId(currentShoeData.id);
      } else if (selectedShoeId && selectedShoeId !== 'all') {
        shoeIdFilter = selectedShoeId;
      }

      // 加载历史记录（传入牌靴筛选参数）
      const historyResult = await getRoundsHistory(page, 100, shoeIdFilter);
      setRounds(historyResult.items);
      setTotalPages(historyResult.totalPages);

      // 加载路单数据
      const roadmapResult = await getRoadmapData(shoeIdFilter);
      setRoadmapData(roadmapResult);

      // 加载统计
      const statsResult = await getGameStats();
      setStats(statsResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filterMode, selectedShoeId, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 筛选后的记录
  const filteredRounds = useMemo(() => {
    let result = [...rounds];

    // 按牌靴筛选
    if (filterMode === 'current_shoe' && currentShoe) {
      result = result.filter(r => r.shoeId === currentShoe.id);
    } else if (selectedShoeId && selectedShoeId !== 'all') {
      result = result.filter(r => r.shoeId === selectedShoeId);
    }

    // 按结果筛选
    if (resultFilter !== 'all') {
      result = result.filter(r => r.result === resultFilter);
    }

    // 搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.roundNumber.toString().includes(query) ||
        r.id.toLowerCase().includes(query)
      );
    }

    return result;
  }, [rounds, filterMode, currentShoe, selectedShoeId, resultFilter, searchQuery]);

  // 筛选后的路单数据
  const filteredRoadmapData = useMemo(() => {
    if (filterMode === 'current_shoe' && currentShoe) {
      return roadmapData;
    }
    if (selectedShoeId && selectedShoeId !== 'all') {
      return roadmapData;
    }
    return roadmapData;
  }, [roadmapData, filterMode, currentShoe, selectedShoeId]);

  // 计算统计信息（使用路单数据，确保显示全部数据的统计）
  const displayStats = useMemo(() => {
    const data = filteredRoadmapData;
    // 从全部历史记录计算 naturals（需要点数信息）
    const naturalsCount = filteredRounds.filter(r => r.playerTotal >= 8 || r.bankerTotal >= 8).length;
    return {
      total: data.length,
      bankerWins: data.filter(r => r.result === 'banker_win').length,
      playerWins: data.filter(r => r.result === 'player_win').length,
      ties: data.filter(r => r.result === 'tie').length,
      bankerPairs: data.filter(r => r.isPair?.banker).length,
      playerPairs: data.filter(r => r.isPair?.player).length,
      naturals: naturalsCount,
    };
  }, [filteredRoadmapData, filteredRounds]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
        {/* Header - 移动端优化 */}
        <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
          {/* 第一行：返回 + 标题 */}
          <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 md:gap-4 min-w-0">
                <Link href="/" className="flex items-center gap-1 md:gap-2 text-emerald-400 hover:text-emerald-300 transition shrink-0">
                  <span className="text-xl md:text-2xl">←</span>
                  <span className="hidden sm:inline text-sm md:text-base">{t('returnToHome')}</span>
                </Link>
                <h1 className="text-lg md:text-2xl font-bold text-white truncate">{t('title')}</h1>
              </div>
              
              {/* 桌面端筛选 */}
              <div className="hidden md:flex items-center gap-4">
                <Tabs value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)}>
                  <TabsList className="bg-zinc-800">
                    <TabsTrigger value="current_shoe" className="text-xs">{t('currentShoe')}</TabsTrigger>
                    <TabsTrigger value="all" className="text-xs">{t('allRecords')}</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                {filterMode === 'all' && (
                  <Select value={selectedShoeId} onValueChange={setSelectedShoeId}>
                    <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700">
                      <SelectValue placeholder={t('selectShoe')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allShoes')}</SelectItem>
                      {shoes.map(shoe => (
                        <SelectItem key={shoe.id} value={shoe.id}>
                          {tGame('shoe')} #{shoe.shoeNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* 移动端筛选 - 第二行：紧凑按钮 */}
            <div className="md:hidden flex items-center gap-2 mt-3">
              <div className="flex-1 grid grid-cols-2">
                <button
                  onClick={() => setFilterMode('current_shoe')}
                  className={cn(
                    "py-2 text-xs font-medium transition-all",
                    filterMode === 'current_shoe'
                      ? "text-emerald-400 bg-emerald-500/10 border-b-2 border-emerald-500"
                      : "text-zinc-500 border-b-2 border-transparent"
                  )}
                >
                  {t('currentShoe')}
                </button>
                <button
                  onClick={() => setFilterMode('all')}
                  className={cn(
                    "py-2 text-xs font-medium transition-all",
                    filterMode === 'all'
                      ? "text-emerald-400 bg-emerald-500/10 border-b-2 border-emerald-500"
                      : "text-zinc-500 border-b-2 border-transparent"
                  )}
                >
                  {t('allRecords')}
                </button>
              </div>
              
              {filterMode === 'all' && (
                <Select value={selectedShoeId} onValueChange={setSelectedShoeId}>
                  <SelectTrigger className="w-24 bg-zinc-800 border-zinc-700 h-8 text-xs">
                    <SelectValue placeholder={t('selectShoe')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allShoes')}</SelectItem>
                    {shoes.map(shoe => (
                      <SelectItem key={shoe.id} value={shoe.id}>
                        #{shoe.shoeNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </header>

        <main className="container mx-auto px-3 md:px-4 py-4 md:py-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-emerald-500" />
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {/* 所有路单 - 类似截图的布局 */}
              <AllRoadmapsPanel data={filteredRoadmapData} stats={displayStats} />

              {/* 历史记录列表 */}
              <HistoryListPanel 
                rounds={filteredRounds}
                resultFilter={resultFilter}
                setResultFilter={setResultFilter}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                page={page}
                setPage={setPage}
                totalPages={totalPages}
                getResultLabel={getResultLabel}
              />

              {/* 局号查询跳转 */}
              <RoundLookupPanel />
            </div>
          )}
        </main>
      </div>
    </PageTransition>
  );
}

// 所有路单面板
function AllRoadmapsPanel({ data, stats }: { data: RoadmapPoint[]; stats: ReturnType<typeof Object> }) {
  const t = useTranslations('history');
  const tGame = useTranslations('game');
  
  const roadmaps = useMemo(() => {
    if (data.length === 0) return null;
    return generateAllRoadmaps(data);
  }, [data]);

  if (!roadmaps || data.length === 0) {
    return (
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardContent className="py-12 text-center text-zinc-500">
          {t('noRoadmapData')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#1a5276] border-zinc-700 overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {/* 大路 - 顶部最大 */}
        <div className="bg-white/10 rounded-lg p-2">
          <div className="text-xs text-white/60 mb-1 font-medium">{t('roadmaps.bigRoad')} Big Road</div>
          <RoadmapGrid grid={roadmaps.bigRoad} type="big_road" rows={6} columns={40} />
        </div>

        {/* 下半部分：三个衍生路 + 珠盘路 + 统计 */}
        <div className="grid grid-cols-12 gap-4">
          {/* 左侧：三个衍生路 + 珠盘路 */}
          <div className="col-span-8 space-y-2">
            {/* 大眼仔和小路并排 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/10 rounded-lg p-2">
                <div className="text-xs text-white/60 mb-1 font-medium">{t('roadmaps.bigEyeBoy')} Big Eye Boy</div>
                <RoadmapGrid grid={roadmaps.bigEyeBoy} type="derived" rows={6} columns={20} cellSize="sm" />
              </div>
              <div className="bg-white/10 rounded-lg p-2">
                <div className="text-xs text-white/60 mb-1 font-medium">{t('roadmaps.cockroachRoad')} Cockroach Road</div>
                <RoadmapGrid grid={roadmaps.cockroachRoad} type="derived" rows={6} columns={20} cellSize="sm" />
              </div>
            </div>
            
            {/* 小路和珠盘路并排 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/10 rounded-lg p-2">
                <div className="text-xs text-white/60 mb-1 font-medium">{t('roadmaps.smallRoad')} Small Road</div>
                <RoadmapGrid grid={roadmaps.smallRoad} type="derived" rows={6} columns={20} cellSize="sm" />
              </div>
              <div className="bg-white/10 rounded-lg p-2">
                <div className="text-xs text-white/60 mb-1 font-medium">{t('roadmaps.beadPlate')} Bead Plate</div>
                <RoadmapGrid grid={roadmaps.beadPlate} type="bead_plate" rows={6} columns={12} cellSize="md" />
              </div>
            </div>
          </div>

          {/* 右侧：统计信息 */}
          <div className="col-span-4 space-y-2">
            {/* 统计表格 */}
            <div className="bg-white rounded-lg p-3 text-zinc-900">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-zinc-200">
                    <td className="py-1.5 text-red-600 font-bold">{tGame('banker')}</td>
                    <td className="py-1.5">Banker</td>
                    <td className="py-1.5 text-right font-bold text-lg">{(stats as { bankerWins: number }).bankerWins}</td>
                  </tr>
                  <tr className="border-b border-zinc-200">
                    <td className="py-1.5 text-blue-600 font-bold">{tGame('player')}</td>
                    <td className="py-1.5">Player</td>
                    <td className="py-1.5 text-right font-bold text-lg">{(stats as { playerWins: number }).playerWins}</td>
                  </tr>
                  <tr className="border-b border-zinc-200">
                    <td className="py-1.5 text-green-600 font-bold">{tGame('tie')}</td>
                    <td className="py-1.5">Tie</td>
                    <td className="py-1.5 text-right font-bold text-lg">{(stats as { ties: number }).ties}</td>
                  </tr>
                  <tr className="border-b border-zinc-200">
                    <td className="py-1.5 text-zinc-600">{t('stats.natural89')}</td>
                    <td className="py-1.5">Natural</td>
                    <td className="py-1.5 text-right font-bold">{(stats as { naturals: number }).naturals}</td>
                  </tr>
                  <tr className="border-b border-zinc-200">
                    <td className="py-1.5 text-zinc-600">{tGame('bankerPair')}</td>
                    <td className="py-1.5">Banker Pair</td>
                    <td className="py-1.5 text-right font-bold">{(stats as { bankerPairs: number }).bankerPairs}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-zinc-600">{tGame('playerPair')}</td>
                    <td className="py-1.5">Player Pair</td>
                    <td className="py-1.5 text-right font-bold">{(stats as { playerPairs: number }).playerPairs}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 局数信息 */}
            <div className="bg-white rounded-lg p-3 text-zinc-900">
              <div className="flex justify-between items-center">
                <span className="text-sm">{t('stats.game')} Game:</span>
                <span className="font-bold text-lg">{(stats as { total: number }).total}</span>
              </div>
            </div>

            {/* 图例 */}
            <div className="bg-white rounded-lg p-3">
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="text-sm font-bold text-zinc-600">{tGame('banker')}</div>
                  <div className="text-sm font-bold text-zinc-600">{tGame('player')}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-red-700" />
                  <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-blue-700" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 路单网格组件
function RoadmapGrid({ 
  grid, 
  type, 
  rows, 
  columns, 
  cellSize = 'sm' 
}: { 
  grid: RoadmapCell[][]; 
  type: 'big_road' | 'derived' | 'bead_plate';
  rows: number;
  columns: number;
  cellSize?: 'xs' | 'sm' | 'md';
}) {
  const tGame = useTranslations('game');
  const tDerived = useTranslations('history.derived');
  
  const sizeClass = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
  }[cellSize];

  const textSize = {
    xs: 'text-[5px]',
    sm: 'text-[6px]',
    md: 'text-[10px]',
  }[cellSize];

  // 结果标签
  const getResultLabel = (result: GameResult) => {
    switch (result) {
      case 'banker_win': return tGame('bankerWin');
      case 'player_win': return tGame('playerWin');
      case 'tie': return tGame('tie');
    }
  };

  return (
    <div 
      className="grid gap-px overflow-x-auto"
      style={{ 
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {Array.from({ length: rows }).map((_, rowIndex) =>
        Array.from({ length: columns }).map((_, colIndex) => {
          const cell = grid[colIndex]?.[rowIndex];
          return (
            <RoadmapCellDisplay 
              key={`${rowIndex}-${colIndex}`} 
              cell={cell || null}
              type={type}
              sizeClass={sizeClass}
              textSize={textSize}
              getResultLabel={getResultLabel}
              tGame={tGame}
              tDerived={tDerived}
            />
          );
        })
      )}
    </div>
  );
}

// 路单格子组件
function RoadmapCellDisplay({ 
  cell, 
  type,
  sizeClass,
  textSize,
  getResultLabel,
  tGame,
  tDerived,
}: { 
  cell: RoadmapCell | null; 
  type: 'big_road' | 'derived' | 'bead_plate';
  sizeClass: string;
  textSize: string;
  getResultLabel: (result: GameResult) => string;
  tGame: ReturnType<typeof useTranslations>;
  tDerived: ReturnType<typeof useTranslations>;
}) {
  if (!cell || !cell.result) {
    return (
      <div className={cn(
        'rounded-full bg-white/20',
        sizeClass,
        'mx-auto'
      )} />
    );
  }

  const isDerived = type === 'derived';
  
  const colorMap = {
    banker_win: isDerived ? 'bg-red-500 border-red-700' : 'bg-red-500 border-red-700',
    player_win: isDerived ? 'bg-blue-500 border-blue-700' : 'bg-blue-500 border-blue-700',
    tie: 'bg-green-500 border-green-700',
  };

  const label = type === 'bead_plate' 
    ? (cell.result === 'banker_win' ? tGame('banker') : cell.result === 'player_win' ? tGame('player') : tGame('tie'))
    : '';

  return (
    <div
      className={cn(
        'rounded-full mx-auto relative border',
        sizeClass,
        colorMap[cell.result],
        'flex items-center justify-center text-white font-bold',
        textSize,
        'cursor-pointer hover:ring-1 hover:ring-white/50 transition-all'
      )}
      title={
        isDerived 
          ? (cell.result === 'banker_win' ? tDerived('match') : tDerived('noMatch'))
          : `#${cell.roundNumber} - ${getResultLabel(cell.result)}`
      }
    >
      {label}
      {/* 和局标记 */}
      {cell.tieCount > 0 && (
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full text-[4px] flex items-center justify-center border border-green-700">
          {cell.tieCount}
        </div>
      )}
    </div>
  );
}

// 局号查询跳转面板
function RoundLookupPanel() {
  const t = useTranslations('history');
  const router = useRouter();
  const [roundInput, setRoundInput] = useState('');
  const [error, setError] = useState('');

  const handleLookup = () => {
    const roundNumber = parseInt(roundInput.trim());
    if (isNaN(roundNumber) || roundNumber <= 0) {
      setError(t('lookup.invalidNumber'));
      return;
    }
    setError('');
    router.push(`/round/${roundNumber}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLookup();
    }
  };

  return (
    <Card className="bg-zinc-900/80 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center gap-2">
          🔍 {t('lookup.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1 w-full sm:w-auto">
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                placeholder={t('lookup.placeholder')}
                value={roundInput}
                onChange={(e) => {
                  setRoundInput(e.target.value);
                  setError('');
                }}
                onKeyDown={handleKeyDown}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
              <Button 
                onClick={handleLookup}
                className="bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap"
              >
                {t('lookup.button')}
              </Button>
            </div>
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
          </div>
          <p className="text-zinc-500 text-sm">
            {t('lookup.description')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// 历史记录列表面板
function HistoryListPanel({
  rounds,
  resultFilter,
  setResultFilter,
  searchQuery,
  setSearchQuery,
  page,
  setPage,
  totalPages,
  getResultLabel,
}: {
  rounds: Round[];
  resultFilter: ResultFilter;
  setResultFilter: (v: ResultFilter) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  page: number;
  setPage: (v: number) => void;
  totalPages: number;
  getResultLabel: (result: GameResult) => string;
}) {
  const t = useTranslations('history');
  const tGame = useTranslations('game');

  const RESULT_COLORS: Record<GameResult, string> = {
    'banker_win': '#dc2626',
    'player_win': '#2563eb',
    'tie': '#16a34a',
  };

  return (
    <Card className="bg-zinc-900/80 border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-lg text-white">{t('detailedRecords')}</CardTitle>
          
          <div className="flex items-center gap-3">
            {/* 结果筛选 */}
            <Select value={resultFilter} onValueChange={(v) => setResultFilter(v as ResultFilter)}>
              <SelectTrigger className="w-32 bg-zinc-800 border-zinc-700 text-sm">
                <SelectValue placeholder={t('filterResult')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allResults')}</SelectItem>
                <SelectItem value="banker_win">{tGame('bankerWin')}</SelectItem>
                <SelectItem value="player_win">{tGame('playerWin')}</SelectItem>
                <SelectItem value="tie">{tGame('tie')}</SelectItem>
              </SelectContent>
            </Select>

            {/* 搜索 */}
            <Input
              placeholder={t('searchRound')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-40 bg-zinc-800 border-zinc-700 text-sm"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {rounds.length === 0 ? (
          <div className="text-center text-zinc-500 py-8">
            {t('noHistory')}
          </div>
        ) : (
          <>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-400">{t('roundNumber')}</TableHead>
                    <TableHead className="text-zinc-400">{t('result')}</TableHead>
                    <TableHead className="text-zinc-400">{t('playerHand')}</TableHead>
                    <TableHead className="text-zinc-400">{t('bankerHand')}</TableHead>
                    <TableHead className="text-zinc-400">{t('pairs')}</TableHead>
                    <TableHead className="text-zinc-400">{t('time')}</TableHead>
                    <TableHead className="text-zinc-400">{t('shoeNumber')}</TableHead>
                    <TableHead className="text-zinc-400">{t('onChain')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rounds.map((round) => (
                    <TableRow key={round.id} className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableCell className="font-mono text-zinc-300">
                        #{round.roundNumber}
                      </TableCell>
                      <TableCell>
                        <Badge style={{ backgroundColor: RESULT_COLORS[round.result] }} className="text-xs text-white">
                          {getResultLabel(round.result)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CardGroup cards={round.playerCards} size="xs" />
                          <span className="text-blue-400 font-bold">{round.playerTotal}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CardGroup cards={round.bankerCards} size="xs" />
                          <span className="text-red-400 font-bold">{round.bankerTotal}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {round.isPair.player && (
                            <Badge variant="outline" className="text-[10px] border-blue-500 text-blue-400">{tGame('playerPair')}</Badge>
                          )}
                          {round.isPair.banker && (
                            <Badge variant="outline" className="text-[10px] border-red-500 text-red-400">{tGame('bankerPair')}</Badge>
                          )}
                          {!round.isPair.player && !round.isPair.banker && (
                            <span className="text-zinc-600">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-500 text-xs">
                        <TimestampDisplay timestamp={round.completedAtUnix} />
                      </TableCell>
                      <TableCell className="text-zinc-400 text-xs font-mono">
                        #{round.shoeNumber}
                      </TableCell>
                      <TableCell>
                        {round.solanaSignature ? (
                          <Link 
                            href={round.solanaExplorerUrl || `https://solscan.io/tx/${round.solanaSignature}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-xs underline underline-offset-2 hover:no-underline transition-all"
                          >
                            <span>🔗</span>
                            <span>{t('viewTransaction')}</span>
                          </Link>
                        ) : (
                          <span className="text-zinc-600 text-xs">{t('pendingConfirm')}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="bg-zinc-800 border-zinc-700"
                >
                  {t('prevPage')}
                </Button>
                <span className="text-zinc-400 text-sm">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="bg-zinc-800 border-zinc-700"
                >
                  {t('nextPage')}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
