// ============================================
// OpenBaccarat - 统计面板
// ============================================

'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGameStore } from '@/stores/game-store';
import { cn } from '@/lib/utils';

export function StatsPanel() {
  const t = useTranslations('stats');
  const tCommon = useTranslations('common');
  const { stats } = useGameStore();

  if (!stats) {
    return (
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-zinc-500 py-2 text-sm">
            {tCommon('loading')}
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = stats.bankerWins + stats.playerWins + stats.ties;
  const bankerPercentage = total > 0 ? ((stats.bankerWins / total) * 100).toFixed(1) : '0';
  const playerPercentage = total > 0 ? ((stats.playerWins / total) * 100).toFixed(1) : '0';
  const tiePercentage = total > 0 ? ((stats.ties / total) * 100).toFixed(1) : '0';

  return (
    <Card className="bg-zinc-900/80 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-white flex items-center justify-between">
          <span>{t('title')}</span>
          <span className="text-xs text-zinc-500 font-normal">{t('totalRounds', { count: stats.totalRounds })}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 胜率条形图 */}
        <div className="space-y-2">
          <StatBar 
            label={t('bankerWin')} 
            value={stats.bankerWins} 
            percentage={parseFloat(bankerPercentage)} 
            color="bg-red-500" 
          />
          <StatBar 
            label={t('playerWin')} 
            value={stats.playerWins} 
            percentage={parseFloat(playerPercentage)} 
            color="bg-blue-500" 
          />
          <StatBar 
            label={t('tie')} 
            value={stats.ties} 
            percentage={parseFloat(tiePercentage)} 
            color="bg-green-500" 
          />
        </div>

        {/* 对子统计 */}
        <div className="flex justify-between text-xs pt-2 border-t border-zinc-800">
          <div className="flex items-center gap-1">
            <span className="text-zinc-500">{t('bankerPair')}:</span>
            <span className="text-red-300">{stats.bankerPairs}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-zinc-500">{t('playerPair')}:</span>
            <span className="text-blue-300">{stats.playerPairs}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatBar({ 
  label, 
  value, 
  percentage, 
  color 
}: { 
  label: string; 
  value: number; 
  percentage: number; 
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="text-white">
          {value} <span className="text-zinc-500">({percentage}%)</span>
        </span>
      </div>
      <div className="w-full bg-zinc-700 rounded-full h-1.5">
        <div
          className={cn(color, 'h-1.5 rounded-full transition-all duration-500')}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
