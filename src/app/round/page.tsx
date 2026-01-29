// ============================================
// OpenBaccarat - 局号查询页面
// ============================================

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RoundLookupPage() {
  const t = useTranslations('history');
  const tCommon = useTranslations('common');
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
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col">
        {/* 返回按钮 */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="text-zinc-400 hover:text-white">
              {tCommon('backToHome')}
            </Button>
          </Link>
        </div>

        {/* 主内容区 - 居中 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-xl space-y-8">
            {/* 标题 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 mb-6">
                <span className="text-4xl">🔍</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">
                {t('lookup.title')}
              </h1>
              <p className="text-zinc-400">
                {t('lookup.description')}
              </p>
            </div>

            {/* 搜索框 */}
            <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex gap-3">
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
                    className="bg-zinc-800/80 border-zinc-700 text-white placeholder:text-zinc-500 text-lg h-14 text-center font-mono"
                    autoFocus
                  />
                  <Button 
                    onClick={handleLookup}
                    className="bg-emerald-600 hover:bg-emerald-700 h-14 px-8 text-base font-medium shrink-0"
                  >
                    {t('lookup.button')}
                  </Button>
                </div>
                {error && (
                  <p className="text-red-400 text-center text-sm mt-3">{error}</p>
                )}
              </CardContent>
            </Card>

            {/* 快捷操作 */}
            <div className="flex items-center justify-center gap-6 text-sm">
              <Link 
                href="/history"
                className="text-zinc-400 hover:text-emerald-400 transition flex items-center gap-2"
              >
                <span>📊</span>
                <span>{t('title')}</span>
              </Link>
              <span className="text-zinc-700">|</span>
              <a 
                href="/api/docs" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-emerald-400 transition flex items-center gap-2"
              >
                <span>📄</span>
                <span>API Docs</span>
              </a>
              <span className="text-zinc-700">|</span>
              <Link 
                href="/about"
                className="text-zinc-400 hover:text-emerald-400 transition flex items-center gap-2"
              >
                <span>ℹ️</span>
                <span>{t('lookup.about')}</span>
              </Link>
            </div>

            {/* API 提示 */}
            <div className="text-center">
              <p className="text-zinc-600 text-xs">
                {t('lookup.apiTip')}{' '}
                <code className="text-zinc-500 font-mono">
                  GET /api/games/{'{roundNumber}'}
                </code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
