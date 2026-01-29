// ============================================
// OpenBaccarat - 游戏规则说明
// ============================================

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

export function GameRules() {
  return (
    <Card className="bg-zinc-900/80 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white">📖 游戏规则</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic">
          <TabsList className="bg-zinc-800 w-full">
            <TabsTrigger value="basic" className="flex-1 text-xs">基本规则</TabsTrigger>
            <TabsTrigger value="draw" className="flex-1 text-xs">补牌规则</TabsTrigger>
            <TabsTrigger value="payout" className="flex-1 text-xs">赔率说明</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[300px] mt-4">
            <TabsContent value="basic" className="mt-0 space-y-4">
              <RuleSection title="游戏目标">
                <p>百家乐是一种比较闲家（Player）和庄家（Banker）点数的游戏。</p>
                <p>点数更接近 9 的一方获胜。</p>
              </RuleSection>

              <RuleSection title="点数计算">
                <ul className="list-disc list-inside space-y-1">
                  <li>A = 1点</li>
                  <li>2-9 = 面值点数</li>
                  <li>10, J, Q, K = 0点</li>
                  <li>总点数超过9时取个位数</li>
                </ul>
                <p className="text-emerald-400 mt-2">例：7 + 8 = 15 → 5点</p>
              </RuleSection>

              <RuleSection title="牌靴说明">
                <ul className="list-disc list-inside space-y-1">
                  <li>使用 8 副牌（共 416 张）</li>
                  <li>开局时根据第一张牌点数烧牌</li>
                  <li>牌靴末端保留约 15 张牌不使用</li>
                </ul>
              </RuleSection>
            </TabsContent>

            <TabsContent value="draw" className="mt-0 space-y-4">
              <RuleSection title="天牌规则">
                <p>任一方前两张牌总点数为 8 或 9 时，称为"天牌"（Natural）。</p>
                <p>天牌出现时，双方都不再补牌，直接比较大小。</p>
              </RuleSection>

              <RuleSection title="闲家补牌">
                <ul className="list-disc list-inside space-y-1">
                  <li>0-5 点：补一张牌</li>
                  <li>6-7 点：不补牌</li>
                </ul>
              </RuleSection>

              <RuleSection title="庄家补牌">
                <p className="text-zinc-400 mb-2">庄家补牌规则取决于闲家第三张牌：</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-zinc-700">
                        <th className="text-left p-2">庄家点数</th>
                        <th className="text-left p-2">补牌条件</th>
                      </tr>
                    </thead>
                    <tbody className="text-zinc-400">
                      <tr className="border-b border-zinc-800">
                        <td className="p-2">0-2</td>
                        <td className="p-2">必定补牌</td>
                      </tr>
                      <tr className="border-b border-zinc-800">
                        <td className="p-2">3</td>
                        <td className="p-2">闲家第三张不是 8 时补牌</td>
                      </tr>
                      <tr className="border-b border-zinc-800">
                        <td className="p-2">4</td>
                        <td className="p-2">闲家第三张是 2-7 时补牌</td>
                      </tr>
                      <tr className="border-b border-zinc-800">
                        <td className="p-2">5</td>
                        <td className="p-2">闲家第三张是 4-7 时补牌</td>
                      </tr>
                      <tr className="border-b border-zinc-800">
                        <td className="p-2">6</td>
                        <td className="p-2">闲家第三张是 6-7 时补牌</td>
                      </tr>
                      <tr>
                        <td className="p-2">7</td>
                        <td className="p-2">不补牌</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </RuleSection>
            </TabsContent>

            <TabsContent value="payout" className="mt-0 space-y-4">
              <RuleSection title="标准赔率">
                <div className="space-y-2">
                  <PayoutRow label="庄家赢" payout="1:0.95" note="扣除5%佣金" />
                  <PayoutRow label="闲家赢" payout="1:1" />
                  <PayoutRow label="和局" payout="1:8" />
                  <PayoutRow label="庄对" payout="1:11" note="庄家前两张相同点数" />
                  <PayoutRow label="闲对" payout="1:11" note="闲家前两张相同点数" />
                </div>
              </RuleSection>

              <RuleSection title="注意事项">
                <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 mb-2">
                  ⚠️ 仅供展示
                </Badge>
                <p>本平台为游戏展示平台，不涉及真实货币下注。</p>
                <p>所有赔率仅作规则说明用途。</p>
              </RuleSection>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function RuleSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-white">{title}</h4>
      <div className="text-sm text-zinc-400 space-y-1">{children}</div>
    </div>
  );
}

function PayoutRow({ 
  label, 
  payout, 
  note 
}: { 
  label: string; 
  payout: string; 
  note?: string; 
}) {
  return (
    <div className="flex items-center justify-between bg-zinc-800/50 rounded p-2">
      <div>
        <span className="text-white">{label}</span>
        {note && <span className="text-xs text-zinc-500 ml-2">({note})</span>}
      </div>
      <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
        {payout}
      </Badge>
    </div>
  );
}
