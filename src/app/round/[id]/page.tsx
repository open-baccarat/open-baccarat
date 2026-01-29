// ============================================
// OpenBaccarat - 单局详情页面
// SEO & AI Friendly: 包含 JSON-LD 结构化数据
// ============================================

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getRoundByNumber, getRoundById } from '@/lib/supabase/queries';
import type { Round, CardSuit } from '@/types';

interface RoundPageProps {
  params: Promise<{ id: string }>;
}

// 生成 JSON-LD 结构化数据
function generateJsonLd(round: Round) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.open-baccarat.com';
  const getSuitSymbol = (suit: string) => {
    const symbols: Record<string, string> = { spade: '♠', heart: '♥', diamond: '♦', club: '♣' };
    return symbols[suit] || suit;
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'GamePlayAction',
    '@id': `${baseUrl}/round/${round.roundNumber}`,
    name: `Baccarat Round #${round.roundNumber}`,
    description: `Game round ${round.roundNumber} - ${round.result === 'banker_win' ? 'Banker Win' : round.result === 'player_win' ? 'Player Win' : 'Tie'} (Player: ${round.playerTotal}, Banker: ${round.bankerTotal})`,
    url: `${baseUrl}/round/${round.roundNumber}`,
    
    // 游戏数据 - 自定义扩展
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'roundNumber',
        value: round.roundNumber,
      },
      {
        '@type': 'PropertyValue',
        name: 'shoeNumber',
        value: round.shoeNumber,
      },
      {
        '@type': 'PropertyValue',
        name: 'result',
        value: round.result,
      },
      {
        '@type': 'PropertyValue',
        name: 'playerCards',
        value: round.playerCards.map(c => `${c.rank}${getSuitSymbol(c.suit)}`).join(' '),
      },
      {
        '@type': 'PropertyValue',
        name: 'playerTotal',
        value: round.playerTotal,
      },
      {
        '@type': 'PropertyValue',
        name: 'bankerCards',
        value: round.bankerCards.map(c => `${c.rank}${getSuitSymbol(c.suit)}`).join(' '),
      },
      {
        '@type': 'PropertyValue',
        name: 'bankerTotal',
        value: round.bankerTotal,
      },
      {
        '@type': 'PropertyValue',
        name: 'isNatural',
        value: round.playerTotal >= 8 || round.bankerTotal >= 8,
      },
      {
        '@type': 'PropertyValue',
        name: 'isPlayerPair',
        value: round.isPair.player,
      },
      {
        '@type': 'PropertyValue',
        name: 'isBankerPair',
        value: round.isPair.banker,
      },
      {
        '@type': 'PropertyValue',
        name: 'solanaSignature',
        value: round.solanaSignature || null,
      },
      {
        '@type': 'PropertyValue',
        name: 'blockchainStatus',
        value: round.blockchainStatus,
      },
    ],
    
    // 时间信息
    startTime: round.startedAt.toISOString(),
    endTime: round.completedAt.toISOString(),
    
    // 关联的 API 端点
    potentialAction: {
      '@type': 'ReadAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/api/games/${round.roundNumber}`,
        encodingType: 'application/json',
        contentType: 'application/json',
      },
    },
  };
}

export default async function RoundPage({ params }: RoundPageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="container mx-auto px-3 md:px-4 py-6 md:py-8">
        <div className="mb-4 md:mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-zinc-400 hover:text-white min-h-[44px] -ml-2">
              ← 返回首页
            </Button>
          </Link>
        </div>

        <Suspense fallback={<RoundDetailSkeleton />}>
          <RoundDetail roundId={id} />
        </Suspense>
      </div>
    </div>
  );
}

// 判断是否是红色花色
function isRedSuit(suit: string): boolean {
  return suit === 'heart' || suit === 'diamond';
}

async function RoundDetail({ roundId }: { roundId: string }) {
  // 从数据库获取真实数据
  let round: Round | null = null;

  // 尝试作为局号（数字）查询
  const roundNumber = parseInt(roundId);
  if (!isNaN(roundNumber)) {
    round = await getRoundByNumber(roundNumber);
  }

  // 如果按局号找不到，尝试按 ID 查询
  if (!round) {
    round = await getRoundById(roundId);
  }

  // 如果找不到记录，显示友好的提示页面
  if (!round) {
    return <RoundNotFound roundId={roundId} />;
  }

  const resultLabels = {
    banker_win: '庄赢',
    player_win: '闲赢',
    tie: '和局',
  };

  const resultColors = {
    banker_win: 'bg-red-500',
    player_win: 'bg-blue-500',
    tie: 'bg-green-500',
  };

  const suitSymbols: Record<CardSuit, string> = {
    spade: '♠',
    heart: '♥',
    diamond: '♦',
    club: '♣',
  };

  // 生成 JSON-LD 结构化数据
  const jsonLd = generateJsonLd(round);

  return (
    <>
      {/* JSON-LD 结构化数据 - 方便 AI 和爬虫直接解析 */}
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* 隐藏的纯文本数据 - 方便 AI 快速提取 */}
      <div className="sr-only" data-game-data={JSON.stringify({
        roundNumber: round.roundNumber,
        shoeNumber: round.shoeNumber,
        result: round.result,
        playerCards: round.playerCards,
        playerTotal: round.playerTotal,
        bankerCards: round.bankerCards,
        bankerTotal: round.bankerTotal,
        isNatural: round.playerTotal >= 8 || round.bankerTotal >= 8,
        isPlayerPair: round.isPair.player,
        isBankerPair: round.isPair.banker,
        completedAt: round.completedAt.toISOString(),
        solanaSignature: round.solanaSignature,
        blockchainStatus: round.blockchainStatus,
        apiEndpoint: `/api/games/${round.roundNumber}`,
      })}>
        Game Data: Round #{round.roundNumber}, 
        Result: {round.result}, 
        Player: {round.playerTotal}, 
        Banker: {round.bankerTotal}
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* 标题 */}
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">
            第 {round.roundNumber} 局详情
          </h1>
          <p className="text-zinc-400 text-sm md:text-base">牌靴 #{round.shoeNumber}</p>
        </div>

        {/* 结果卡片 */}
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader className="text-center pb-2">
            <Badge className={`${resultColors[round.result]} text-white text-lg md:text-xl py-1.5 md:py-2 px-4 md:px-6 mx-auto`}>
              {resultLabels[round.result]}
            </Badge>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            {/* 移动端：上下堆叠布局 */}
            <div className="md:hidden space-y-4 py-4">
              {/* 闲家 */}
              <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
                <div className="shrink-0 text-center">
                  <h3 className="text-sm text-blue-400 mb-1">闲家</h3>
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold ${round.result === 'player_win' ? 'bg-blue-500 text-white ring-2 ring-blue-300' : 'bg-zinc-700 text-zinc-300'}`}>
                    {round.playerTotal}
                  </div>
                </div>
                <div className="flex-1 flex justify-center gap-1.5">
                  {round.playerCards.map((card, i) => (
                    <div
                      key={i}
                      className="w-12 h-[68px] bg-white rounded-md flex flex-col items-center justify-center shadow-lg"
                    >
                      <span className={`text-lg font-bold ${isRedSuit(card.suit) ? 'text-red-500' : 'text-black'}`}>
                        {card.rank}
                      </span>
                      <span className={`text-base ${isRedSuit(card.suit) ? 'text-red-500' : 'text-black'}`}>
                        {suitSymbols[card.suit]}
                      </span>
                    </div>
                  ))}
                </div>
                {round.isPair.player && (
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] shrink-0">对子</Badge>
                )}
              </div>

              {/* 庄家 */}
              <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
                <div className="shrink-0 text-center">
                  <h3 className="text-sm text-red-400 mb-1">庄家</h3>
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold ${round.result === 'banker_win' ? 'bg-red-500 text-white ring-2 ring-red-300' : 'bg-zinc-700 text-zinc-300'}`}>
                    {round.bankerTotal}
                  </div>
                </div>
                <div className="flex-1 flex justify-center gap-1.5">
                  {round.bankerCards.map((card, i) => (
                    <div
                      key={i}
                      className="w-12 h-[68px] bg-white rounded-md flex flex-col items-center justify-center shadow-lg"
                    >
                      <span className={`text-lg font-bold ${isRedSuit(card.suit) ? 'text-red-500' : 'text-black'}`}>
                        {card.rank}
                      </span>
                      <span className={`text-base ${isRedSuit(card.suit) ? 'text-red-500' : 'text-black'}`}>
                        {suitSymbols[card.suit]}
                      </span>
                    </div>
                  ))}
                </div>
                {round.isPair.banker && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] shrink-0">对子</Badge>
                )}
              </div>
            </div>

            {/* 桌面端：左右并排布局 */}
            <div className="hidden md:grid grid-cols-2 gap-8 py-6">
              {/* 闲家 */}
              <div className="text-center">
                <h3 className="text-lg text-zinc-400 mb-4">闲家 PLAYER</h3>
                <div className="flex justify-center gap-2 mb-4">
                  {round.playerCards.map((card, i) => (
                    <div
                      key={i}
                      className="w-16 h-24 bg-white rounded-lg flex flex-col items-center justify-center shadow-lg"
                    >
                      <span className={`text-2xl font-bold ${isRedSuit(card.suit) ? 'text-red-500' : 'text-black'}`}>
                        {card.rank}
                      </span>
                      <span className={`text-xl ${isRedSuit(card.suit) ? 'text-red-500' : 'text-black'}`}>
                        {suitSymbols[card.suit]}
                      </span>
                    </div>
                  ))}
                </div>
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full text-2xl font-bold ${round.result === 'player_win' ? 'bg-blue-500 text-white ring-2 ring-blue-300' : 'bg-zinc-700 text-zinc-300'}`}>
                  {round.playerTotal}
                </div>
                {round.isPair.player && (
                  <Badge className="ml-2 bg-blue-500/20 text-blue-400 border-blue-500/30">对子</Badge>
                )}
              </div>

              {/* 庄家 */}
              <div className="text-center">
                <h3 className="text-lg text-zinc-400 mb-4">庄家 BANKER</h3>
                <div className="flex justify-center gap-2 mb-4">
                  {round.bankerCards.map((card, i) => (
                    <div
                      key={i}
                      className="w-16 h-24 bg-white rounded-lg flex flex-col items-center justify-center shadow-lg"
                    >
                      <span className={`text-2xl font-bold ${isRedSuit(card.suit) ? 'text-red-500' : 'text-black'}`}>
                        {card.rank}
                      </span>
                      <span className={`text-xl ${isRedSuit(card.suit) ? 'text-red-500' : 'text-black'}`}>
                        {suitSymbols[card.suit]}
                      </span>
                    </div>
                  ))}
                </div>
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full text-2xl font-bold ${round.result === 'banker_win' ? 'bg-red-500 text-white ring-2 ring-red-300' : 'bg-zinc-700 text-zinc-300'}`}>
                  {round.bankerTotal}
                </div>
                {round.isPair.banker && (
                  <Badge className="ml-2 bg-red-500/20 text-red-400 border-red-500/30">对子</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 区块链信息 */}
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="text-white flex items-center gap-2 text-lg md:text-xl">
              🔗 区块链验证信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
              <div>
                <div className="text-xs md:text-sm text-zinc-400 mb-1">交易签名</div>
                <div className="font-mono text-xs md:text-sm text-white bg-zinc-800 p-2 rounded overflow-x-auto">
                  {round.solanaSignature || '待确认'}
                </div>
              </div>
              <div>
                <div className="text-xs md:text-sm text-zinc-400 mb-1">状态</div>
                <Badge className={round.blockchainStatus === 'confirmed' ? 'bg-emerald-500' : 'bg-yellow-500'}>
                  {round.blockchainStatus === 'confirmed' ? '✅ 已确认' : '⏳ 确认中'}
                </Badge>
              </div>
              <div>
                <div className="text-xs md:text-sm text-zinc-400 mb-1">完成时间</div>
                <div className="text-white text-sm md:text-base">
                  {round.completedAt.toLocaleString('zh-CN')}
                </div>
              </div>
              <div>
                <div className="text-sm text-zinc-400 mb-1">牌靴 / 局号</div>
                <div className="text-white font-mono">
                  牌靴 #{round.shoeNumber} · 第 {round.roundNumber} 局
                </div>
              </div>
            </div>

            {round.solanaExplorerUrl && (
              <a
                href={round.solanaExplorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                  在 Solana Explorer 查看 ↗
                </Button>
              </a>
            )}
          </CardContent>
        </Card>

        {/* 验证说明 */}
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              🔍 如何验证
            </CardTitle>
          </CardHeader>
          <CardContent className="text-zinc-400 space-y-3">
            <p>1. 点击上方按钮前往 Solana Explorer 查看链上交易详情</p>
            <p>2. 验证交易数据中的游戏结果与页面显示一致</p>
            <p>3. 使用 VRF 证明验证随机数的公平性</p>
            <p>4. 所有游戏逻辑代码开源，可在 GitHub 审计</p>
          </CardContent>
        </Card>

        {/* API 提示 - 方便开发者 */}
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-sm text-zinc-400">
                <span className="text-zinc-500">💡 开发者提示：</span> 直接获取 JSON 数据请访问 API
              </div>
              <a 
                href={`/api/games/${round.roundNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono text-emerald-400 hover:text-emerald-300 underline"
              >
                GET /api/games/{round.roundNumber}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function RoundDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Skeleton className="h-10 w-64 mx-auto mb-2" />
        <Skeleton className="h-6 w-32 mx-auto" />
      </div>
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardContent className="py-12">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

// 局号不存在时的友好提示组件
function RoundNotFound({ roundId }: { roundId: string }) {
  const isNumber = !isNaN(parseInt(roundId));
  
  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-zinc-800 mb-6">
          <span className="text-5xl">🔍</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">
          {isNumber ? `第 ${roundId} 局暂未开始` : '局号无效'}
        </h1>
        <p className="text-zinc-400 max-w-md mx-auto">
          {isNumber 
            ? '这一局还没有开始，请稍后再查询或查看其他已完成的局。'
            : '请输入有效的局号数字。'
          }
        </p>
      </div>

      {/* 操作卡片 */}
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardContent className="py-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/round">
              <Button className="bg-emerald-600 hover:bg-emerald-700 min-w-[140px]">
                🔍 查询其他局
              </Button>
            </Link>
            <Link href="/history">
              <Button variant="outline" className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 min-w-[140px]">
                📊 查看历史记录
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="text-zinc-400 hover:text-white min-w-[140px]">
                🏠 返回首页
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 提示信息 */}
      <Card className="bg-zinc-800/30 border-zinc-700/50">
        <CardContent className="py-4">
          <div className="text-center text-sm text-zinc-500">
            <p>💡 提示：游戏在每分钟整点自动开始，全球同步进行。</p>
            <p className="mt-1">
              也可通过 API 查询：
              <code className="text-emerald-400/70 ml-1">GET /api/games/{roundId}</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
