// ============================================
// OpenBaccarat - 关于页面
// ============================================

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function AboutPage() {
  const t = useTranslations('about');
  const tCommon = useTranslations('common');

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="container mx-auto px-3 md:px-4 py-6 md:py-8">
        {/* 返回按钮 */}
        <div className="mb-4 md:mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-zinc-400 hover:text-white min-h-[44px] -ml-2">
              {tCommon('backToHome')}
            </Button>
          </Link>
        </div>

        {/* 标题 */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-3 md:mb-4">
            {t('title')}
          </h1>
          <p className="text-base md:text-xl text-zinc-400 max-w-2xl mx-auto px-2">
            {t('subtitle')}
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          {/* 项目愿景 */}
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader className="pb-2 md:pb-4">
              <CardTitle className="text-white text-xl md:text-2xl">{t('vision.title')}</CardTitle>
            </CardHeader>
            <CardContent className="text-zinc-300 space-y-3 md:space-y-4 text-sm md:text-base">
              <p>{t('vision.p1')}</p>
              <p>{t('vision.p2')}</p>
            </CardContent>
          </Card>

          {/* 核心特性 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
            <Card className="bg-zinc-900/80 border-zinc-800">
              <CardContent className="pt-4 md:pt-6 text-center pb-4 md:pb-6">
                <div className="text-4xl md:text-5xl mb-2 md:mb-4">🔓</div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-1 md:mb-2">{t('features.openSource.title')}</h3>
                <p className="text-zinc-400 text-xs md:text-sm">
                  {t('features.openSource.description')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/80 border-zinc-800">
              <CardContent className="pt-4 md:pt-6 text-center pb-4 md:pb-6">
                <div className="text-4xl md:text-5xl mb-2 md:mb-4">🔗</div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-1 md:mb-2">{t('features.blockchain.title')}</h3>
                <p className="text-zinc-400 text-xs md:text-sm">
                  {t('features.blockchain.description')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/80 border-zinc-800">
              <CardContent className="pt-4 md:pt-6 text-center pb-4 md:pb-6">
                <div className="text-4xl md:text-5xl mb-2 md:mb-4">🎲</div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-1 md:mb-2">{t('features.vrf.title')}</h3>
                <p className="text-zinc-400 text-xs md:text-sm">
                  {t('features.vrf.description')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 技术架构 */}
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader className="pb-2 md:pb-4">
              <CardTitle className="text-white text-xl md:text-2xl">{t('techStack.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                <TechBadge name="Next.js 16" category={t('techStack.frontend')} />
                <TechBadge name="React Three Fiber" category={t('techStack.threeD')} />
                <TechBadge name="Tailwind CSS" category={t('techStack.styling')} />
                <TechBadge name="shadcn/ui" category={t('techStack.components')} />
                <TechBadge name="Supabase" category={t('techStack.database')} />
                <TechBadge name="Solana" category={t('techStack.blockchain')} />
                <TechBadge name="ORAO VRF" category={t('techStack.random')} />
                <TechBadge name="Vercel" category={t('techStack.deployment')} />
              </div>
            </CardContent>
          </Card>

          {/* 百家乐规则 */}
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader className="pb-2 md:pb-4">
              <CardTitle className="text-white text-xl md:text-2xl">{t('rules.title')}</CardTitle>
            </CardHeader>
            <CardContent className="text-zinc-300 space-y-3 md:space-y-4">
              <div>
                <h4 className="text-white font-medium mb-1.5 md:mb-2 text-sm md:text-base">{t('rules.basic.title')}</h4>
                <ul className="list-disc list-inside space-y-0.5 md:space-y-1 text-xs md:text-sm text-zinc-400">
                  <li>{t('rules.basic.rule1')}</li>
                  <li>{t('rules.basic.rule2')}</li>
                  <li>{t('rules.basic.rule3')}</li>
                  <li>{t('rules.basic.rule4')}</li>
                  <li>{t('rules.basic.rule5')}</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-medium mb-1.5 md:mb-2 text-sm md:text-base">{t('rules.drawing.title')}</h4>
                <ul className="list-disc list-inside space-y-0.5 md:space-y-1 text-xs md:text-sm text-zinc-400">
                  <li>{t('rules.drawing.rule1')}</li>
                  <li>{t('rules.drawing.rule2')}</li>
                  <li>{t('rules.drawing.rule3')}</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-medium mb-1.5 md:mb-2 text-sm md:text-base">{t('rules.burning.title')}</h4>
                <ul className="list-disc list-inside space-y-0.5 md:space-y-1 text-xs md:text-sm text-zinc-400">
                  <li>{t('rules.burning.rule1')}</li>
                  <li>{t('rules.burning.rule2')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 开发者 API */}
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader className="pb-2 md:pb-4">
              <CardTitle className="text-white text-xl md:text-2xl">{t('api.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              <p className="text-zinc-400 text-sm md:text-base">{t('api.description')}</p>
              
              {/* API 端点列表 */}
              <div className="space-y-2 md:space-y-3">
                <ApiEndpoint
                  method="GET"
                  path="/api/games/{roundNumber}"
                  description={t('api.endpoints.singleRound')}
                />
                <ApiEndpoint
                  method="GET"
                  path="/api/rounds?format=minimal&limit=100"
                  description={t('api.endpoints.batchQuery')}
                />
                <ApiEndpoint
                  method="GET"
                  path="/api/docs"
                  description={t('api.endpoints.docs')}
                />
                <ApiEndpoint
                  method="GET"
                  path="/api/stats"
                  description={t('api.endpoints.stats')}
                />
              </div>

              {/* 查询参数说明 */}
              <div className="mt-3 md:mt-4 p-3 md:p-4 bg-zinc-800 rounded-lg">
                <h4 className="text-white font-medium mb-2 text-sm md:text-base">{t('api.queryParams.title')}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 md:gap-2 text-xs md:text-sm">
                  <div className="text-zinc-400">
                    <code className="text-emerald-400">roundNumber</code> - {t('api.queryParams.roundNumber')}
                  </div>
                  <div className="text-zinc-400">
                    <code className="text-emerald-400">roundFrom/To</code> - {t('api.queryParams.roundRange')}
                  </div>
                  <div className="text-zinc-400">
                    <code className="text-emerald-400">result</code> - {t('api.queryParams.result')}
                  </div>
                  <div className="text-zinc-400">
                    <code className="text-emerald-400">format</code> - {t('api.queryParams.format')}
                  </div>
                  <div className="text-zinc-400">
                    <code className="text-emerald-400">limit/offset</code> - {t('api.queryParams.pagination')}
                  </div>
                  <div className="text-zinc-400">
                    <code className="text-emerald-400">shoeNumber</code> - {t('api.queryParams.shoeNumber')}
                  </div>
                </div>
              </div>

              {/* 快速开始 */}
              <div className="mt-3 md:mt-4 p-3 md:p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="text-white font-medium mb-2 md:mb-3 text-sm md:text-base">{t('api.quickStart.title')}</h4>
                <div className="space-y-2 font-mono text-xs md:text-sm">
                  <div className="p-2 bg-zinc-900 rounded text-zinc-300 overflow-x-auto whitespace-nowrap">
                    <span className="text-zinc-500"># {t('api.quickStart.example1')}</span><br />
                    curl https://www.open-baccarat.com/api/games/42
                  </div>
                  <div className="p-2 bg-zinc-900 rounded text-zinc-300 overflow-x-auto whitespace-nowrap">
                    <span className="text-zinc-500"># {t('api.quickStart.example2')}</span><br />
                    curl &quot;https://www.open-baccarat.com/api/rounds?limit=10&format=compact&quot;
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-3 md:mt-4">
                <a href="/api/docs" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto min-h-[44px]">
                    {t('api.viewDocs')}
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* 局号查询 */}
          <RoundLookupCard />

          {/* 免责声明 */}
          <Card className="bg-zinc-900/80 border-zinc-800 relative overflow-hidden">
            {/* 左侧装饰条 */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500/80 via-amber-600/80 to-amber-500/80" />
            <CardHeader className="pb-3 pl-6">
              <CardTitle className="text-zinc-200 text-xl flex items-center gap-2">
                <span className="text-amber-500">⚠</span>
                {t('disclaimer.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pl-6 space-y-2">
              <p className="text-zinc-400 text-sm">• {t('disclaimer.p1')}</p>
              <p className="text-amber-400/90 text-sm">• {t('disclaimer.p2')}</p>
              <p className="text-zinc-400 text-sm">• {t('disclaimer.p3')}</p>
              <p className="text-emerald-400/80 text-sm">• {t('disclaimer.p4')}</p>
            </CardContent>
          </Card>

          {/* 链接 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://github.com/open-baccarat/OpenBaccarat"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700">
                {t('links.github')}
              </Button>
            </a>
            <Link href="/verify">
              <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
                {t('links.verify')}
              </Button>
            </Link>
            <a
              href="https://solscan.io"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="w-full sm:w-auto border-zinc-600 text-zinc-300 hover:bg-zinc-800">
                {t('links.explorer')}
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function TechBadge({ name, category }: { name: string; category: string }) {
  return (
    <div className="bg-zinc-800 rounded-lg p-2 md:p-3 text-center">
      <div className="text-white font-medium text-xs md:text-sm">{name}</div>
      <div className="text-zinc-500 text-[10px] md:text-xs mt-0.5 md:mt-1">{category}</div>
    </div>
  );
}

function ApiEndpoint({ method, path, description }: { method: string; path: string; description: string }) {
  return (
    <div className="flex items-start gap-2 md:gap-3 p-2 md:p-3 bg-zinc-800/50 rounded-lg">
      <span className="px-1.5 md:px-2 py-0.5 md:py-1 bg-emerald-600 text-white text-[10px] md:text-xs font-bold rounded shrink-0">
        {method}
      </span>
      <div className="flex-1 min-w-0">
        <code className="text-emerald-400 text-xs md:text-sm break-all">{path}</code>
        <p className="text-zinc-400 text-xs md:text-sm mt-0.5 md:mt-1">{description}</p>
      </div>
    </div>
  );
}

function RoundLookupCard() {
  const t = useTranslations('about');
  const tHistory = useTranslations('history');
  const router = useRouter();
  const [roundInput, setRoundInput] = useState('');
  const [error, setError] = useState('');

  const handleLookup = () => {
    const roundNumber = parseInt(roundInput.trim());
    if (isNaN(roundNumber) || roundNumber <= 0) {
      setError(tHistory('lookup.invalidNumber'));
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
      <CardHeader className="pb-2 md:pb-4">
        <CardTitle className="text-white text-lg md:text-xl flex items-center gap-2">
          🔍 {tHistory('lookup.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 md:gap-4">
          <div className="w-full">
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                placeholder={tHistory('lookup.placeholder')}
                value={roundInput}
                onChange={(e) => {
                  setRoundInput(e.target.value);
                  setError('');
                }}
                onKeyDown={handleKeyDown}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[44px]"
              />
              <Button 
                onClick={handleLookup}
                className="bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap min-h-[44px] px-4 md:px-6"
              >
                {tHistory('lookup.button')}
              </Button>
            </div>
            {error && (
              <p className="text-red-400 text-xs md:text-sm mt-2">{error}</p>
            )}
          </div>
          <p className="text-zinc-500 text-xs md:text-sm">
            {tHistory('lookup.description')}
          </p>
        </div>

        {/* API 提示 */}
        <div className="mt-3 md:mt-4 p-2.5 md:p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
          <p className="text-zinc-400 text-xs md:text-sm">
            💡 {t('api.lookupTip')}{' '}
            <code className="text-emerald-400 break-all">/api/games/{'{roundNumber}'}</code>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
