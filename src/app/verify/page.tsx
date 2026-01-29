// ============================================
// OpenBaccarat - 验证工具页面
// 功能：链上数据解析展示、与DB数据对比验证
// 完全使用真实数据，无mock
// ============================================

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { GameResult } from '@/types';

// 链上数据接口
interface ChainData {
  signature: string;
  slot: number;
  blockTime: number;
  confirmations: number | null;
  roundId: string;
  shoeId: string;
  roundNumber: number;
  result: string;
  playerCards: string;
  bankerCards: string;
  playerTotal: number;
  bankerTotal: number;
  playerPair: boolean;
  bankerPair: boolean;
  timestamp: number;
  rawMemo: string;
}

// 数据库数据接口
interface DbData {
  id: string;
  roundNumber: number;
  shoeId: string;
  result: string;
  playerCards: Array<{ suit: string; rank: string }>;
  bankerCards: Array<{ suit: string; rank: string }>;
  playerTotal: number;
  bankerTotal: number;
  isPlayerPair: boolean;
  isBankerPair: boolean;
  completedAt: string;
  solanaSignature: string | null;
}

// 对比结果接口
interface ComparisonResult {
  match: boolean;
  differences: string[];
  details: {
    field: string;
    chainValue: string;
    dbValue: string;
    match: boolean;
  }[];
}

// 验证结果接口
interface VerificationResult {
  success: boolean;
  chainData?: ChainData;
  dbData?: DbData | null;
  comparison?: ComparisonResult | null;
  network?: string;
  explorerUrl?: string;
  error?: string;
}

export default function VerifyPage() {
  const t = useTranslations('verify');
  const tCommon = useTranslations('common');
  const tGame = useTranslations('game');
  
  const [signature, setSignature] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chain' | 'db' | 'compare'>('chain');

  // 结果标签
  const getResultLabel = (result: string): string => {
    switch (result) {
      case 'banker_win': 
      case 'B':
        return tGame('bankerWin');
      case 'player_win': 
      case 'P':
        return tGame('playerWin');
      case 'tie': 
      case 'T':
        return tGame('tie');
      default:
        return result;
    }
  };

  // 标准化结果值
  const normalizeResult = (result: string): GameResult => {
    const resultMap: Record<string, GameResult> = {
      'P': 'player_win',
      'B': 'banker_win', 
      'T': 'tie',
      'player_win': 'player_win',
      'banker_win': 'banker_win',
      'tie': 'tie',
    };
    return resultMap[result] || 'tie';
  };

  const handleVerify = async () => {
    if (!signature.trim()) return;

    setIsLoading(true);
    setVerificationResult(null);

    try {
      // 调用真实的验证 API
      const response = await fetch(`/api/verify?signature=${encodeURIComponent(signature.trim())}`);
      const result = await response.json();
      
      setVerificationResult(result);
      
      if (result.success) {
        setActiveTab('chain');
      }
    } catch (error) {
      setVerificationResult({
        success: false,
        error: error instanceof Error ? error.message : t('failed'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return '-';
    // 如果时间戳是秒级的，转换为毫秒
    const ms = timestamp > 10000000000 ? timestamp : timestamp * 1000;
    return new Date(ms).toLocaleString(undefined, {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };

  const getResultBadge = (result: string) => {
    const normalizedResult = normalizeResult(result);
    switch (normalizedResult) {
      case 'player_win':
        return <Badge className="bg-blue-500">{getResultLabel(result)}</Badge>;
      case 'banker_win':
        return <Badge className="bg-red-500">{getResultLabel(result)}</Badge>;
      case 'tie':
        return <Badge className="bg-green-500">{getResultLabel(result)}</Badge>;
      default:
        return <Badge>{result}</Badge>;
    }
  };

  // 格式化牌组显示
  const formatCards = (cards: Array<{ suit: string; rank: string }>) => {
    const suitSymbols: Record<string, string> = {
      'spade': '♠', 'spades': '♠',
      'heart': '♥', 'hearts': '♥',
      'diamond': '♦', 'diamonds': '♦',
      'club': '♣', 'clubs': '♣',
    };
    return cards.map(c => `${c.rank}${suitSymbols[c.suit] || c.suit}`).join(' ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="container mx-auto px-3 md:px-4 py-6 md:py-8">
        {/* 返回按钮 */}
        <div className="mb-4 md:mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-zinc-400 hover:text-white min-h-[44px] -ml-2">
              ← {tCommon('backToHome')}
            </Button>
          </Link>
        </div>

        {/* 标题 */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">{t('title')}</h1>
          <p className="text-zinc-400 text-sm md:text-base px-2">{t('subtitle')}</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
          {/* 输入区域 */}
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader className="pb-2 md:pb-4">
              <CardTitle className="text-white text-lg md:text-xl">{t('signatureVerify')}</CardTitle>
              <CardDescription className="text-zinc-400 text-sm">
                {t('signatureDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              <div>
                <label className="block text-xs md:text-sm text-zinc-400 mb-1.5 md:mb-2">
                  {t('signatureLabel')}
                </label>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                  placeholder={t('signaturePlaceholder')}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 md:px-4 py-2.5 md:py-3 text-white font-mono text-xs md:text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                />
              </div>
              <Button
                onClick={handleVerify}
                disabled={isLoading || !signature.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('verifying')}
                  </span>
                ) : (
                  t('verifyButton')
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 验证结果 */}
          {verificationResult && (
            <>
              {/* 状态概览 */}
              <Card className={`border ${verificationResult.success ? 'bg-emerald-900/20 border-emerald-800' : 'bg-red-900/20 border-red-800'}`}>
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {verificationResult.success ? (
                        <>
                          <span className="text-2xl">✅</span>
                          {t('success')}
                        </>
                      ) : (
                        <>
                          <span className="text-2xl">❌</span>
                          {t('failed')}
                        </>
                      )}
                    </span>
                    {verificationResult.success && verificationResult.comparison && (
                      <Badge className={verificationResult.comparison.match ? 'bg-emerald-600' : 'bg-amber-600'}>
                        {verificationResult.comparison.match ? t('dataMatch') : t('dataDifference')}
                      </Badge>
                    )}
                    {verificationResult.success && !verificationResult.dbData && (
                      <Badge className="bg-zinc-600">
                        {t('noDbRecord')}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                {!verificationResult.success && (
                  <CardContent>
                    <p className="text-red-400">{verificationResult.error}</p>
                  </CardContent>
                )}
              </Card>

              {verificationResult.success && verificationResult.chainData && (
                <>
                  {/* 标签页切换 */}
                  <div className="flex gap-2 bg-zinc-800 p-1 rounded-lg">
                    <button
                      onClick={() => setActiveTab('chain')}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'chain' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {t('tabs.chain')}
                    </button>
                    <button
                      onClick={() => setActiveTab('db')}
                      disabled={!verificationResult.dbData}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'db' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'
                      } ${!verificationResult.dbData ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {t('tabs.db')}
                    </button>
                    <button
                      onClick={() => setActiveTab('compare')}
                      disabled={!verificationResult.comparison}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'compare' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'
                      } ${!verificationResult.comparison ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {t('tabs.compare')}
                    </button>
                  </div>

                  {/* 链上数据 */}
                  {activeTab === 'chain' && (
                    <Card className="bg-zinc-900/80 border-zinc-800">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          ⛓️ {t('chainData.title')}
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                          {t('chainData.subtitle')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* 交易信息 */}
                        <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
                          <h4 className="text-white font-medium text-sm">{t('chainData.txInfo')}</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-zinc-400">{t('chainData.signature')}</div>
                              <div className="text-white font-mono text-xs truncate" title={verificationResult.chainData.signature}>
                                {verificationResult.chainData.signature}
                              </div>
                            </div>
                            <div>
                              <div className="text-zinc-400">{t('chainData.slot')}</div>
                              <div className="text-white">{verificationResult.chainData.slot.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-zinc-400">{t('chainData.confirmations')}</div>
                              <div className="text-emerald-400">
                                {verificationResult.chainData.confirmations !== null 
                                  ? `${verificationResult.chainData.confirmations.toLocaleString()} ${t('chainData.confirmed')}`
                                  : '-'
                                }
                              </div>
                            </div>
                            <div>
                              <div className="text-zinc-400">{t('chainData.blockTime')}</div>
                              <div className="text-white">{formatTimestamp(verificationResult.chainData.blockTime)}</div>
                            </div>
                          </div>
                        </div>

                        {/* 游戏数据 */}
                        <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
                          <h4 className="text-white font-medium text-sm">{t('chainData.gameData')}</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-zinc-400 text-sm">{t('chainData.roundNumber')}</div>
                              <div className="text-white font-bold text-xl">#{verificationResult.chainData.roundNumber}</div>
                            </div>
                            <div>
                              <div className="text-zinc-400 text-sm">{t('chainData.result')}</div>
                              <div>{getResultBadge(verificationResult.chainData.result)}</div>
                            </div>
                          </div>
                          <Separator className="bg-zinc-700" />
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-zinc-400 text-sm mb-2">{t('chainData.playerHand')}</div>
                              <div className="text-white font-mono text-lg">
                                {verificationResult.chainData.playerCards}
                              </div>
                              <div className="text-blue-400 mt-1">
                                {t('chainData.totalPoints')}: {verificationResult.chainData.playerTotal}
                                {verificationResult.chainData.playerPair && (
                                  <Badge className="ml-2 bg-blue-500/30 text-blue-300 text-xs">{tGame('playerPair')}</Badge>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-zinc-400 text-sm mb-2">{t('chainData.bankerHand')}</div>
                              <div className="text-white font-mono text-lg">
                                {verificationResult.chainData.bankerCards}
                              </div>
                              <div className="text-red-400 mt-1">
                                {t('chainData.totalPoints')}: {verificationResult.chainData.bankerTotal}
                                {verificationResult.chainData.bankerPair && (
                                  <Badge className="ml-2 bg-red-500/30 text-red-300 text-xs">{tGame('bankerPair')}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 原始 Memo 数据 */}
                        <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
                          <h4 className="text-white font-medium text-sm">{t('chainData.rawMemo')}</h4>
                          <div className="text-white font-mono text-xs bg-zinc-900 p-3 rounded overflow-x-auto">
                            {verificationResult.chainData.rawMemo}
                          </div>
                        </div>

                        <a
                          href={verificationResult.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" className="w-full border-emerald-500 text-emerald-400 hover:bg-emerald-500/10">
                            {t('chainData.viewOnExplorer')} ↗
                          </Button>
                        </a>
                      </CardContent>
                    </Card>
                  )}

                  {/* 数据库数据 */}
                  {activeTab === 'db' && verificationResult.dbData && (
                    <Card className="bg-zinc-900/80 border-zinc-800">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          🗄️ {t('dbData.title')}
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                          {t('dbData.subtitle')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-zinc-400">{t('dbData.recordId')}</div>
                              <div className="text-white font-mono text-xs truncate" title={verificationResult.dbData.id}>
                                {verificationResult.dbData.id}
                              </div>
                            </div>
                            <div>
                              <div className="text-zinc-400">{t('dbData.shoeId')}</div>
                              <div className="text-white font-mono text-xs truncate" title={verificationResult.dbData.shoeId}>
                                {verificationResult.dbData.shoeId}
                              </div>
                            </div>
                            <div>
                              <div className="text-zinc-400">{t('dbData.roundNumber')}</div>
                              <div className="text-white font-bold">#{verificationResult.dbData.roundNumber}</div>
                            </div>
                            <div>
                              <div className="text-zinc-400">{t('dbData.result')}</div>
                              <div>{getResultBadge(verificationResult.dbData.result)}</div>
                            </div>
                          </div>
                          <Separator className="bg-zinc-700" />
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-zinc-400 text-sm mb-2">{t('chainData.playerHand')}</div>
                              <div className="text-white font-mono">
                                {formatCards(verificationResult.dbData.playerCards)}
                              </div>
                              <div className="text-blue-400 mt-1">
                                {t('dbData.playerPoints')}: {verificationResult.dbData.playerTotal}
                                {verificationResult.dbData.isPlayerPair && (
                                  <Badge className="ml-2 bg-blue-500/30 text-blue-300 text-xs">{tGame('playerPair')}</Badge>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-zinc-400 text-sm mb-2">{t('chainData.bankerHand')}</div>
                              <div className="text-white font-mono">
                                {formatCards(verificationResult.dbData.bankerCards)}
                              </div>
                              <div className="text-red-400 mt-1">
                                {t('dbData.bankerPoints')}: {verificationResult.dbData.bankerTotal}
                                {verificationResult.dbData.isBankerPair && (
                                  <Badge className="ml-2 bg-red-500/30 text-red-300 text-xs">{tGame('bankerPair')}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Separator className="bg-zinc-700" />
                          <div>
                            <div className="text-zinc-400 text-sm">{t('dbData.createdAt')}</div>
                            <div className="text-white">
                              {new Date(verificationResult.dbData.completedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 数据对比 */}
                  {activeTab === 'compare' && verificationResult.comparison && (
                    <Card className="bg-zinc-900/80 border-zinc-800">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          🔍 {t('compare.title')}
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                          {t('compare.subtitle')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {verificationResult.comparison.match ? (
                          <div className="bg-emerald-900/30 border border-emerald-800 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">✅</span>
                              <div>
                                <div className="text-emerald-400 font-bold">{t('compare.match')}</div>
                                <div className="text-zinc-400 text-sm">{t('compare.matchDesc')}</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-amber-900/30 border border-amber-800 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">⚠️</span>
                              <div>
                                <div className="text-amber-400 font-bold">{t('compare.difference')}</div>
                                <ul className="text-zinc-400 text-sm list-disc list-inside">
                                  {verificationResult.comparison.differences.map((diff, i) => (
                                    <li key={i}>{diff}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 对比表格 */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-zinc-700">
                                <th className="text-left text-zinc-400 py-2">{t('compare.field')}</th>
                                <th className="text-left text-zinc-400 py-2">{t('compare.chainValue')}</th>
                                <th className="text-left text-zinc-400 py-2">{t('compare.dbValue')}</th>
                                <th className="text-left text-zinc-400 py-2">{t('compare.status')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {verificationResult.comparison.details.map((detail, i) => (
                                <tr key={i} className="border-b border-zinc-800">
                                  <td className="py-2 text-white">{detail.field}</td>
                                  <td className="py-2 text-zinc-300 font-mono">{detail.chainValue}</td>
                                  <td className="py-2 text-zinc-300 font-mono">{detail.dbValue}</td>
                                  <td className="py-2">
                                    {detail.match ? (
                                      <span className="text-emerald-400">✓ {t('compare.consistent')}</span>
                                    ) : (
                                      <span className="text-amber-400">✗ {t('compare.inconsistent')}</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </>
          )}

          {/* 使用说明 */}
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                📖 {t('vrfExplain.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-zinc-400 space-y-4">
              <p>{t('vrfExplain.p1')}</p>
              <div className="bg-zinc-800 rounded-lg p-4 space-y-2">
                <h4 className="text-white font-medium">{t('vrfExplain.stepsTitle')}</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>{t('vrfExplain.step1')}</li>
                  <li>{t('vrfExplain.step2')}</li>
                  <li>{t('vrfExplain.step3')}</li>
                  <li>{t('vrfExplain.step4')}</li>
                </ol>
              </div>
              <a
                href="https://github.com/open-baccarat/OpenBaccarat"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-800">
                  {t('vrfExplain.viewCode')} ↗
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* 导出验证结果 */}
          {verificationResult?.success && (
            <Card className="bg-zinc-900/80 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  📥 {t('export.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-zinc-400 text-sm">{t('export.desc')}</p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                    onClick={() => {
                      const data = JSON.stringify(verificationResult, null, 2);
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `verification-${signature.slice(0, 8)}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    {t('export.downloadJson')}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(verificationResult, null, 2));
                    }}
                  >
                    {t('export.copyClipboard')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 常见问题 */}
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">{t('faq.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-white font-medium mb-1">{t('faq.q1')}</h4>
                <p className="text-zinc-400 text-sm">{t('faq.a1')}</p>
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">{t('faq.q2')}</h4>
                <p className="text-zinc-400 text-sm">{t('faq.a2')}</p>
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">{t('faq.q3')}</h4>
                <p className="text-zinc-400 text-sm">{t('faq.a3')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
