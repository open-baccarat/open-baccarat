// ============================================
// OpenBaccarat - 验证面板
// ============================================

'use client';

import { useState } from 'react';
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
      details.push(rulesValid ? '✅ 游戏规则验证通过' : '❌ 游戏规则验证失败');
      if (!rulesValid) isValid = false;

      // 2. 验证点数计算
      details.push(`✅ 闲家点数: ${round.playerTotal}`);
      details.push(`✅ 庄家点数: ${round.bankerTotal}`);

      // 3. 验证区块链交易
      if (round.solanaSignature) {
        const txResult = await verifyTransaction(round.solanaSignature);
        if (txResult.isValid) {
          details.push(`✅ 区块链交易已确认 (Slot: ${txResult.slot})`);
        } else {
          details.push(`❌ 区块链验证失败: ${txResult.error}`);
          isValid = false;
        }
      } else {
        details.push('⏳ 区块链交易待确认');
      }

      setVerificationResult({ isValid, details });
    } catch (error) {
      setVerificationResult({
        isValid: false,
        details: ['❌ 验证过程出错: ' + (error instanceof Error ? error.message : '未知错误')],
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (!round) {
    return (
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-white">🔍 验证中心</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-500 text-sm text-center py-4">
            选择一局游戏进行验证
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900/80 border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white">🔍 验证中心</CardTitle>
          <Badge variant="outline" className="border-zinc-600">
            局号 #{round.roundNumber}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 基本信息 */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-400">游戏ID</span>
            <span className="font-mono text-white text-xs">{round.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">区块链状态</span>
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
              验证中...
            </>
          ) : (
            '🔐 开始验证'
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
                {verificationResult.isValid ? '验证通过' : '验证失败'}
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
            🔗 在 Solana 区块浏览器上查看
          </a>
        )}

        {/* 验证说明 */}
        <div className="text-xs text-zinc-500 space-y-1">
          <p>验证内容：</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>游戏规则正确性（补牌规则、点数计算）</li>
            <li>结果判定准确性</li>
            <li>区块链交易确认状态</li>
            <li>VRF 随机数证明（如适用）</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function BlockchainStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending: {
      label: '确认中',
      className: 'border-yellow-500/50 text-yellow-400',
    },
    confirmed: {
      label: '已确认',
      className: 'border-emerald-500/50 text-emerald-400',
    },
    failed: {
      label: '失败',
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
