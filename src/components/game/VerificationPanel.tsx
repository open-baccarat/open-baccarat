// ============================================
// OpenBaccarat - 验证面板
// ============================================

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { verifyTransaction, getExplorerUrl } from '@/lib/solana/client';
import { verifyRound } from '@/lib/game/rules';
import type { Round } from '@/types';
import { cn } from '@/lib/utils';

interface VerificationPanelProps {
  round?: Round;
}

export function VerificationPanel({ round }: VerificationPanelProps) {
  const t = useTranslations('verificationPanel');
  const tError = useTranslations('error');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    details: string[];
  } | null>(null);

  const handleVerify = async () => {
    if (!round) return;

    setIsVerifying(true);
    setVerificationResult(null);

    const details: string[] = [];
    let isValid = true;

    try {
      // 1. 验证游戏规则
      const rulesValid = verifyRound(
        round.playerCards,
        round.bankerCards,
        round.result
      );
      details.push(rulesValid ? t('rulesValid') : t('rulesInvalid'));
      if (!rulesValid) isValid = false;

      // 2. 验证点数计算
      details.push(t('playerPoints', { points: round.playerTotal }));
      details.push(t('bankerPoints', { points: round.bankerTotal }));

      // 3. 验证区块链交易
      if (round.solanaSignature) {
        const txResult = await verifyTransaction(round.solanaSignature);
        if (txResult.isValid) {
          details.push(t('transactionConfirmed', { slot: txResult.slot ?? 0 }));
        } else {
          details.push(t('transactionFailed', { error: txResult.error ?? 'Unknown error' }));
          isValid = false;
        }
      } else {
        details.push(t('transactionPending'));
      }

      setVerificationResult({ isValid, details });
    } catch (error) {
      setVerificationResult({
        isValid: false,
        details: [t('verificationError', { error: error instanceof Error ? error.message : tError('unknown') })],
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (!round) {
    return (
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-white">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-500 text-sm text-center py-4">
            {t('selectRound')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900/80 border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white">{t('title')}</CardTitle>
          <Badge variant="outline" className="border-zinc-600">
            {t('roundNumber', { roundNumber: round.roundNumber })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 基本信息 */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-400">{t('gameId')}</span>
            <span className="font-mono text-white text-xs">{round.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">{t('blockchainStatus')}</span>
            <BlockchainStatusBadge status={round.blockchainStatus} />
          </div>
        </div>

        <Separator className="bg-zinc-800" />

        {/* 验证按钮 */}
        <Button
          onClick={handleVerify}
          disabled={isVerifying}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
        >
          {isVerifying ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              {t('verifying')}
            </>
          ) : (
            t('startVerification')
          )}
        </Button>

        {/* 验证结果 */}
        {verificationResult && (
          <div className="space-y-2">
            <div
              className={cn(
                'flex items-center gap-2 p-3 rounded-lg',
                verificationResult.isValid
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : 'bg-red-500/10 border border-red-500/30'
              )}
            >
              <span className="text-xl">
                {verificationResult.isValid ? '✅' : '❌'}
              </span>
              <span
                className={cn(
                  'font-medium',
                  verificationResult.isValid ? 'text-emerald-400' : 'text-red-400'
                )}
              >
                {verificationResult.isValid ? t('verificationPassed') : t('verificationFailed')}
              </span>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-3 space-y-1">
              {verificationResult.details.map((detail, index) => (
                <p key={index} className="text-xs text-zinc-300">
                  {detail}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* 区块链链接 */}
        {round.solanaExplorerUrl && (
          <a
            href={round.solanaExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-emerald-400 hover:underline"
          >
            {t('viewOnExplorer')}
          </a>
        )}

        {/* 验证说明 */}
        <div className="text-xs text-zinc-500 space-y-1">
          <p>{t('verificationContent')}</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>{t('content.rules')}</li>
            <li>{t('content.result')}</li>
            <li>{t('content.transaction')}</li>
            <li>{t('content.vrf')}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function BlockchainStatusBadge({ status }: { status: string }) {
  const t = useTranslations('verificationPanel.status');
  
  const config: Record<string, { label: string; className: string }> = {
    pending: {
      label: t('pending'),
      className: 'border-yellow-500/50 text-yellow-400',
    },
    confirmed: {
      label: t('confirmed'),
      className: 'border-emerald-500/50 text-emerald-400',
    },
    failed: {
      label: t('failed'),
      className: 'border-red-500/50 text-red-400',
    },
  };

  const { label, className } = config[status] || config.pending!;

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
